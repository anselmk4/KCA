import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Verify admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Droits administrateurs requis." }, { status: 403 });
    }

    // 1. Fetch all profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("*");
    if (pErr) throw pErr;

    const profileMap = new Map<string, any>();
    profiles?.forEach((p) => profileMap.set(p.id, p));

    // 2. Fetch all Auth users
    const { data: authData, error: aErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (aErr) throw aErr;

    const authUsers = authData?.users || [];
    let updatedCount = 0;
    let createdCount = 0;

    for (const u of authUsers) {
      const meta = u.user_metadata || {};
      const existingProfile = profileMap.get(u.id);

      const resolvedPhone = meta.phone_number || meta.phone || u.phone || "";
      const resolvedCountry = meta.country || meta.nationality || "";
      const resolvedGender = meta.gender || "";
      const resolvedAcademy = meta.academy_name || "";
      const resolvedSpecialty = meta.thematic || meta.specialty || "";
      const resolvedBio = meta.bio || "";
      const resolvedLevel = meta.student_level || "Débutant";
      const resolvedName = meta.full_name || meta.name || u.email?.split("@")[0] || "Utilisateur";

      if (existingProfile) {
        let hasUpdated = false;

        // Resilient phone update
        if (!existingProfile.phone && resolvedPhone) {
          const { error: pErr1 } = await (supabaseAdmin.from("profiles") as any)
            .update({ phone: resolvedPhone })
            .eq("id", u.id);
          if (pErr1) {
            const { error: pErr2 } = await (supabaseAdmin.from("profiles") as any)
              .update({ phone_number: resolvedPhone })
              .eq("id", u.id);
            if (!pErr2) hasUpdated = true;
          } else {
            hasUpdated = true;
          }
        }

        // Resilient nationality update
        if (!existingProfile.nationality && resolvedCountry) {
          const { error: nErr1 } = await (supabaseAdmin.from("profiles") as any)
            .update({ nationality: resolvedCountry })
            .eq("id", u.id);
          if (nErr1) {
            const { error: nErr2 } = await (supabaseAdmin.from("profiles") as any)
              .update({ country: resolvedCountry })
              .eq("id", u.id);
            if (!nErr2) hasUpdated = true;
          } else {
            hasUpdated = true;
          }
        }

        // Optional fields (ignore error if column doesn't exist)
        if (!existingProfile.full_name && resolvedName) {
          await (supabaseAdmin.from("profiles") as any).update({ full_name: resolvedName }).eq("id", u.id).catch(() => {});
        }
        if (!existingProfile.gender && resolvedGender) {
          await (supabaseAdmin.from("profiles") as any).update({ gender: resolvedGender }).eq("id", u.id).catch(() => {});
        }
        if (!existingProfile.academy_name && resolvedAcademy) {
          await (supabaseAdmin.from("profiles") as any).update({ academy_name: resolvedAcademy }).eq("id", u.id).catch(() => {});
        }
        if (!existingProfile.specialty && resolvedSpecialty) {
          await (supabaseAdmin.from("profiles") as any).update({ specialty: resolvedSpecialty }).eq("id", u.id).catch(() => {});
        }
        if (!existingProfile.bio && resolvedBio) {
          await (supabaseAdmin.from("profiles") as any).update({ bio: resolvedBio }).eq("id", u.id).catch(() => {});
        }

        if (hasUpdated) updatedCount++;
      } else {
        // Create base profile first
        const { error: inErr } = await (supabaseAdmin
          .from("profiles") as any)
          .insert({
            id: u.id,
            email: u.email || "",
            full_name: resolvedName,
            status: "ACTIVE",
            plan: "FREE",
          });

        if (!inErr) {
          createdCount++;
          if (resolvedPhone) {
            const { error: pErr } = await (supabaseAdmin.from("profiles") as any).update({ phone: resolvedPhone }).eq("id", u.id);
            if (pErr) await (supabaseAdmin.from("profiles") as any).update({ phone_number: resolvedPhone }).eq("id", u.id).catch(() => {});
          }
          if (resolvedCountry) {
            const { error: nErr } = await (supabaseAdmin.from("profiles") as any).update({ nationality: resolvedCountry }).eq("id", u.id);
            if (nErr) await (supabaseAdmin.from("profiles") as any).update({ country: resolvedCountry }).eq("id", u.id).catch(() => {});
          }
          if (resolvedGender) {
            await (supabaseAdmin.from("profiles") as any).update({ gender: resolvedGender }).eq("id", u.id).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée : ${updatedCount} profil(s) mis à jour, ${createdCount} profil(s) créés.`,
      totalAuthUsers: authUsers.length,
      updatedCount,
      createdCount,
    });
  } catch (err: any) {
    console.error("[sync-profiles] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
