const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dwhtfoqqbwsycthpksqu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY'
);

async function run() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'payments' });
  if (error) {
    // If get_policies function does not exist, let's query pg_policies using an direct query
    console.error("RPC Error:", error.message);
  } else {
    console.log("Policies:", data);
  }

  // Let's do a direct test select to see if we can read payments
  // We don't have a user session in this script, but we can query using service role to list all policies or use a raw sql query via the api if we have a custom endpoint
}
run();
