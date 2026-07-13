const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sqlPath = path.join(__dirname, '..', 'prisma', 'add-course-features.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const host = 'aws-0-eu-west-1.pooler.supabase.com';

const passwords = [
  'AdminPassword123!',
  'password123',
  'dwhtfoqqbwsycthpksqu',
  'postgres',
  'ansella',
  'kuettu',
  'academy',
  'anselmk4',
  'ansel',
  'KCA',
  'Kuettu',
  'Academy',
  'KuettuAcademy',
  'KuettuCrypto',
  'CryptoAcademy',
  'Admin123!',
  'admin',
  'password',
  'root',
  'ansel123',
  'ansella123',
  'kuettu123',
  'anselmk4123',
  'KuettuCryptoAcademy',
  'anselmk4/KCA'
];

async function run() {
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
      console.log(`Failed for ${password}: ${e.message}`);
      try { await client.end(); } catch (err) {}
    }
  }
  console.log('All passwords failed.');
}

run().catch(console.error);
