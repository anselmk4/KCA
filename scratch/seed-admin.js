const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

async function main() {
  const email = 'admin@kuettu.com';
  const password = 'AdminPassword123!';

  console.log(`Attempting to sign up ${email}...`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpErr) {
    if (signUpErr.message.includes('already registered')) {
      console.log(`${email} already registered in Auth. Proceeding to sign in and check mapping.`);
    } else {
      console.error('Sign Up Error:', signUpErr.message);
      return;
    }
  } else {
    console.log('Sign Up successful! User ID:', signUpData.user?.id);
  }

  // Sign in to get authenticated session (required for RLS update/insert own roles)
  console.log(`Signing in as ${email} to gain authenticated session...`);
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    console.error('Sign In Error:', signInErr.message);
    return;
  }

  const userId = signInData.user.id;
  console.log('Sign In successful! Token active for user ID:', userId);

  // 1. Check or insert profile
  console.log('Checking profile in public.profiles...');
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) {
    console.error('Fetch profile error:', profileErr.message);
  }

  if (!profile) {
    console.log('Inserting profile record...');
    const { error: insProfileErr } = await supabase.from('profiles').insert({
      id: userId,
      email,
      full_name: 'Ansel Admin',
      status: 'ACTIVE',
      plan: 'MAX'
    });
    if (insProfileErr) {
      console.error('Insert profile error:', insProfileErr.message);
    } else {
      console.log('Profile created successfully!');
    }
  } else {
    console.log('Profile already exists!');
  }

  // 2. Fetch SUPER_ADMIN role ID
  console.log('Fetching roles from public.roles...');
  const { data: roles, error: rolesErr } = await supabase
    .from('roles')
    .select('id, name');

  if (rolesErr) {
    console.error('Fetch roles error:', rolesErr.message);
    return;
  }

  console.log('Roles in DB:', roles);
  const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN');
  if (!superAdminRole) {
    console.error('SUPER_ADMIN role not found in table public.roles. Seed table first!');
    return;
  }

  // 3. Ensure role mapping
  console.log(`Mapping user ${userId} to SUPER_ADMIN role (${superAdminRole.id})...`);
  const { data: userRoles, error: userRolesErr } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role_id', superAdminRole.id);

  if (userRolesErr) {
    console.error('Fetch user_roles error:', userRolesErr.message);
  }

  if (!userRoles || userRoles.length === 0) {
    const { error: insRoleErr } = await supabase.from('user_roles').insert({
      user_id: userId,
      role_id: superAdminRole.id
    });
    if (insRoleErr) {
      console.error('Insert role error:', insRoleErr.message);
    } else {
      console.log('Mapped user to SUPER_ADMIN successfully! Seed completed ✓');
    }
  } else {
    console.log('User already mapped to SUPER_ADMIN role! Seed completed ✓');
  }
}

main();
