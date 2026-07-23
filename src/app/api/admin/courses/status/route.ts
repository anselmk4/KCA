import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  try {
    const { courseId, nextStatus, feedbackReason } = await req.json();

    if (!courseId || !nextStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch course details
    const { data: course, error: fetchErr } = await supabaseAdmin
      .from("courses")
      .select("id, title, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (fetchErr || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 2. Update status in database
    const { error: updateErr } = await supabaseAdmin
      .from("courses")
      .update({ status: nextStatus })
      .eq("id", courseId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. Trigger Notification and Email
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
