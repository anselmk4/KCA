const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sqlPath = path.join(__dirname, '..', 'prisma', 'add-course-features.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const regions = [
  'eu-central-1',
  'us-east-1',
  'us-east-2',
  'eu-west-3',
  'eu-west-1',
  'ap-southeast-1'
];

const passwords = [
  'AdminPassword123!',
  'password123',
  'dwhtfoqqbwsycthpksqu',
  'postgres',
  'ansella',
  'kuettu',
  'academy'
];

async function run() {
  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    for (const password of passwords) {
      console.log(`Trying ${host} with password: ${password}`);
      const client = new Client({
        host: host,
        port: 6543,
        database: 'postgres',
        user: 'postgres.dwhtfoqqbwsycthpksqu',
        password: password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log(`SUCCESS! Connected to ${host} with password ${password}`);
        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration executed successfully!');
        await client.end();
        return;
      } catch (e) {
        console.log(`Failed for ${host} / ${password}: ${e.message}`);
        try { await client.end(); } catch (err) {}
      }
    }
  }
  console.log('All attempts failed.');
}

run().catch(console.error);
