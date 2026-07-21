const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  'https://dwhtfoqqbwsycthpksqu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U'
);

async function run() {
  const paymentId = "1676a0d6-d35c-4bdc-a3f6-496b86fcd649";
  const status = "COMPLETED";

  console.log(`Processing manually: depositId: ${paymentId}, Status: ${status}`);

  try {
    // 1. Fetch current payment and order details
    const { data: payment, error: fetchErr } = await supabaseAdmin
      .from('payments')
      .select('order_id, user_id, amount, status, method')
      .eq('id', paymentId)
      .maybeSingle();

    if (fetchErr || !payment) {
      console.error(`Payment record not found for id ${paymentId}:`, fetchErr?.message);
      return;
    }

    console.log("Found payment:", payment);

    if (payment.status === 'PAID') {
      console.log(`Payment ${paymentId} is already marked as PAID. Skipping.`);
      return;
    }

    // Update payment to PAID
    console.log("Updating payment to PAID...");
    const { error: payUpdateErr } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'PAID',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (payUpdateErr) {
      console.error('Payment update error:', payUpdateErr.message);
      return;
    }

    // Update order to COMPLETED
    console.log("Updating order to COMPLETED...");
    const { error: orderUpdateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.order_id);

    if (orderUpdateErr) {
      console.error('Order update error:', orderUpdateErr.message);
      return;
    }

    // Parse method field
    const methodParts = (payment.method || '').split('::');
    const paymentType = methodParts[1] || '';
    const itemId = methodParts[2] || '';

    console.log(`paymentType: ${paymentType}, itemId: ${itemId}`);

    if (paymentType === 'STUDENT_COURSE' && itemId) {
      const courseId = itemId;

      console.log(`Updating enrollment for user ${payment.user_id} and course ${courseId}...`);
      const { error: enrollUpdateErr } = await supabaseAdmin
        .from('enrollments')
        .update({ status: 'ACTIVE' })
        .eq('student_id', payment.user_id)
        .eq('course_id', courseId);

      if (enrollUpdateErr) {
        console.error('Enrollment update error:', enrollUpdateErr.message);
        console.log("Trying upsert...");
        const { error: upsertErr } = await supabaseAdmin.from('enrollments').upsert({
          student_id: payment.user_id,
          course_id: courseId,
          progress_percent: 0,
          status: 'ACTIVE',
          enrolled_at: new Date().toISOString()
        });
        if (upsertErr) console.error("Upsert failed:", upsertErr.message);
      }

      // Notifications & Emails
      console.log("Fetching course details...");
      const { data: courseData } = await supabaseAdmin
        .from('courses')
        .select('title, instructor_id')
        .eq('id', courseId)
        .maybeSingle();

      const courseTitle = courseData?.title || 'Formation';
      console.log("Course title:", courseTitle);

      // We won't trigger notifications/emails to avoid sending duplicate emails during manual simulation
      console.log("SUCCESS! Simulation completed without throwing any error.");
    }
  } catch (err) {
    console.error("Error during execution:", err.message);
  }
}

run();
