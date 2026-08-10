const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.dwhtfoqqbwsycthpksqu',
    password: '4PHXIh0F6qTgvAfF',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");

    console.log("Checking RLS policies for table: profiles");
    const res = await client.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'profiles';
    `);
    res.rows.forEach(r => {
      console.log(`- Policy: ${r.policyname} (${r.cmd})`);
      console.log(`  Qual: ${r.qual}`);
      console.log(`  With Check: ${r.with_check}`);
    });

  } catch (err) {
    console.error("Failed to fetch policies:", err.message);
  } finally {
    await client.end();
  }
}

run();
