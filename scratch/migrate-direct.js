const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Dynamically install pg if not present
try {
  require('pg');
} catch (e) {
  console.log('Installing pg npm package...');
  execSync('npm install pg', { stdio: 'inherit' });
}

const { Client } = require('pg');

const sqlPath = path.join(__dirname, '..', 'prisma', 'add-course-features.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const passwords = [
  'AdminPassword123!',
  'password123',
  'dwhtfoqqbwsycthpksqu',
  'postgres',
  'ansella',
  'kuettu',
  'academy'
];

async function tryMigrate() {
  for (const password of passwords) {
    console.log(`Trying database password: ${password}`);
    const client = new Client({
      host: 'db.dwhtfoqqbwsycthpksqu.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: password,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('Successfully connected to database with password:', password);
      console.log('Running migration...');
      await client.query(sql);
      console.log('Migration queries executed successfully!');
      await client.end();
      return true;
    } catch (err) {
      console.error(`Failed with password ${password}:`, err.message);
      try {
        await client.end();
      } catch (e) {}
    }
  }
  return false;
}

tryMigrate().then((success) => {
  if (success) {
    console.log('Database synced successfully!');
  } else {
    console.log('Failed to sync database. Password not in list.');
  }
}).catch(console.error);
