const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const referrerId = 'bfaf1a31-87e2-4e56-a9ef-fbc84783956c'; // referrer
  
  console.log("=== Querying affiliations with user_roles join ===");
  const { data: affiliations, error } = await supabase
    .from('affiliations')
    .select(`
      id,
      points_awarded,
      created_at,
      referred:referred_id (
        id,
        full_name,
        email,
        created_at,
        user_roles (
          roles (
            name
          )
        )
      )
    `)
    .eq('referrer_id', referrerId);

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Returned affiliations with roles:", JSON.stringify(affiliations, null, 2));
  }
}

run();
