const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

async function main() {
  const email = 'jean@example.com';
  const password = 'password123';
  
  console.log(`Logging in as ${email}...`);
  // First login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('Login error:', authError.message);
    return;
  }
  
  const user = authData.user;
  console.log('Logged in! User ID:', user.id);

  console.log('Testing certificates fetch...');
  const { data: certs, error: certError } = await supabase
    .from("certificates")
    .select("id, course_id, code, issued_at")
    .eq("student_id", user.id);

  if (certError) {
    console.error('Certificates query failed! Error:', certError.message);
  } else {
    console.log('Certificates query succeeded! Found:', certs.length, 'certs');
  }

  console.log('Testing enrollments fetch...');
  const { data: enrollments, error: enrollError } = await supabase
    .from("enrollments")
    .select("id, student_id, course_id, status, progress_percent");

  if (enrollError) {
    console.error('Enrollments query failed! Error:', enrollError.message);
  } else {
    console.log('Enrollments query succeeded! Found:', enrollments.length, 'enrollments');
  }
}

main();
