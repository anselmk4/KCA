const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse .env.local manually to get DATABASE_URL
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let databaseUrl = '';

const matches = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (matches && matches[1]) {
  databaseUrl = matches[1];
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('Connecting to database...');

const client = new Client({
  connectionString: databaseUrl,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected successfully!');

    const migrationSqlPath = path.join(__dirname, '..', 'prisma', 'migrations', '20240713_add_profile_columns', 'migration.sql');
    const sql = fs.readFileSync(migrationSqlPath, 'utf8');

    console.log('Running migration...');
    const res = await client.query(sql);
    console.log('Migration executed successfully!');
    console.log('PostgREST schema cache reloaded.');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await client.end();
  }
}

run();
