import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { getPawaPayDepositStatus } from '@/lib/pawapay';
import { createNotification } from '@/lib/supabase/notifications-helper';
import { incrementCouponUses } from '@/lib/supabase/orders-helper';
import crypto from 'crypto';

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 });
    }

    // 2. Extract depositId from query params
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json({ error: 'Identifiant de dépôt manquant (depositId)' }, { status: 400 });
    }

    // 3. Fetch payment from database
    const { data: payment, error: fetchErr } = await supabaseAdmin
      .from('payments')
      .select('id, order_id, user_id, amount, status, method, failure_reason')
      .eq('id', depositId)
      .maybeSingle();

    if (fetchErr || !payment) {
      return NextResponse.json({ error: `Paiement introuvable pour l'id ${depositId}` }, { status: 404 });
    }

    // Ensure payment belongs to the current user (security check)
    if (payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé à cette transaction.' }, { status: 403 });
    }

    // If already marked as PAID in DB, return immediately
    if (payment.status === 'PAID') {
      return NextResponse.json({ 
        status: 'PAID',
        message: 'Paiement déjà validé.'
      });
    }

    // If marked as FAILED in DB, return failure status
    if (payment.status === 'FAILED') {
      return NextResponse.json({ 
        status: 'FAILED',
        failureReason: payment.failure_reason || 'Paiement annulé ou rejeté.'
      });
    }

    // 4. Query PawaPay API directly for deposit status
    const pawaPayResult = await getPawaPayDepositStatus(depositId);

    if (!pawaPayResult.success) {
      console.warn('[pawapay-check-status] PawaPay status check warning:', pawaPayResult.error);
      // Return pending if PawaPay API error (to allow retry)
      return NextResponse.json({ status: 'PENDING', error: pawaPayResult.error });
    }

    const pawaStatus = (pawaPayResult.status || '').toUpperCase();
    console.log(`[pawapay-check-status] Deposit ${depositId} PawaPay status: ${pawaStatus}`);

    // 5. Process COMPLETED status
    if (pawaStatus === 'COMPLETED') {
      console.log(`[pawapay-check-status] Deposit ${depositId} is COMPLETED. Updating database...`);

      // Update payment to PAID
      const { error: payUpdateErr } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'PAID',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', depositId);

      if (payUpdateErr) console.error('[pawapay-check-status] Payment update error:', payUpdateErr.message);

      // Update order to COMPLETED
      const { error: orderUpdateErr } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', payment.order_id);

      if (orderUpdateErr) console.error('[pawapay-check-status] Order update error:', orderUpdateErr.message);

      // Increment coupon usages if applicable
      await incrementCouponUses(payment.order_id, supabaseAdmin);

      // Parse method field: CARRIER::TYPE::ITEM_ID::CYCLE
      const methodParts = (payment.method || '').split('::');
      const paymentType = methodParts[1] || '';
      const itemId = methodParts[2] || '';
      const billingCycle = (methodParts[3] || 'MONTHLY').toUpperCase();

      if (paymentType === 'INSTRUCTOR_PLAN' && itemId) {
        // Activate Instructor Plan
        const planVal = itemId.toUpperCase();

        await supabaseAdmin
          .from('profiles')
          .update({ plan: planVal } as any)
          .eq('id', payment.user_id);

        const cycleLabel = billingCycle === 'ANNUAL' ? 'Annuel (1 an)' : 'Mensuel';

        await createNotification({
          userId: payment.user_id,
          title: "Abonnement activé !",
          message: `Félicitations, votre abonnement Ansella au plan ${planVal} (${cycleLabel}) est maintenant activé !`,
          type: "SUCCESS",
          link: `/instructor/billing`
        });

        // Send Invoice Email to Instructor
        try {
          const { data: instructorProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', payment.user_id)
            .maybeSingle();

          if (instructorProfile?.email) {
            const { data: orderData } = await supabaseAdmin
              .from("orders")
              .select("order_number")
              .eq("id", payment.order_id)
              .maybeSingle();

            const orderNumber = orderData?.order_number || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            const { sendInstructorPlanInvoiceEmail } = await import("@/lib/email");
            await sendInstructorPlanInvoiceEmail(
              instructorProfile.email,
              instructorProfile.full_name || "Formateur",
              orderNumber,
              payment.amount,
              `${planVal} — ${cycleLabel}`
            );
          }
        } catch (emailErr) {
          console.error('[pawapay-check-status] Error sending instructor invoice:', emailErr);
        }

      } else if (paymentType === 'STUDENT_COURSE' && itemId) {
        // Activate Student Course Enrollment
        const courseId = itemId;

        const { data: updateData, error: enrollUpdateErr } = await supabaseAdmin
          .from('enrollments')
          .update({ 
            status: 'ACTIVE',
            updated_at: new Date().toISOString()
          } as any)
          .eq('student_id', payment.user_id)
          .eq('course_id', courseId)
          .select('id');

        if (enrollUpdateErr || !updateData || updateData.length === 0) {
          await supabaseAdmin
            .from('enrollments')
            .insert({
              id: crypto.randomUUID(),
              student_id: payment.user_id,
              course_id: courseId,
              progress_percent: 0,
              status: 'ACTIVE',
              enrolled_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any);
        }

        // Notifications & Emails
        try {
          const { data: courseData } = await supabaseAdmin
            .from('courses')
            .select('title, instructor_id')
            .eq('id', courseId)
            .maybeSingle();

          const courseTitle = courseData?.title || 'Formation';

          await createNotification({
            userId: payment.user_id,
            title: "Paiement validé !",
            message: `Votre paiement de ${payment.amount}$ pour le cours "${courseTitle}" a été validé.`,
            type: "SUCCESS",
            link: `/dashboard/courses`
          });

          const { data: studentProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', payment.user_id)
            .maybeSingle();

          const studentName = studentProfile?.full_name || 'Un apprenant';
          const studentEmail = studentProfile?.email;

          if (courseData?.instructor_id) {
            const { data: instructorProfile } = await supabaseAdmin
              .from('profiles')
              .select('full_name, email, plan')
              .eq('id', courseData.instructor_id)
              .maybeSingle();

            if (instructorProfile) {
              const instPlan = instructorProfile.plan || 'FREE';
              const commissionRate = instPlan === 'FREE' ? 0.20 : (instPlan === 'BASE' ? 0.10 : 0.0);
              const platformFee = payment.amount * commissionRate;
              const instructorEarnings = payment.amount - platformFee;

              await createNotification({
                userId: courseData.instructor_id,
                title: "Nouvelle inscription !",
                message: `"${studentName}" s'est inscrit à votre cours "${courseTitle}". Vos gains : $${instructorEarnings.toFixed(2)}.`,
                type: "SUCCESS",
                link: `/instructor/students`
              });

              if (instructorProfile.email) {
                const { sendInstructorCoursePurchasedEmail } = await import("@/lib/email");
                await sendInstructorCoursePurchasedEmail(
                  instructorProfile.email,
                  instructorProfile.full_name || "Formateur",
                  studentName,
                  courseTitle,
                  payment.amount
                );
              }

              // Check FREE instructor 10 students quota
              const { checkInstructorStudentQuota } = await import("@/lib/supabase/notifications-helper");
              await checkInstructorStudentQuota(courseData.instructor_id);
            }
          }

          if (studentEmail) {
            const { sendStudentTransactionReceiptEmail, sendStudentCourseUnlockedEmail } = await import("@/lib/email");
            const { data: orderData } = await supabaseAdmin
              .from("orders")
              .select("order_number")
              .eq("id", payment.order_id)
              .maybeSingle();

            const orderNumber = orderData?.order_number || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Send Detailed Transaction Receipt
            await sendStudentTransactionReceiptEmail(
              studentEmail,
              studentName,
              orderNumber,
              payment.amount,
              "USD",
              courseTitle,
              "Mobile Money"
            );

            // Send Course Unlocked Email
            await sendStudentCourseUnlockedEmail(
              studentEmail,
              studentName,
              courseTitle,
              courseId
            );
          }
        } catch (notifErr) {
          console.error('[pawapay-check-status] Error sending course notifications:', notifErr);
        }
      }

      return NextResponse.json({ 
        status: 'PAID',
        message: 'Paiement validé avec succès !'
      });
    }

    // 6. Process FAILED or REJECTED status
    if (['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(pawaStatus)) {
      const failureReason = pawaPayResult.failureMessage || 'Transaction rejetée ou annulée par l\'opérateur.';

      await supabaseAdmin
        .from('payments')
        .update({
          status: 'FAILED',
          failure_reason: failureReason,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', depositId);

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', payment.order_id);

      return NextResponse.json({
        status: 'FAILED',
        failureReason
      });
    }

    // 7. Transaction is still PENDING / SUBMITTED / ACCEPTED
    return NextResponse.json({
      status: 'PENDING',
      message: 'Transaction en cours d\'approbation sur le mobile du client.'
    });

  } catch (err: any) {
    console.error('[pawapay-check-status] Critical error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne de serveur' }, { status: 500 });
  }
}
