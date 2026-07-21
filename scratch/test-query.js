const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dwhtfoqqbwsycthpksqu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY'
);

async function run() {
  const instructorId = '6d36e750-81e1-4f72-a5bd-043cf63c3c55'; // Julien Lepers ID

  try {
    const { data: collabData, error: collabErr } = await supabase
      .from("course_collaborators")
      .select("course_id")
      .eq("collaborator_id", instructorId);
    
    if (collabErr) {
      console.error("Collab fetch error:", collabErr.message);
      return;
    }
    
    console.log("Collab data:", collabData);
    const collabCourseIds = (collabData || []).map(c => c.course_id);

    let query = supabase
      .from("courses")
      .select("id, title, status, price, level, thumbnail_url, instructor_id");
    
    if (collabCourseIds.length > 0) {
      // Test the OR syntax
      query = query.or(`instructor_id.eq.${instructorId},id.in.(${collabCourseIds.join(",")})`);
    } else {
      query = query.eq("instructor_id", instructorId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Courses fetch error:", error.message);
    } else {
      console.log("Courses fetch success! Count:", data.length);
    }

  } catch (err) {
    console.error("Unexpected error:", err.message);
  }
}

run();
