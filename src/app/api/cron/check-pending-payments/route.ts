import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getPawaPayDepositStatus } from '@/lib/pawapay';
import { createNotification } from '@/lib/supabase/notifications-helper';
import { incrementCouponUses } from '@/lib/supabase/orders-helper';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[cron-pending-payments] Unauthorized cron execution attempt blocked.');
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    console.log('[cron-pending-payments] Running background pending payments check...');

    // 1. Fetch pending Mobile Money payments created within the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: pendingPayments, error: fetchErr } = await supabaseAdmin
      .from('payments')
      .select('id, order_id, user_id, amount, status, method, created_at')
      .eq('status', 'PENDING')
      .eq('provider', 'MOBILE_MONEY')
      .gte('created_at', yesterday);

    if (fetchErr) {
      console.error('[cron-pending-payments] Error fetching pending payments:', fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({ processed: 0, message: 'Aucun paiement Mobile Money en attente.' });
    }

    console.log(`[cron-pending-payments] Found ${pendingPayments.length} pending Mobile Money payments.`);

    let completedCount = 0;
    let failedCount = 0;

    for (const payment of pendingPayments) {
      const createdAtTime = new Date(payment.created_at).getTime();
      const nowTime = Date.now();
      const ageMinutes = (nowTime - createdAtTime) / (1000 * 60);

      // Query PawaPay deposit status directly
      const pawaResult = await getPawaPayDepositStatus(payment.id);

      if (!pawaResult.success) {
        // If > 15 minutes old and PawaPay API check fails or returns error, expire it
        if (ageMinutes > 15) {
          await expirePayment(payment);
          failedCount++;
        }
        continue;
      }

      const pawaStatus = (pawaResult.status || '').toUpperCase();

      if (pawaStatus === 'COMPLETED') {
        console.log(`[cron-pending-payments] Deposit ${payment.id} is COMPLETED! Activating order...`);

        // Mark payment PAID
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'PAID',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', payment.id);

        // Mark order COMPLETED
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'COMPLETED',
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', payment.order_id);

        await incrementCouponUses(payment.order_id, supabaseAdmin);

        // Parse method field CARRIER::TYPE::ITEM_ID
        const methodParts = (payment.method || '').split('::');
        const paymentType = methodParts[1] || '';
        const itemId = methodParts[2] || '';

        if (paymentType === 'INSTRUCTOR_PLAN' && itemId) {
          const planVal = itemId.toUpperCase();

          await supabaseAdmin
            .from('profiles')
            .update({ plan: planVal } as any)
            .eq('id', payment.user_id);

          await createNotification({
            userId: payment.user_id,
            title: "Abonnement activé !",
            message: `Félicitations, votre abonnement Ansella au plan ${planVal} est maintenant activé !`,
            type: "SUCCESS",
            link: `/instructor/billing`
          });

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
                `Référence : ${orderNumber} — Accès illimité aux fonctionnalités Formateur Plan ${planVal}.`
              );
            }
          } catch (emailErr) {
            console.error('[cron-pending-payments] Error sending instructor invoice:', emailErr);
          }

        } else if (paymentType === 'STUDENT_COURSE' && itemId) {
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

                // Base instructor commission on course price (excluding gateway fee surcharge)
                const { data: orderItem } = await supabaseAdmin
                  .from('order_items')
                  .select('final_price')
                  .eq('order_id', payment.order_id)
                  .eq('course_id', courseId)
                  .maybeSingle();

                const courseRevenue = orderItem?.final_price != null 
                  ? (Number(orderItem.final_price) || 0)
                  : payment.amount;

                const platformFee = courseRevenue * commissionRate;
                const instructorEarnings = courseRevenue - platformFee;

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
              }
            }

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
          } catch (notifErr) {
            console.error('[cron-pending-payments] Error sending course notifications:', notifErr);
          }
        } else if (paymentType === 'DIGITAL_PRODUCT' && itemId) {
          try {
            await supabaseAdmin
              .from('digital_product_purchases')
              .upsert({
                product_id: itemId,
                user_id: payment.user_id,
                price_paid: payment.amount,
                payment_method: 'pawapay',
                payment_status: 'COMPLETED',
                transaction_id: payment.id,
                created_at: new Date().toISOString(),
              } as any, { onConflict: 'product_id,user_id' });

            // Enregistrer dans transactions générale
            await (supabaseAdmin as any).from('transactions').insert({
              user_id: payment.user_id,
              amount: payment.amount,
              course_id: itemId,
              method: 'PawaPay Mobile Money',
              status: 'PAID',
              date: new Date().toISOString(),
            } as any);

            // Fetch product and author to notify and calculate commission
            const { data: product } = await supabaseAdmin
              .from('digital_products')
              .select('id, title, author_id, price')
              .eq('id', itemId)
              .maybeSingle();

            const productTitle = product?.title || 'Produit Digital';

            if (product?.author_id) {
              const { data: authorProfile } = await supabaseAdmin
                .from('profiles')
                .select('email, full_name, plan')
                .eq('id', product.author_id)
                .maybeSingle();

              const instPlan = authorProfile?.plan || 'FREE';
              const commissionRate = instPlan === 'FREE' ? 0.20 : (instPlan === 'BASE' ? 0.10 : (instPlan === 'PRO' ? 0.05 : 0.0));
              const platformFee = payment.amount * commissionRate;
              const instructorEarnings = payment.amount - platformFee;

              await createNotification({
                userId: product.author_id,
                title: "Nouvelle vente de produit digital !",
                message: `"${productTitle}" a été acheté (${payment.amount} $). Vos gains nets : $${instructorEarnings.toFixed(2)} (Commission plateforme : ${(commissionRate * 100).toFixed(0)}%).`,
                type: "SUCCESS",
                link: `/instructor/courses`
              });
            }

            // Buyer notification & invoice
            const metaEmail = methodParts[3] ? decodeURIComponent(methodParts[3]) : '';
            let buyerEmail = (metaEmail && metaEmail.includes('@')) ? metaEmail : '';
            let buyerName = buyerEmail ? (buyerEmail.split('@')[0] || "Client") : "Client";

            if (!buyerEmail && payment.user_id) {
              const { data: buyerProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, email')
                .eq('id', payment.user_id)
                .maybeSingle();
              if (buyerProfile?.email) {
                buyerEmail = buyerProfile.email;
                buyerName = buyerProfile.full_name || buyerName;
              }
            }

            if (buyerEmail) {
              const { sendInvoiceEmail } = await import("@/lib/email");
              await sendInvoiceEmail(
                buyerEmail,
                buyerName,
                `DP-${payment.id.substring(0, 8).toUpperCase()}`,
                payment.amount,
                productTitle,
                "Votre paiement Mobile Money PawaPay est validé. Votre ressource numérique est disponible immédiatement."
              );
            }
          } catch (dpCronErr) {
            console.error('[cron-pending-payments] Error activating digital product:', dpCronErr);
          }
        }

        completedCount++;

      } else if (['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(pawaStatus) || ageMinutes > 15) {
        await expirePayment(payment, pawaResult.failureMessage || 'Expiré ou rejeté.');
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingPayments.length,
      completed: completedCount,
      failed: failedCount
    });

  } catch (err: any) {
    console.error('[cron-pending-payments] Critical error:', err);
    return NextResponse.json({ error: err.message || 'Erreur interne' }, { status: 500 });
  }
}

async function expirePayment(payment: any, reason?: string) {
  await supabaseAdmin
    .from('payments')
    .update({
      status: 'FAILED',
      failure_reason: reason || 'Délai d\'attente de la saisie du code PIN dépassé (15 minutes).',
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', payment.id);

  await supabaseAdmin
    .from('orders')
    .update({
      status: 'CANCELLED',
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', payment.order_id);
}
