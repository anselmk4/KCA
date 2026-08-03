const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const payoutId = 'a4a6a916-c370-48ef-9006-5daa89e6bcf6';
  console.log(`=== Updating failed payout ${payoutId} ===`);

  const { data, error } = await supabase
    .from('payouts')
    .update({
      status: 'FAILED',
      notes: '[Échec PawaPay API] Solde PawaPay marchand insuffisant pour effectuer le versement (balance insuffisant). Réf transaction: 2eff1431-eb5a-43eb-be5a-01af64f75bfb',
      processed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', payoutId)
    .select();

  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Successfully updated payout record:", JSON.stringify(data, null, 2));
  }
}

run();
