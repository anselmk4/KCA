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
  // Let's find one user and one course first to make valid foreign keys
  console.log('=== Finding a test user and course ===');
  const userRes = await executeRequest('/rest/v1/profiles?select=id&limit=1', 'GET');
  const courseRes = await executeRequest('/rest/v1/courses?select=id&limit=1', 'GET');
  
  const users = JSON.parse(userRes.body);
  const courses = JSON.parse(courseRes.body);
  
  if (!users.length || !courses.length) {
    console.log('No user or course found to run the test!');
    return;
  }
  
  const userId = users[0].id;
  const courseId = courses[0].id;
  
  console.log(`Using User ID: ${userId}, Course ID: ${courseId}`);

  // Test 1: Try inserting a test enrollment with upsert
  console.log('\n=== Testing Upsert Enrollment ===');
  const enrollmentData = {
    id: '00000000-0000-0000-0000-000000000123', // supply a dummy uuid
    student_id: userId,
    course_id: courseId,
    progress_percent: 0,
    status: 'ACTIVE',
    enrolled_at: new Date().toISOString()
  };
  
  const upsertRes = await executeRequest('/rest/v1/enrollments', 'POST', enrollmentData);
  console.log('Upsert Response Status:', upsertRes.status);
  console.log('Upsert Response Body:', upsertRes.body);

  // Test 2: Try checking profile update
  console.log('\n=== Testing Profile Plan Update ===');
  const profileRes = await executeRequest(`/rest/v1/profiles?id=eq.${userId}`, 'PATCH', { plan: 'PRO' });
  console.log('Profile Plan Update Status:', profileRes.status);
  console.log('Profile Plan Update Body:', profileRes.body);
}

run().catch(console.error);
