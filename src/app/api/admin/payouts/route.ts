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

    if (action === "accept") {
      // 1. Process Mobile Money payout via PawaPay
      // Format: ORANGE: 243891234567
      const ref = payout.payment_reference || "";
      const separatorIndex = ref.indexOf(":");
      
      if (separatorIndex === -1) {
        return NextResponse.json({ error: "Format de référence de paiement invalide (Opérateur: Numéro requis)" }, { status: 400 });
      }

      const carrier = ref.substring(0, separatorIndex).trim();
      const phoneNumber = ref.substring(separatorIndex + 1).trim();

      if (!carrier || !phoneNumber) {
        return NextResponse.json({ error: "Informations de paiement invalides ou incomplètes" }, { status: 400 });
      }

      // 2. Resolve PawaPay operator and local currency conversion
      const resolveResult = resolvePawaPayCorrespondent(carrier, phoneNumber);
      if (resolveResult.error) {
        return NextResponse.json({ error: resolveResult.error }, { status: 400 });
      }

      // Convert payout USD amount to local currency
      const amountLocal = payout.amount * resolveResult.exchangeRate;

      // 3. Initiate payout via PawaPay
      const payoutResponse = await initiatePawaPayPayout({
        payoutId: payoutId, // Use the database payout row ID as our unique payoutId for PawaPay tracking
        amount: amountLocal,
        currency: resolveResult.currency,
        correspondent: resolveResult.correspondent,
        phoneNumber: resolveResult.formattedPhone,
        statementDescription: "Kuettu Payout"
      });

      if (!payoutResponse.success) {
        // Record the failure in payout notes but do not mark as PAID
        await supabaseAdmin
          .from("payouts")
          .update({
            notes: `Échec du reversement PawaPay: ${payoutResponse.error}. Résolu localement sous l'opérateur ${resolveResult.correspondent}.`,
            updated_at: new Date().toISOString()
          })
          .eq("id", payoutId);

        return NextResponse.json({ error: `Erreur API PawaPay : ${payoutResponse.error}` }, { status: 400 });
      }

      // 4. Success: update payout record status to PAID
      const { error: updateErr } = await supabaseAdmin
        .from("payouts")
        .update({
          status: "PAID",
          notes: `Reversement réussi de ${Math.round(amountLocal)} ${resolveResult.currency} via PawaPay (${resolveResult.correspondent}). Réf de transaction: ${payoutResponse.payoutId}`,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", payoutId);

      if (updateErr) {
        return NextResponse.json({ error: `Paiement PawaPay effectué, mais erreur de mise à jour de la base de données: ${updateErr.message}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        status: "PAID",
        payoutId: payoutResponse.payoutId
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (err: any) {
    console.error("[API /api/admin/payouts] Unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Erreur interne du serveur" }, { status: 500 });
  }
}
