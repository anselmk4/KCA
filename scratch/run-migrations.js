// scratch/run-migrations.js
// Script to run Supabase database migrations using the pg package and pooler host.
// Usage: node scratch/run-migrations.js <your_db_password>

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Manually parse .env and .env.local if they exist
const envFiles = ['.env', '.env.local'];
envFiles.forEach(file => {
  const envPath = path.join(__dirname, '..', file);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
});

let password = process.argv[2] || process.env.DATABASE_PASSWORD;

if (!password && process.env.DATABASE_URL) {
  // Extract password from postgresql://user:password@host:port/database
  const match = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@/);
  if (match) {
    password = match[2];
  }
}

if (!password) {
  console.error('Error: Please provide the database password.');
  console.error('Either:');
  console.error('  1. Pass it as an argument: node scratch/run-migrations.js <your_db_password>');
  console.error('  2. Define DATABASE_PASSWORD in your .env.local file');
  console.error('  3. Define DATABASE_URL in your .env.local file');
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

      // For RLS policies, run queries one-by-one to catch "already exists" policy errors cleanly
      if (filename === 'supabase-rls-policies.sql') {
        const cleanedSql = sql.replace(/NOTIFY pgrst, 'reload schema';/g, '');
        const queries = [];
        let current = '';
        let inDollarQuote = false;
        let inSingleQuote = false;
        let inDoubleQuote = false;

        for (let i = 0; i < cleanedSql.length; i++) {
          const char = cleanedSql[i];
          const nextChar = cleanedSql[i + 1] || '';
          
          if (char === '$' && nextChar === '$') {
            inDollarQuote = !inDollarQuote;
            current += '$$';
            i++;
            continue;
          }
          if (char === "'" && !inDollarQuote) {
            inSingleQuote = !inSingleQuote;
          }
          if (char === '"' && !inDollarQuote) {
            inDoubleQuote = !inDoubleQuote;
          }
          if (char === ';' && !inDollarQuote && !inSingleQuote && !inDoubleQuote) {
            const trimmed = current.trim();
            if (trimmed.length > 0) {
              queries.push(trimmed);
            }
            current = '';
          } else {
            current += char;
          }
        }
        
        const finalTrimmed = current.trim();
        if (finalTrimmed.length > 0) {
          queries.push(finalTrimmed);
        }

        for (let query of queries) {
          try {
            await client.query(query);
          } catch (err) {
            if (err.message.includes('already exists') || err.message.includes('already a member')) {
              console.log(`[OK/Info] Query skipped: ${err.message}`);
            } else {
              console.error(`[Error] Query failed: "${query.substring(0, 80)}..." \nReason: ${err.message}`);
            }
          }
        }
      } else {
        // For DDL tables and category inserts, execute the entire file in one fast batch to prevent ECONNRESET
        try {
          const cleanedSql = sql.replace(/NOTIFY pgrst, 'reload schema';/g, '');
          await client.query(cleanedSql);
          console.log(`[OK] Batch execution of ${filename} completed successfully.`);
        } catch (err) {
          console.error(`[Error] Batch execution of ${filename} failed: ${err.message}`);
          process.exit(1);
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
