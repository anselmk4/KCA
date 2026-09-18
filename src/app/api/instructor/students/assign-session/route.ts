import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/supabase/notifications-helper";

async function resolveCourse(dbClient: any, courseIdentifier: string) {
  const rawId = courseIdentifier || "";
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch {
    // keep rawId
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

  let course: any = null;
  if (isUuid) {
    try {
      const { data } = await (dbClient.from("courses" as any) as any)
        .select("id, title, instructor_id")
        .eq("id", rawId)
        .maybeSingle();
      course = data;
    } catch (e) {
      console.warn("[resolveCourse] UUID query error:", e);
    }
  }

  if (!course) {
    try {
      const { data } = await (dbClient.from("courses" as any) as any)
        .select("id, title, instructor_id")
        .eq("slug", decodedId)
        .maybeSingle();
      course = data;
    } catch {
      // ignore
    }
  }

  if (!course && decodedId !== rawId) {
    try {
      const { data } = await (dbClient.from("courses" as any) as any)
        .select("id, title, instructor_id")
        .eq("slug", rawId)
        .maybeSingle();
      course = data;
    } catch {
      // ignore
    }
  }

  // Fallback: search by title
  if (!course) {
    try {
      const { data } = await (dbClient.from("courses" as any) as any)
        .select("id, title, instructor_id")
        .ilike("title", decodedId)
        .maybeSingle();
      course = data;
    } catch {
      // ignore
    }
  }

  if (!course) return null;

  let courseType = "academic";
  try {
    const { data: tData, error: tErr } = await (dbClient.from("courses" as any) as any)
      .select("type")
      .eq("id", course.id)
      .maybeSingle();
    if (!tErr && tData?.type) {
      courseType = tData.type;
    }
  } catch {
    // type column absent
  }

  return { ...course, type: courseType };
}

async function checkAccess(supabase: any, dbClient: any, userId: string, course: any) {
  const { data: userRoles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", userId);
  const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
  const isOwnerOrAdmin = course.instructor_id === userId || roles.some((r: any) => ["SUPER_ADMIN", "ADMIN", "ACADEMIC_ADMIN"].includes(r));
  if (isOwnerOrAdmin) return true;

  const { data: collab } = await (dbClient.from("course_collaborators" as any) as any)
    .select("id")
    .eq("course_id", course.id)
    .eq("collaborator_id", userId)
    .maybeSingle();
  return !!collab;
}

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

    const course = await resolveCourse(dbClient, courseId);
    if (!course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (course.type === "self_paced") {
      return NextResponse.json(
        { error: "Ce cours est en autonomie (self_paced) et ne supporte pas l'affectation à des sessions." },
        { status: 400 }
      );
    }

    const hasAccess = await checkAccess(supabase, dbClient, user.id, course);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé. Vous n'êtes pas le formateur de ce cours." }, { status: 403 });
    }

    let sessionName = "Non assigné";
    if (sessionId) {
      const { data: session, error: sessErr } = await (dbClient
        .from("course_sessions" as any) as any)
        .select("id, name, course_id, start_date")
        .eq("id", sessionId)
        .maybeSingle();

      if (sessErr || !session || session.course_id !== course.id) {
        return NextResponse.json({ error: "Session introuvable pour ce cours." }, { status: 404 });
      }
      sessionName = session.name;
    }

    // Update enrollment using actual course UUID
    const { data: updatedEnrollment, error: updateErr } = await (dbClient
      .from("enrollments" as any) as any)
      .update({ session_id: sessionId || null })
      .eq("student_id", studentId)
      .eq("course_id", course.id)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error("[assign-session] update error:", updateErr);
      if (updateErr.message?.includes("session_id")) {
        return NextResponse.json({
          error: "La colonne 'session_id' n'est pas encore ajoutée à la table enrollments. Veuillez exécuter le script prisma/add-course-sessions.sql dans Supabase SQL Editor."
        }, { status: 400 });
      }
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    if (!updatedEnrollment) {
      const { data: existingEnr } = await (dbClient.from("enrollments" as any) as any)
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", course.id)
        .maybeSingle();

      if (!existingEnr) {
        return NextResponse.json({
          error: "Inscription introuvable pour cet apprenant dans ce cours."
        }, { status: 404 });
      }
    }

    // Send notification to the student if assigned to a session
    if (sessionId) {
      try {
        await createNotification({
          userId: studentId,
          title: "Classe assignée !",
          message: `Vous avez été affecté à la classe "${sessionName}" pour le cours "${course.title}".`,
          type: "INFO",
          link: `/dashboard/courses/${course.id}`,
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
