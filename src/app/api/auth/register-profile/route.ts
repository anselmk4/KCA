import { NextRequest, NextResponse } from "next/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

// Initialize a service role client to bypass RLS during registration setup
const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    // Security check: restrict registration role strictly to STUDENT or INSTRUCTOR
    let finalRole = (role || "STUDENT").toString().trim().toUpperCase();
    if (!ALLOWED_REGISTRATION_ROLES.includes(finalRole)) {
      console.warn(`[register-profile] Unauthorized role requested: ${finalRole}. Clamping to STUDENT.`);
      finalRole = "STUDENT";
    }

    // Verify user exists in Auth
    let initialStatus = "INACTIVE";
    try {
      const { data: authUserData, error: authUserErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUserErr || !authUserData?.user) {
        return NextResponse.json({ error: "Utilisateur d'authentification introuvable." }, { status: 404 });
      }
      if (authUserData.user.email_confirmed_at) {
        initialStatus = "ACTIVE";
      }
    } catch (e) {
      console.warn("[register-profile] Auth user lookup check:", e);
    }

    // 1. Ensure Profile exists or update it
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    const profileData: any = {
      email,
      full_name: name || email.split("@")[0],
      status: initialStatus,
      plan: "FREE",
      nationality: country || null,
      phone: phone || null,
      gender: gender || null,
    };

    if (finalRole === "INSTRUCTOR") {
      profileData.academy_name = academyName || "Mon Académie";
      profileData.bio = bio || null;
      profileData.specialty = thematic || null;
    } else {
      const levelMap: Record<string, string> = {
        Débutant: "BEGINNER",
        Intermédiaire: "INTERMEDIATE",
        Avancé: "ADVANCED",
      };
      profileData.level = levelMap[studentLevel] || "BEGINNER";
    }

    if (existingProfile) {
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update(profileData)
        .eq("id", userId);
      if (updateErr) console.error("[register-profile] Error updating profile:", updateErr.message);
    } else {
      profileData.id = userId;
      const { error: insertErr } = await supabaseAdmin
        .from("profiles")
        .insert(profileData);
      if (insertErr) console.error("[register-profile] Error inserting profile:", insertErr.message);
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
        const { data: referrer, error: referrerErr } = await supabaseAdmin
          .from("profiles")
          .select("id, affiliate_points")
          .eq("referral_code", referralCode.toUpperCase())
          .single();

        if (!referrerErr && referrer && referrer.id !== userId) {
          const { data: existingAff } = await supabaseAdmin
            .from("affiliations" as any)
            .select("id")
            .eq("referred_id", userId)
            .maybeSingle();

          if (!existingAff) {
            const POINTS_PER_AFFILIATE = 10;
            const { error: insErr } = await supabaseAdmin.from("affiliations" as any).insert({
              referrer_id: referrer.id,
              referred_id: userId,
              points_awarded: POINTS_PER_AFFILIATE,
            });

            if (!insErr) {
              const curPoints = referrer.affiliate_points || 0;
              await supabaseAdmin
                .from("profiles")
                .update({ affiliate_points: curPoints + POINTS_PER_AFFILIATE })
                .eq("id", referrer.id);
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
