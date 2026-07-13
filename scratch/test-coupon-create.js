const { createClient } = require('@supabase/supabase-js');
const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';
const supabase = createClient(url, key);

async function main() {
  console.log('Logging in as instructor...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'instructor@kuettu.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  const user = authData.user;
  console.log('Logged in! User ID:', user.id);

  // Let's test insert using the user's own client (satisfying RLS)
  console.log('Inserting coupon using user client...');
  const { data: insData, error: insError } = await supabase
    .from("coupons")
    .insert({
      code: 'TESTRLS10',
      description: 'Test RLS description',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      applicable_course_id: null,
      max_uses: 10,
      current_uses: 0,
      expires_at: null,
      is_active: true,
      created_by: user.id
    })
    .select();

  if (insError) {
    console.error('Insert error under RLS:', insError);
  } else {
    console.log('Insert succeeded under RLS:', insData);
    // Cleanup
    await supabase.from('coupons').delete().eq('id', insData[0].id);
  }
}

main();
