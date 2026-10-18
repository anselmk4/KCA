import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { COUNTRIES } from "@/lib/countries";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Verify admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("[update-profile] Error reading user roles:", rolesError);
    }

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Droits administrateurs requis." }, { status: 403 });
    }

    const body = await req.json();
    const {
      targetUserId,
      name,
      phoneNumber,
      country,
      gender,
      academyName,
      academyTagline,
      specialty,
      bio,
    } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId est requis." }, { status: 400 });
    }

    // Resolve country name/code if country is given
    let resolvedCountry = country || "";
    if (resolvedCountry) {
      const found = COUNTRIES.find(
        (c) => c.code.toLowerCase() === resolvedCountry.toLowerCase() || c.name.toLowerCase() === resolvedCountry.toLowerCase()
      );
      if (found) {
        resolvedCountry = found.name;
      }
    }

    // 1. Prepare profile updates for profiles table (using verified column names)
    const profileUpdates: Record<string, any> = {};
    if (name !== undefined) profileUpdates.full_name = name.trim();
    if (phoneNumber !== undefined) profileUpdates.phone = phoneNumber.trim();
    if (resolvedCountry !== undefined) profileUpdates.nationality = resolvedCountry.trim();
    if (gender !== undefined) profileUpdates.gender = gender.trim();
    if (academyName !== undefined) profileUpdates.academy_name = academyName.trim();
    if (academyTagline !== undefined) profileUpdates.academy_tagline = academyTagline.trim();
    if (specialty !== undefined) profileUpdates.specialty = specialty.trim();
    if (bio !== undefined) profileUpdates.bio = bio.trim();

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (existingProfile) {
      const { error: updateErr } = await (supabaseAdmin
        .from("profiles") as any)
        .update(profileUpdates)
        .eq("id", targetUserId);

      if (updateErr) {
        console.error("[update-profile] Error updating profiles table:", updateErr.message);
        return NextResponse.json({ error: "Erreur lors de la mise à jour du profil : " + updateErr.message }, { status: 500 });
      }
    } else {
      // Create profile row if it was missing
      const { data: authTarget } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      const targetEmail = authTarget?.user?.email || "";
      const { error: insertErr } = await (supabaseAdmin
        .from("profiles") as any)
        .insert({
          id: targetUserId,
          email: targetEmail,
          full_name: name || targetEmail.split("@")[0] || "Utilisateur",
          status: "ACTIVE",
          plan: "FREE",
          ...profileUpdates,
        });

      if (insertErr) {
        console.error("[update-profile] Error inserting new profile:", insertErr.message);
        return NextResponse.json({ error: "Erreur lors de la création du profil : " + insertErr.message }, { status: 500 });
      }
    }

    // 2. Synchronize user_metadata in auth.users
    try {
      const { data: authTarget } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (authTarget?.user) {
        const currentMeta = authTarget.user.user_metadata || {};
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            ...currentMeta,
            full_name: name || currentMeta.full_name,
            name: name || currentMeta.name,
            phone: phoneNumber !== undefined ? phoneNumber.trim() : currentMeta.phone,
            phone_number: phoneNumber !== undefined ? phoneNumber.trim() : currentMeta.phone_number,
            country: resolvedCountry || currentMeta.country,
            nationality: resolvedCountry || currentMeta.nationality,
            gender: gender !== undefined ? gender.trim() : currentMeta.gender,
            academy_name: academyName !== undefined ? academyName.trim() : currentMeta.academy_name,
            academy_tagline: academyTagline !== undefined ? academyTagline.trim() : currentMeta.academy_tagline,
            specialty: specialty !== undefined ? specialty.trim() : currentMeta.specialty,
            thematic: specialty !== undefined ? specialty.trim() : currentMeta.thematic,
            bio: bio !== undefined ? bio.trim() : currentMeta.bio,
          },
        });
      }
    } catch (metaErr: any) {
      console.warn("[update-profile] Warning updating auth user_metadata:", metaErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: "Profil utilisateur mis à jour avec succès.",
      updatedFields: profileUpdates,
    });
  } catch (err: any) {
    console.error("[update-profile] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
