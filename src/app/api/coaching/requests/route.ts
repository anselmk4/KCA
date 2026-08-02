import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createNotification } from "@/lib/supabase/notifications-helper";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// In-memory fallback store for requests when DB table isn't present
let inMemoryRequests: any[] = [
  {
    id: "req_demo_1",
    studentId: "demo_student",
    studentName: "Alexandre Martin",
    studentEmail: "alexandre.martin@email.com",
    courseId: "course_1",
    courseTitle: "Masterclass IA & Web3 Automation",
    subject: "Aide sur le Déploiement d'un Smart Contract Solidity",
    message: "Bonjour, j'aimerais qu'on revoie ensemble la compilation et le déploiement sur le testnet Sepolia car je rencontre une erreur de nonce.",
    preferredTime: "Semaine prochaine, après-midi",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  }
];

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ requests: inMemoryRequests });
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    // Check user role
    const { data: userRoles } = await dbClient
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isInstructorOrAdmin = roles.some((r: string) =>
      ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "TEACHING_ASSISTANT"].includes(r)
    );

    // Try fetching from DB if coaching_requests table exists
    const { data: dbRequests, error } = await (dbClient as any)
      .from("coaching_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbRequests) {
      const filtered = isInstructorOrAdmin
        ? dbRequests
        : dbRequests.filter((r: any) => r.student_id === user.id);
      
      const formatted = filtered.map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        studentEmail: r.student_email,
        courseId: r.course_id,
        courseTitle: r.course_title,
        subject: r.subject,
        message: r.message,
        preferredTime: r.preferred_time,
        status: r.status || "PENDING",
        createdAt: r.created_at,
        reply: r.reply,
      }));

      return NextResponse.json({ requests: formatted });
    }

    // Fallback to inMemoryRequests
    const filteredMemory = isInstructorOrAdmin
      ? inMemoryRequests
      : inMemoryRequests.filter((r) => r.studentId === user.id || r.studentId === "demo_student");

    return NextResponse.json({ requests: filteredMemory });

  } catch (err: any) {
    console.error("[GET /api/coaching/requests] Error:", err);
    return NextResponse.json({ requests: inMemoryRequests });
  }
}

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

    const requestId = "req_" + Date.now().toString(36);
    const newReq = {
      id: requestId,
      studentId: studentId,
      studentName,
      studentEmail,
      courseId: courseId || null,
      courseTitle: courseTitle || "Mentorat Général",
      subject: subject.trim(),
      message: message.trim(),
      preferredTime: preferredTime?.trim() || "Dès que possible",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    // Store in DB if table available
    try {
      await (dbClient as any).from("coaching_requests").insert({
        id: requestId,
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        course_id: courseId || null,
        course_title: courseTitle || "Mentorat Général",
        subject: subject.trim(),
        message: message.trim(),
        preferred_time: preferredTime?.trim() || "Dès que possible",
        status: "PENDING",
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("DB insert for coaching_requests skipped:", dbErr);
    }

    // Always push to inMemoryRequests fallback
    inMemoryRequests.unshift(newReq);

    // Send notification to target instructor or super admins
    if (instructorId) {
      await createNotification({
        userId: instructorId,
        title: "📥 Nouvelle Demande de Coaching 1-on-1",
        message: `${studentName} sollicite une séance de coaching 1-on-1 : "${subject.trim()}".`,
        type: "INFO",
        link: "/instructor/coach"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Votre demande de coaching 1-on-1 a été transmise avec succès à votre formateur.",
      request: newReq,
    }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/coaching/requests] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
