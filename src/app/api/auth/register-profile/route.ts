import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { COUNTRIES } from "@/lib/countries";

const ALLOWED_REGISTRATION_ROLES = ["STUDENT", "INSTRUCTOR"];

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

    // Strict validation of mandatory contact details
    if (!country || !String(country).trim()) {
      return NextResponse.json({ error: "Le pays de résidence est obligatoire." }, { status: 400 });
    }

    const cleanPhone = String(phone || "").trim();
    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, "").length < 6) {
      return NextResponse.json({ error: "Le numéro de téléphone est obligatoire et doit être valide (minimum 6 chiffres)." }, { status: 400 });
    }

    const cleanGenderRaw = String(gender || "").trim().toLowerCase();
    if (!cleanGenderRaw || !["male", "female", "homme", "femme", "m", "f"].includes(cleanGenderRaw)) {
      return NextResponse.json({ error: "Le genre est obligatoire (Masculin ou Féminin)." }, { status: 400 });
    }
    const cleanGender = cleanGenderRaw === "female" || cleanGenderRaw === "femme" || cleanGenderRaw === "f" ? "female" : "male";

    // Security check: restrict registration role strictly to STUDENT or INSTRUCTOR
    let finalRole = (role || "STUDENT").toString().trim().toUpperCase();
    if (!ALLOWED_REGISTRATION_ROLES.includes(finalRole)) {
      console.warn(`[register-profile] Unauthorized role requested: ${finalRole}. Clamping to STUDENT.`);
      finalRole = "STUDENT";
    }

    if (finalRole === "INSTRUCTOR" && (!academyName || !String(academyName).trim())) {
      return NextResponse.json({ error: "Le nom de l'académie est obligatoire pour les formateurs." }, { status: 400 });
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

    // Non-blocking Auth user verification (never block registration if service role or replica lag delays lookup)
    let initialStatus = "ACTIVE";
    try {
      const { data: authUserData, error: authUserErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!authUserErr && authUserData?.user && !authUserData.user.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true }).catch(() => {});
      }
    } catch (e) {
      console.warn("[register-profile] Auth user lookup notice:", e);
    }

    // 1. Resilient Profile Persistence
    // Base guaranteed profile fields
    const baseProfile: Record<string, any> = {
      email,
      full_name: name || email.split("@")[0],
      status: initialStatus,
      plan: "FREE",
    };

    const { data: existingProfile } = await (supabaseAdmin
      .from("profiles") as any)
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      await (supabaseAdmin.from("profiles") as any)
        .update(baseProfile)
        .eq("id", userId);
    } else {
      await (supabaseAdmin.from("profiles") as any)
        .insert({ id: userId, ...baseProfile });
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
    } catch (e) {}

    // Persist role-specific fields (isolated so schema mismatches never affect phone/country)
    try {
      if (finalRole === "INSTRUCTOR") {
        await (supabaseAdmin.from("profiles") as any).update({
          academy_name: academyName || "Mon Académie",
          bio: bio || null,
          specialty: thematic || null,
        }).eq("id", userId);
      } else {
        const levelMap: Record<string, string> = {
          Débutant: "BEGINNER",
          Intermédiaire: "INTERMEDIATE",
          Avancé: "ADVANCED",
        };
        await (supabaseAdmin.from("profiles") as any).update({
          level: levelMap[studentLevel] || "BEGINNER",
        }).eq("id", userId);
      }
    } catch (e) {}

    // Synchronize Auth user_metadata so information is permanently anchored in Auth as well
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: name || email.split("@")[0],
          name: name || email.split("@")[0],
          country: countryCode,
          nationality: countryName,
          phone: cleanPhone,
          phone_number: cleanPhone,
          gender: cleanGender,
          ...(finalRole === "INSTRUCTOR"
            ? { academy_name: academyName || "Mon Académie", bio: bio || null, thematic: thematic || null }
            : { student_level: studentLevel || null }),
        },
      });
    } catch (metaErr: any) {
      console.warn("[register-profile] Auth user_metadata sync warning:", metaErr?.message);
    }

    // 2. Ensure role assignment in user_roles (strictly STUDENT or INSTRUCTOR)
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

    // 3. Auto-enrollment for Student if interestCourse provided
    if (finalRole === "STUDENT" && interestCourse) {
      const COURSE_MAP: Record<string, string> = {
        blockchain: "10000000-0000-0000-0000-000000000001",
        trading: "10000000-0000-0000-0000-000000000002",
        ai: "10000000-0000-0000-0000-000000000003",
        web3: "10000000-0000-0000-0000-000000000004",
      };
      const courseId = COURSE_MAP[interestCourse] || interestCourse;

      await supabaseAdmin.from("enrollments").upsert(
        {
          student_id: userId,
          course_id: courseId,
          progress_percent: 0,
          status: "ACTIVE",
          enrolled_at: new Date().toISOString(),
        },
        { onConflict: "student_id,course_id", ignoreDuplicates: true }
      );
    }

    // 4. Affiliation registration
    if (referralCode) {
      try {
        const { data: referrer, error: referrerErr } = await (supabaseAdmin
          .from("profiles" as any)
          .select("id, affiliate_points")
          .eq("referral_code", referralCode.toUpperCase())
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
