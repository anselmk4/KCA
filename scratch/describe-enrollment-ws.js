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
    console.log("Connected to database successfully!");

    // Get columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'enrollments';
    `);
    console.log("Columns of enrollments table:");
    console.log(columns.rows);

    // Get unique constraints
    const constraints = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'enrollments'::regclass;
    `);
    console.log("Constraints of enrollments table:");
    console.log(constraints.rows);

  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
