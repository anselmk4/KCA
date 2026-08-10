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

    console.log("Fetching coupon 6f13a204-e41d-4bf9-b05e-b98eb5212abe...");
    const res = await client.query(`
      SELECT * FROM public.coupons WHERE id = '6f13a204-e41d-4bf9-b05e-b98eb5212abe';
    `);
    console.log("Coupon details:", JSON.stringify(res.rows, null, 2));

    console.log("Fetching course 53fa61ed-477b-4579-abf3-6387974b0b13...");
    const courseRes = await client.query(`
      SELECT * FROM public.courses WHERE id = '53fa61ed-477b-4579-abf3-6387974b0b13';
    `);
    console.log("Course details:", JSON.stringify(courseRes.rows, null, 2));

  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
