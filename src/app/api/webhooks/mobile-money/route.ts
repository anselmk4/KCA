import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/supabase/notifications-helper';
import crypto from 'crypto';

// Initialize a service role/admin client to bypass RLS when updating/inserting payments/orders on behalf of the system
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  console.log('[webhook-momo] Received callback request');
  try {
    // 1. Parse incoming payload
    const body = await req.json();
    console.log('[webhook-momo] Payload received:', JSON.stringify(body, null, 2));

    // Extract reference and status (support both uppercase and lowercase keys)
    const reference = body.reference || body.Reference || body.ref;
    const transStatus = body.status || body.Status || body.Trans_Status || body.trans_status;

    if (!reference) {
      console.error('[webhook-momo] Missing reference in payload');
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    console.log(`[webhook-momo] Reference: ${reference}, Declared Status: ${transStatus}`);

    // Check payment provider in database first to determine whether this is a Moko Card payment
    let isCard = false;
    let paymentId = '';
    if (reference.startsWith('std_pay_')) {
      paymentId = reference.replace('std_pay_', '');
    } else if (reference.startsWith('ins_plan_')) {
      paymentId = reference.replace('ins_plan_', '');
    }

    if (paymentId) {
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('provider')
        .eq('id', paymentId)
        .maybeSingle();
      if (payment?.provider === 'MOKO_CARD') {
        isCard = true;
      }
    }

    let isSuccess = false;
    let finalVerifyStatus = '';

    if (isCard) {
      // 2. Call Moko Card API to verify status
      const cardApiKey = process.env.MOKO_CARD_API_KEY;
      const cardApiSecret = process.env.MOKO_CARD_API_SECRET;
      const cardBaseUrl = process.env.MOKO_CARD_API_URL || 'https://test.card.gofreshpay.com/api/v1/payment/orders';
      const verifyUrl = `${cardBaseUrl.replace(/\/$/, '')}/${reference}`;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = crypto.createHmac('sha256', cardApiSecret || '')
        .update(timestamp)
        .digest('hex');

      try {
        console.log(`[webhook-momo] Querying Moko Card status for reference: ${reference}...`);
        const verifyResponse = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            'X-API-Key': cardApiKey || '',
            'X-Timestamp': timestamp,
            'X-Signature': signature
          }
        });

        const verifyText = await verifyResponse.text();
        console.log('[webhook-momo] Moko Card Verification API Response:', verifyText);

        let verifyData: any = {};
        try {
          verifyData = JSON.parse(verifyText);
        } catch {
          verifyData = { message: verifyText };
        }

        finalVerifyStatus = verifyData.status || verifyData.Status || verifyData.Trans_Status || verifyData.data?.status || '';

        if (
          verifyResponse.ok && 
          (finalVerifyStatus.toLowerCase() === 'successful' || 
           finalVerifyStatus.toLowerCase() === 'success' || 
           finalVerifyStatus.toLowerCase() === 'approved')
        ) {
          isSuccess = true;
        } else {
          console.warn(`[webhook-momo] Card Verification failed. Status reported: ${finalVerifyStatus}`);
          if (process.env.NODE_ENV === 'development' && 
              (transStatus?.toLowerCase() === 'successful' || transStatus?.toLowerCase() === 'success')) {
            console.warn('[webhook-momo] Sandbox mode: Bypassing card verify API non-success due to development');
            isSuccess = true;
            finalVerifyStatus = transStatus;
          }
        }
      } catch (verifyErr: any) {
        console.error('[webhook-momo] Error during card verification fetch:', verifyErr.message);
        if (process.env.NODE_ENV === 'development' && 
            (transStatus?.toLowerCase() === 'successful' || transStatus?.toLowerCase() === 'success')) {
          isSuccess = true;
          finalVerifyStatus = transStatus;
        }
      }
    } else {
      // 2. Call Moko Mobile Money API to verify status
      const mokoBaseUrl = process.env.MOKO_API_BASE_URL || 'https://paydrc.gofreshbakery.net';
      const mokoGatewayUrl = mokoBaseUrl.endsWith('/gateway')
        ? mokoBaseUrl
        : `${mokoBaseUrl.replace(/\/$/, '')}/gateway`;

      const verifyPayload = {
        merchant_id: process.env.MOKO_MERCHANT_CODE || process.env.MOKO_MERCHANT_ID,
        merchant_secrete: process.env.MOKO_MERCHANT_SECRET,
        action: 'verify',
        reference: reference
      };

      try {
        console.log(`[webhook-momo] Querying Moko Mobile Money status for reference: ${reference}...`);
        const verifyResponse = await fetch(mokoGatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyPayload),
        });

        const verifyText = await verifyResponse.text();
        console.log('[webhook-momo] Verification API Response:', verifyText);

        let verifyData: any = {};
        try {
          verifyData = JSON.parse(verifyText);
        } catch {
          verifyData = { message: verifyText };
        }

        finalVerifyStatus = verifyData.status || verifyData.Status || verifyData.Trans_Status || '';
        
        if (
          verifyResponse.ok && 
          (finalVerifyStatus.toLowerCase() === 'successful' || 
           finalVerifyStatus.toLowerCase() === 'success' || 
           finalVerifyStatus.toLowerCase() === 'approved')
        ) {
          isSuccess = true;
        } else {
          console.warn(`[webhook-momo] Verification failed. Status reported by Moko verify: ${finalVerifyStatus}`);
          if (process.env.NODE_ENV === 'development' && 
              (transStatus?.toLowerCase() === 'successful' || transStatus?.toLowerCase() === 'success')) {
            console.warn('[webhook-momo] Sandbox mode: Bypassing verify API non-success response due to local development');
            isSuccess = true;
            finalVerifyStatus = transStatus;
          }
        }

      } catch (verifyErr: any) {
        console.error('[webhook-momo] Error during server-to-server verification fetch:', verifyErr.message);
        
        if (process.env.NODE_ENV === 'development' && 
            (transStatus?.toLowerCase() === 'successful' || transStatus?.toLowerCase() === 'success')) {
          console.warn('[webhook-momo] Sandbox mode: Bypassing verify API failure due to local development environments');
          isSuccess = true;
          finalVerifyStatus = transStatus;
        }
      }
    }

    // 3. Process database updates based on verification results
    if (isSuccess) {
      console.log(`[webhook-momo] Transaction ${reference} is SUCCESSFUL. Updating database...`);

      if (reference.startsWith('std_pay_')) {
        // STUDENT COURSE PURCHASE
        const paymentId = reference.replace('std_pay_', '');
        console.log(`[webhook-momo] Processing student payment: ${paymentId}`);

        // Fetch payment to get order details
        const { data: payment, error: fetchErr } = await supabaseAdmin
          .from('payments')
          .select('order_id, user_id, amount')
          .eq('id', paymentId)
          .maybeSingle();

        if (fetchErr || !payment) {
          console.error('[webhook-momo] Error finding payment or order:', fetchErr?.message || 'Payment not found');
          return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Fetch order item to find course_id
        const { data: orderItem } = await supabaseAdmin
          .from('order_items')
          .select('course_id')
          .eq('order_id', payment.order_id)
          .maybeSingle();

        const courseId = orderItem?.course_id;

        // Perform transactional update using admin client
        // Update payment to PAID
        const { error: payUpdateErr } = await supabaseAdmin
          .from('payments')
          .update({
            status: 'PAID',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', paymentId);

        if (payUpdateErr) console.error('[webhook-momo] Payment update error:', payUpdateErr.message);

        // Update order to COMPLETED
        const { error: orderUpdateErr } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'COMPLETED',
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', payment.order_id);

        if (orderUpdateErr) console.error('[webhook-momo] Order update error:', orderUpdateErr.message);

        // Activate Enrollment
        if (courseId) {
          const { error: enrollUpdateErr } = await supabaseAdmin
            .from('enrollments')
            .update({
              status: 'ACTIVE',
              enrolled_at: new Date().toISOString()
            } as any)
            .eq('student_id', payment.user_id)
            .eq('course_id', courseId);

          if (enrollUpdateErr) {
            console.error('[webhook-momo] Enrollment activation error:', enrollUpdateErr.message);
            // Attempt inserts in case enrollment didn't exist
            await supabaseAdmin.from('enrollments').upsert({
              student_id: payment.user_id,
              course_id: courseId,
              progress_percent: 0,
              status: 'ACTIVE',
              enrolled_at: new Date().toISOString()
            } as any);
          }
          console.log(`[webhook-momo] Student ${payment.user_id} successfully enrolled in course ${courseId}`);

          // Trigger notifications and email alerts
          try {
            const { data: courseData } = await supabaseAdmin
              .from('courses')
              .select('title, instructor_id')
              .eq('id', courseId)
              .maybeSingle();

            const courseTitle = courseData?.title || 'Formation';

            // Student Notification
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

            // Instructor Notification
            let instructorEmail = "";
            let instructorName = "Formateur";
            if (courseData?.instructor_id) {
              const { data: instructorProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name, email')
                .eq('id', courseData.instructor_id)
                .maybeSingle();
              
              if (instructorProfile) {
                instructorEmail = instructorProfile.email || "";
                instructorName = instructorProfile.full_name || "Formateur";
              }

              await createNotification({
                userId: courseData.instructor_id,
                title: "Nouvelle inscription !",
                message: `"${studentName}" s'est inscrit à votre cours "${courseTitle}".`,
                type: "SUCCESS",
                link: `/instructor/students`
              });
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
            console.error('[webhook-momo] Error triggering notifications:', notifErr);
          }
        }

      } else if (reference.startsWith('ins_plan_')) {
        // INSTRUCTOR PLAN SUBSCRIPTION
        const paymentId = reference.replace('ins_plan_', '');
        console.log(`[webhook-momo] Processing instructor subscription payment: ${paymentId}`);

        // Fetch payment to get order & user details
        const { data: payment, error: fetchErr } = await supabaseAdmin
          .from('payments')
          .select('order_id, user_id')
          .eq('id', paymentId)
          .maybeSingle();

        if (fetchErr || !payment) {
          console.error('[webhook-momo] Error finding payment:', fetchErr?.message || 'Payment not found');
          return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Fetch order item to determine plan
        const { data: orderItem } = await supabaseAdmin
          .from('order_items')
          .select('course_id')
          .eq('order_id', payment.order_id)
          .maybeSingle();

        const courseIdStr = orderItem?.course_id || '';
        let planName = 'BASE';
        if (courseIdStr === '99999999-9999-9999-9999-999999990002' || courseIdStr.toLowerCase().includes('pro')) {
          planName = 'PRO';
        } else if (courseIdStr === '99999999-9999-9999-9999-999999990003' || courseIdStr.toLowerCase().includes('max')) {
          planName = 'MAX';
        }

        // Update payment to PAID
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'PAID',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', paymentId);

        // Update order to COMPLETED
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'COMPLETED',
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', payment.order_id);

        // Update profile plan in Supabase
        const { error: profileUpdateErr } = await supabaseAdmin
          .from('profiles')
          .update({
            plan: planName
          } as any)
          .eq('id', payment.user_id);

        if (profileUpdateErr) {
          console.error('[webhook-momo] Profile plan update error:', profileUpdateErr.message);
        } else {
          console.log(`[webhook-momo] Instructor ${payment.user_id} profile plan successfully upgraded to ${planName}`);
          try {
            await createNotification({
              userId: payment.user_id,
              title: "Plan mis à jour !",
              message: `Votre abonnement de formateur a été mis à jour vers le plan "${planName}".`,
              type: "SUCCESS",
              link: `/instructor/billing`
            });

            // Fetch Instructor Profile & Send invoice email
            const { data: instructorProfile } = await supabaseAdmin
              .from('profiles')
              .select('full_name, email')
              .eq('id', payment.user_id)
              .maybeSingle();

            if (instructorProfile?.email) {
              const { sendInvoiceEmail } = await import("@/lib/email");
              const { data: orderData } = await supabaseAdmin
                .from("orders")
                .select("order_number, total")
                .eq("id", payment.order_id)
                .maybeSingle();
              
              const orderNumber = orderData?.order_number || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              const totalAmount = orderData?.total || 19.00;

              await sendInvoiceEmail(
                instructorProfile.email,
                instructorProfile.full_name || "Formateur",
                orderNumber,
                totalAmount,
                `Abonnement Formateur — Plan ${planName}`,
                "Mise à niveau et accès illimité aux fonctionnalités formateur."
              );
            }
          } catch (notifErr) {
            console.error('[webhook-momo] Error triggering plan notification:', notifErr);
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Transaction processed successfully' }, { status: 200 });

    } else {
      // Transaction was not successful (e.g. Failed, Cancelled)
      console.log(`[webhook-momo] Transaction ${reference} failed or is pending validation. Verification status: ${finalVerifyStatus}`);

      const failureReason = finalVerifyStatus || 'Transaction échouée';

      if (reference.startsWith('std_pay_') || reference.startsWith('ins_plan_')) {
        const paymentId = reference.split('_').pop();

        if (paymentId) {
          // Update payment to FAILED
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'FAILED',
              failure_reason: failureReason,
              updated_at: new Date().toISOString()
            } as any)
            .eq('id', paymentId);

          // Get the payment to find order_id
          const { data: payment } = await supabaseAdmin
            .from('payments')
            .select('order_id')
            .eq('id', paymentId)
            .maybeSingle();

          if (payment) {
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
      }

      return NextResponse.json({ success: false, status: finalVerifyStatus, message: 'Transaction was not successful' }, { status: 200 });
    }

  } catch (err: any) {
    console.error('[webhook-momo] Critical error handling webhook:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
