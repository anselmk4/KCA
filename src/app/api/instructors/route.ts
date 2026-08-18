import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export interface RealInstructor {
  id: string;
  full_name: string;
  email?: string;
  bio: string | null;
  specialty: string | null;
  avatar_url: string | null;
  academy_name: string | null;
  nationality: string | null;
  website: string | null;
  courseCount: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch courses to calculate course count per instructor
    const { data: coursesData } = await supabaseAdmin
      .from("courses")
      .select("id, instructor_id, status");

    const courseCountsByInstructor: Record<string, number> = {};
    const instructorIdsFromCourses = new Set<string>();

    (coursesData || []).forEach((c: any) => {
      if (c.instructor_id) {
        instructorIdsFromCourses.add(c.instructor_id);
        courseCountsByInstructor[c.instructor_id] =
          (courseCountsByInstructor[c.instructor_id] || 0) + 1;
      }
    });

    // 2. Fetch role IDs for INSTRUCTOR, TEACHING_ASSISTANT, ADMIN, SUPER_ADMIN
    const { data: roleRows } = await supabaseAdmin
      .from("roles")
      .select("id, name")
      .in("name", ["INSTRUCTOR", "TEACHING_ASSISTANT", "ADMIN", "SUPER_ADMIN"]);

    const roleIds = (roleRows || []).map((r) => r.id);
    const instructorUserIds = new Set<string>(instructorIdsFromCourses);

    if (roleIds.length > 0) {
      const { data: userRolesData } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .in("role_id", roleIds);

      (userRolesData || []).forEach((ur: any) => {
        if (ur.user_id) instructorUserIds.add(ur.user_id);
      });
    }

    // 3. Fetch course collaborators
    try {
      const { data: collabData } = await (supabaseAdmin as any)
        .from("course_collaborators")
        .select("collaborator_id");

      (collabData || []).forEach((c: any) => {
        if (c.collaborator_id) instructorUserIds.add(c.collaborator_id);
      });
    } catch {}

    // 4. Fetch profiles for all identified instructors + any profile that has academy_name or specialty
    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, bio, specialty, avatar_url, academy_name, nationality, website, role")
      .order("full_name", { ascending: true });

    const { data: allProfiles, error: profileErr } = await query;

    if (profileErr) {
      console.error("[/api/instructors] Error fetching profiles:", profileErr.message);
      return NextResponse.json({ instructors: [] }, { status: 500 });
    }

    const profilesList = (allProfiles || []) as any[];

    const realInstructors: RealInstructor[] = [];
    const seenIds = new Set<string>();

    profilesList.forEach((prof) => {
      const isExplicitInstructor = instructorUserIds.has(prof.id);
      const hasAcademyOrSpecialty = Boolean(prof.academy_name || prof.specialty);
      const isInstructorRole = ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(prof.role);

      if ((isExplicitInstructor || hasAcademyOrSpecialty || isInstructorRole) && !seenIds.has(prof.id) && prof.full_name) {
        seenIds.add(prof.id);
        realInstructors.push({
          id: prof.id,
          full_name: prof.full_name,
          email: prof.email,
          bio: prof.bio || null,
          specialty: prof.specialty || (courseCountsByInstructor[prof.id] ? "Formateur Certifié ANSELLA" : "Formateur"),
          avatar_url: prof.avatar_url || null,
          academy_name: prof.academy_name || null,
          nationality: prof.nationality || null,
          website: prof.website || null,
          courseCount: courseCountsByInstructor[prof.id] || 0,
        });
      }
    });

    return NextResponse.json({ instructors: realInstructors });
  } catch (err: any) {
    console.error("[/api/instructors] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
