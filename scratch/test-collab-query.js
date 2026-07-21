const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dwhtfoqqbwsycthpksqu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY'
);

async function run() {
  try {
    const { data, error } = await supabase
      .from("course_collaborators")
      .select("id, collaborator_id, profiles!collaborator_id(full_name, email)");
    
    if (error) {
      console.error("Collab query error:", error.message);
    } else {
      console.log("Collab query result:", JSON.stringify(data, null, 2));
    }

    // Try without explicit key
    const { data: data2, error: error2 } = await supabase
      .from("course_collaborators")
      .select("id, collaborator_id, profiles(full_name, email)");

    if (error2) {
      console.error("Collab query 2 error:", error2.message);
    } else {
      console.log("Collab query 2 result:", JSON.stringify(data2, null, 2));
    }

  } catch (err) {
    console.error("Unexpected error:", err.message);
  }
}

run();
