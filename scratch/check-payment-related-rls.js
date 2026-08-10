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
    console.log("Connected to PostgreSQL successfully!");

    const tables = ['payments', 'orders', 'enrollments'];
    
    for (const t of tables) {
      console.log(`\nRLS policies for table: ${t}`);
      const res = await client.query(`
        SELECT policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = $1;
      `, [t]);
      res.rows.forEach(r => {
        console.log(`- Policy: ${r.policyname} (${r.cmd})`);
        console.log(`  Qual: ${r.qual}`);
        console.log(`  With Check: ${r.with_check}`);
      });
    }

  } catch (err) {
    console.error("Database check failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
