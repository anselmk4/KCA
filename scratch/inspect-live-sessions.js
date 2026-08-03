const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.dwhtfoqqbwsycthpksqu',
    password: '4PHXIh0F6qTgvAfF',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // 1. Inspect columns of live_sessions
    const resLive = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions';
    `);
    console.log("Columns of live_sessions:", resLive.rows);

    // Fetch existing live_sessions rows
    const resLiveRows = await client.query(`SELECT * FROM live_sessions LIMIT 10;`);
    console.log("Existing live_sessions rows:", resLiveRows.rows);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
