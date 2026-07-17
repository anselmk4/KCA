const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Fetching tables in public schema ===");
  const { data, error } = await supabase.rpc('get_tables'); // Check if a helper exists
  
  if (error) {
    // fallback to sql select
    const { data: tables, error: sqlError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
      
    if (sqlError) {
      // Let's try raw SQL select via direct query if possible, or just standard query on some tables
      console.log("Standard table list query error:", sqlError);
      
      // Let's test standard tables we expect
      const testTables = ['profiles', 'enrollments', 'courses', 'user_roles', 'roles', 'orders', 'payments', 'messages', 'chat_messages', 'chats', 'support_tickets'];
      for (const table of testTables) {
        const { error: tErr } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (tErr) {
          console.log(`Table '${table}' status: Error or Not Found (${tErr.message})`);
        } else {
          console.log(`Table '${table}': EXISTS`);
        }
      }
    } else {
      console.log("Tables in DB:", tables.map(t => t.tablename));
    }
  } else {
    console.log("RPC tables:", data);
  }
}

run();
