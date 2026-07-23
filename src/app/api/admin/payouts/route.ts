import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { initiatePawaPayPayout, resolvePawaPayCorrespondent } from "@/lib/pawapay";

const supabaseAdmin = createSupabaseAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Role verification (SUPER_ADMIN, ADMIN, or FINANCE_ADMIN) - Support multiple roles per user
    const { data: userRoles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("roles!inner(name)")
      .eq("user_id", user.id) as any;

    if (rolesErr || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const roleNames = userRoles.map((ur: any) => ur.roles?.name);
    const hasAdminAccess = roleNames.some((name: string) => 
      name === "SUPER_ADMIN" || name === "ADMIN" || name === "FINANCE_ADMIN"
    );

    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { payoutId, action } = await req.json();
    if (!payoutId || !action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Fetch the payout request
    const { data: payout, error: fetchErr } = await supabaseAdmin
      .from("payouts")
      .select("*")
      .eq("id", payoutId)
      .single() as any;

    if (fetchErr || !payout) {
      return NextResponse.json({ error: "Demande de retrait introuvable" }, { status: 404 });
    }

    if (payout.status !== "PENDING") {
      return NextResponse.json({ error: "La demande de retrait n'est plus en attente" }, { status: 400 });
    }

    if (action === "reject") {
      // Update status to CANCELLED (Rejected)
      const { error: updateErr } = await supabaseAdmin
        .from("payouts")
        .update({
          status: "CANCELLED",
          notes: `Demande de retrait rejetée par l'administrateur (${user.email}) le ${new Date().toLocaleDateString()}`,
          updated_at: new Date().toISOString()
        })
        .eq("id", payoutId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    if (action === "accept" || action === "manual_accept") {
      const ref = payout.payment_reference || "";
      const separatorIndex = ref.indexOf(":");
      
      const carrier = separatorIndex !== -1 ? ref.substring(0, separatorIndex).trim() : "MOBILE_MONEY";
      const phoneNumber = separatorIndex !== -1 ? ref.substring(separatorIndex + 1).trim() : ref.trim();

      const resolveResult = resolvePawaPayCorrespondent(carrier, phoneNumber);
      const amountLocal = payout.amount * resolveResult.exchangeRate;

      let pawapayRef = `MANUAL-${Date.now()}`;

      if (action === "accept") {
        // Generate a fresh unique transaction ID for PawaPay to prevent DUPLICATE_PAYOUT_ID rejections
        const freshPayoutTxId = crypto.randomUUID();

        // Initiate payout via PawaPay API
        const payoutResponse = await initiatePawaPayPayout({
          payoutId: freshPayoutTxId,
          amount: amountLocal,
          currency: resolveResult.currency,
          correspondent: resolveResult.correspondent,
          phoneNumber: resolveResult.formattedPhone,
          statementDescription: "Ansella Payout"
        });

        if (!payoutResponse.success) {
          // Record the failure in payout notes but DO NOT mark as PAID
          await supabaseAdmin
            .from("payouts")
            .update({
              notes: `[Échec PawaPay API] ${payoutResponse.error}. Résolu pour ${resolveResult.correspondent} (${resolveResult.currency}).`,
              updated_at: new Date().toISOString()
            })
            .eq("id", payoutId);

          return NextResponse.json({ 
            error: `Échec du virement PawaPay : ${payoutResponse.error}. Vous pouvez aussi utiliser l'option de validation manuelle après envoi direct.` 
          }, { status: 400 });
        }

        pawapayRef = payoutResponse.payoutId;
      }

      // Success or Manual Validation: update payout record status to PAID
      const { error: updateErr } = await supabaseAdmin
        .from("payouts")
        .update({
          status: "PAID",
          notes: action === "manual_accept" 
            ? `Versement validé manuellement par l'administrateur (${user.email}). Réf : ${ref}` 
            : `Reversement réussi de ${Math.round(amountLocal)} ${resolveResult.currency} via PawaPay (${resolveResult.correspondent}). Réf transaction: ${pawapayRef}`,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", payoutId);

      if (updateErr) {
        return NextResponse.json({ error: `Erreur de mise à jour de la base de données: ${updateErr.message}` }, { status: 500 });
      }

      // Send notification & email to instructor
      try {
        const { createNotification } = await import("@/lib/supabase/notifications-helper");
        const { sendInstructorPayoutCompletedEmail } = await import("@/lib/email");

        await createNotification({
          userId: payout.instructor_id,
          title: "Versement effectué !",
          message: `Votre demande de retrait de $${payout.amount.toFixed(2)} USD a été validée et transférée vers votre Mobile Money.`,
          type: "SUCCESS",
          link: "/instructor/earnings"
        });

        const { data: instProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", payout.instructor_id)
          .maybeSingle();

        if (instProfile?.email) {
          await sendInstructorPayoutCompletedEmail(
            instProfile.email,
            instProfile.full_name || "Formateur",
            payout.amount,
            payout.payment_method || "Mobile Money",
            payout.payment_reference || payoutId
          );
        }
      } catch (notifErr) {
        console.error("[admin-payouts] Error sending payout notification:", notifErr);
      }

      return NextResponse.json({
        success: true,
        status: "PAID",
        payoutId: pawapayRef
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (err: any) {
    console.error("[API /api/admin/payouts] Unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Erreur interne du serveur" }, { status: 500 });
  }
}
