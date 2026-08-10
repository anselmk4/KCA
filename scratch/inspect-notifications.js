const { createClient } = require('@supabase/supabase-js');
const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('notifications').select('*').limit(5);
  console.log('Notifications length:', data ? data.length : 'NULL', 'Error:', error);
  if (data) console.log('Sample notification:', data[0]);
}

main();
