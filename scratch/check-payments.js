const https = require('node:https');
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

// Get payments table schema via information_schema (using PostgREST function if available)
// Instead, let's try inserting a test row to see what columns are needed
function checkPaymentCols() {
  return new Promise(resolve => {
    // Try selecting specific candidate columns
    const cols = 'id,order_id,user_id,amount,currency,status,provider,method,paid_at,created_at,updated_at,failure_reason,reference,transaction_id,external_id,order_number';
    const opts = {
      hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
      path: `/rest/v1/payments?select=${cols}&limit=0`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Accept': 'application/json',
        'Prefer': 'count=none'
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        resolve();
      });
    });
    req.on('error', e => { console.log('ERR:', e.message); resolve(); });
    req.end();
  });
}

// Use the Supabase Management API (requires service role) to list columns
// Actually, let's try a direct INSERT with all possible columns to see which ones fail
async function testInsert() {
  const body = JSON.stringify({
    id: '00000000-0000-0000-0000-000000000099',
    order_id: '00000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    amount: 0.01,
    currency: 'USD',
    status: 'PENDING',
    provider: 'PAYPAL',
    method: 'PAYPAL',
    transaction_reference: 'TEST_REF',
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  await new Promise(resolve => {
    const opts = {
      hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
      path: '/rest/v1/payments',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=representation'
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log('\n=== INSERT with transaction_reference ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        resolve();
      });
    });
    req.on('error', e => { console.log('ERR:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('=== Checking payments columns ===');
  await checkPaymentCols();
  await testInsert();
}
run();
