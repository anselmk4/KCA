const { createClient } = require('@supabase/supabase-js');

const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

const supabase = createClient(url, key);

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
  console.log('Inserting roles...');
  const { data, error } = await supabase
    .from('roles')
    .insert(rolesToSeed);

  if (error) {
    console.error('Error seeding roles:', error.message, error.details);
    console.log('\nSi l\'accès est refusé par RLS, exécutez la requête SQL suivante dans la console Supabase SQL Editor :\n');
    const sql = `INSERT INTO public.roles (id, name, display_name) VALUES\n` +
      rolesToSeed.map(r => `  ('${r.id}', '${r.name}', '${r.display_name}')`).join(',\n') +
      `\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, display_name = EXCLUDED.display_name;`;
    console.log(sql);
  } else {
    console.log('Roles seeded successfully! data:', data);
  }
}

main();
