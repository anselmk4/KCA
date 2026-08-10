const https = require('node:https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

function checkCol(table, col) {
  return new Promise(resolve => {
    const opts = {
      hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
      path: `/rest/v1/${table}?select=${col}&limit=1`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Accept': 'application/json'
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const ok = res.statusCode === 200 ? '✅' : '❌';
        const msg = res.statusCode !== 200 ? JSON.parse(data).message : '(exists)';
        console.log(`${ok} ${table}.${col} → ${msg}`);
        resolve();
      });
    });
    req.on('error', e => { console.log(`ERR ${table}.${col}: ${e.message}`); resolve(); });
    req.end();
  });
}

async function run() {
  console.log('\n=== PAYMENTS ===');
  for (const c of ['id','order_id','user_id','amount','currency','status','provider','method','transaction_reference','paid_at','created_at','updated_at','failure_reason']) {
    await checkCol('payments', c);
  }

  console.log('\n=== ORDERS ===');
  for (const c of ['id','user_id','status','total_price','total_amount','created_at','updated_at']) {
    await checkCol('orders', c);
  }

  console.log('\n=== ORDER_ITEMS ===');
  for (const c of ['id','order_id','course_id','unit_price','final_price','quantity','created_at']) {
    await checkCol('order_items', c);
  }

  console.log('\n=== PROFILES ===');
  for (const c of ['id','plan','full_name','email','role','status','created_at']) {
    await checkCol('profiles', c);
  }
}

run().catch(console.error);
