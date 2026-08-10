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

    console.log("Fetching last 5 orders...");
    const ordersRes = await client.query(`
      SELECT id, order_number, user_id, status, subtotal, discount_amount, total, coupon_id, created_at 
      FROM public.orders 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    console.log("Orders:", JSON.stringify(ordersRes.rows, null, 2));

    console.log("Fetching last 5 payments...");
    const paymentsRes = await client.query(`
      SELECT id, order_id, user_id, amount, status, provider, method, created_at 
      FROM public.payments 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    console.log("Payments:", JSON.stringify(paymentsRes.rows, null, 2));

  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
