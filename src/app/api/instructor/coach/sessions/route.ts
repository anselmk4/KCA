import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createNotification } from "@/lib/supabase/notifications-helper";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/instructor/coach/sessions
 * Returns real confirmed coaching & visio sessions for instructor.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ sessions: [] }, { status: 401 });
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    // Fetch live_sessions authored by instructor where allowed_user_ids is not empty or sessionType is coaching
    const { data: sessionsData } = await dbClient
      .from("live_sessions")
      .select("*")
      .eq("instructor_id", user.id)
      .order("scheduled_at", { ascending: true });

    // Fetch coaching requests for instructor
    const { data: coachReqs } = await dbClient
      .from("coaching_requests")
      .select("*")
      .or(`instructor_id.eq.${user.id},instructor_id.is.null`)
      .order("created_at", { ascending: false });

    // Gather student IDs to fetch profile names
    const studentIds = Array.from(new Set([
      ...(sessionsData || []).flatMap((s: any) => s.allowed_user_ids || []),
      ...(coachReqs || []).map((c: any) => c.student_id)
    ].filter(Boolean)));

    let studentMap: Record<string, { name: string; email: string }> = {};
    if (studentIds.length > 0) {
      const { data: profiles } = await dbClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", studentIds);

      profiles?.forEach((p: any) => {
        studentMap[p.id] = {
          name: p.full_name || p.email || "Apprenant Kuettu",
          email: p.email || ""
        };
      });
    }

    const formattedSessions: any[] = [];

    // 1. Add coaching requests
    (coachReqs || []).forEach((c: any) => {
      const student = studentMap[c.student_id] || { name: c.student_name || "Apprenant Kuettu", email: c.student_email || "" };
      formattedSessions.push({
        id: c.id,
        studentName: student.name,
        studentEmail: student.email,
        courseTitle: c.course_title || "Mentorat Général",
        date: c.scheduled_at 
          ? new Date(c.scheduled_at).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
          : `Créneau souhaité : ${c.preferred_time || "A définir"}`,
        time: c.scheduled_at ? new Date(c.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "A définir",
        durationMin: 45,
        videoPlatform: "ANSELLA_LIVE",
        meetingUrl: c.scheduled_at ? `https://meet.jit.si/ansella-live-coaching-${c.id.slice(0, 8)}` : "",
        status: c.status === "SCHEDULED" ? "CONFIRMED" : c.status === "COMPLETED" ? "COMPLETED" : "PENDING",
      });
    });

    // 2. Add live_sessions
    (sessionsData || []).forEach((s: any) => {
      const targetStudentId = s.allowed_user_ids?.[0];
      const student = targetStudentId ? studentMap[targetStudentId] : null;

      formattedSessions.push({
        id: s.id,
        studentName: student?.name || (s.is_public ? "Session Publique" : "Participants Invités"),
        studentEmail: student?.email || "",
        courseTitle: s.title,
        date: new Date(s.scheduled_at).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        time: `${s.duration_minutes || 60} min`,
        durationMin: s.duration_minutes || 60,
        videoPlatform: s.meeting_provider || "ANSELLA_LIVE",
        meetingUrl: s.meeting_url || "",
        status: "CONFIRMED",
      });
    });

    return NextResponse.json({ sessions: formattedSessions });

  } catch (err: any) {
    console.error("[GET /api/instructor/coach/sessions] Error:", err);
    return NextResponse.json({ sessions: [] });
  }
}

/**
 * POST /api/instructor/coach/sessions
 * Creates a new coaching slot in DB and notifies target student if provided.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { title, scheduledAt, durationMin, meetingUrl, videoPlatform, studentId } = body;

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;
    const sessionId = crypto.randomUUID();

    let finalMeetingUrl = meetingUrl?.trim() || "";
    if (videoPlatform === "ANSELLA_LIVE" || !finalMeetingUrl) {
      finalMeetingUrl = `https://meet.jit.si/ansella-live-${sessionId}`;
    }

    const newSession = {
      id: sessionId,
      title: title || "Session de Coaching Individuel",
      description: "[COACHING] Séance de coaching créée par l'instructeur",
      scheduled_at: new Date(scheduledAt || Date.now() + 86400000).toISOString(),
      duration_minutes: Number(durationMin) || 45,
      meeting_provider: videoPlatform || "ANSELLA_LIVE",
      meeting_url: finalMeetingUrl,
      is_public: false,
      instructor_id: user.id,
      allowed_user_ids: studentId ? [studentId] : [],
    };

    const { data, error } = await dbClient
      .from("live_sessions")
      .insert(newSession as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (studentId) {
      await createNotification({
        userId: studentId,
        title: "🤝 Nouveau Créneau de Coaching Disponible",
        message: `Votre formateur a ouvert un nouveau créneau de coaching visio.`,
        type: "INFO",
        link: "/dashboard/coaching"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Créneau de coaching créé avec succès.",
      session: data,
    }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/instructor/coach/sessions] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
