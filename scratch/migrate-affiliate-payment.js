// Migration directe via API REST Supabase
const https = require("https");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_raw_sql`);
    const body = JSON.stringify({ sql_query: sql });
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, data });
        } else {
          resolve({ ok: false, status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Use the pg direct connection instead
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const migrations = [
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_points INTEGER DEFAULT 0`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT DEFAULT NULL`,
  `ALTER TABLE courses ADD COLUMN IF NOT EXISTS require_section_quiz BOOLEAN DEFAULT TRUE`,
  `CREATE TABLE IF NOT EXISTS affiliations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
     referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
     points_awarded INTEGER DEFAULT 10,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(referred_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_affiliations_referrer ON affiliations(referrer_id)`,
];

async function run() {
  console.log("Running migrations via Supabase REST...");

  for (const sql of migrations) {
    const preview = sql.replace(/\s+/g, " ").trim().substring(0, 70);
    
    // Use direct fetch to Supabase REST
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });

    // Since RPC exec_raw_sql may not exist, use pg via API
    // Try using the Supabase management API if available
    const result = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (result.ok) {
      console.log(`✓ ${preview}`);
    } else {
      const text = await result.text();
      console.log(`~ ${preview} [${result.status}]`);
    }
  }

  // Now try assigning referral codes via Supabase JS client
  console.log("\nAssigning referral codes to instructors...");
  const { data: instructors, error: fetchErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "INSTRUCTOR")
    .is("referral_code", null);

  if (fetchErr) {
    console.log("Could not fetch instructors:", fetchErr.message);
  } else if (instructors && instructors.length > 0) {
    for (const inst of instructors) {
      const code = inst.id.replace(/-/g, "").substring(0, 12).toUpperCase();
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ referral_code: code })
        .eq("id", inst.id);
      if (!updateErr) console.log(`  ✓ Code assigned to ${inst.id}: ${code}`);
    }
  } else {
    console.log("  No instructors without code or column not yet created.");
  }

  console.log("\n✅ Done. Note: Column creation requires running SQL directly in Supabase Dashboard if not supported via REST.");
  console.log("\n📋 COPY THIS SQL INTO SUPABASE DASHBOARD > SQL EDITOR:\n");
  console.log("----------------------------------------------------");
  console.log(migrations.join(";\n\n") + ";");
  console.log("----------------------------------------------------");
}

run().catch(console.error);
