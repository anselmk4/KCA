// scratch/seed-db-service-role.js
// Seeds roles, a test user profile, and a test course using the service role key.

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found at project root.');
  process.exit(1);
}

const envConfig = {};
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    envConfig[key] = val.trim();
  }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) missing in .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rolesToSeed = [
  { id: 'bad87955-3c4d-4e49-8ad8-86764e78fdcd', name: 'SUPER_ADMIN', display_name: 'Super Administrateur' },
  { id: '1f349fbc-2447-445b-9ffc-ba140563d30f', name: 'ADMIN', display_name: 'Administrateur' },
  { id: '939b225c-5684-4780-b5e2-45ab0bee23da', name: 'FINANCE_ADMIN', display_name: 'Administrateur Financier' },
  { id: 'a7e9ca7a-a47e-438b-ba05-d9823d21d342', name: 'ACADEMIC_ADMIN', display_name: 'Administrateur Académique' },
  { id: '54eb301d-f5f7-421c-a4b8-c3918ceef476', name: 'SUPPORT_AGENT', display_name: 'Agent de Support' },
  { id: '79bb40ee-3ff8-4673-9078-a91b53221f8f', name: 'INSTRUCTOR', display_name: 'Formateur' },
  { id: '44b4fcf9-8469-4530-87bd-219c1c6eda30', name: 'TEACHING_ASSISTANT', display_name: 'Assistant' },
  { id: '09ecfd8e-b5c8-4f55-bebb-fa72344e0472', name: 'STUDENT', display_name: 'Apprenant' }
];

async function main() {
  console.log('1. Seeding roles...');
  const { error: rolesErr } = await supabase.from('roles').upsert(rolesToSeed);
  if (rolesErr) {
    console.error('Error seeding roles:', rolesErr.message);
  } else {
    console.log('Roles seeded successfully!');
  }

  // 2. Seed a test student user profile
  console.log('2. Seeding test profile...');
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: testUserId,
    email: 'test-student@ansella.app',
    full_name: 'Jean Test Apprenant',
    status: 'ACTIVE',
    plan: 'FREE'
  });

  if (profileErr) {
    console.error('Error seeding test profile:', profileErr.message);
  } else {
    console.log(`Test profile seeded successfully for user ID: ${testUserId}`);
  }

  // 3. Seed a test course
  console.log('3. Seeding test course...');
  const testCourseId = '00000000-0000-0000-0000-000000000002';
  const { error: courseErr } = await supabase.from('courses').upsert({
    id: testCourseId,
    title: 'Formation Crypto Sandbox',
    slug: 'formation-crypto-sandbox',
    description: 'Cours de test pour les paiements Mobile Money.',
    price: 15,
    instructor_id: testUserId, // Self-authored or mapped to the user
    status: 'PUBLISHED'
  });

  if (courseErr) {
    console.error('Error seeding test course:', courseErr.message);
  } else {
    console.log(`Test course seeded successfully for course ID: ${testCourseId}`);
  }

  console.log('\n✓ Seeding finished successfully!');
}

main();
