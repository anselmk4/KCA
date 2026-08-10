const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

async function main() {
  const email = 'jean@example.com';
  const password = 'password123';
  
  console.log(`Logging in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('Login error:', authError);
    return;
  }
  
  const user = authData.user;
  console.log('Logged in! User ID:', user.id);

  console.log('Fetching profiles for user...');
  const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profErr) console.error('Profile fetch error:', profErr);
  else console.log('Profile:', JSON.stringify(profile, null, 2));

  console.log('Fetching user_roles for user...');
  const { data: roles, error: rolesErr } = await supabase.from('user_roles').select('*, roles(*)').eq('user_id', user.id);
  if (rolesErr) console.error('Roles fetch error:', rolesErr);
  else console.log('Roles:', JSON.stringify(roles, null, 2));

  console.log('Fetching enrollments for user...');
  const { data: enrollData, error: enrollErr } = await supabase
    .from('enrollments')
    .select('*, courses(*)');
  if (enrollErr) console.error('Enrollments fetch error:', enrollErr);
  else console.log('Enrollments:', JSON.stringify(enrollData, null, 2));

  console.log('Fetching certificates for user...');
  const { data: certsRaw, error: certsErr } = await supabase
    .from('certificates')
    .select('*, courses(*)');
  if (certsErr) console.error('Certificates fetch error:', certsErr);
  else console.log('Certificates:', JSON.stringify(certsRaw, null, 2));

  console.log('Fetching payments for user...');
  const { data: payments, error: paymentsErr } = await supabase.from('payments').select('*');
  if (paymentsErr) console.error('Payments fetch error:', paymentsErr);
  else console.log('Payments:', JSON.stringify(payments, null, 2));
}

main();
