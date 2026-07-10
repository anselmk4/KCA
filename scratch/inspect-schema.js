const { createClient } = require('@supabase/supabase-js');
const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(url, key);

async function main() {
  // Let's run a raw query via postgrest to see RLS configuration of coupons table
  // Since we cannot run raw sql unless we have an RPC, let's see if we have RPCs.
  // Wait, let's try to query the schema details of coupons table:
  const { data, error } = await supabase.from('coupons').select('id').limit(1);
  console.log('Query coupons with service role:', data, 'Error:', error);

  // If there's an error, let's see. If not, it means the service role can query it.
}

main();
