const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dwhtfoqqbwsycthpksqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aHRmb3FxYndzeWN0aHBrc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3ODM3MywiZXhwIjoyMDk2MjU0MzczfQ.o4ZWh-OcFxMGSzrMCBwioCIbwlRnJstoQQNKF4GoR4U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const referrerId = 'bfaf1a31-87e2-4e56-a9ef-fbc84783956c'; // referrer
  
  console.log("1. Fetching affiliations...");
  const { data: affiliations, error } = await supabase
    .from('affiliations')
    .select(`
      id,
      referred_id,
      points_awarded,
      created_at,
      referred:referred_id (
        id,
        full_name,
        email,
        created_at
      )
    `)
    .eq('referrer_id', referrerId);

  if (error) {
    console.error("Affiliations fetch failed:", error);
    return;
  }

  const referredIds = affiliations.map(a => a.referred_id).filter(Boolean);
  console.log("Referred IDs found:", referredIds);

  if (referredIds.length > 0) {
    console.log("2. Querying user_roles...");
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles!inner(name)
      `)
      .in('user_id', referredIds);

    if (rolesError) {
      console.error("Roles fetch failed:", rolesError);
      return;
    }

    const rolesMap = new Map();
    (rolesData || []).forEach(ur => {
      rolesMap.set(ur.user_id, ur.roles?.name || 'STUDENT');
    });

    console.log("Roles mapping map:", Object.fromEntries(rolesMap));

    const affiliateList = affiliations.map(a => ({
      id: a.id,
      pointsAwarded: a.points_awarded,
      joinedAt: a.created_at,
      user: {
        id: a.referred?.id,
        name: a.referred?.full_name || "—",
        email: a.referred?.email || "—",
        role: rolesMap.get(a.referred_id) || "STUDENT"
      }
    }));

    console.log("Final affiliate list with correct roles:", JSON.stringify(affiliateList, null, 2));
  } else {
    console.log("No referred users found.");
  }
}

run();
