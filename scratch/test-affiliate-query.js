const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Querying affiliations table raw ===");
  const { data: rawAffiliations, error: rawError } = await supabase
    .from('affiliations')
    .select('*')
    .limit(10);
    
  if (rawError) {
    console.error("Error fetching raw affiliations:", rawError);
    return;
  }
  
  console.log("Raw affiliations in DB:", JSON.stringify(rawAffiliations, null, 2));

  console.log("\n=== Querying affiliations with join profiles ===");
  const { data: joinProfiles, error: joinError } = await supabase
    .from('affiliations')
    .select(`
      id,
      points_awarded,
      created_at,
      profiles!referred_id (
        id,
        full_name,
        email,
        role,
        created_at
      )
    `)
    .limit(10);

  if (joinError) {
    console.error("Error fetching join profiles:", joinError);
  } else {
    console.log("Join profiles result:", JSON.stringify(joinProfiles, null, 2));
  }

  console.log("\n=== Querying affiliations with default join referred ===");
  const { data: joinReferred, error: refError } = await supabase
    .from('affiliations')
    .select(`
      id,
      points_awarded,
      created_at,
      referred:referred_id (
        id,
        full_name,
        email,
        role,
        created_at
      )
    `)
    .limit(10);

  if (refError) {
    console.error("Error fetching join referred:", refError);
  } else {
    console.log("Join referred result:", JSON.stringify(joinReferred, null, 2));
  }
}

run();
