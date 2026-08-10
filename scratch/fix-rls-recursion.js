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

    console.log("Dropping existing policies on course_collaborators...");
    await client.query("DROP POLICY IF EXISTS \"Instructors can manage collaborators of their courses\" ON public.course_collaborators;");
    await client.query("DROP POLICY IF EXISTS \"Collaborators can read their relationships\" ON public.course_collaborators;");

    console.log("Creating new RLS policies for course_collaborators...");
    
    // SELECT: Any authenticated user can read collaborators (prevents infinite recursion)
    await client.query(`
      CREATE POLICY "Authenticated users can select collaborators" ON public.course_collaborators
          FOR SELECT USING (
              auth.role() = 'authenticated'
          );
    `);

    // INSERT/DELETE: Course owner can manage collaborators
    await client.query(`
      CREATE POLICY "Instructors can insert collaborators" ON public.course_collaborators
          FOR INSERT WITH CHECK (
              auth.uid() IN (
                  SELECT instructor_id FROM public.courses WHERE id = course_id
              )
          );
    `);

    await client.query(`
      CREATE POLICY "Instructors can delete collaborators" ON public.course_collaborators
          FOR DELETE USING (
              auth.uid() IN (
                  SELECT instructor_id FROM public.courses WHERE id = course_id
              )
          );
    `);

    console.log("✔ New policies applied successfully!");

    console.log("Reloading schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✔ Schema cache reloaded successfully!");

  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
