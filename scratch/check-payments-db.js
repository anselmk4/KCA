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

    const res = await client.query(`
      SELECT id, order_id, user_id, amount, status, provider, method, created_at 
      FROM payments 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);

    console.log("Recent payments in database:");
    console.log(JSON.stringify(res.rows, null, 2));

  } catch (err) {
    console.error("Database query failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
