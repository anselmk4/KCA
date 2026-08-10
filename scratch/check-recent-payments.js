const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dwhtfoqqbwsycthpksqu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLAJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY'
);

async function run() {
  const { data, error } = await supabase
    .from('payments')
    .select('id, order_id, user_id, amount, status, provider, method, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Fetch payments error:", error.message);
  } else {
    console.log("Recent payments:", JSON.stringify(data, null, 2));
  }
}
run();
