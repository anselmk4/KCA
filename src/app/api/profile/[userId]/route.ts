import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/[userId]
 * Public profile data endpoint with admin fallback and auto-provisioning.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Support "me" alias
    const targetId = userId === "me" ? authUser?.id : userId;

    if (!targetId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    // 1. Fetch Profile from profiles table
    let { data: profile, error: profErr } = await dbClient
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    // 2. If profile is not found in profiles, try checking auth.users via supabaseAdmin
    if (!profile && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data: adminUserData } = await supabaseAdmin.auth.admin.getUserById(targetId);
        if (adminUserData?.user) {
          const u = adminUserData.user;
          const fullName =
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split("@")[0] ||
            "Utilisateur";

          const newProfile = {
            id: u.id,
            email: u.email || "",
            full_name: fullName,
            avatar_url: u.user_metadata?.avatar_url || null,
            bio: null,
            specialty: null,
            academy_name: null,
            role: "STUDENT",
            created_at: new Date().toISOString(),
          };

          // Upsert profile
          await dbClient.from("profiles").upsert(newProfile);
          profile = newProfile;
        }
      } catch (adminErr) {
        console.warn("[GET /api/profile/[userId]] Admin user lookup note:", adminErr);
      }
    }

    // 3. Fallback: try matching by email or username
    if (!profile) {
      const { data: altProf } = await dbClient
        .from("profiles")
        .select("*")
        .or(`email.eq.${targetId},full_name.ilike.${targetId}`)
        .maybeSingle();
      if (altProf) profile = altProf;
    }

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // 4. Check user roles
    let isInstructor = false;
    try {
      const { data: roles } = await dbClient
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", profile.id);

      const roleNames = (roles || []).map((r: any) => r.roles?.name).filter(Boolean);
      isInstructor =
        roleNames.includes("INSTRUCTOR") ||
        roleNames.includes("SUPER_ADMIN") ||
        roleNames.includes("ADMIN") ||
        profile.role === "INSTRUCTOR" ||
        profile.role === "ADMIN";
    } catch {
      isInstructor = profile.role === "INSTRUCTOR";
    }

    // 5. Fetch published courses if instructor
    let courses: any[] = [];
    if (isInstructor) {
      try {
        const { data: coursesData } = await dbClient
          .from("courses")
          .select("id, title, price, status, thumbnail_url, level, short_description, language")
          .eq("instructor_id", profile.id)
          .eq("status", "PUBLISHED");

        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map((c: any) => c.id);
          const { data: enrollData } = await dbClient
            .from("enrollments")
            .select("course_id")
            .in("course_id", courseIds);

          const countMap: Record<string, number> = {};
          (enrollData || []).forEach((e: any) => {
            countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
          });

          courses = coursesData.map((c: any) => ({
            ...c,
            enrollmentCount: countMap[c.id] || 0,
          }));
        }
      } catch (cErr) {
        console.error("[GET /api/profile/[userId]] Courses query error:", cErr);
      }
    }

    // 6. Fetch enrolled courses if student
    let paidCourses: any[] = [];
    try {
      const { data: enrollData } = await dbClient
        .from("enrollments")
        .select("course_id, courses(id, title, price, thumbnail_url, level, language)")
        .eq("student_id", profile.id);

      paidCourses = (enrollData || []).map((e: any) => ({
        id: e.courses?.id || e.course_id,
        title: e.courses?.title || "Formation",
        price: e.courses?.price || 0,
        status: "PUBLISHED",
        thumbnail_url: e.courses?.thumbnail_url,
        level: e.courses?.level,
        language: e.courses?.language || "fr",
        enrollmentCount: 0,
      }));
    } catch (eErr) {
      console.warn("[GET /api/profile/[userId]] Enrollments query note:", eErr);
    }

    return NextResponse.json({
      profile,
      isInstructor,
      courses,
      paidCourses,
      isOwn: authUser?.id === profile.id,
    });
  } catch (err: any) {
    console.error("[GET /api/profile/[userId]] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
