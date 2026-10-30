import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/lib/countries";

const ALLOWED_REGISTRATION_ROLES = ["STUDENT", "INSTRUCTOR"];
const MAX_UNAUTHENTICATED_BOOTSTRAP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes after signUp

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      email,
      name,
      role,
      country,
      phone,
      gender,
      academyName,
      bio,
      thematic,
      studentLevel,
      interestCourse,
      referralCode,
    } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: "userId et email requis" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 0. Verify caller identity: either an active session for `userId` OR a freshly created auth.users record (< 10 min) matching `email`
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    if (sessionUser && sessionUser.id !== userId) {
      return NextResponse.json({ error: "Non autorisé à modifier ce profil." }, { status: 403 });
    }

    const { data: authUserData, error: authUserErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUserErr || !authUserData?.user) {
      return NextResponse.json({ error: "Utilisateur d'authentification introuvable." }, { status: 404 });
    }

    const authUser = authUserData.user;
    if ((authUser.email || "").trim().toLowerCase() !== normalizedEmail) {
      return NextResponse.json({ error: "L'email ne correspond pas au compte créé." }, { status: 403 });
    }

    // If caller does not yet have a session cookie (e.g. email confirmation pending right after signUp),
    // only allow initial profile bootstrap within 10 minutes of account creation.
    if (!sessionUser) {
      const createdAtMs = authUser.created_at ? new Date(authUser.created_at).getTime() : 0;
      const ageMs = Date.now() - createdAtMs;
      if (!createdAtMs || ageMs > MAX_UNAUTHENTICATED_BOOTSTRAP_WINDOW_MS) {
        return NextResponse.json(
          { error: "Session expirée ou non authentifiée. Veuillez vous connecter." },
          { status: 401 }
        );
      }
    }

    // Strict validation of mandatory contact details
    if (!country || !String(country).trim()) {
      return NextResponse.json({ error: "Le pays de résidence est obligatoire." }, { status: 400 });
    }

    const cleanPhone = String(phone || "").trim();
    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, "").length < 6) {
      return NextResponse.json(
        { error: "Le numéro de téléphone est obligatoire et doit être valide (minimum 6 chiffres)." },
        { status: 400 }
      );
    }

    const cleanGenderRaw = String(gender || "").trim().toLowerCase();
    if (!cleanGenderRaw || !["male", "female", "homme", "femme", "m", "f"].includes(cleanGenderRaw)) {
      return NextResponse.json({ error: "Le genre est obligatoire (Masculin ou Féminin)." }, { status: 400 });
    }
    const cleanGender =
      cleanGenderRaw === "female" || cleanGenderRaw === "femme" || cleanGenderRaw === "f"
        ? "female"
        : "male";

    // Security check: restrict registration role strictly to STUDENT or INSTRUCTOR
    let finalRole = (role || "STUDENT").toString().trim().toUpperCase();
    if (!ALLOWED_REGISTRATION_ROLES.includes(finalRole)) {
      console.warn(`[register-profile] Unauthorized role requested: ${finalRole}. Clamping to STUDENT.`);
      finalRole = "STUDENT";
    }

    if (finalRole === "INSTRUCTOR" && (!academyName || !String(academyName).trim())) {
      return NextResponse.json(
        { error: "Le nom de l'académie est obligatoire pour les formateurs." },
        { status: 400 }
      );
    }

    // Resolve country name & code
    const countryRaw = String(country).trim();
    const matchedCountry = COUNTRIES.find(
      (c) =>
        c.code.toLowerCase() === countryRaw.toLowerCase() ||
        c.name.toLowerCase() === countryRaw.toLowerCase()
    );
    const countryCode = matchedCountry ? matchedCountry.code : countryRaw;
    const countryName = matchedCountry ? matchedCountry.name : countryRaw;

    // 1. Resilient Profile Persistence (never overwrite existing plan or suspended status)
    const { data: existingProfile } = await (supabaseAdmin
      .from("profiles") as any)
      .select("id, status, plan")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      await (supabaseAdmin.from("profiles") as any)
        .update({
          email: normalizedEmail,
          full_name: name || normalizedEmail.split("@")[0],
        })
        .eq("id", userId);
    } else {
      await (supabaseAdmin.from("profiles") as any).insert({
        id: userId,
        email: normalizedEmail,
        full_name: name || normalizedEmail.split("@")[0],
        status: "ACTIVE",
        plan: "FREE",
      });
    }

    // Persist Phone Number resiliently (tries 'phone' first, then 'phone_number')
    try {
      const { error: phoneErr } = await (supabaseAdmin.from("profiles") as any)
        .update({ phone: cleanPhone })
        .eq("id", userId);
      if (phoneErr) {
        await (supabaseAdmin.from("profiles") as any)
          .update({ phone_number: cleanPhone })
          .eq("id", userId);
      }
    } catch (e) {
      console.warn("[register-profile] Error saving phone to profiles:", e);
    }

    // Persist Nationality / Country resiliently (tries 'nationality' first, then 'country')
    try {
      const { error: natErr } = await (supabaseAdmin.from("profiles") as any)
        .update({ nationality: countryName })
        .eq("id", userId);
      if (natErr) {
        await (supabaseAdmin.from("profiles") as any)
          .update({ country: countryName })
          .eq("id", userId);
      }
    } catch (e) {
      console.warn("[register-profile] Error saving nationality to profiles:", e);
    }

    // Persist Gender (optional column in database, non-fatal if column absent)
    try {
      await (supabaseAdmin.from("profiles") as any)
        .update({ gender: cleanGender })
        .eq("id", userId);
    } catch {}

    // Persist role-specific fields
    try {
      if (finalRole === "INSTRUCTOR") {
        await (supabaseAdmin.from("profiles") as any)
          .update({
            academy_name: academyName || "Mon Académie",
            bio: bio || null,
            specialty: thematic || null,
          })
          .eq("id", userId);
      } else {
        const levelMap: Record<string, string> = {
          Débutant: "BEGINNER",
          Intermédiaire: "INTERMEDIATE",
          Avancé: "ADVANCED",
        };
        await (supabaseAdmin.from("profiles") as any)
          .update({
            level: levelMap[studentLevel] || "BEGINNER",
          })
          .eq("id", userId);
      }
    } catch {}

    // Synchronize Auth user_metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: name || normalizedEmail.split("@")[0],
          name: name || normalizedEmail.split("@")[0],
          country: countryCode,
          nationality: countryName,
          phone: cleanPhone,
          phone_number: cleanPhone,
          gender: cleanGender,
          ...(finalRole === "INSTRUCTOR"
            ? {
                academy_name: academyName || "Mon Académie",
                bio: bio || null,
                thematic: thematic || null,
              }
            : {
                student_level: studentLevel || null,
                interest_course: interestCourse || null,
              }),
        },
      });
    } catch (metaErr: any) {
      console.warn("[register-profile] Auth user_metadata sync warning:", metaErr?.message);
    }

    // 2. Ensure role assignment in user_roles (only if user has no admin roles)
    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", userId);

    const existingRoleNames: string[] =
      existingRoles?.map((r: any) => r.roles?.name).filter(Boolean) || [];
    const hasAdminRole = existingRoleNames.some((r) =>
      ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "SUPPORT_AGENT"].includes(r)
    );

    if (!hasAdminRole) {
      const { data: roleRow } = await supabaseAdmin
        .from("roles")
        .select("id")
        .eq("name", finalRole)
        .single();

      if (roleRow) {
        if (finalRole !== "STUDENT") {
          const { data: studentRoleRow } = await supabaseAdmin
            .from("roles")
            .select("id")
            .eq("name", "STUDENT")
            .single();

          if (studentRoleRow) {
            await supabaseAdmin
              .from("user_roles")
              .delete()
              .eq("user_id", userId)
              .eq("role_id", studentRoleRow.id);
          }
        }

        await supabaseAdmin
          .from("user_roles")
          .upsert(
            { user_id: userId, role_id: roleRow.id },
            { onConflict: "user_id,role_id", ignoreDuplicates: true }
          );
      }
    }

    // 3. Affiliation registration (only once per referred_id)
    if (referralCode && typeof referralCode === "string") {
      try {
        const cleanReferralCode = referralCode.trim().toUpperCase();
        const { data: referrer, error: referrerErr } = await (supabaseAdmin
          .from("profiles" as any)
          .select("id, affiliate_points")
          .eq("referral_code", cleanReferralCode)
          .single() as any);

        if (!referrerErr && referrer && referrer.id !== userId) {
          const { data: existingAff } = await (supabaseAdmin
            .from("affiliations" as any)
            .select("id")
            .eq("referred_id", userId)
            .maybeSingle() as any);

          if (!existingAff) {
            const POINTS_PER_AFFILIATE = 10;
            const { error: insErr } = await (supabaseAdmin.from("affiliations" as any).insert({
              referrer_id: referrer.id,
              referred_id: userId,
              points_awarded: POINTS_PER_AFFILIATE,
            } as any) as any);

            if (!insErr) {
              const curPoints = referrer.affiliate_points || 0;
              await (supabaseAdmin
                .from("profiles" as any)
                .update({ affiliate_points: curPoints + POINTS_PER_AFFILIATE } as any)
                .eq("id", referrer.id) as any);
            }
          }
        }
      } catch (affErr) {
        console.warn("[register-profile] Affiliation processing error:", affErr);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[register-profile] Server error:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la configuration du profil." },
      { status: 500 }
    );
  }
}
