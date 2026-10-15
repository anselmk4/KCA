import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { COUNTRIES } from "@/lib/countries";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous reconnecter." }, { status: 401 });
    }

    const body = await req.json();
    const { country, phone, gender, academyName } = body;

    if (!country || !country.trim()) {
      return NextResponse.json({ error: "Le pays de résidence est obligatoire." }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Le numéro de téléphone est obligatoire." }, { status: 400 });
    }

    if (!gender || !gender.trim()) {
      return NextResponse.json({ error: "Le genre est obligatoire." }, { status: 400 });
    }

    // Resolve country item from COUNTRIES
    const countryTrimmed = country.trim();
    const matchedCountry = COUNTRIES.find(
      (c) =>
        c.code.toLowerCase() === countryTrimmed.toLowerCase() ||
        c.name.toLowerCase() === countryTrimmed.toLowerCase()
    );

    const countryCode = matchedCountry ? matchedCountry.code : countryTrimmed;
    const countryName = matchedCountry ? matchedCountry.name : countryTrimmed;
    const cleanPhone = phone.trim();
    const cleanGender = gender.trim().toLowerCase() === "female" || gender.trim().toLowerCase() === "femme" || gender.trim() === "F"
      ? "female"
      : "male";

    // 1. Prepare profile updates for profiles table
    const profileUpdates: Record<string, any> = {
      country: countryCode,
      nationality: countryName,
      phone: cleanPhone,
      phone_number: cleanPhone,
      gender: cleanGender,
    };

    if (academyName && academyName.trim()) {
      profileUpdates.academy_name = academyName.trim();
    }

    // Upsert into profiles using supabaseAdmin
    const { data: updatedProfile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur",
        status: "ACTIVE",
        plan: "FREE",
        ...profileUpdates,
      })
      .select()
      .single();

    if (profileErr) {
      console.error("[profile/complete] Error updating profiles table:", profileErr.message);
      // Fallback update
      await supabaseAdmin.from("profiles").update(profileUpdates).eq("id", user.id);
    }

    // 2. Synchronize user_metadata in auth.users
    try {
      const currentMeta = user.user_metadata || {};
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...currentMeta,
          country: countryCode,
          nationality: countryName,
          phone: cleanPhone,
          phone_number: cleanPhone,
          gender: cleanGender,
          ...(academyName ? { academy_name: academyName.trim() } : {}),
        },
      });
    } catch (metaErr: any) {
      console.warn("[profile/complete] Warning updating auth user_metadata:", metaErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: "Profil complété avec succès.",
      profile: updatedProfile || profileUpdates,
    });
  } catch (err: any) {
    console.error("[profile/complete] Server exception:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'enregistrement de vos informations." },
      { status: 500 }
    );
  }
}
