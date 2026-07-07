// Inspect exact column names via Supabase RPC query
const https = require('node:https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

function postSQL(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const opts = {
      hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Alternatively, use GET on information_schema via PostgREST
function getColumns() {
  return new Promise((resolve, reject) => {
    const path = `/rest/v1/rpc/get_schema_info`;
    const opts = {
      hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
      path: '/rest/v1/enrollments?select=student_id,course_id,status,progress_percent,enrolled_at,created_at,joined_at&limit=1',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Accept': 'application/json'
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('\n=== Testing enrollment columns ===');
  const r1 = await getColumns();
  console.log('Status:', r1.status);
  console.log('Body:', r1.body);

  // Test each column individually
  const cols = ['student_id','course_id','status','progress_percent','enrolled_at','created_at','joined_at','id'];
  for (const col of cols) {
    await new Promise(resolve => {
      const opts = {
        hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
        path: `/rest/v1/enrollments?select=${col}&limit=1`,
        method: 'GET',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': 'Bearer ' + SERVICE_KEY,
          'Accept': 'application/json'
        }
      };
      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const ok = res.statusCode === 200 ? '✅' : '❌';
          console.log(`${ok} enrollments.${col} → HTTP ${res.statusCode} → ${data.substring(0, 100)}`);
          resolve();
        });
      });
      req.on('error', e => { console.log(`ERROR ${col}:`, e.message); resolve(); });
      req.end();
    });
  }
}

run().catch(console.error);
