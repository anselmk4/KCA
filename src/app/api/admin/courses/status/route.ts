import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendInstructorCourseValidatedEmail } from "@/lib/email";
import { createNotification } from "@/lib/supabase/notifications-helper";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const MODERATION_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "ACADEMIC_ADMIN"];

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate caller
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Check Admin / Moderation Permissions
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("roles!inner(name)")
      .eq("user_id", user.id) as any;

    const roleNames: string[] = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);
    const hasModRole = roleNames.some(r => MODERATION_ROLES.includes(r));

    if (!hasModRole) {
      return NextResponse.json({ error: "Accès refusé. Rôle d'administration requis pour modifier le statut du cours." }, { status: 403 });
    }

    const { courseId, nextStatus, feedbackReason } = await req.json();

    if (!courseId || !nextStatus) {
      return NextResponse.json({ error: "courseId et nextStatus requis" }, { status: 400 });
    }

    // 3. Fetch course details
    const { data: course, error: fetchErr } = await supabaseAdmin
      .from("courses")
      .select("id, title, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (fetchErr || !course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    // 4. Update status in database
    const { error: updateErr } = await supabaseAdmin
      .from("courses")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", courseId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 5. Trigger Notification and Email
    if (course.instructor_id) {
      let notifTitle = "";
      let notifMessage = "";
      let notifType: "SUCCESS" | "WARNING" | "INFO" = "INFO";

      if (nextStatus === 'PUBLISHED') {
        notifTitle = "Cours validé & publié ! 🚀";
        notifMessage = `Votre cours "${course.title}" a été approuvé et mis en ligne.`;
        notifType = "SUCCESS";
      } else if (nextStatus === 'ARCHIVED') {
        notifTitle = "Cours archivé";
        notifMessage = `Votre cours "${course.title}" a été archivé par l'administration.`;
        notifType = "WARNING";
      } else if (nextStatus === 'DRAFT') {
        notifTitle = "Modifications requises pour votre cours";
        notifMessage = feedbackReason
          ? `Votre cours "${course.title}" nécessite des révisions : "${feedbackReason}"`
          : `Votre cours "${course.title}" a été renvoyé en brouillon pour révision.`;
        notifType = "WARNING";
      }

      if (notifTitle) {
        await createNotification({
          userId: course.instructor_id,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          link: `/instructor/courses`
        });
      }

      // Fetch instructor email & profile
      const { data: instructorProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", course.instructor_id)
        .maybeSingle();

      if (instructorProfile?.email) {
        if (nextStatus === 'PUBLISHED') {
          await sendInstructorCourseValidatedEmail(
            instructorProfile.email,
            instructorProfile.full_name || "Formateur",
            course.title
          );
        } else if (nextStatus === 'DRAFT' && feedbackReason) {
          const { sendInstructorCourseRejectedEmail } = await import("@/lib/email");
          await sendInstructorCourseRejectedEmail(
            instructorProfile.email,
            instructorProfile.full_name || "Formateur",
            course.title,
            feedbackReason
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[course-status API] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
