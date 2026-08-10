const https = require('node:https');
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

// Try inserting with only confirmed columns to find which optional ones exist
async function testInsert(cols) {
  const body = JSON.stringify(cols);
  return new Promise(resolve => {
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
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

async function run() {
  // First try minimal required columns only
  const base = {
    id: '00000000-0000-0000-0000-000000000099',
    order_id: '00000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    amount: 0.01,
    currency: 'USD',
    status: 'PENDING',
    provider: 'PAYPAL',
    method: 'PAYPAL',
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Test with each possible reference column name
  const candidateFields = ['external_id', 'transaction_id', 'paypal_order_id', 'gateway_ref', 'gateway_id', 'reference_id', 'capture_id'];
  
  for (const field of candidateFields) {
    const r = await testInsert({ ...base, [field]: 'TEST_123', id: '00000000-0000-0000-0000-' + field.substring(0,12).padEnd(12,'0') });
    const errMsg = r.status !== 201 ? JSON.parse(r.body || '{}').message : 'SUCCESS';
    const ok = r.status === 201 ? '✅' : '❌';
    console.log(`${ok} payments.${field} → ${errMsg}`);
    if (r.status === 201) {
      // Delete the test row
      console.log('  Full row:', r.body.substring(0, 200));
    }
  }

  // Also test without any reference column — just base fields
  const r = await testInsert({ ...base, id: '00000000-0000-0000-0000-aabbccddeef0' });
  console.log(`\nBase insert (no reference): HTTP ${r.status} → ${r.body.substring(0, 300)}`);
}

run().catch(console.error);
