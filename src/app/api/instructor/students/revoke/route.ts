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

    const { studentId, courseId } = await req.json();

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: "L'identifiant de l'étudiant et du cours sont requis." },
        { status: 400 }
      );
    }

    // Verify user role with supabaseAdmin
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles: string[] = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAdmin = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));

    // Verify course belongs to this instructor or user is admin/collaborator
    const { data: course, error: courseErr } = await supabaseAdmin
      .from("courses")
      .select("id, title, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    let isAllowed = isAdmin || (course.instructor_id === user.id);
    if (!isAllowed) {
      const { data: collab } = await (supabaseAdmin
        .from("course_collaborators" as any) as any)
        .select("id")
        .eq("course_id", courseId)
        .eq("collaborator_id", user.id)
        .maybeSingle();
      if (collab) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Vous n'avez pas l'autorisation de gérer cet apprenant sur ce cours." },
        { status: 403 }
      );
    }

    // Delete enrollment from database using service role client to bypass RLS
    const { error: deleteErr } = await supabaseAdmin
      .from("enrollments")
      .delete()
      .eq("student_id", studentId)
      .eq("course_id", courseId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `L'accès au cours "${course.title}" a été révoqué avec succès.`,
    });
  } catch (err: any) {
    console.error("[API instructor/students/revoke] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
