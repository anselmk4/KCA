const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

async function main() {
  // Query RLS policies from pg_policies
  console.log('--- RLS POLICIES ---');
  const { data: policies, error } = await supabase.rpc('get_policies').catch(() => ({ error: 'rpc failed' }));
  
  if (error) {
    // Let's try to query pg_policies using an RPC if exists, or execute raw sql
    // Since we don't have direct raw SQL access unless there is an RPC, let's check what RPCs are available,
    // or let's try to do a mock insert into courses to see what error it returns!
    console.log('RPC get_policies not available, let\'s simulate course insert.');
  } else {
    console.log(policies);
  }

  // Let's try to insert a test course with a random UUID to see the error message
  const testId = '00000000-0000-0000-0000-000000000099';
  const { error: insertErr } = await supabase.from('courses').insert({
    id: testId,
    title: 'Test Course RLS',
    slug: 'test-course-rls',
    price: 100,
    status: 'DRAFT',
    instructor_id: 'u3' // Let's try u3
  });

  if (insertErr) {
    console.error('Insert Course Error:', insertErr.message, insertErr.details, insertErr.hint);
  } else {
    console.log('Mock insert course succeeded! (RLS allows it or RLS disabled)');
    // Clean up
    await supabase.from('courses').delete().eq('id', testId);
  }
}

main();
