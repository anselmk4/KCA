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
    console.log("Connected to PostgreSQL pooler successfully!");

    console.log("Adding columns to public.enrollments table...");
    await client.query(`
      ALTER TABLE public.enrollments 
      ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(50) DEFAULT 'ONLINE_GATEWAY',
      ADD COLUMN IF NOT EXISTS manual_payment_status VARCHAR(50) DEFAULT 'NOT_APPLICABLE',
      ADD COLUMN IF NOT EXISTS manual_amount_paid NUMERIC(10,2) DEFAULT 0;
    `);

    console.log("✔ Columns enrollment_type, manual_payment_status, manual_amount_paid added successfully!");

    // Update existing enrollments without online payments to be recognized as manual enrollments
    console.log("Migrating existing manual enrollments...");
    await client.query(`
      UPDATE public.enrollments e
      SET enrollment_type = 'MANUAL_INSTRUCTOR',
          manual_payment_status = 'FREE_SCHOLARSHIP',
          manual_amount_paid = 0
      WHERE e.id NOT IN (
        SELECT DISTINCT e2.id 
        FROM public.enrollments e2
        JOIN public.payments p ON p.user_id = e2.student_id
        WHERE p.status = 'PAID'
      );
    `);
    console.log("✔ Existing enrollments without online payment updated to MANUAL_INSTRUCTOR / FREE_SCHOLARSHIP!");

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
