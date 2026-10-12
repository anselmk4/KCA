import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { sendInstructorDigitalProductsAnnouncementEmail } from "../src/lib/email";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Recherche des formateurs...");

  // 1. Instructor roles
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, roles!inner(name)")
    .eq("roles.name", "INSTRUCTOR");

  const instructorIds = new Set((roles || []).map((r: any) => r.user_id));

  // 2. Profiles
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, plan");

  if (profErr) {
    console.error("Erreur profiles:", profErr);
    process.exit(1);
  }

  const instructors: { id: string; name: string; email: string }[] = [];

  profiles?.forEach((p: any) => {
    const isInstructor = instructorIds.has(p.id) || p.role === "INSTRUCTOR" || (p.plan && p.plan !== "FREE");
    if (isInstructor && p.email) {
      instructors.push({
        id: p.id,
        name: p.full_name || "Formateur",
        email: p.email,
      });
    }
  });

  console.log(`Trouvé ${instructors.length} formateur(s) dans la base.`);

  for (const inst of instructors) {
    console.log(`Envoi de l'email à : ${inst.name} <${inst.email}>...`);
    try {
      await sendInstructorDigitalProductsAnnouncementEmail(inst.email, inst.name);
      console.log(`✓ Email envoyé avec succès à ${inst.email}`);
    } catch (err: any) {
      console.error(`✗ Erreur envoi à ${inst.email}:`, err.message);
    }
  }

  console.log("Opération terminée !");
}

main().catch(console.error);
