import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/supabase/notifications-helper";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin
      : supabase;

    const body = await req.json();
    const { studentId, courseId, sessionId } = body;

    if (!studentId || !courseId) {
      return NextResponse.json({ error: "Données manquantes (studentId ou courseId)." }, { status: 400 });
    }

    // Check course & instructor permissions
    const { data: course, error: courseErr } = await (dbClient
      .from("courses" as any) as any)
      .select("id, title, type, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (course.type === "self_paced") {
      return NextResponse.json(
        { error: "Ce cours est en autonomie (self_paced) et ne supporte pas l'affectation à des sessions." },
        { status: 400 }
      );
    }

    const { data: userRoles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isOwnerOrAdmin = course.instructor_id === user.id || roles.some(r => ["SUPER_ADMIN", "ADMIN", "ACADEMIC_ADMIN"].includes(r));

    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: "Accès refusé. Vous n'êtes pas le formateur de ce cours." }, { status: 403 });
    }

    let sessionName = "Non assigné";
    if (sessionId) {
      const { data: session, error: sessErr } = await (dbClient
        .from("course_sessions" as any) as any)
        .select("id, name, course_id, start_date")
        .eq("id", sessionId)
        .maybeSingle();

      if (sessErr || !session || session.course_id !== courseId) {
        return NextResponse.json({ error: "Session introuvable pour ce cours." }, { status: 404 });
      }
      sessionName = session.name;
    }

    // Update enrollment
    const { data: updatedEnrollment, error: updateErr } = await (dbClient
      .from("enrollments" as any) as any)
      .update({ session_id: sessionId || null })
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error("[assign-session] update error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Send notification to the student if assigned to a session
    if (sessionId) {
      try {
        await createNotification({
          userId: studentId,
          title: "Classe assignée !",
          message: `Vous avez été affecté à la classe "${sessionName}" pour le cours "${course.title}".`,
          type: "INFO",
          link: `/dashboard/courses/${courseId}`,
        });
      } catch (notifErr) {
        console.warn("[assign-session] notification warning:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: sessionId
        ? `L'apprenant a été affecté avec succès à "${sessionName}".`
        : "L'apprenant a été retiré de la session.",
      enrollment: updatedEnrollment,
    });
  } catch (err: any) {
    console.error("[assign-session] error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
