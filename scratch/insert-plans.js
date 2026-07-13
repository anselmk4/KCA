const { Client } = require('pg');

const regions = [
  'eu-west-1',
  'eu-central-1',
  'us-east-1',
  'us-east-2',
  'eu-west-3',
  'ap-southeast-1'
];

async function run() {
  let client = null;
  const password = "4PHXIh0F6qTgvAfF";

  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    console.log(`Trying to connect to pooler: ${host}...`);
    client = new Client({
      host: host,
      port: 6543,
      database: 'postgres',
      user: 'postgres.dwhtfoqqbwsycthpksqu',
      password: password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`SUCCESS! Connected to ${host}`);
      break;
    } catch (e) {
      console.log(`Failed for ${host}: ${e.message}`);
      client = null;
    }
  }

  if (!client) {
    console.error("Could not connect to any database pooler. Exiting.");
    process.exit(1);
  }

  try {
    // 1. Get a valid profile ID to avoid foreign key violations for courses.instructor_id -> profiles.id
    console.log("Fetching a valid profile ID...");
    const profilesRes = await client.query("SELECT id, email, full_name FROM profiles LIMIT 5");
    console.log("Profiles found:", profilesRes.rows);

    if (profilesRes.rows.length === 0) {
      throw new Error("No profiles found in the database. Please register at least one user first.");
    }

    // We can use the first profile found as the instructor/owner for the dummy plan courses
    const targetInstructorId = profilesRes.rows[0].id;
    console.log(`Using instructor ID: ${targetInstructorId} (${profilesRes.rows[0].email})`);

    // 2. Insert/Merge plan courses
    const plans = [
      {
        id: '99999999-9999-9999-9999-999999990001',
        title: 'Abonnement Plan Base',
        slug: 'plan-base',
        description: 'Abonnement Plan Base pour formateur',
        price: 19.00,
        status: 'ARCHIVED',
        instructor_id: targetInstructorId
      },
      {
        id: '99999999-9999-9999-9999-999999990002',
        title: 'Abonnement Plan Pro',
        slug: 'plan-pro',
        description: 'Abonnement Plan Pro pour formateur',
        price: 49.00,
        status: 'ARCHIVED',
        instructor_id: targetInstructorId
      },
      {
        id: '99999999-9999-9999-9999-999999990003',
        title: 'Abonnement Plan Max',
        slug: 'plan-max',
        description: 'Abonnement Plan Max pour formateur',
        price: 200.00,
        status: 'ARCHIVED',
        instructor_id: targetInstructorId
      }
    ];

    for (const plan of plans) {
      console.log(`Inserting/updating plan: ${plan.title}...`);
      const query = `
        INSERT INTO courses (id, title, slug, description, price, status, instructor_id, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE 
        SET title = EXCLUDED.title,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            status = EXCLUDED.status,
            instructor_id = EXCLUDED.instructor_id,
            updated_at = NOW()
      `;
      await client.query(query, [
        plan.id,
        plan.title,
        plan.slug,
        plan.description,
        plan.price,
        plan.status,
        plan.instructor_id
      ]);
      console.log(`Plan ${plan.slug} processed successfully.`);
    }

    console.log("Dummy plan courses seeded successfully in the database!");

  } catch (err) {
    console.error("Error running script:", err);
  } finally {
    await client.end();
  }
}

run();
