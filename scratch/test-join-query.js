const { createClient } = require('@supabase/supabase-js');
const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(url, key);

async function main() {
  const userId = 'bfaf1a31-87e2-4e56-a9ef-fbc84783956c'; // instructor
  
  const { data: userRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  console.log('userRoles join query results:', userRoles);
  console.log('rolesError:', rolesError);

  const roles = userRoles?.map((ur) => ur.roles?.name) || [];
  console.log('Mapped roles:', roles);
}

main();
