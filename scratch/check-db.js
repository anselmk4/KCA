const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc("check_profiles_columns");
  if (error) {
    // Si l'RPC n'existe pas, on fait une requête simple
    console.log("Querying profiles table schema info...");
    const { data: profileRow, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);
    
    if (selectError) {
      console.error("Select error:", selectError.message);
    } else {
      console.log("Profile columns found:", Object.keys(profileRow[0] || {}));
    }
  } else {
    console.log("Columns:", data);
  }
}

run();
