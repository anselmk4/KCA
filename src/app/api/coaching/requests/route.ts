import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/supabase/notifications-helper";

/**
 * GET /api/coaching/requests
 * Returns all coaching requests for the user (student or instructor/admin).
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ requests: [] }, { status: 401 });
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    // Check user roles
    const { data: userRoles } = await dbClient
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isInstructorOrAdmin = roles.some((r: string) =>
      ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "TEACHING_ASSISTANT"].includes(r)
    );

    let query = (dbClient as any).from("coaching_requests").select("*");

    if (isInstructorOrAdmin) {
      // Instructors see requests assigned to them or unassigned requests
      query = query.or(`instructor_id.eq.${user.id},instructor_id.is.null`);
    } else {
      // Students see only their own requests
      query = query.eq("student_id", user.id);
    }

    const { data: dbRequests, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/coaching/requests] DB query error:", error.message);
      return NextResponse.json({ requests: [] });
    }

    const formatted = (dbRequests || []).map((r: any) => ({
      id: r.id,
      studentId: r.student_id,
      instructorId: r.instructor_id,
      studentName: r.student_name || "Apprenant Kuettu",
      studentEmail: r.student_email || "",
      courseId: r.course_id,
      courseTitle: r.course_title || "Mentorat Général",
      subject: r.subject,
      message: r.message,
      preferredTime: r.preferred_time || "Dès que possible",
      scheduledAt: r.scheduled_at,
      status: r.status || "PENDING",
      createdAt: r.created_at,
      reply: r.reply || null,
      repliedAt: r.replied_at || null,
    }));

    return NextResponse.json({ requests: formatted });

  } catch (err: any) {
    console.error("[GET /api/coaching/requests] Error:", err);
    return NextResponse.json({ requests: [], error: err.message });
  }
}

/**
 * POST /api/coaching/requests
 * Creates a new coaching request submitted by a student.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { courseId, courseTitle, instructorId, subject, message, preferredTime } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Le sujet et le message détaillant votre besoin sont requis." },
        { status: 400 }
      );
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    let studentName = "Apprenant Kuettu";
    let studentEmail = "apprenant@kuettu.com";
    let studentId = user?.id || "student_" + Date.now();

    if (user) {
      const { data: profile } = await dbClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        studentName = profile.full_name || studentName;
        studentEmail = profile.email || studentEmail;
      }
    }

    const newReqData = {
      student_id: studentId,
      instructor_id: instructorId || null,
      student_name: studentName,
      student_email: studentEmail,
      course_id: courseId || null,
      course_title: courseTitle || "Mentorat Général",
      subject: subject.trim(),
      message: message.trim(),
      preferred_time: preferredTime?.trim() || "Dès que possible",
      status: "PENDING",
    };

    const { data: createdReq, error } = await (dbClient as any)
      .from("coaching_requests")
      .insert(newReqData)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/coaching/requests] Insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Notify instructor or admins
    if (instructorId) {
      await createNotification({
        userId: instructorId,
        title: "📥 Nouvelle Demande de Coaching 1-on-1",
        message: `${studentName} vous a sollicité pour un coaching : "${subject.trim()}".`,
        type: "INFO",
        link: "/instructor/coach"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Votre demande de coaching 1-on-1 a été transmise avec succès à votre formateur.",
      request: createdReq,
    }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/coaching/requests] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

/**
 * PATCH /api/coaching/requests
 * Updates a request: Reply, Schedule date/time, or Status update by Instructor or Student.
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, reply, status, scheduledAt, message } = body;

    if (!requestId) {
      return NextResponse.json({ error: "L'identifiant de la demande (requestId) est requis." }, { status: 400 });
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    // Fetch existing request
    const { data: existingReq, error: fetchErr } = await (dbClient as any)
      .from("coaching_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchErr || !existingReq) {
      return NextResponse.json({ error: "Demande de coaching introuvable." }, { status: 404 });
    }

    // Check sender identity (Instructor vs Student)
    const isStudent = existingReq.student_id === user.id;

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (reply !== undefined) {
      updatePayload.reply = reply.trim();
      updatePayload.replied_at = new Date().toISOString();
      updatePayload.replied_by = user.id;
      updatePayload.status = status || "REPLIED";
    }

    if (status) {
      updatePayload.status = status;
    }

    if (scheduledAt) {
      updatePayload.scheduled_at = new Date(scheduledAt).toISOString();
      updatePayload.status = "SCHEDULED";
    }

    if (message && isStudent) {
      // Student appended a message/response
      updatePayload.message = `${existingReq.message}\n\n[Mise à jour Apprenant] ${message.trim()}`;
    }

    const { data: updatedReq, error: updateErr } = await (dbClient as any)
      .from("coaching_requests")
      .update(updatePayload)
      .eq("id", requestId)
      .select()
      .single();

    if (updateErr) {
      console.error("[PATCH /api/coaching/requests] Update error:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Also sync with live_sessions if scheduledAt was set
    if (scheduledAt) {
      const sessionId = crypto.randomUUID();
      const meetingUrl = `https://meet.jit.si/ansella-live-coaching-${sessionId.slice(0, 8)}`;

      await (dbClient as any).from("live_sessions").insert({
        id: sessionId,
        title: `Coaching 1-on-1 : ${existingReq.subject}`,
        description: `[COACHING] Séance de coaching individuel avec ${existingReq.student_name}. ${existingReq.message}`,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: 45,
        meeting_provider: "ANSELLA_LIVE",
        meeting_url: meetingUrl,
        is_public: false,
        instructor_id: existingReq.instructor_id || user.id,
        allowed_user_ids: [existingReq.student_id],
        course_id: existingReq.course_id || null
      });
    }

    // Trigger Notifications
    if (isStudent) {
      // Notify instructor
      const recipientId = existingReq.instructor_id;
      if (recipientId) {
        await createNotification({
          userId: recipientId,
          title: "💬 Message de l'apprenant pour le coaching",
          message: `${existingReq.student_name} a répondu pour la séance : "${existingReq.subject}".`,
          type: "INFO",
          link: "/instructor/coach"
        });
      }
    } else {
      // Notify student
      const notificationTitle = scheduledAt
        ? "📅 Séance de coaching 1-on-1 programmée !"
        : "💬 Réponse à votre demande de coaching";

      const notificationMsg = scheduledAt
        ? `Votre séance "${existingReq.subject}" a été programmée pour le ${new Date(scheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.`
        : `Votre formateur a répondu à votre demande : "${existingReq.subject}".`;

      await createNotification({
        userId: existingReq.student_id,
        title: notificationTitle,
        message: notificationMsg,
        type: "SUCCESS",
        link: "/dashboard/coaching"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Mise à jour enregistrée avec succès.",
      request: updatedReq
    });

  } catch (err: any) {
    console.error("[PATCH /api/coaching/requests] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
