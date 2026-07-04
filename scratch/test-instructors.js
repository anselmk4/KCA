const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

async function main() {
  console.log('Fetching instructors from user_roles and profiles...');
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, roles(name), profiles(id, full_name, bio, specialty, avatar_url, academy_name)");

  if (error) {
    console.error('Instructors query failed! Error:', error.message);
  } else {
    console.log('Query succeeded! Found rows:', data.length);
    const instructors = data
      .filter(ur => ur.roles?.name === 'INSTRUCTOR' || ur.roles?.name === 'SUPER_ADMIN' || ur.roles?.name === 'ADMIN')
      .map(ur => ur.profiles)
      .filter(Boolean);
    console.log('Filtered instructors count:', instructors.length);
    if (instructors.length > 0) {
      console.log('Sample instructor:', instructors[0]);
    }
  }
}

main();
