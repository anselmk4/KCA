import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/supabase/notifications-helper";

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, courseId, action, reason } = body;

    if (!studentId || !courseId || !action) {
      return NextResponse.json({ error: "studentId, courseId et action ('BLOCK' | 'UNBLOCK') sont requis." }, { status: 400 });
    }

    // Verify user role
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAdmin = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin
      : supabase;

    // Verify course belongs to this instructor (unless admin)
    const { data: course, error: courseErr } = await dbClient
      .from("courses")
      .select("id, title, instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (!isAdmin && course.instructor_id !== user.id) {
      return NextResponse.json({ error: "Vous n'êtes pas le formateur de ce cours." }, { status: 403 });
    }

    const nextStatus = action === "BLOCK" ? "SUSPENDED" : "ACTIVE";

    // Update enrollment status in database using service role client to bypass RLS
    const { error: updateErr } = await dbClient
      .from("enrollments")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq("student_id", studentId)
      .eq("course_id", courseId);

    if (updateErr) {
      console.error("[block-access] Error updating enrollment status:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Send in-app notification to student
    try {
      if (action === "BLOCK") {
        await createNotification({
          userId: studentId,
          title: "Accès au cours restreint 🔒",
          message: reason || `Votre accès au cours "${course.title}" a été temporairement suspendu en raison d'une tranche de paiement requise.`,
          type: "WARNING",
          link: `/dashboard/payments`
        });
      } else {
        await createNotification({
          userId: studentId,
          title: "Accès au cours rétabli ! 🎉",
          message: `Votre accès au cours "${course.title}" a été réactivé par votre formateur. Bonne continuation !`,
          type: "SUCCESS",
          link: `/dashboard/courses/${courseId}/learn`
        });
      }
    } catch (notifErr) {
      console.warn("[block-access] Notification error:", notifErr);
    }

    return NextResponse.json({
      success: true,
      newStatus: nextStatus,
      message: action === "BLOCK"
        ? `L'accès de l'étudiant au cours "${course.title}" a été suspendu.`
        : `L'accès de l'étudiant au cours "${course.title}" a été réactivé.`
    });
  } catch (err: any) {
    console.error("[API block-access] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
