const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Querying raw message table schema ===");
  
  // Try select one row or columns
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error select from messages:", error);
  } else {
    console.log("Success! Messages structure sample:", data);
  }

  // Let's also check if we can get schema details via postgres
  console.log("\nTrying to insert a dummy message to see fields...");
  const dummy = {
    sender_id: 'bfaf1a31-87e2-4e56-a9ef-fbc84783956c',
    receiver_id: '6d36e750-81e1-4f72-a5bd-043cf63c3c55',
    content: 'Test query structure',
  };
  const { data: insData, error: insErr } = await supabase
    .from('messages')
    .insert(dummy)
    .select();

  if (insErr) {
    console.log("Dummy insert failed. Error details:", insErr);
  } else {
    console.log("Dummy insert succeeded! Created row:", insData);
    // Delete the dummy message to clean up
    await supabase.from('messages').delete().eq('id', insData[0].id);
  }
}

run();
