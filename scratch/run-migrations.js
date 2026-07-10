// scratch/run-migrations.js
// Script to run Supabase database migrations using the pg package and pooler host.
// Usage: node scratch/run-migrations.js <your_db_password>

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const password = process.argv[2] || process.env.DATABASE_PASSWORD;

if (!password) {
  console.error('Error: Please provide the database password as a command line argument.');
  console.error('Usage: node scratch/run-migrations.js <your_db_password>');
  process.exit(1);
}

const host = 'aws-0-eu-west-1.pooler.supabase.com'; // Resolved region (Ireland)
const port = 6543;
const database = 'postgres';
const user = 'postgres.dwhtfoqqbwsycthpksqu'; // Project ID dwhtfoqqbwsycthpksqu

const sqlFiles = [
  'add-profile-columns.sql',
  'add-course-features.sql',
  'supabase-rls-policies.sql'
];

async function runMigrations() {
  console.log(`Connecting to Supabase Database pooler at ${host}:${port}...`);
  const client = new Client({
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('Connected successfully! Starting migrations...');

    for (const filename of sqlFiles) {
      console.log(`\n--- Running ${filename} ---`);
      const sqlPath = path.join(__dirname, '..', 'prisma', filename);
      if (!fs.existsSync(sqlPath)) {
        console.warn(`File ${filename} not found, skipping.`);
        continue;
      }
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Clean up notifications reload schema if it exists since we do it at the end
      const queries = sql
        .replace(/NOTIFY pgrst, 'reload schema';/g, '')
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      for (let query of queries) {
        // Execute block queries (DO $$ ... END $$) as a single execution
        try {
          await client.query(query);
        } catch (err) {
          // If RLS policy already exists or some other harmless error, log it
          if (err.message.includes('already exists') || err.message.includes('already a member')) {
            console.log(`[OK/Info] Query skipped: ${err.message}`);
          } else {
            console.error(`[Error] Query failed: "${query.substring(0, 100)}..." \nReason: ${err.message}`);
          }
        }
      }
      console.log(`Finished ${filename} successfully!`);
    }

    console.log('\nReloading PostgREST schema cache...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('Schema cache reloaded.');

    await client.end();
    console.log('\nAll migrations completed successfully! ✓');
  } catch (err) {
    console.error('Migration failed:', err.message);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

runMigrations();
