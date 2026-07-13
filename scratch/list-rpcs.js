const https = require('node:https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

function getOpenAPISpec() {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'dwhtfoqqbwsycthpksqu.supabase.co',
      path: '/rest/v1/?apikey=' + SERVICE_KEY,
      method: 'GET',
      headers: {
        'Accept': 'application/openapi+json'
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const res = await getOpenAPISpec();
  console.log('Status:', res.status);
  try {
    const spec = JSON.parse(res.body);
    const paths = Object.keys(spec.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log('Available RPCs:', rpcs);
  } catch (e) {
    console.log('Parse error:', e.message);
  }
}

run().catch(console.error);
