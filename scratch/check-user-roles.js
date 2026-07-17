const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Fetching all user roles from 'user_roles' ===");
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role_id,
      roles (
        id,
        name
      )
    `);

  if (error) {
    console.error("Query failed:", error);
    return;
  }

  console.log("User Roles list:", JSON.stringify(userRoles, null, 2));

  // Let's also print profiles to match ids to names/emails
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name');
    
  console.log("Profiles list:", JSON.stringify(profiles, null, 2));
}

run();
