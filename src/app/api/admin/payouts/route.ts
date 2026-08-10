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

    const body = await req.json();
    const { payoutId, action, reason } = body;

    if (!action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // --- Direct Admin Payout via PawaPay API ---
    if (action === "direct_payout") {
      const { 
        phoneNumber, 
        carrier, 
        country, 
        currency: requestCurrency,
        amount, 
        statementDescription, 
        instructorId 
      } = body;

      const numAmount = parseFloat(amount);
      if (!phoneNumber || !carrier || isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Numéro de téléphone, réseau/opérateur et montant valide requises." }, { status: 400 });
      }

      // Format and resolve PawaPay params
      const resolveResult = resolvePawaPayCorrespondent(carrier, phoneNumber, country, requestCurrency);
      if (resolveResult.error) {
        return NextResponse.json({ error: resolveResult.error }, { status: 400 });
      }

      const amountLocal = numAmount * resolveResult.exchangeRate;
      const targetPhone = resolveResult.formattedPhone;
      const freshPayoutTxId = crypto.randomUUID();
      const desc = statementDescription || "Retrait Direct Admin PawaPay";

      // Initiate payout via PawaPay API
      const payoutResponse = await initiatePawaPayPayout({
        payoutId: freshPayoutTxId,
        amount: amountLocal,
        currency: resolveResult.currency,
        correspondent: resolveResult.correspondent,
        phoneNumber: targetPhone,
        statementDescription: desc.substring(0, 22)
      });

      const isSuccess = payoutResponse.success;
      const pStatus = isSuccess ? "PAID" : "FAILED";
      const formattedAmountText = resolveResult.currency === "USD" 
        ? `${numAmount}$ USD` 
        : `${Math.round(amountLocal)} CDF (${numAmount}$ USD)`;

      const pNote = isSuccess 
        ? `[Retrait Direct PawaPay API] Transfert réussi de ${formattedAmountText} via ${resolveResult.correspondent} vers +${targetPhone}. Réf: ${freshPayoutTxId}. Note: ${desc}`
        : `[Échec Retrait Direct PawaPay API] ${payoutResponse.error}. (Opérateur: ${resolveResult.correspondent}, Devise: ${resolveResult.currency}, Téléphone: +${targetPhone}). Réf: ${freshPayoutTxId}`;

      const targetInstructorId = instructorId || user.id;

      // Insert payout record in Supabase
      const { data: newPayout, error: insertErr } = await supabaseAdmin
        .from("payouts")
        .insert({
          id: freshPayoutTxId,
          instructor_id: targetInstructorId,
          amount: numAmount,
          currency: "USD",
          status: pStatus,
          payment_method: "MOBILE_MONEY",
          payment_reference: `${carrier}: +${targetPhone}`,
          notes: pNote,
          processed_by: user.id,
          processed_at: isSuccess ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertErr) {
        console.error("[admin-payouts] Insert direct payout record error:", insertErr.message);
      }

      // Send notification & email if a target instructor was selected
      if (isSuccess && instructorId && instructorId !== user.id) {
        try {
          const { createNotification } = await import("@/lib/supabase/notifications-helper");
          const { sendInstructorPayoutCompletedEmail } = await import("@/lib/email");

          await createNotification({
            userId: instructorId,
            title: "Versement reçu !",
            message: `Un versement direct de ${formattedAmountText} a été envoyé sur votre Mobile Money (+${targetPhone}).`,
            type: "SUCCESS",
            link: "/instructor/earnings"
          });

          const { data: instProfile } = await supabaseAdmin
            .from("profiles")
            .select("email, full_name")
            .eq("id", instructorId)
            .maybeSingle();

          if (instProfile?.email) {
            await sendInstructorPayoutCompletedEmail(
              instProfile.email,
              instProfile.full_name || "Formateur",
              numAmount,
              "Mobile Money",
              `${carrier}: +${targetPhone}`
            );
          }
        } catch (notifErr) {
          console.error("[admin-payouts] Error sending direct payout notifications:", notifErr);
        }
      }

      if (!isSuccess) {
        return NextResponse.json({
          error: `Échec du versement PawaPay : ${payoutResponse.error}. Le versement a été consigné avec le statut ÉCHOUÉ.`,
          status: "FAILED",
          notes: pNote
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        status: "PAID",
        payoutId: freshPayoutTxId,
        message: `Versement direct PawaPay de ${formattedAmountText} envoyé avec succès au +${targetPhone} !`
      });
    }

    if (!payoutId) {
      return NextResponse.json({ error: "Identifiant de retrait manquant" }, { status: 400 });
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
      const rejectReason = reason || "Coordonnées de paiement à réviser ou non conformes.";

      // Update status to CANCELLED (Rejected)
      const { error: updateErr } = await supabaseAdmin
        .from("payouts")
        .update({
          status: "CANCELLED",
          notes: `Demande de retrait rejetée par l'administrateur (${user.email}). Motif : ${rejectReason}`,
          updated_at: new Date().toISOString()
        })
        .eq("id", payoutId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      // Send in-app notification & email to instructor
      try {
        const { createNotification } = await import("@/lib/supabase/notifications-helper");
        const { sendInstructorPayoutRejectedEmail } = await import("@/lib/email");

        await createNotification({
          userId: payout.instructor_id,
          title: "Demande de retrait refusée",
          message: `Votre demande de retrait de $${payout.amount.toFixed(2)} USD a été refusée. Motif : ${rejectReason}`,
          type: "WARNING",
          link: "/instructor/earnings"
        });

        const { data: instProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", payout.instructor_id)
          .maybeSingle();

        if (instProfile?.email) {
          await sendInstructorPayoutRejectedEmail(
            instProfile.email,
            instProfile.full_name || "Formateur",
            payout.amount,
            rejectReason
          );
        }
      } catch (notifErr) {
        console.error("[admin-payouts] Error sending rejection notifications:", notifErr);
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
          const failureNote = `[Échec PawaPay API] ${payoutResponse.error}. (Opérateur: ${resolveResult.correspondent}, Devise: ${resolveResult.currency}). Réf: ${freshPayoutTxId}`;
          
          // Mark status as FAILED in database so it is no longer considered PAID or PENDING without explanation
          await supabaseAdmin
            .from("payouts")
            .update({
              status: "FAILED",
              notes: failureNote,
              updated_at: new Date().toISOString()
            })
            .eq("id", payoutId);

          return NextResponse.json({ 
            error: `Échec du virement PawaPay : ${payoutResponse.error}. La demande a été marquée comme ÉCHOUÉE (FAILED). Vous pouvez réessayer ou valider manuellement.`,
            status: "FAILED",
            notes: failureNote
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
