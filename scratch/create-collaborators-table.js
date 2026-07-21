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

    console.log("Creating course_collaborators table...");
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS public.course_collaborators (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
          collaborator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE (course_id, collaborator_id)
      );
    `;
    await client.query(createTableSql);
    console.log("✔ Table course_collaborators created successfully!");

    console.log("Enabling RLS on course_collaborators...");
    await client.query("ALTER TABLE public.course_collaborators ENABLE ROW LEVEL SECURITY;");
    
    console.log("Creating RLS policies...");
    await client.query("DROP POLICY IF EXISTS \"Instructors can manage collaborators of their courses\" ON public.course_collaborators;");
    await client.query("DROP POLICY IF EXISTS \"Collaborators can read their relationships\" ON public.course_collaborators;");

    // Policy: Course owner can insert/delete/update collaborators
    await client.query(`
      CREATE POLICY "Instructors can manage collaborators of their courses" ON public.course_collaborators
          FOR ALL USING (
              auth.uid() IN (
                  SELECT instructor_id FROM public.courses WHERE id = course_id
              )
          );
    `);
    
    // Policy: Collaborators can select their own collaborations
    await client.query(`
      CREATE POLICY "Collaborators can read their relationships" ON public.course_collaborators
          FOR SELECT USING (
              auth.uid() = collaborator_id
          );
    `);
    
    console.log("✔ RLS Policies created successfully!");

    console.log("Reloading PostgREST schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✔ PostgREST schema cache reloaded successfully!");

  } catch (err) {
    console.error("Database operation failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
