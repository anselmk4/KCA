const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

async function main() {
  console.log('Fetching enrollments...');
  const { data: enrollments, error: err1 } = await supabase.from('enrollments').select('*');
  if (err1) console.error('Enrollments error:', err1);
  else console.log('Enrollments:', JSON.stringify(enrollments, null, 2));

  console.log('Fetching certificates...');
  const { data: certificates, error: err2 } = await supabase.from('certificates').select('*');
  if (err2) console.error('Certificates error:', err2);
  else console.log('Certificates:', JSON.stringify(certificates, null, 2));

  console.log('Fetching payments...');
  const { data: payments, error: err3 } = await supabase.from('payments').select('*');
  if (err3) console.error('Payments error:', err3);
  else console.log('Payments:', JSON.stringify(payments, null, 2));

  console.log('Fetching profiles...');
  const { data: profiles, error: err4 } = await supabase.from('profiles').select('id, email, full_name, plan, status');
  if (err4) console.error('Profiles error:', err4);
  else console.log('Profiles:', JSON.stringify(profiles, null, 2));
}

main();
