import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { normalizeStatus } from '@/lib/statusHelpers';

// Initialize admin client to query transactions and payouts securely
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80 },
  BASE: { commissionRate: 0.10, instructorShare: 0.90 },
  PRO: { commissionRate: 0.05, instructorShare: 0.95 },
  MAX: { commissionRate: 0.00, instructorShare: 1.00 },
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, paymentMethod, carrier, phoneNumber, currency, country } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Le montant de retrait doit être supérieur à 0.' }, { status: 400 });
    }

    if (!paymentMethod || !carrier || !phoneNumber) {
      return NextResponse.json({ error: 'Informations de paiement incomplètes.' }, { status: 400 });
    }

    const resolvedCurrency = (country === "CD" || phoneNumber?.includes("243")) ? (currency || "USD") : (currency || "USD");
    const paymentRef = `${carrier.toUpperCase()} (${resolvedCurrency}): ${phoneNumber}`;
    const payoutNotes = `Retrait Mobile Money (${carrier.toUpperCase()} - Wallet ${resolvedCurrency}) vers le numéro ${phoneNumber}.`;

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 1. Fetch instructor's profile to get plan
    const { data: profile } = await dbClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    const instructorPlan = profile.plan || 'FREE';
    const planConfig = PLAN_COMMISSION_CONFIG[instructorPlan] || PLAN_COMMISSION_CONFIG.FREE;
    const instructorShare = planConfig.instructorShare;

    // 2. Fetch instructor's courses to identify earnings
    const { data: courses } = await dbClient
      .from("courses")
      .select("id")
      .eq("instructor_id", user.id);

    const courseIds = courses?.map((c) => c.id) || [];

    let totalNetRevenue = 0;

    if (courseIds.length > 0) {
      // Fetch matching order items
      const { data: orderItems } = await dbClient
        .from("order_items")
        .select("order_id")
        .in("course_id", courseIds);

      const orderIds = orderItems?.map((oi) => oi.order_id) || [];

      if (orderIds.length > 0) {
        // Fetch paid payments
        const { data: payments } = await dbClient
          .from("payments")
          .select("amount, status")
          .in("order_id", orderIds)
          .eq("status", "PAID");

        const totalRevenue = payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
        totalNetRevenue = totalRevenue * instructorShare;
      }
    }

    // 3. Fetch existing payouts to calculate already withdrawn / pending amount
    const { data: payouts, error: payoutsErr } = await dbClient
      .from('payouts')
      .select('amount, status')
      .eq('instructor_id', user.id);

    if (payoutsErr) {
      return NextResponse.json({ error: payoutsErr.message }, { status: 400 });
    }

    const totalWithdrawnOrPending = payouts
      ?.filter((p) => p.status === 'PAID' || p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

    const availableBalance = totalNetRevenue - totalWithdrawnOrPending;

    if (amount > availableBalance) {
      return NextResponse.json({ 
        error: `Solde insuffisant. Vous pouvez retirer un maximum de ${availableBalance.toFixed(2)} $.` 
      }, { status: 400 });
    }

    // 4. Create new payout request record
    const { data: newPayout, error: insertErr } = await dbClient
      .from('payouts')
      .insert({
        id: crypto.randomUUID(),
        instructor_id: user.id,
        amount: amount,
        status: 'PENDING',
        payment_method: paymentMethod,
        payment_reference: paymentRef,
        notes: payoutNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .select()
      .single();

    if (insertErr) {
      console.error('[API instructor/payouts POST] Insert error:', insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    // 5. Trigger notifications for admin and instructor
    try {
      await dbClient.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: "Demande de retrait reçue !",
        message: `Votre demande de retrait de ${amount} $ par ${carrier.toUpperCase()} a été enregistrée et est en cours d'examen.`,
        type: "INFO",
        link: "/instructor/earnings",
        created_at: new Date().toISOString()
      } as any);
    } catch (notifErr) {
      console.warn('[API instructor/payouts POST] Notification error:', notifErr);
    }

    return NextResponse.json({
      success: true,
      payout: newPayout
    });

  } catch (err: any) {
    console.error('[API instructor/payouts POST] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Identifiant manquant' }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 1. Fetch payout request
    const { data: payout, error: fetchErr } = await dbClient
      .from('payouts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !payout) {
      return NextResponse.json({ error: 'Demande de retrait introuvable' }, { status: 404 });
    }

    // 2. Security: Verify ownership
    if (payout.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // 3. Verify status is PENDING
    if (payout.status !== 'PENDING') {
      return NextResponse.json({ error: 'Seules les demandes en attente peuvent être annulées.' }, { status: 400 });
    }

    // 4. Update status to CANCELLED
    const { data: updatedPayout, error: updateErr } = await dbClient
      .from('payouts')
      .update({
        status: 'CANCELLED',
        notes: `Annulé par l'instructeur le ${new Date().toLocaleDateString('fr-FR')}.`,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, payout: updatedPayout });
  } catch (err: any) {
    console.error('[API instructor/payouts DELETE] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { id, carrier, phoneNumber, currency, country } = body;

    if (!id || !carrier || !phoneNumber) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const resolvedCurrency = (country === "CD" || phoneNumber?.includes("243")) ? (currency || "USD") : (currency || "USD");
    const paymentRef = `${carrier.toUpperCase()} (${resolvedCurrency}): ${phoneNumber}`;

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 1. Fetch payout request
    const { data: payout, error: fetchErr } = await dbClient
      .from('payouts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !payout) {
      return NextResponse.json({ error: 'Demande de retrait introuvable' }, { status: 404 });
    }

    // 2. Security: Verify ownership
    if (payout.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // 3. Verify status is PENDING
    if (payout.status !== 'PENDING') {
      return NextResponse.json({ error: 'Seules les demandes en attente peuvent être modifiées.' }, { status: 400 });
    }

    // 4. Update details
    const { data: updatedPayout, error: updateErr } = await dbClient
      .from('payouts')
      .update({
        payment_reference: paymentRef,
        notes: `Coordonnées modifiées par l'instructeur le ${new Date().toLocaleDateString('fr-FR')} (Wallet ${resolvedCurrency}).`,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, payout: updatedPayout });
  } catch (err: any) {
    console.error('[API instructor/payouts PUT] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
