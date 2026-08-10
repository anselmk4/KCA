const { createClient } = require('@supabase/supabase-js');
const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

const supabase = createClient(url, key);

async function main() {
  console.log('Testing nested role query for INSTRUCTOR...');
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, roles!inner(name)')
    .eq('roles.name', 'INSTRUCTOR');

  if (error) {
    console.error('Error fetching instructors:', error);
  } else {
    console.log('Instructors found:', data);
  }

  console.log('Testing nested role query for STUDENT...');
  const { data: students, error: sErr } = await supabase
    .from('user_roles')
    .select('user_id, roles!inner(name)')
    .eq('roles.name', 'STUDENT');

  if (sErr) {
    console.error('Error fetching students:', sErr);
  } else {
    console.log('Students found:', students);
  }
}

main();
