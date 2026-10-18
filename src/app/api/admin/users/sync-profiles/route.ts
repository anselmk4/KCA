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
        // Check if any missing field can be filled from meta
        const updates: Record<string, any> = {};
        if (!existingProfile.phone && resolvedPhone) updates.phone = resolvedPhone;
        if (!existingProfile.nationality && resolvedCountry) updates.nationality = resolvedCountry;
        if (!existingProfile.gender && resolvedGender) updates.gender = resolvedGender;
        if (!existingProfile.academy_name && resolvedAcademy) updates.academy_name = resolvedAcademy;
        if (!existingProfile.specialty && resolvedSpecialty) updates.specialty = resolvedSpecialty;
        if (!existingProfile.bio && resolvedBio) updates.bio = resolvedBio;
        if (!existingProfile.full_name && resolvedName) updates.full_name = resolvedName;

        if (Object.keys(updates).length > 0) {
          const { error: upErr } = await (supabaseAdmin
            .from("profiles") as any)
            .update(updates)
            .eq("id", u.id);
          if (!upErr) updatedCount++;
        }
      } else {
        // Create profile
        const { error: inErr } = await (supabaseAdmin
          .from("profiles") as any)
          .insert({
            id: u.id,
            email: u.email || "",
            full_name: resolvedName,
            status: "ACTIVE",
            plan: "FREE",
            phone: resolvedPhone || null,
            nationality: resolvedCountry || null,
            gender: resolvedGender || null,
            academy_name: resolvedAcademy || null,
            specialty: resolvedSpecialty || null,
            bio: resolvedBio || null,
            level: resolvedLevel,
          });
        if (!inErr) createdCount++;
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
