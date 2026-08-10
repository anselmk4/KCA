const https = require('node:https');
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

function executeRequest(path, method, bodyObj = null) {
  return new Promise((resolve) => {
    const body = bodyObj ? JSON.stringify(bodyObj) : '';
    const opts = {
      hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
      path,
      method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    if (body) {
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log('=== Test 1: Insert order_item with non-existent UUID (to test foreign key constraint) ===');
  // First make a temporary order
  const orderId = '00000000-0000-0000-0000-999999999999';
  await executeRequest('/rest/v1/orders', 'POST', {
    id: orderId,
    order_number: 'TEST-FK',
    user_id: '00000000-0000-0000-0000-000000000001',
    status: 'PENDING',
    subtotal: 10,
    total: 10,
    currency: 'USD'
  });

  const dummyItemId = '00000000-0000-0000-0000-111111111111';
  // Try inserting order item with dummy course_id UUID
  const res1 = await executeRequest('/rest/v1/order_items', 'POST', {
    id: dummyItemId,
    order_id: orderId,
    course_id: '00000000-0000-0000-0000-000000000000', // Non-existent course UUID
    unit_price: 10,
    discount_amount: 0,
    final_price: 10
  });

  console.log('Insert with dummy course_id status:', res1.status);
  console.log('Insert with dummy course_id body:', res1.body);

  // Clean up
  await executeRequest(`/rest/v1/order_items?id=eq.${dummyItemId}`, 'DELETE');
  await executeRequest(`/rest/v1/orders?id=eq.${orderId}`, 'DELETE');

  console.log('\n=== Test 2: Try inserting order_item with NULL course_id ===');
  // Let's see if course_id is nullable
  await executeRequest('/rest/v1/orders', 'POST', {
    id: orderId,
    order_number: 'TEST-FK2',
    user_id: '00000000-0000-0000-0000-000000000001',
    status: 'PENDING',
    subtotal: 10,
    total: 10,
    currency: 'USD'
  });

  const res2 = await executeRequest('/rest/v1/order_items', 'POST', {
    id: dummyItemId,
    order_id: orderId,
    course_id: null, // Test nullable
    unit_price: 10,
    discount_amount: 0,
    final_price: 10
  });

  console.log('Insert with NULL course_id status:', res2.status);
  console.log('Insert with NULL course_id body:', res2.body);

  // Clean up
  await executeRequest(`/rest/v1/order_items?id=eq.${dummyItemId}`, 'DELETE');
  await executeRequest(`/rest/v1/orders?id=eq.${orderId}`, 'DELETE');
}

run().catch(console.error);
