// scratch/simulate-webhook.js
// Script to test the Moko Afrika webhook locally on the dev server.

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Load env variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found at project root.');
  process.exit(1);
}

const envConfig = {};
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    envConfig[key] = val.trim();
  }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase environment variables missing in .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTest() {
  console.log('--- Starting Webhook Local Simulation Test ---');
  
  // A. Find or create a test student (user)
  console.log('1. Finding a test user...');
  const { data: users, error: userError } = await supabase.from('profiles').select('id, full_name').limit(1);
  if (userError || !users || users.length === 0) {
    console.error('Error: No users found in database to link payment to.');
    return;
  }
  const testUserId = users[0].id;
  console.log(`Using test user ID: ${testUserId} (${users[0].full_name})`);

  // B. Find or create a test course
  console.log('2. Finding a test course...');
  const { data: courses, error: courseError } = await supabase.from('courses').select('id, title').limit(1);
  if (courseError || !courses || courses.length === 0) {
    console.error('Error: No courses found in database to buy.');
    return;
  }
  const testCourseId = courses[0].id;
  console.log(`Using test course ID: ${testCourseId} (${courses[0].title})`);

  // C. Create a mock pending order & payment
  console.log('3. Inserting a mock PENDING order and payment...');
  const testOrderId = crypto.randomUUID();
  const testPaymentId = crypto.randomUUID();
  const testReference = `std_pay_${testPaymentId}`;

  // Insert Order
  const { error: ordErr } = await supabase.from('orders').insert({
    id: testOrderId,
    user_id: testUserId,
    status: 'PENDING',
    total_price: 15,
  });
  if (ordErr) {
    console.error('Error inserting mock order:', ordErr.message);
    return;
  }

  // Insert Order Item
  const { error: itemErr } = await supabase.from('order_items').insert({
    id: crypto.randomUUID(),
    order_id: testOrderId,
    course_id: testCourseId,
    unit_price: 15,
    final_price: 15
  });
  if (itemErr) {
    console.error('Error inserting mock order item:', itemErr.message);
    return;
  }

  // Insert Payment
  const { error: payErr } = await supabase.from('payments').insert({
    id: testPaymentId,
    order_id: testOrderId,
    user_id: testUserId,
    amount: 15,
    status: 'PENDING',
    provider: 'MOBILE_MONEY',
    method: 'MPESA'
  });
  if (payErr) {
    console.error('Error inserting mock payment:', payErr.message);
    return;
  }

  // Insert Enrollment in PENDING state
  const { error: enrollErr } = await supabase.from('enrollments').upsert({
    student_id: testUserId,
    course_id: testCourseId,
    progress_percent: 0,
    status: 'PENDING'
  }, { onConflict: 'student_id,course_id' });
  if (enrollErr) {
    console.error('Error inserting mock enrollment:', enrollErr.message);
  }

  console.log(`Mock pending payment successfully created. ID: ${testPaymentId}, Ref: ${testReference}`);

  // D. Send POST request to local webhook API
  console.log('4. Invoking local webhook endpoint via fetch...');
  const webhookUrl = 'http://localhost:3000/api/webhooks/mobile-money';
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: testReference,
        status: 'Successful' // simulate successful payment callback
      })
    });

    const responseText = await response.text();
    console.log(`Webhook responded with status: ${response.status}`);
    console.log('Response body:', responseText);

    // E. Verify that the payment status is updated to PAID and enrollment to ACTIVE in Supabase
    console.log('5. Verifying database updates...');
    
    // Check payment status
    const { data: updatedPayment } = await supabase
      .from('payments')
      .select('status')
      .eq('id', testPaymentId)
      .maybeSingle();
      
    // Check order status
    const { data: updatedOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', testOrderId)
      .maybeSingle();

    // Check enrollment status
    const { data: updatedEnrollment } = await supabase
      .from('enrollments')
      .select('status')
      .eq('student_id', testUserId)
      .eq('course_id', testCourseId)
      .maybeSingle();

    console.log('\n--- VERIFICATION RESULT ---');
    console.log(`Payment Status (Expected PAID): ${updatedPayment?.status}`);
    console.log(`Order Status (Expected COMPLETED): ${updatedOrder?.status}`);
    console.log(`Enrollment Status (Expected ACTIVE): ${updatedEnrollment?.status}`);

    if (updatedPayment?.status === 'PAID' && updatedEnrollment?.status === 'ACTIVE') {
      console.log('\n✅ SUCCESS: The local webhook successfully updated the database and activated the enrollment!');
    } else {
      console.log('\n❌ FAILURE: The statuses were not updated correctly. Check webhook logs.');
    }

  } catch (err) {
    console.error('Error calling webhook API:', err.message);
    console.log('Make sure your local Next.js dev server is running on http://localhost:3000');
  }
}

runTest();
