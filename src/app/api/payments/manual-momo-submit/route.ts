import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/supabase/notifications-helper';
import { incrementCouponUses } from '@/lib/supabase/orders-helper';
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
    const { amount, phoneNumber, carrier, type, itemId, transactionRef, couponId, payInstallment } = body;

    if (!amount || !phoneNumber || !transactionRef || !type || !itemId) {
      return NextResponse.json({ error: 'Informations de virement incomplètes. Veuillez fournir la référence de transaction.' }, { status: 400 });
    }

    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const cleanRef = String(transactionRef).trim().toUpperCase();

    // 3. Create Order
    const { error: orderError } = await supabaseAdmin.from('orders').insert({
      id: orderId,
      user_id: user.id,
      order_number: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'COMPLETED',
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

    // 4. Create Payment
    const { error: paymentError } = await supabaseAdmin.from('payments').insert({
      id: paymentId,
      order_id: orderId,
      user_id: user.id,
      amount: amount,
      currency: 'USD',
      status: 'PAID',
      provider: 'MOBILE_MONEY_MANUAL',
      method: `MANUAL_MOMO::${carrier || 'MTN'}::${itemId}::MONTHLY`,
      paid_at: new Date().toISOString(),
      failure_reason: `Réf Virement MoMo : ${cleanRef} (${phoneNumber})`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any);

    if (paymentError) throw paymentError;

    // 5. Handle Activation
    if (type === 'STUDENT_COURSE') {
      // Enroll student
      await supabaseAdmin.from('enrollments').upsert({
        id: crypto.randomUUID(),
        student_id: user.id,
        course_id: itemId,
        progress_percent: 0,
        status: 'ACTIVE',
        enrolled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any, { onConflict: 'student_id,course_id' });

      // Increment coupon uses
      if (couponId) {
        await incrementCouponUses(orderId, supabaseAdmin);
      }

      // Notify & Send Email
      try {
        const { data: courseData } = await supabaseAdmin
          .from('courses')
          .select('title')
          .eq('id', itemId)
          .maybeSingle();

        const courseTitle = courseData?.title || 'Formation';

        await createNotification({
          userId: user.id,
          title: "Inscription validée !",
          message: `Votre virement MoMo (Réf: ${cleanRef}) a été confirmé. Vous avez maintenant accès à "${courseTitle}".`,
          type: "SUCCESS",
          link: "/dashboard/courses"
        });

        const { data: studentProfile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (studentProfile?.email) {
          const { sendStudentCourseUnlockedEmail } = await import("@/lib/email");
          await sendStudentCourseUnlockedEmail(
            studentProfile.email,
            studentProfile.full_name || "Apprenant",
            courseTitle,
            itemId
          );
        }
      } catch (e) {
        console.error('[manual-momo-submit] Notification error:', e);
      }

    } else if (type === 'INSTRUCTOR_PLAN') {
      // Update instructor plan
      const planVal = itemId.toUpperCase();

      await supabaseAdmin
        .from('profiles')
        .update({ plan: planVal } as any)
        .eq('id', user.id);

      await createNotification({
        userId: user.id,
        title: "Abonnement activé !",
        message: `Votre virement MoMo (Réf: ${cleanRef}) a été confirmé. Votre plan ${planVal} est actif.`,
        type: "SUCCESS",
        link: "/instructor/billing"
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Paiement par virement Mobile Money validé avec succès !'
    });

  } catch (err: any) {
    console.error('[manual-momo-submit] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de la validation du virement.' }, { status: 500 });
  }
}
