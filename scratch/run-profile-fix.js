const fs = require('fs');
const { Client } = require('pg');
require("dotenv").config({ path: "d:/saas IA/Kuettu Crypto Academy/.env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

console.log('Connecting to database...');

const client = new Client({
  connectionString: databaseUrl,
});

const sql = `
-- 1. Add country, phone_number, and gender to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2. Sync existing data for safety
UPDATE public.profiles SET country = nationality WHERE country IS NULL AND nationality IS NOT NULL;
UPDATE public.profiles SET phone_number = phone WHERE phone_number IS NULL AND phone IS NOT NULL;
UPDATE public.profiles SET phone = phone_number WHERE phone IS NULL AND phone_number IS NOT NULL;
UPDATE public.profiles SET nationality = country WHERE nationality IS NULL AND country IS NOT NULL;

-- 3. Reload cache
NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected successfully!');
    console.log('Running profiles extension SQL...');
    await client.query(sql);
    console.log('Profiles table updated successfully!');
  } catch (err) {
    console.error('Error running profiles extension SQL:', err);
  } finally {
    await client.end();
  }
}

run();
