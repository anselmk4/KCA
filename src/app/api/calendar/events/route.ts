import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createNotification } from "@/lib/supabase/notifications-helper";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/calendar/events
 * Returns scheduled Live Sessions and 1-on-1 Coaching events for current user.
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

    let events: any[] = [];

    if (isInstructorOrAdmin) {
      // Instructor/Admin: Fetch all events authored by this user
      const { data: authoredEvents, error } = await dbClient
        .from("live_sessions")
        .select(`
          *,
          courses (id, title)
        `)
        .eq("instructor_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (!error && authoredEvents) {
        events = authoredEvents;
      }
    } else {
      // Student: Fetch 1. Public events, 2. Events where allowed_user_ids contains user.id, 3. Events linked to enrolled courses
      const { data: enrollments } = await dbClient
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id)
        .eq("status", "ACTIVE");

      const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

      const { data: allSessions, error } = await dbClient
        .from("live_sessions")
        .select(`
          *,
          courses (id, title)
        `)
        .order("scheduled_at", { ascending: true });

      if (!error && allSessions) {
        events = allSessions.filter((s: any) => {
          // Public session
          if (s.is_public) return true;
          // Target student in allowed_user_ids
          if (Array.isArray(s.allowed_user_ids) && s.allowed_user_ids.includes(user.id)) return true;
          // Linked to enrolled course
          if (s.course_id && enrolledCourseIds.includes(s.course_id)) return true;
          return false;
        });
      }
    }

    // Fetch instructor names for display
    const instructorIds = Array.from(new Set(events.map(e => e.instructor_id).filter(Boolean)));
    let hostMap: Record<string, string> = {};

    if (instructorIds.length > 0) {
      const { data: profiles } = await dbClient
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);

      profiles?.forEach(p => {
        hostMap[p.id] = p.full_name || "Formateur";
      });
    }

    const formattedEvents = events.map(e => {
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

    return NextResponse.json({ events: formattedEvents }, { status: 200 });

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
      sessionType, // "LIVE_SESSION" | "COACHING_1ON1"
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

    // Determine meeting link
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

    // Send notifications to selected student(s)
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
