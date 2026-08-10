import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin
      : supabase;

    // Verify course belongs to this instructor
    const { data: course, error: courseErr } = await dbClient
      .from("courses")
      .select("id, title, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (course.instructor_id !== user.id) {
      return NextResponse.json(
        { error: "Vous n'avez pas l'autorisation de gérer cet apprenant sur ce cours." },
        { status: 403 }
      );
    }

    // Delete enrollment from database
    const { error: deleteErr } = await dbClient
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
