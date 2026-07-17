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
    console.log("Connected to PostgreSQL pooler successfully!");

    console.log("Reloading PostgREST schema cache...");
    await client.query(`
      NOTIFY pgrst, 'reload schema';
    `);
    console.log("✔ PostgREST schema cache reloaded successfully!");

  } catch (err) {
    console.error("Database operation failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
