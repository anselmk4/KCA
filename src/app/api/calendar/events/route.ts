import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/supabase/notifications-helper";

/**
 * GET /api/calendar/events
 * Returns scheduled Live Sessions AND Coaching 1-on-1 events for current user.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    // Check user roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isInstructorOrAdmin = roles.some(r => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "TEACHING_ASSISTANT"].includes(r));

    let liveSessionsList: any[] = [];
    let coachingRequestsList: any[] = [];

    if (isInstructorOrAdmin) {
      // 1. Fetch live sessions authored by or assigned to instructor
      const { data: authoredEvents } = await dbClient
        .from("live_sessions")
        .select(`*, courses (id, title)`)
        .eq("instructor_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (authoredEvents) liveSessionsList = authoredEvents;

      // 2. Fetch scheduled coaching requests
      const { data: coachReqs } = await (dbClient
        .from("coaching_requests" as any)
        .select("*")
        .or(`instructor_id.eq.${user.id},instructor_id.is.null`)
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true }) as any);

      if (coachReqs) coachingRequestsList = coachReqs;

    } else {
      // Student: Fetch 1. Public events, 2. Events where allowed_user_ids contains user.id, 3. Enrolled courses
      const { data: enrollments } = await dbClient
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id)
        .eq("status", "ACTIVE");

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

      const { data: allSessions } = await dbClient
        .from("live_sessions")
        .select(`*, courses (id, title)`)
        .order("scheduled_at", { ascending: true });

      if (allSessions) {
        liveSessionsList = allSessions.filter((s: any) => {
          if (s.is_public) return true;
          if (Array.isArray(s.allowed_user_ids) && s.allowed_user_ids.includes(user.id)) return true;
          if (s.course_id && enrolledCourseIds.includes(s.course_id)) return true;
          return false;
        });
      }

      // Fetch scheduled coaching requests for student
      const { data: coachReqs } = await (dbClient
        .from("coaching_requests" as any)
        .select("*")
        .eq("student_id", user.id)
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true }) as any);

      if (coachReqs) coachingRequestsList = coachReqs;
    }

    // Resolve instructor names
    const allInstructorIds = Array.from(new Set([
      ...liveSessionsList.map(e => e.instructor_id),
      ...coachingRequestsList.map(c => c.instructor_id)
    ].filter(Boolean)));

    let hostMap: Record<string, string> = {};
    if (allInstructorIds.length > 0) {
      const { data: profiles } = await dbClient
        .from("profiles")
        .select("id, full_name")
        .in("id", allInstructorIds);

      profiles?.forEach(p => {
        hostMap[p.id] = p.full_name || "Formateur";
      });
    }

    // Format live_sessions events
    const formattedLive = liveSessionsList.map(e => {
      const isCoaching = (!e.is_public && Array.isArray(e.allowed_user_ids) && e.allowed_user_ids.length > 0) || e.description?.includes("[COACHING]");
      return {
        id: e.id,
        title: e.title,
        description: (e.description || "").replace("[COACHING]", "").trim(),
        scheduledAt: e.scheduled_at,
        durationMinutes: e.duration_minutes || 60,
        meetingProvider: e.meeting_provider || "ANSELLA_LIVE",
        meetingUrl: e.meeting_url || "",
        isPublic: e.is_public ?? true,
        instructorId: e.instructor_id,
        instructorName: hostMap[e.instructor_id] || "Formateur",
        allowedUserIds: e.allowed_user_ids || [],
        sessionType: isCoaching ? "COACHING_1ON1" : "LIVE_SESSION",
        courseId: e.course_id,
        courseTitle: e.courses?.title || null,
      };
    });

    // Format coaching_requests events (avoiding duplicate IDs if already converted to live_sessions)
    const existingLiveIds = new Set(liveSessionsList.map(l => l.id));
    const formattedCoaching = coachingRequestsList
      .filter(c => !existingLiveIds.has(c.id))
      .map(c => ({
        id: c.id,
        title: `Coaching 1-on-1 : ${c.subject}`,
        description: c.message,
        scheduledAt: c.scheduled_at,
        durationMinutes: 45,
        meetingProvider: "ANSELLA_LIVE",
        meetingUrl: `https://meet.jit.si/ansella-live-coaching-${c.id.slice(0, 8)}`,
        isPublic: false,
        instructorId: c.instructor_id,
        instructorName: hostMap[c.instructor_id] || "Formateur",
        allowedUserIds: [c.student_id],
        sessionType: "COACHING_1ON1",
        courseId: c.course_id,
        courseTitle: c.course_title,
      }));

    const events = [...formattedLive, ...formattedCoaching].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    return NextResponse.json({ events }, { status: 200 });

  } catch (err: any) {
    console.error("[GET /api/calendar/events] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

/**
 * POST /api/calendar/events
 * Schedules a new Live Session or Coaching 1-on-1 session.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      scheduledAt,
      durationMinutes,
      sessionType,
      courseId,
      allowedUserIds,
      meetingProvider,
      meetingUrl,
      isPublic
    } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: "Le titre et la date/heure de planification sont requis." }, { status: 400 });
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;
    const sessionId = crypto.randomUUID();

    let finalMeetingUrl = meetingUrl?.trim() || "";
    if (meetingProvider === "ANSELLA_LIVE" || !finalMeetingUrl) {
      finalMeetingUrl = `https://meet.jit.si/ansella-live-${sessionId}`;
    }

    const isPublicSession = sessionType === "COACHING_1ON1" ? false : Boolean(isPublic);
    const finalAllowedUsers = Array.isArray(allowedUserIds) ? allowedUserIds : [];
    
    const formattedDesc = sessionType === "COACHING_1ON1" 
      ? `[COACHING] ${description || ""}`.trim()
      : (description || "").trim();

    const newSession = {
      id: sessionId,
      title: title.trim(),
      description: formattedDesc || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: Number(durationMinutes) || 60,
      meeting_provider: meetingProvider || "ANSELLA_LIVE",
      meeting_url: finalMeetingUrl,
      is_public: isPublicSession,
      instructor_id: user.id,
      allowed_user_ids: isPublicSession ? [] : finalAllowedUsers,
      course_id: courseId || null,
    };

    const { data, error } = await dbClient
      .from("live_sessions")
      .insert(newSession as any)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/calendar/events] Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Send notifications to target student(s)
    if (finalAllowedUsers.length > 0) {
      for (const studentId of finalAllowedUsers) {
        await createNotification({
          userId: studentId,
          title: sessionType === "COACHING_1ON1" ? "🤝 Séance de Coaching 1-sur-1 programmée" : "📡 Session Live Privée programmée",
          message: `Votre séance "${title}" a été programmée pour le ${new Date(scheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.`,
          type: "INFO",
          link: "/dashboard/calendar"
        });
      }
    }

    return NextResponse.json({ success: true, event: data }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/calendar/events] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
