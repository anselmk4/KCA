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
    
    // Columns of community_posts
    const resPosts = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'community_posts';
    `);
    console.log("Columns of community_posts:", resPosts.rows.map(r => `${r.column_name} (${r.data_type})`));

    // Columns of community_comments
    const resComments = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'community_comments';
    `);
    console.log("Columns of community_comments:", resComments.rows.map(r => `${r.column_name} (${r.data_type})`));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
