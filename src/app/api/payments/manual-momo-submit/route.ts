import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/supabase/notifications-helper';
import crypto from 'crypto';

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json();
    const { amount, phoneNumber, carrier, type, itemId, transactionRef, couponId } = body;

    if (!amount || !phoneNumber || !transactionRef || !type || !itemId) {
      return NextResponse.json({ error: 'Informations de virement incomplètes. Veuillez fournir la référence de transaction.' }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const cleanRef = String(transactionRef).trim().toUpperCase();

    // 3. Create Order with PENDING status
    const { error: orderError } = await supabaseAdmin.from('orders').insert({
      id: orderId,
      user_id: user.id,
      order_number: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'PENDING',
      subtotal: amount,
      discount_amount: 0,
      tax_amount: 0,
      total: amount,
      currency: 'USD',
      coupon_id: couponId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any);

    if (orderError) throw orderError;

    if (type === 'STUDENT_COURSE') {
      await supabaseAdmin.from('order_items').insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        course_id: itemId,
        unit_price: amount,
        discount_amount: 0,
        final_price: amount,
        created_at: new Date().toISOString()
      } as any);
    }

    // 4. Create Payment with PENDING status (awaiting manual admin verification)
    const { error: paymentError } = await supabaseAdmin.from('payments').insert({
      id: paymentId,
      order_id: orderId,
      user_id: user.id,
      amount: amount,
      currency: 'USD',
      status: 'PENDING',
      provider: 'MOBILE_MONEY_MANUAL',
      method: `MANUAL_MOMO::${carrier || 'MTN'}::${itemId}::MONTHLY`,
      failure_reason: `Réf Virement MoMo : ${cleanRef} (${phoneNumber}) — En attente de validation administrative`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any);

    if (paymentError) throw paymentError;

    // 5. Notify student/instructor that payment is under review (no instant activation)
    try {
      let itemTitle = 'votre commande';
      if (type === 'STUDENT_COURSE') {
        const { data: courseData } = await supabaseAdmin
          .from('courses')
          .select('title')
          .eq('id', itemId)
          .maybeSingle();
        itemTitle = courseData?.title ? `le cours "${courseData.title}"` : 'votre formation';
      } else if (type === 'INSTRUCTOR_PLAN') {
        itemTitle = `l'abonnement Plan ${itemId.toUpperCase()}`;
      }

      await createNotification({
        userId: user.id,
        title: "Virement Mobile Money en cours d'examen ⏳",
        message: `Votre virement Mobile Money (Réf: ${cleanRef}) pour ${itemTitle} a été enregistré. L'accès sera activé dès confirmation par l'administration.`,
        type: "INFO",
        link: "/dashboard/payments"
      });
    } catch (e) {
      console.warn('[manual-momo-submit] Notification error:', e);
    }

    return NextResponse.json({
      success: true,
      pending: true,
      orderId,
      paymentId,
      message: 'Votre demande de paiement par virement Mobile Money a été enregistrée avec succès. Elle sera validée par notre équipe sous peu.'
    });

  } catch (err: any) {
    console.error('[manual-momo-submit] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de l\'enregistrement du virement.' }, { status: 500 });
  }
}
