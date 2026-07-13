const { createClient } = require('@supabase/supabase-js');
const url = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(url, key);

async function main() {
  // Let's check if categories table exists
  const { data: catData, error: catError } = await supabase.from('categories').select('*');
  console.log('Categories:', catData ? catData.length : null, 'Error:', catError);
  if (catData) console.log('Sample category:', catData[0]);

  // Let's check columns of courses
  const { data: courseData, error: courseError } = await supabase.from('courses').select('*').limit(1);
  console.log('Course columns:', courseData ? Object.keys(courseData[0] || {}) : null, 'Error:', courseError);
  if (courseData) console.log('Sample course:', courseData[0]);

  // Let's check columns of lessons
  const { data: lessonData, error: lessonError } = await supabase.from('lessons').select('*').limit(1);
  console.log('Lesson columns:', lessonData ? Object.keys(lessonData[0] || {}) : null, 'Error:', lessonError);

  // Let's check if there is a devoirs/homework table
  const { data: devData, error: devError } = await supabase.from('homework').select('*').limit(1);
  console.log('Homework table search:', devData ? Object.keys(devData[0] || {}) : 'None/Error', 'Error:', devError);
  
  const { data: devData2, error: devError2 } = await supabase.from('assignments').select('*').limit(1);
  console.log('Assignments table search:', devData2 ? Object.keys(devData2[0] || {}) : 'None/Error', 'Error:', devError2);
}

main();
