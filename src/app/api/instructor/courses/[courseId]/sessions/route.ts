import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    // type column not in DB yet, default to academic
  }

  return { ...course, type: courseType };
}

async function checkAccess(supabase: any, dbClient: any, userId: string, course: any) {
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin
      : supabase;

    const course = await resolveCourse(dbClient, courseId);
    if (!course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    const hasAccess = await checkAccess(supabase, dbClient, user.id, course);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé. Vous n'êtes pas le formateur de ce cours." }, { status: 403 });
    }

    // Fetch sessions safely
    let sessions: any[] = [];
    try {
      const { data: sessData } = await (dbClient
        .from("course_sessions" as any) as any)
        .select("*")
        .eq("course_id", course.id)
        .order("start_date", { ascending: true, nullsFirst: false });
      if (sessData) sessions = sessData;
    } catch {
      sessions = [];
    }

    // Fetch student counts per session safely
    let enrollments: any[] = [];
    try {
      const { data: enrData, error: enrErr } = await (dbClient
        .from("enrollments" as any) as any)
        .select("session_id, id")
        .eq("course_id", course.id);
      if (!enrErr && enrData) enrollments = enrData;
    } catch {
      enrollments = [];
    }

    const countMap = new Map<string, number>();
    let unassignedCount = 0;

    enrollments?.forEach((e: any) => {
      if (e.session_id) {
        countMap.set(e.session_id, (countMap.get(e.session_id) || 0) + 1);
      } else {
        unassignedCount++;
      }
    });

    const enrichedSessions = (sessions || []).map((s: any) => ({
      id: s.id,
      courseId: s.course_id,
      name: s.name,
      startDate: s.start_date,
      endDate: s.end_date,
      status: s.status,
      maxCapacity: s.max_capacity,
      isDefault: s.is_default || false,
      createdAt: s.created_at,
      studentsCount: countMap.get(s.id) || 0,
    }));

    return NextResponse.json({
      sessions: enrichedSessions,
      unassignedStudentsCount: unassignedCount,
      totalCourseStudents: enrollments?.length || 0,
      courseType: course.type || "academic",
    });
  } catch (err: any) {
    console.error("[sessions GET] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin
      : supabase;

    const course = await resolveCourse(dbClient, courseId);
    if (!course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (course.type === "self_paced") {
      return NextResponse.json(
        { error: "Les sessions/classes ne s'appliquent pas aux cours en autonomie (self_paced)." },
        { status: 400 }
      );
    }

    const hasAccess = await checkAccess(supabase, dbClient, user.id, course);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const body = await req.json();
    const { name, startDate, endDate, status, maxCapacity, isDefault } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Le nom de la classe/session est obligatoire." }, { status: 400 });
    }

    // If isDefault is true, set others for this course to false
    if (isDefault) {
      try {
        await (dbClient.from("course_sessions" as any) as any)
          .update({ is_default: false })
          .eq("course_id", course.id);
      } catch (e) {
        console.warn("[sessions POST] update default warning:", e);
      }
    }

    const sessionStatus = status || "UPCOMING";

    const { data: newSession, error: insertErr } = await (dbClient
      .from("course_sessions" as any) as any)
      .insert({
        course_id: course.id,
        name: name.trim(),
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        status: sessionStatus,
        max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
        is_default: !!isDefault,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[sessions POST] insert error:", insertErr);
      if (insertErr.message?.includes("does not exist") || (insertErr as any).code === "42P01") {
        return NextResponse.json({
          error: "La table 'course_sessions' n'est pas encore créée en base. Veuillez exécuter le script prisma/add-course-sessions.sql dans Supabase SQL Editor."
        }, { status: 400 });
      }
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Session créée avec succès.",
      session: newSession,
    });
  } catch (err: any) {
    console.error("[sessions POST] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
