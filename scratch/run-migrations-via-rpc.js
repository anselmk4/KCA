const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';

const supabase = createClient(url, serviceKey);

async function main() {
  console.log('Reading migration file...');
  const sqlPath = path.join(__dirname, '..', 'prisma', 'add-course-features.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing migration via RPC exec...');
  const { data, error } = await supabase.rpc('exec', { query: sql });
  if (error) {
    console.error('Migration failed:', error);
  } else {
    console.log('Migration executed successfully:', data);
  }
}

main().catch(console.error);
