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

    console.log("Adding chat_messages to supabase_realtime publication...");
    // Check if the publication exists, and add the table to it
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    `);
    console.log("✔ chat_messages table successfully added to supabase_realtime publication!");

  } catch (err) {
    console.error("Database operation failed:", err.message);
    if (err.message.includes("already exists")) {
      console.log("Note: Table was already in publication, which is fine.");
    }
  } finally {
    await client.end();
  }
}

run();
