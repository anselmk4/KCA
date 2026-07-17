const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = '2ec0a273-7e9e-450a-a53e-b113f86793c8'; // Ansel Super Admin
  
  console.log("=== Querying roles for Ansel ===");
  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('roles!inner(name)')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Returned userRole object:", JSON.stringify(userRole, null, 2));
    console.log("roleName computed:", userRole?.roles?.name);
  }
}

run();
