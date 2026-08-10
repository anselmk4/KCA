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

    console.log("Applying collaborator RLS policies to courses and child tables...");

    // 1. courses
    await client.query("DROP POLICY IF EXISTS \"Collaborators can read courses\" ON public.courses;");
    await client.query(`
      CREATE POLICY "Collaborators can read courses" ON public.courses
          FOR SELECT USING (
              auth.uid() IN (
                  SELECT collaborator_id FROM public.course_collaborators WHERE course_id = id
              )
          );
    `);
    
    await client.query("DROP POLICY IF EXISTS \"Collaborators can update courses\" ON public.courses;");
    await client.query(`
      CREATE POLICY "Collaborators can update courses" ON public.courses
          FOR UPDATE USING (
              auth.uid() IN (
                  SELECT collaborator_id FROM public.course_collaborators WHERE course_id = id
              )
          );
    `);

    // 2. course_sections
    await client.query("DROP POLICY IF EXISTS \"Collaborators can manage sections\" ON public.course_sections;");
    await client.query(`
      CREATE POLICY "Collaborators can manage sections" ON public.course_sections
          FOR ALL USING (
              auth.uid() IN (
                  SELECT collaborator_id FROM public.course_collaborators WHERE course_id = course_sections.course_id
              )
          );
    `);

    // 3. lessons
    await client.query("DROP POLICY IF EXISTS \"Collaborators can manage lessons\" ON public.lessons;");
    await client.query(`
      CREATE POLICY "Collaborators can manage lessons" ON public.lessons
          FOR ALL USING (
              auth.uid() IN (
                  SELECT cc.collaborator_id 
                  FROM public.course_collaborators cc
                  JOIN public.course_sections cs ON cs.course_id = cc.course_id
                  WHERE cs.id = lessons.section_id
              )
          );
    `);

    // 4. quizzes
    await client.query("DROP POLICY IF EXISTS \"Collaborators can manage quizzes\" ON public.quizzes;");
    await client.query(`
      CREATE POLICY "Collaborators can manage quizzes" ON public.quizzes
          FOR ALL USING (
              auth.uid() IN (
                  SELECT collaborator_id FROM public.course_collaborators WHERE course_id = quizzes.course_id
              )
          );
    `);

    // 5. questions
    await client.query("DROP POLICY IF EXISTS \"Collaborators can manage questions\" ON public.questions;");
    await client.query(`
      CREATE POLICY "Collaborators can manage questions" ON public.questions
          FOR ALL USING (
              auth.uid() IN (
                  SELECT cc.collaborator_id 
                  FROM public.course_collaborators cc
                  JOIN public.quizzes q ON q.course_id = cc.course_id
                  WHERE q.id = questions.quiz_id
              )
          );
    `);

    // 6. homeworks
    await client.query("DROP POLICY IF EXISTS \"Collaborators can manage homeworks\" ON public.homeworks;");
    await client.query(`
      CREATE POLICY "Collaborators can manage homeworks" ON public.homeworks
          FOR ALL USING (
              auth.uid() IN (
                  SELECT collaborator_id FROM public.course_collaborators WHERE course_id = homeworks.course_id
              )
          );
    `);

    // 7. resources
    await client.query("DROP POLICY IF EXISTS \"Collaborators can manage resources\" ON public.resources;");
    await client.query(`
      CREATE POLICY "Collaborators can manage resources" ON public.resources
          FOR ALL USING (
              auth.uid() IN (
                  SELECT cc.collaborator_id 
                  FROM public.course_collaborators cc
                  JOIN public.course_sections cs ON cs.course_id = cc.course_id
                  JOIN public.lessons l ON l.section_id = cs.id
                  WHERE l.id = resources.lesson_id
              )
          );
    `);

    console.log("✔ All collaborator RLS policies applied successfully!");

    console.log("Reloading schema cache...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("✔ PostgREST schema cache reloaded successfully!");

  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
