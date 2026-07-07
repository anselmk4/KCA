const https = require('node:https');

const SUPABASE_URL = 'dwhtfoqqbwsycthpksqu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

function fetchColumns(table) {
  return new Promise((resolve, reject) => {
    const path = `/rest/v1/${table}?select=*&limit=0`;
    const opts = {
      hostname: SUPABASE_URL,
      path,
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // PostgREST returns column info in Content-Range header + body
        resolve({ table, status: res.statusCode, headers: res.headers, body: data.substring(0, 300) });
      });
    });
    req.on('error', (e) => reject(e));
    req.end();
  });
}

// Also try to get column names via the RPC or a direct INSERT attempt
async function inspectTables() {
  const tables = ['enrollments', 'payments', 'orders', 'order_items', 'profiles'];
  
  for (const table of tables) {
    try {
      const result = await fetchColumns(table);
      console.log(`\n=== TABLE: ${table} ===`);
      console.log('Status:', result.status);
      
      // Check Content-Profile or Content-Range header for schema info
      const contentRange = result.headers['content-range'];
      const expose = result.headers['content-profile'];
      console.log('Content-Range:', contentRange);
      console.log('Body:', result.body || '(empty)');
    } catch (e) {
      console.log(`ERROR for ${table}:`, e.message);
    }
  }
}

inspectTables();
