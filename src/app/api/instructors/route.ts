import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
    // 1. Fetch all profiles
    let profiles: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) profiles = data;
    } catch (e) {
      console.warn("[/api/instructors] supabaseAdmin profiles error:", e);
    }

    if (profiles.length === 0) {
      try {
        const supabase = await createClient();
        const { data } = await supabase.from("profiles").select("*");
        if (data) profiles = data;
      } catch {}
    }

    // 2. Fetch courses to calculate course count per instructor
    const courseCountsByInstructor: Record<string, number> = {};
    const courseAuthorIds = new Set<string>();

    try {
      const { data: coursesData } = await supabaseAdmin
        .from("courses")
        .select("id, instructor_id, title, status");

      (coursesData || []).forEach((c: any) => {
        if (c.instructor_id) {
          courseAuthorIds.add(c.instructor_id);
          courseCountsByInstructor[c.instructor_id] =
            (courseCountsByInstructor[c.instructor_id] || 0) + 1;
        }
      });
    } catch (e) {
      console.warn("[/api/instructors] courses query error:", e);
    }

    // 3. Fetch user roles
    const roleMap = new Map<string, string[]>();
    try {
      const { data: allUserRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role_id, roles(name)");

      (allUserRoles || []).forEach((ur: any) => {
        const name = ur.roles?.name;
        if (name && ur.user_id) {
          const list = roleMap.get(ur.user_id) || [];
          list.push(name);
          roleMap.set(ur.user_id, list);
        }
      });
    } catch (e) {
      console.warn("[/api/instructors] user_roles query error:", e);
    }

    // 4. Fetch course collaborators
    const collaboratorIds = new Set<string>();
    try {
      const { data: collabData } = await (supabaseAdmin as any)
        .from("course_collaborators")
        .select("collaborator_id");

      (collabData || []).forEach((c: any) => {
        if (c.collaborator_id) collaboratorIds.add(c.collaborator_id);
      });
    } catch {}

    // 5. Identify instructors from the profiles
    const instructorsList: RealInstructor[] = [];
    const seenIds = new Set<string>();

    // Pass 1: Explicit instructors, course authors, admins, collaborators
    profiles.forEach((p) => {
      const userRoles = roleMap.get(p.id) || [];
      const hasInstructorRole =
        userRoles.includes("INSTRUCTOR") ||
        userRoles.includes("TEACHING_ASSISTANT") ||
        userRoles.includes("ADMIN") ||
        userRoles.includes("SUPER_ADMIN") ||
        ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(p.role);

      const hasCreatedCourses = courseAuthorIds.has(p.id);
      const isCollaborator = collaboratorIds.has(p.id);
      const hasAcademyDetails = Boolean(p.academy_name || p.specialty);

      if ((hasInstructorRole || hasCreatedCourses || isCollaborator || hasAcademyDetails) && !seenIds.has(p.id) && p.full_name) {
        seenIds.add(p.id);
        instructorsList.push({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          bio: p.bio || null,
          specialty:
            p.specialty ||
            (hasCreatedCourses
              ? `Formateur (${courseCountsByInstructor[p.id] || 1} formation${(courseCountsByInstructor[p.id] || 1) > 1 ? "s" : ""})`
              : p.academy_name
              ? `Formateur · ${p.academy_name}`
              : "Formateur Certifié"),
          avatar_url: p.avatar_url || null,
          academy_name: p.academy_name || null,
          nationality: p.nationality || null,
          website: p.website || null,
          courseCount: courseCountsByInstructor[p.id] || 0,
        });
      }
    });

    // Pass 2: If no explicit instructor was found with strict flags, include all non-empty profiles from the database
    if (instructorsList.length === 0 && profiles.length > 0) {
      profiles.forEach((p) => {
        if (!seenIds.has(p.id) && p.full_name) {
          seenIds.add(p.id);
          instructorsList.push({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            bio: p.bio || null,
            specialty: p.specialty || p.academy_name || "Formateur & Expert",
            avatar_url: p.avatar_url || null,
            academy_name: p.academy_name || null,
            nationality: p.nationality || null,
            website: p.website || null,
            courseCount: courseCountsByInstructor[p.id] || 0,
          });
        }
      });
    }

    return NextResponse.json({ instructors: instructorsList, count: instructorsList.length });
  } catch (err: any) {
    console.error("[/api/instructors] Server error:", err);
    return NextResponse.json({ instructors: [], error: err.message }, { status: 500 });
  }
}
