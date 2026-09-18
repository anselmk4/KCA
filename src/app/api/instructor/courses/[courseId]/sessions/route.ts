import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    // Check course existence & access
    const { data: course, error: courseErr } = await (dbClient
      .from("courses" as any) as any)
      .select("id, title, type, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    // Check roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);
    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isOwnerOrAdmin = course.instructor_id === user.id || roles.some(r => ["SUPER_ADMIN", "ADMIN", "ACADEMIC_ADMIN"].includes(r));

    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: "Accès refusé. Vous n'êtes pas le formateur de ce cours." }, { status: 403 });
    }

    // Fetch sessions
    const { data: sessions, error: sessionsErr } = await (dbClient
      .from("course_sessions" as any) as any)
      .select("*")
      .eq("course_id", courseId)
      .order("start_date", { ascending: true, nullsFirst: false });

    if (sessionsErr) {
      console.error("[sessions GET] error:", sessionsErr);
      return NextResponse.json({ error: sessionsErr.message }, { status: 400 });
    }

    // Fetch student counts per session
    const { data: enrollments } = await (dbClient
      .from("enrollments" as any) as any)
      .select("session_id, id")
      .eq("course_id", courseId);

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

    // Check course existence
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
        { error: "Les sessions/classes ne s'appliquent pas aux cours en autonomie (self_paced)." },
        { status: 400 }
      );
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);
    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isOwnerOrAdmin = course.instructor_id === user.id || roles.some(r => ["SUPER_ADMIN", "ADMIN", "ACADEMIC_ADMIN"].includes(r));

    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const body = await req.json();
    const { name, startDate, endDate, status, maxCapacity, isDefault } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Le nom de la classe/session est obligatoire." }, { status: 400 });
    }

    // If isDefault is true, set others for this course to false
    if (isDefault) {
      await (dbClient.from("course_sessions" as any) as any)
        .update({ is_default: false })
        .eq("course_id", courseId);
    }

    const sessionStatus = status || "UPCOMING";

    const { data: newSession, error: insertErr } = await (dbClient
      .from("course_sessions" as any) as any)
      .insert({
        course_id: courseId,
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
