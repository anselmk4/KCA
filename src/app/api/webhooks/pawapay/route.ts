import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/supabase/notifications-helper';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  console.log('[webhook-pawapay] Received callback request from PawaPay');
  try {
    const body = await req.json();
    console.log('[webhook-pawapay] Callback payload:', JSON.stringify(body, null, 2));

    // PawaPay callbacks can arrive as an array of event objects or a single object
    const events = Array.isArray(body) ? body : [body];

    for (const event of events) {
      const { depositId, status, failureCode } = event;

      if (!depositId) {
        console.warn('[webhook-pawapay] Skipping event due to missing depositId');
        continue;
      }

      console.log(`[webhook-pawapay] Processing depositId: ${depositId}, Status: ${status}`);

      // depositId corresponds to paymentId in our database
      const paymentId = depositId;

      // 1. Fetch current payment and order details
      const { data: payment, error: fetchErr } = await supabaseAdmin
        .from('payments')
        .select('order_id, user_id, amount, status')
        .eq('id', paymentId)
        .maybeSingle();

      if (fetchErr || !payment) {
        console.error(`[webhook-pawapay] Payment record not found for id ${paymentId}:`, fetchErr?.message);
        continue;
      }

      if (payment.status === 'PAID') {
        console.log(`[webhook-pawapay] Payment ${paymentId} is already marked as PAID. Skipping.`);
        continue;
      }

      if (status === 'COMPLETED') {
        console.log(`[webhook-pawapay] Deposit ${depositId} is COMPLETED. Updating database...`);

        // Update payment to PAID
        const { error: payUpdateErr } = await supabaseAdmin
          .from('payments')
          .update({
            status: 'PAID',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', paymentId);

        if (payUpdateErr) console.error('[webhook-pawapay] Payment update error:', payUpdateErr.message);

        // Update order to COMPLETED
        const { error: orderUpdateErr } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'COMPLETED',
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', payment.order_id);

        if (orderUpdateErr) console.error('[webhook-pawapay] Order update error:', orderUpdateErr.message);

        // Fetch order item to determine product type
        const { data: orderItem } = await supabaseAdmin
          .from('order_items')
          .select('course_id')
          .eq('order_id', payment.order_id)
          .maybeSingle();

        if (orderItem) {
          const courseId = orderItem.course_id;

          // Plan list IDs
          const planUuidMap: Record<string, string> = {
            "99999999-9999-9999-9999-999999990001": "BASE",
            "99999999-9999-9999-9999-999999990002": "PRO",
            "99999999-9999-9999-9999-999999990003": "MAX",
          };

          const planVal = planUuidMap[courseId];
          if (planVal) {
            // Upgrade profile plan
            const { error: planErr } = await supabaseAdmin
              .from('profiles')
              .update({ plan: planVal } as any)
              .eq('id', payment.user_id);

            if (planErr) console.error('[webhook-pawapay] Error updating instructor plan:', planErr.message);

            // Notify instructor of subscription
            await createNotification({
              userId: payment.user_id,
              title: "Abonnement activé !",
              message: `Félicitations, votre abonnement Ansella au plan ${planVal} est maintenant activé !`,
              type: "SUCCESS",
              link: `/instructor/billing`
            });

            // Send Invoice Email to instructor
            try {
              const { data: instructorProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, email')
                .eq('id', payment.user_id)
                .maybeSingle();

              if (instructorProfile?.email) {
                const { sendInvoiceEmail } = await import("@/lib/email");
                const { data: orderData } = await supabaseAdmin
                  .from("orders")
                  .select("order_number")
                  .eq("id", payment.order_id)
                  .maybeSingle();
                
                const orderNumber = orderData?.order_number || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

                await sendInvoiceEmail(
                  instructorProfile.email,
                  instructorProfile.full_name || "Formateur",
                  orderNumber,
                  payment.amount,
                  `Abonnement Formateur — Plan ${planVal}`,
                  "Mise à niveau et accès illimité aux fonctionnalités formateur."
                );
              }
            } catch (emailErr) {
              console.error('[webhook-pawapay] Error sending instructor invoice:', emailErr);
            }

          } else {
            // Activate student course enrollment
            const { error: enrollUpdateErr } = await supabaseAdmin
              .from('enrollments')
              .update({ status: 'ACTIVE' } as any)
              .eq('student_id', payment.user_id)
              .eq('course_id', courseId);

            if (enrollUpdateErr) {
              console.error('[webhook-pawapay] Enrollment activate error, trying upsert:', enrollUpdateErr.message);
              await supabaseAdmin.from('enrollments').upsert({
                student_id: payment.user_id,
                course_id: courseId,
                progress_percent: 0,
                status: 'ACTIVE',
                enrolled_at: new Date().toISOString()
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

              // Notify student
              await createNotification({
                userId: payment.user_id,
                title: "Paiement validé !",
                message: `Votre paiement de ${payment.amount}$ pour le cours "${courseTitle}" a été validé.`,
                type: "SUCCESS",
                link: `/dashboard/courses`
              });

              // Fetch Student Profile
              const { data: studentProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, email')
                .eq('id', payment.user_id)
                .maybeSingle();

              const studentName = studentProfile?.full_name || 'Un apprenant';
              const studentEmail = studentProfile?.email;

              // Notify instructor & compute payout earnings
              let instructorEmail = "";
              let instructorName = "Formateur";
              if (courseData?.instructor_id) {
                const { data: instructorProfile } = await supabaseAdmin
                  .from('profiles')
                  .select('full_name, email, plan')
                  .eq('id', courseData.instructor_id)
                  .maybeSingle();
                
                if (instructorProfile) {
                  instructorEmail = instructorProfile.email || "";
                  instructorName = instructorProfile.full_name || "Formateur";

                  // Commission logic (20% for FREE plan, 10% for BASE, 0% for PRO/MAX)
                  const instPlan = instructorProfile.plan || 'FREE';
                  const commissionRate = instPlan === 'FREE' ? 0.20 : (instPlan === 'BASE' ? 0.10 : 0.0);
                  const platformFee = payment.amount * commissionRate;
                  const instructorEarnings = payment.amount - platformFee;

                  // Insert payout record
                  await supabaseAdmin.from('payouts').insert({
                    id: crypto.randomUUID(),
                    instructor_id: courseData.instructor_id,
                    amount: instructorEarnings,
                    status: 'PENDING',
                    payment_method: 'MOBILE_MONEY',
                    created_at: new Date().toISOString()
                  } as any);

                  // Send notification to instructor
                  await createNotification({
                    userId: courseData.instructor_id,
                    title: "Nouvelle inscription !",
                    message: `"${studentName}" s'est inscrit à votre cours "${courseTitle}". Vos gains : $${instructorEarnings.toFixed(2)}.`,
                    type: "SUCCESS",
                    link: `/instructor/students`
                  });
                }
              }

              // Send Invoice Email to student
              if (studentEmail) {
                const { sendInvoiceEmail } = await import("@/lib/email");
                const { data: orderData } = await supabaseAdmin
                  .from("orders")
                  .select("order_number")
                  .eq("id", payment.order_id)
                  .maybeSingle();
                const orderNumber = orderData?.order_number || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

                await sendInvoiceEmail(
                  studentEmail,
                  studentName,
                  orderNumber,
                  payment.amount,
                  courseTitle,
                  "Accès complet et illimité à la formation."
                );
              }

              // Send purchased email alert to instructor
              if (instructorEmail) {
                const { sendInstructorCoursePurchasedEmail } = await import("@/lib/email");
                await sendInstructorCoursePurchasedEmail(
                  instructorEmail,
                  instructorName,
                  studentName,
                  courseTitle,
                  payment.amount
                );
              }
            } catch (notifErr) {
              console.error('[webhook-pawapay] Error triggering course notifications:', notifErr);
            }
          }
        }
      } else if (status === 'FAILED') {
        console.log(`[webhook-pawapay] Deposit ${depositId} has FAILED. Marking payment as FAILED.`);

        // Update payment to FAILED
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'FAILED',
            failure_reason: failureCode || 'Rejeté par PawaPay / Annulé par l\'utilisateur',
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', paymentId);

        // Update order to CANCELLED
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'CANCELLED',
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', payment.order_id);
      }
    }

    return NextResponse.json({ success: true, message: 'Events processed' }, { status: 200 });

  } catch (err: any) {
    console.error('[webhook-pawapay] Critical error handling webhook:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
