const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres:4PHXIh0F6qTgvAfF@db.dwhtfoqqbwsycthpksqu.supabase.co:5432/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PG Database.');

    // 1. Check profiles
    const profilesRes = await client.query("SELECT id, full_name, email FROM profiles LIMIT 5");
    console.log('\n--- Profiles (first 5) ---');
    console.log(profilesRes.rows);

    // 2. Check if dummy plan courses already exist
    const planCoursesRes = await client.query(
      "SELECT id, title, instructor_id FROM courses WHERE id IN ('99999999-9999-9999-9999-999999990001', '99999999-9999-9999-9999-999999990002', '99999999-9999-9999-9999-999999990003')"
    );
    console.log('\n--- Existing plan courses ---');
    console.log(planCoursesRes.rows);

    // 3. Check for any admin or instructor or user
    const instructorRes = await client.query(
      "SELECT p.id FROM profiles p LIMIT 1"
    );
    if (instructorRes.rows.length > 0) {
      console.log('\nSuggested instructor ID:', instructorRes.rows[0].id);
    } else {
      console.log('\nNo profiles found in the database!');
    }

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await client.end();
  }
}

run();
