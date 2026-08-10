const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzgzNzMsImV4cCI6MjA5NjI1NDM3M30.E1kK0zGrUMkLbBhekJMQJEy5_rznyMGT_3q04rf8EqY';

// We will sign in as the user anselmk4@gmail.com or mock their session
async function run() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("=== Testing with Anon Client (Without Auth Session) ===");
  const { data: noAuth, error: noAuthErr } = await supabase
    .from('affiliations')
    .select('*');
    
  console.log("Without session: error:", noAuthErr, "data length:", noAuth ? noAuth.length : null);

  console.log("\n=== Logging in as anselmk4@gmail.com ===");
  // Sign in as anselmk4@gmail.com
  const { data: authData, error: logErr } = await supabase.auth.signInWithPassword({
    email: 'anselmk4@gmail.com',
    password: 'password123' // Let's try password123, or if we don't know the password we can use another method
  });

  if (logErr) {
    console.error("Login failed (this is expected if password is different):", logErr.message);
    // Since we don't know the password, we can generate a temporary token or use service role to act as user if RLS is the cause
    console.log("Let's query schema policies to verify RLS.");
    return;
  }

  console.log("Logged in successfully! User ID:", authData.user.id);
  const { data: aff, error: affErr } = await supabase
    .from('affiliations')
    .select('*');

  console.log("With session: error:", affErr, "data:", aff);
}

run();
