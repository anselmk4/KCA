const https = require('node:https');
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

// Fetch one complete row from each table to see ALL real columns
function fetchOneRow(table) {
  return new Promise(resolve => {
    const opts = {
      hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
      path: `/rest/v1/${table}?select=*&limit=1`,
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
        console.log(`\n=== ${table.toUpperCase()} ===`);
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('Columns:', Object.keys(parsed[0]).join(', '));
            console.log('Sample:', JSON.stringify(parsed[0]).substring(0, 300));
          } else if (parsed.code) {
            console.log('Error:', parsed.message);
          } else {
            console.log('Empty:', JSON.stringify(parsed).substring(0, 200));
          }
        } catch(e) {
          console.log('Raw:', data.substring(0, 300));
        }
        resolve();
      });
    });
    req.on('error', e => { console.log(`ERR ${table}: ${e.message}`); resolve(); });
    req.end();
  });
}

async function run() {
  await fetchOneRow('orders');
  await fetchOneRow('payments');
  await fetchOneRow('order_items');
  await fetchOneRow('enrollments');
  await fetchOneRow('profiles');
}
run();
