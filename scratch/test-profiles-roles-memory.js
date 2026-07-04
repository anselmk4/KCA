const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

async function main() {
  console.log('Fetching roles, user_roles and profiles separately...');
  
  const { data: roles, error: rolesError } = await supabase.from('roles').select('id, name');
  const { data: userRoles, error: urError } = await supabase.from('user_roles').select('user_id, role_id');
  const { data: profiles, error: profError } = await supabase.from('profiles').select('id, full_name, bio, specialty, avatar_url, academy_name, nationality');

  if (rolesError || urError || profError) {
    console.error('Error fetching:', { rolesError, urError, profError });
    return;
  }

  console.log(`Loaded ${roles.length} roles, ${userRoles.length} user_roles, ${profiles.length} profiles.`);

  const instructorRole = roles.find(r => r.name === 'INSTRUCTOR');
  const adminRole = roles.find(r => r.name === 'ADMIN');
  const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN');

  const instructorRoleIds = [instructorRole?.id, adminRole?.id, superAdminRole?.id].filter(Boolean);

  const instructorUserIds = userRoles
    .filter(ur => instructorRoleIds.includes(ur.role_id))
    .map(ur => ur.user_id);

  const instructors = profiles.filter(p => instructorUserIds.includes(p.id));
  console.log('Instructors found in memory join:', instructors.length);
  if (instructors.length > 0) {
    console.log('Sample instructor:', instructors[0]);
  }
}

main();
