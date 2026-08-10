const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const referrerId = 'bfaf1a31-87e2-4e56-a9ef-fbc84783956c'; // the referrer
  console.log(`Querying affiliations for referrer: ${referrerId}`);
  
  const { data: affiliations, error: affErr } = await supabase
    .from('affiliations')
    .select(`
      id,
      points_awarded,
      created_at,
      referred:referred_id (
        id,
        full_name,
        email,
        created_at
      )
    `)
    .eq('referrer_id', referrerId)
    .order('created_at', { ascending: false });

  if (affErr) {
    console.error("Error occurred:", affErr);
    return;
  }

  console.log("Returned affiliations data count:", affiliations.length);
  console.log("Returned affiliations:", JSON.stringify(affiliations, null, 2));
}

run();
