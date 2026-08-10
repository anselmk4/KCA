const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dwhtfoqqbwsycthpksqu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY'
);

// We need the service role key to insert mock data bypassing RLS
const supabaseAdmin = createClient(
  'https://dwhtfoqqbwsycthpksqu.supabase.co',
  process.argv[2] || '' // Pass the service role key as parameter
);

async function run() {
  if (!process.argv[2]) {
    console.error("Please provide the service role key as an argument: node scratch/test-webhook-simulate.js <service_role_key>");
    return;
  }

  try {
    const userId = "c18dfd5a-5eb0-4bf6-905e-f00e572074e5"; // mock user ID (Jean Dupont or check profiles)
    const courseId = "53fa61ed-477b-4579-abf3-6387974b0b13"; // mock course ID

    const orderId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const orderNumber = `ORD-TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    console.log("1. Creating PENDING order & payment...");
    
    // Insert order
    const { error: orderErr } = await supabaseAdmin.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      user_id: userId,
      status: 'PENDING',
      subtotal: 100,
      discount_amount: 0,
      tax_amount: 0,
      total: 100,
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (orderErr) throw orderErr;

    // Insert payment
    const { error: paymentErr } = await supabaseAdmin.from('payments').insert({
      id: paymentId,
      order_id: orderId,
      user_id: userId,
      amount: 100,
      currency: 'USD',
      status: 'PENDING',
      provider: 'MOBILE_MONEY',
      method: `MTN::STUDENT_COURSE::${courseId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (paymentErr) throw paymentErr;

    console.log(`Order created: ${orderId}, Payment created: ${paymentId}`);

    console.log("\n2. Calling /api/webhooks/pawapay simulation...");
    const fetch = (await import('node-fetch')).default;
    
    // Call the local webhook endpoint or live endpoint
    // Since we are running locally, let's call the live endpoint (since pawapay.ts connects to dwhtfoqqbwsycthpksqu.supabase.co which is the live db)
    // Wait, the client is hitting local route: http://localhost:3000/api/webhooks/pawapay or https://ansella.app/api/webhooks/pawapay
    // Since we want to test the routing logic of route.ts, let's call it on localhost if running, or simulate the code of route.ts directly in this script!
    // Wait! Let's check what route.ts does on COMPLETED status.
    
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}
run();
