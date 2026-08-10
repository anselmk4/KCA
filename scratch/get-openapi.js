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
    const definitions = spec.definitions || spec.components?.schemas;
    if (definitions) {
      console.log('\n=== TABLES DEFINITIONS ===');
      for (const tableName of Object.keys(definitions)) {
        if (['payments', 'orders', 'order_items', 'enrollments', 'profiles'].includes(tableName)) {
          console.log(`\nTable: ${tableName}`);
          console.log('Properties:', Object.keys(definitions[tableName].properties).join(', '));
        }
      }
    } else {
      console.log('No definitions found in OpenAPI spec.');
    }
  } catch (e) {
    console.log('Parse error:', e.message);
    console.log('Raw body snippet:', res.body.substring(0, 1000));
  }
}

run().catch(console.error);
