const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

async function main() {
  console.log('Testing nested select query...');
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, student_id, course_id, status, progress_percent, created_at, courses(id, title, category_id, level, price, status, categories(name))");

  if (error) {
    console.error('Query failed! Error:', error.message);
  } else {
    console.log('Query succeeded! Sample data:', data);
  }
}

main();
