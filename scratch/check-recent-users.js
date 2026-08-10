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

    console.log("\nRecently registered users in auth.users:");
    const resUsers = await client.query(`
      SELECT id, email, created_at, last_sign_in_at
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    resUsers.rows.forEach(r => {
      console.log(`- ID: ${r.id}, Email: ${r.email}, Created: ${r.created_at}, LastLogin: ${r.last_sign_in_at}`);
    });

    console.log("\nProfiles in public.profiles for those users:");
    const userIds = resUsers.rows.map(r => r.id);
    if (userIds.length > 0) {
      const resProfiles = await client.query(`
        SELECT id, email, full_name, plan, status
        FROM public.profiles
        WHERE id = ANY($1);
      `, [userIds]);
      resProfiles.rows.forEach(r => {
        console.log(`- ID: ${r.id}, Email: ${r.email}, Name: ${r.full_name}, Plan: ${r.plan}, Status: ${r.status}`);
      });
      
      console.log("\nUser roles for those users:");
      const resRoles = await client.query(`
        SELECT ur.user_id, r.name as role_name
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = ANY($1);
      `, [userIds]);
      resRoles.rows.forEach(r => {
        console.log(`- UserID: ${r.user_id}, Role: ${r.role_name}`);
      });
    }

  } catch (err) {
    console.error("Failed to query:", err.message);
  } finally {
    await client.end();
  }
}

run();
