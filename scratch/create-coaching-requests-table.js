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
    console.log("Creating coaching_requests table...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.coaching_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        student_name TEXT,
        student_email TEXT,
        course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
        course_title TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        preferred_time TEXT,
        scheduled_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'PENDING',
        reply TEXT,
        replied_at TIMESTAMPTZ,
        replied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- Index for fast queries by student_id and instructor_id
      CREATE INDEX IF NOT EXISTS idx_coaching_requests_student ON public.coaching_requests(student_id);
      CREATE INDEX IF NOT EXISTS idx_coaching_requests_instructor ON public.coaching_requests(instructor_id);
      CREATE INDEX IF NOT EXISTS idx_coaching_requests_status ON public.coaching_requests(status);
    `);

    console.log("coaching_requests table created successfully!");

  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    await client.end();
  }
}

run();
