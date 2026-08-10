const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Checking profiles with affiliate_points > 0 ===");
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, affiliate_points, referral_code')
    .gt('affiliate_points', 0);

  if (pErr) {
    console.error("Error fetching profiles:", pErr);
  } else {
    console.log("Profiles with points:", JSON.stringify(profiles, null, 2));
  }

  console.log("\n=== Checking all rows in affiliations table ===");
  const { data: affiliations, error: aErr } = await supabase
    .from('affiliations')
    .select('*');

  if (aErr) {
    console.error("Error fetching affiliations:", aErr);
  } else {
    console.log("All affiliations rows:", JSON.stringify(affiliations, null, 2));
  }
}

run();
