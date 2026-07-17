const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const referredId = '6d36e750-81e1-4f72-a5bd-043cf63c3c55';
  console.log(`Checking profile for referred ID: ${referredId}`);
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', referredId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
  } else {
    console.log("Profile details in DB:", JSON.stringify(profile, null, 2));
  }

  console.log("\nChecking user details in auth.users via admin API...");
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(referredId);
  if (userError) {
    console.error("Error fetching auth user:", userError);
  } else {
    console.log("Auth user details:", JSON.stringify(user, null, 2));
  }
}

run();
