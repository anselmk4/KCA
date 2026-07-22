import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

// Initialize a service role client to bypass RLS when querying student payment info (if key is set)
const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Verify user role
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));
    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Rôle insuffisant." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // Choose client
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // Get instructor's courses
    const { data: courses, error: coursesError } = await dbClient
      .from("courses")
      .select("id, title, slug, price")
      .eq("instructor_id", user.id);

    if (coursesError) {
      console.error("[students-api] error fetching instructor courses:", coursesError);
      return NextResponse.json({ error: coursesError.message }, { status: 400 });
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json(studentId ? { error: "Aucun cours trouvé pour ce formateur." } : { enrollments: [] });
    }

    const courseIds = courses.map(c => c.id);
    const courseMap = new Map(courses.map(c => [c.id, c]));

    // --- BEHAVIOR 1: Single Student Detail ---
    if (studentId) {
      // Get student profile
      const { data: profile } = await dbClient
        .from("profiles")
        .select("id, full_name, email, plan, created_at")
        .eq("id", studentId)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json({ error: "Étudiant introuvable." }, { status: 404 });
      }

      // Get enrollments for this student in instructor's courses
      const { data: enrollments } = await dbClient
        .from("enrollments")
        .select("id, course_id, progress_percent, status, enrolled_at")
        .eq("student_id", studentId)
        .in("course_id", courseIds);

      if (!enrollments || enrollments.length === 0) {
        return NextResponse.json({
          id: studentId,
          name: profile.full_name,
          email: profile.email,
          plan: profile.plan || "FREE",
          joinedAt: profile.created_at,
          courses: []
        });
      }

      const enrolledCourseIds = enrollments.map(e => e.course_id);

      // Get sections for those courses
      const { data: sections } = await dbClient
        .from("course_sections")
        .select("id, course_id")
        .in("course_id", enrolledCourseIds);
      const sectionIds = sections?.map(s => s.id) || [];
      const sectionCourseMap = new Map(sections?.map(s => [s.id, s.course_id]) || []);

      // Get lessons for those sections
      const { data: lessons } = await dbClient
        .from("lessons")
        .select("id, section_id")
        .in("section_id", sectionIds);

      // Lesson count per course
      const lessonCountByCourse = new Map<string, number>();
      lessons?.forEach(l => {
        const cId = sectionCourseMap.get(l.section_id);
        if (cId) lessonCountByCourse.set(cId, (lessonCountByCourse.get(cId) || 0) + 1);
      });

      // Get completed lessons progress
      const enrollmentIds = enrollments.map(e => e.id);
      const completedLessonIds = new Set<string>();

      if (enrollmentIds.length > 0) {
        const { data: lessonProgress } = await dbClient
          .from("lesson_progress")
          .select("lesson_id, completed")
          .in("enrollment_id", enrollmentIds)
          .eq("completed", true);
        lessonProgress?.forEach(lp => { if (lp.lesson_id) completedLessonIds.add(lp.lesson_id); });
      }

      // Completed count per course
      const completedByCourse = new Map<string, number>();
      lessons?.forEach(l => {
        if (completedLessonIds.has(l.id)) {
          const cId = sectionCourseMap.get(l.section_id);
          if (cId) completedByCourse.set(cId, (completedByCourse.get(cId) || 0) + 1);
        }
      });

      // Get payments for those courses
      const { data: orderItems } = await dbClient
        .from("order_items")
        .select("order_id, course_id")
        .in("course_id", enrolledCourseIds);
      const orderItemCourseMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);
      const orderIds = orderItems?.map(oi => oi.order_id) || [];

      const payDataByCourse = new Map<string, { status: string; amount: number; date: string | null }>();

      // 1. Check for any PAID payments for this student
      const { data: paidUserPayments } = await dbClient
        .from("payments")
        .select("order_id, status, amount, paid_at, created_at, method")
        .eq("user_id", studentId)
        .eq("status", "PAID");

      paidUserPayments?.forEach(p => {
        const methodParts = (p.method || "").split("::");
        const cId = methodParts[2] || (p.order_id ? orderItemCourseMap.get(p.order_id) : null);
        if (cId) {
          payDataByCourse.set(cId, { status: "PAID", amount: p.amount, date: p.paid_at || p.created_at });
        }
      });

      // 2. Fallback to order items payments if no PAID record found
      if (orderIds.length > 0) {
        const { data: payments } = await dbClient
          .from("payments")
          .select("order_id, status, amount, paid_at, created_at, method")
          .eq("user_id", studentId)
          .in("order_id", orderIds);
        payments?.forEach(p => {
          const methodParts = (p.method || "").split("::");
          const cId = methodParts[2] || orderItemCourseMap.get(p.order_id);
          if (cId) {
            const existing = payDataByCourse.get(cId);
            if (!existing || p.status === "PAID") {
              payDataByCourse.set(cId, { status: p.status, amount: p.amount, date: p.paid_at || p.created_at });
            }
          }
        });
      }

      // Get certificates
      const { data: certs } = await dbClient
        .from("certificates")
        .select("course_id, issued_at")
        .eq("student_id", studentId)
        .in("course_id", enrolledCourseIds);
      const certMap = new Map(certs?.map(c => [c.course_id, c.issued_at]) || []);

      // Assemble course details
      const courseDetails = enrollments.map(e => {
        const course = courseMap.get(e.course_id);
        const pay = payDataByCourse.get(e.course_id);
        const certDate = certMap.get(e.course_id) || null;
        return {
          courseId: e.course_id,
          courseTitle: course?.title || "Cours",
          courseSlug: course?.slug || "",
          coursePrice: course?.price || 0,
          enrollmentStatus: e.status || "ACTIVE",
          enrolledAt: e.enrolled_at,
          progressPercent: e.progress_percent || 0,
          totalLessons: lessonCountByCourse.get(e.course_id) || 0,
          completedLessons: completedByCourse.get(e.course_id) || 0,
          paymentStatus: pay?.status || "none",
          paymentAmount: pay?.amount || 0,
          paymentDate: pay?.date || null,
          hasCertificate: certDate !== null,
          certificateDate: certDate,
        };
      });

      return NextResponse.json({
        id: studentId,
        name: profile.full_name,
        email: profile.email,
        plan: profile.plan || "FREE",
        joinedAt: profile.created_at,
        courses: courseDetails
      });
    }

    // --- BEHAVIOR 2: All Students List ---
    // Get enrollments for those courses
    const { data: enrData, error: enrError } = await dbClient
      .from("enrollments")
      .select("id, student_id, course_id, progress_percent, status, enrolled_at")
      .in("course_id", courseIds);

    if (enrError) {
      console.error("[students-api] error fetching enrollments:", enrError);
      return NextResponse.json({ error: enrError.message }, { status: 400 });
    }

    if (!enrData || enrData.length === 0) {
      return NextResponse.json({ enrollments: [] });
    }

    const studentIds = [...new Set(enrData.map(e => e.student_id))];

    // Get student profiles
    const { data: profiles } = await dbClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get orders & payments for those courses
    const { data: orderItems } = await dbClient
      .from("order_items")
      .select("order_id, course_id")
      .in("course_id", courseIds);
    const orderIds = orderItems?.map(oi => oi.order_id) || [];
    const orderItemMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);

    let paymentMap = new Map<string, { status: string; amount: number; userId: string }>();

    // 1. Fetch all PAID payments for these students to ensure PAID status takes priority over any failed attempts
    if (studentIds.length > 0) {
      const { data: paidPayments } = await dbClient
        .from("payments")
        .select("order_id, status, amount, user_id, method")
        .in("user_id", studentIds)
        .eq("status", "PAID");

      paidPayments?.forEach(p => {
        const methodParts = (p.method || "").split("::");
        const courseId = methodParts[2] || orderItemMap.get(p.order_id);
        if (courseId) {
          const key = `${p.user_id}_${courseId}`;
          const current = paymentMap.get(key);
          const newAmount = (current?.amount || 0) + (p.amount || 0);
          paymentMap.set(key, { status: "PAID", amount: newAmount > 0 ? newAmount : p.amount, userId: p.user_id });
        }
      });
    }

    // 2. Fetch order items payments (fallback to populate non-PAID attempts only if no PAID record exists)
    if (orderIds.length > 0) {
      const { data: payments } = await dbClient
        .from("payments")
        .select("order_id, status, amount, user_id, method")
        .in("order_id", orderIds);

      payments?.forEach(p => {
        const methodParts = (p.method || "").split("::");
        const courseId = methodParts[2] || orderItemMap.get(p.order_id);
        if (courseId) {
          const key = `${p.user_id}_${courseId}`;
          const existing = paymentMap.get(key);
          if (!existing) {
            paymentMap.set(key, { status: p.status, amount: p.amount, userId: p.user_id });
          } else if (existing.status !== "PAID" && p.status === "PAID") {
            paymentMap.set(key, { status: "PAID", amount: p.amount, userId: p.user_id });
          }
        }
      });
    }

    // Get certificates
    const { data: certs } = await dbClient
      .from("certificates")
      .select("student_id, course_id")
      .in("course_id", courseIds);
    const certSet = new Set(certs?.map(c => `${c.student_id}_${c.course_id}`) || []);

    // Map everything
    const rows = enrData.map(e => {
      const profile = profileMap.get(e.student_id);
      const course = courseMap.get(e.course_id);
      const pay = paymentMap.get(`${e.student_id}_${e.course_id}`);
      return {
        studentId: e.student_id,
        studentName: profile?.full_name || "Étudiant",
        studentEmail: profile?.email || "",
        courseId: e.course_id,
        courseTitle: course?.title || "Cours",
        coursePrice: course?.price || 0,
        progressPercent: e.progress_percent || 0,
        enrollmentStatus: e.status || "ACTIVE",
        enrolledAt: e.enrolled_at,
        paymentStatus: pay?.status || "none",
        paymentAmount: pay?.amount || 0,
        hasCertificate: certSet.has(`${e.student_id}_${e.course_id}`),
      };
    });

    return NextResponse.json({ enrollments: rows });
  } catch (err: any) {
    console.error("[students-api GET] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne du serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Verify user role
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));
    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Rôle insuffisant." }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, courseId } = body;

    if (!studentId || !courseId) {
      return NextResponse.json({ error: "Données manquantes (studentId ou courseId)." }, { status: 400 });
    }

    // Check if the current user is the instructor of the course
    // Or if they are admin/super_admin
    const isAdmin = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));
    if (!isAdmin) {
      const { data: course, error: courseErr } = await supabaseAdmin
        .from("courses")
        .select("instructor_id")
        .eq("id", courseId)
        .maybeSingle();

      if (courseErr || !course) {
        return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
      }

      if (course.instructor_id !== user.id) {
        return NextResponse.json({ error: "Vous n'êtes pas le formateur de ce cours." }, { status: 403 });
      }
    }

    // Check if already enrolled
    const { data: existing, error: existErr } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Cet étudiant est déjà inscrit à ce cours." }, { status: 400 });
    }

    // Insert the enrollment using supabaseAdmin to bypass RLS
    const { error: insertErr } = await supabaseAdmin
      .from("enrollments")
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: "ACTIVE",
        progress_percent: 0,
        created_at: new Date().toISOString()
      });

    if (insertErr) {
      console.error("[students-api POST] error inserting enrollment:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    // Send notification to the student
    try {
      const { createNotification } = await import('@/lib/supabase/notifications-helper');
      const { data: courseData } = await supabaseAdmin
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .maybeSingle();

      await createNotification({
        userId: studentId,
        title: "Invitation à un cours !",
        message: `Le formateur vous a invité à rejoindre le cours "${courseData?.title || 'Formation'}".`,
        type: "INFO",
        link: `/dashboard/courses`
      });
    } catch (notifErr) {
      console.error("Error creating student invite notification:", notifErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[students-api POST] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne du serveur." }, { status: 500 });
  }
}

