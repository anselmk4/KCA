const { Client } = require('pg');

const regions = [
  'eu-west-3',    // Paris
  'eu-west-1',    // Ireland
  'eu-central-1', // Frankfurt
  'us-east-1',    // N. Virginia
  'us-west-1',    // N. California
  'ap-southeast-1' // Singapore
];

async function tryConnect(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`\nTrying to connect to pooler in region: ${region} (${host})...`);
  
  const client = new Client({
    host: host,
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
    console.log(`✔ Connected to pooler in region ${region} successfully!`);
    return client;
  } catch (err) {
    console.log(`❌ Failed for region ${region}:`, err.message);
    await client.end().catch(() => {});
    return null;
  }
}

async function run() {
  let client = null;
  for (const region of regions) {
    client = await tryConnect(region);
    if (client) break;
  }

  if (!client) {
    console.error("\nCould not connect to any pooler region. Please check credentials.");
    return;
  }

  try {
    console.log("Creating chat_messages table...");
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS public.chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    await client.query(createTableSql);
    console.log("✔ Table chat_messages created successfully!");

    console.log("Enabling RLS on chat_messages...");
    await client.query("ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;");
    
    console.log("Creating RLS policies...");
    await client.query("DROP POLICY IF EXISTS \"Users can insert their own messages\" ON public.chat_messages;");
    await client.query("DROP POLICY IF EXISTS \"Users can read messages they sent or received\" ON public.chat_messages;");

    await client.query(`
      CREATE POLICY "Users can insert their own messages" ON public.chat_messages
          FOR INSERT WITH CHECK (auth.uid() = sender_id);
    `);
    
    await client.query(`
      CREATE POLICY "Users can read messages they sent or received" ON public.chat_messages
          FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    `);
    
    console.log("✔ RLS Policies created successfully!");

  } catch (err) {
    console.error("Database operation failed during table creation:", err);
  } finally {
    await client.end();
  }
}

run();
