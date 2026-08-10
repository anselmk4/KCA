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
        'Prefer': 'resolution=merge-duplicates'
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
  console.log('=== Seeding Dummy Plan Courses into courses table ===');
  
  const plans = [
    {
      id: '99999999-9999-9999-9999-999999990001',
      title: 'Abonnement Plan Base',
      slug: 'plan-base',
      description: 'Abonnement Plan Base pour formateur',
      price: 19.00,
      status: 'ARCHIVED',
      instructor_id: '00000000-0000-0000-0000-000000000001'
    },
    {
      id: '99999999-9999-9999-9999-999999990002',
      title: 'Abonnement Plan Pro',
      slug: 'plan-pro',
      description: 'Abonnement Plan Pro pour formateur',
      price: 49.00,
      status: 'ARCHIVED',
      instructor_id: '00000000-0000-0000-0000-000000000001'
    },
    {
      id: '99999999-9999-9999-9999-999999990003',
      title: 'Abonnement Plan Max',
      slug: 'plan-max',
      description: 'Abonnement Plan Max pour formateur',
      price: 200.00,
      status: 'ARCHIVED',
      instructor_id: '00000000-0000-0000-0000-000000000001'
    }
  ];

  for (const plan of plans) {
    const res = await executeRequest('/rest/v1/courses', 'POST', plan);
    console.log(`Plan ${plan.slug}: HTTP ${res.status} -> ${res.body}`);
  }
}

run().catch(console.error);
