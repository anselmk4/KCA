import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/supabase/notifications-helper";

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

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin
      : supabase;

    // Get instructor's courses
    const { data: coursesRaw, error: coursesError } = await (dbClient
      .from("courses" as any) as any)
      .select("id, title, slug, price, allow_installments, installments_count")
      .eq("instructor_id", user.id);
    const courses: any[] | null = coursesRaw;

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
      const { data: profile } = await dbClient
        .from("profiles")
        .select("id, full_name, email, plan, created_at")
        .eq("id", studentId)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json({ error: "Étudiant introuvable." }, { status: 404 });
      }

      const { data: enrollments } = await dbClient
        .from("enrollments")
        .select("id, course_id, progress_percent, status, enrolled_at, enrollment_type, manual_payment_status, manual_amount_paid")
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

      // Get sections & lessons for lesson completion statistics
      const { data: sections } = await dbClient
        .from("course_sections")
        .select("id, course_id")
        .in("course_id", enrolledCourseIds);
      const sectionIds = sections?.map(s => s.id) || [];
      const sectionCourseMap = new Map(sections?.map(s => [s.id, s.course_id]) || []);

      const { data: lessons } = await dbClient
        .from("lessons")
        .select("id, section_id")
        .in("section_id", sectionIds);

      const lessonCountByCourse = new Map<string, number>();
      lessons?.forEach(l => {
        const cId = sectionCourseMap.get(l.section_id);
        if (cId) lessonCountByCourse.set(cId, (lessonCountByCourse.get(cId) || 0) + 1);
      });

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

      const completedByCourse = new Map<string, number>();
      lessons?.forEach(l => {
        if (completedLessonIds.has(l.id)) {
          const cId = sectionCourseMap.get(l.section_id);
          if (cId) completedByCourse.set(cId, (completedByCourse.get(cId) || 0) + 1);
        }
      });

      // Get payments for these courses
      const { data: orderItems } = await dbClient
        .from("order_items")
        .select("order_id, course_id")
        .in("course_id", enrolledCourseIds);
      const orderItemCourseMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);

      // Calculate total paid and number of payments per course for this student
      const paySumByCourse = new Map<string, { totalAmount: number; count: number; lastDate: string | null; status: string }>();

      const { data: paidUserPayments } = await dbClient
        .from("payments")
        .select("order_id, status, amount, paid_at, created_at, method")
        .eq("user_id", studentId)
        .eq("status", "PAID");

      paidUserPayments?.forEach(p => {
        const methodParts = (p.method || "").split("::");
        const cId = methodParts[2] || (p.order_id ? orderItemCourseMap.get(p.order_id) : null);
        if (cId) {
          const curr = paySumByCourse.get(cId) || { totalAmount: 0, count: 0, lastDate: null, status: "PAID" };
          paySumByCourse.set(cId, {
            totalAmount: curr.totalAmount + (p.amount || 0),
            count: curr.count + 1,
            lastDate: p.paid_at || p.created_at || curr.lastDate,
            status: "PAID"
          });
        }
      });

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
        const payInfo = paySumByCourse.get(e.course_id);
        const certDate = certMap.get(e.course_id) || null;

        const rawPrice = parseFloat((course?.price as any) || 0);
        const hasOnlinePayment = !!payInfo && payInfo.totalAmount > 0;
        const isManual = (e as any).enrollment_type === 'MANUAL_INSTRUCTOR' || !hasOnlinePayment;
        const manualStatus = (e as any).manual_payment_status || (isManual ? 'FREE_SCHOLARSHIP' : 'NOT_APPLICABLE');
        const manualAmount = parseFloat((e as any).manual_amount_paid || 0);

        let totalPaid = 0;
        let paymentOrigin: "ONLINE" | "MANUAL" = "ONLINE";

        if (hasOnlinePayment) {
          totalPaid = payInfo.totalAmount;
          paymentOrigin = "ONLINE";
        } else if (isManual) {
          paymentOrigin = "MANUAL";
          if (manualStatus === "CASH_FULL") {
            totalPaid = rawPrice;
          } else if (manualStatus === "CASH_INSTALLMENT") {
            totalPaid = manualAmount;
          } else {
            totalPaid = 0;
          }
        }

        const remainingAmount = Math.max(0, Math.round(rawPrice - totalPaid));
        const isInstallmentCourse = course?.allow_installments || false;
        const totalInstallments = isInstallmentCourse ? (course?.installments_count || 3) : 1;
        const paidInstallmentsCount = hasOnlinePayment ? payInfo.count : (manualStatus === "CASH_FULL" ? 1 : (totalPaid > 0 ? 1 : 0));
        const remainingInstallmentsCount = remainingAmount <= 0 ? 0 : Math.max(0, totalInstallments - paidInstallmentsCount);

        let pStatus = "none";
        if (hasOnlinePayment) {
          if (totalPaid >= rawPrice && rawPrice > 0) pStatus = "PAID";
          else if (totalPaid > 0) pStatus = "PARTIAL";
        } else if (isManual) {
          if (manualStatus === "CASH_FULL") pStatus = "MANUAL_CASH_FULL";
          else if (manualStatus === "CASH_INSTALLMENT") pStatus = "MANUAL_CASH_PARTIAL";
          else pStatus = "FREE_SCHOLARSHIP";
        }

        return {
          courseId: e.course_id,
          courseTitle: course?.title || "Cours",
          courseSlug: course?.slug || "",
          coursePrice: rawPrice,
          totalPaid,
          remainingAmount,
          isInstallmentCourse,
          totalInstallments,
          paidInstallmentsCount,
          remainingInstallmentsCount,
          enrollmentStatus: e.status || "ACTIVE",
          enrolledAt: e.enrolled_at,
          progressPercent: e.progress_percent || 0,
          totalLessons: lessonCountByCourse.get(e.course_id) || 0,
          completedLessons: completedByCourse.get(e.course_id) || 0,
          paymentStatus: pStatus,
          paymentAmount: totalPaid,
          paymentOrigin,
          manualPaymentStatus: manualStatus,
          manualAmountPaid: manualAmount,
          paymentDate: payInfo?.lastDate || null,
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
    const { data: enrData, error: enrError } = await dbClient
      .from("enrollments")
      .select("id, student_id, course_id, progress_percent, status, enrolled_at, enrollment_type, manual_payment_status, manual_amount_paid")
      .in("course_id", courseIds);

    if (enrError) {
      console.error("[students-api] error fetching enrollments:", enrError);
      return NextResponse.json({ error: enrError.message }, { status: 400 });
    }

    if (!enrData || enrData.length === 0) {
      return NextResponse.json({ enrollments: [] });
    }

    const studentIds = [...new Set(enrData.map(e => e.student_id))];

    const { data: profiles } = await dbClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const { data: orderItems } = await dbClient
      .from("order_items")
      .select("order_id, course_id")
      .in("course_id", courseIds);
    const orderItemMap = new Map(orderItems?.map(oi => [oi.order_id, oi.course_id]) || []);

    // Track total paid per (student_id, course_id)
    const paymentMap = new Map<string, { totalPaid: number; count: number; status: string }>();

    if (studentIds.length > 0) {
      const { data: paidPayments } = await dbClient
        .from("payments")
        .select("order_id, status, amount, user_id, method")
        .in("user_id", studentIds)
        .eq("status", "PAID");

      paidPayments?.forEach(p => {
        const methodParts = (p.method || "").split("::");
        const cId = methodParts[2] || orderItemMap.get(p.order_id);
        if (cId) {
          const key = `${p.user_id}_${cId}`;
          const curr = paymentMap.get(key) || { totalPaid: 0, count: 0, status: "PAID" };
          paymentMap.set(key, {
            totalPaid: curr.totalPaid + (p.amount || 0),
            count: curr.count + 1,
            status: "PAID"
          });
        }
      });
    }

    const { data: certs } = await dbClient
      .from("certificates")
      .select("student_id, course_id")
      .in("course_id", courseIds);
    const certSet = new Set(certs?.map(c => `${c.student_id}_${c.course_id}`) || []);

    const rows = enrData.map(e => {
      const profile = profileMap.get(e.student_id);
      const course = courseMap.get(e.course_id);
      const payInfo = paymentMap.get(`${e.student_id}_${e.course_id}`);

      const rawPrice = parseFloat((course?.price as any) || 0);
      const hasOnlinePayment = !!payInfo && payInfo.totalPaid > 0;
      const isManual = (e as any).enrollment_type === 'MANUAL_INSTRUCTOR' || !hasOnlinePayment;
      const manualStatus = (e as any).manual_payment_status || (isManual ? 'FREE_SCHOLARSHIP' : 'NOT_APPLICABLE');
      const manualAmount = parseFloat((e as any).manual_amount_paid || 0);

      let totalPaid = 0;
      let paymentOrigin: "ONLINE" | "MANUAL" = "ONLINE";

      if (hasOnlinePayment) {
        totalPaid = payInfo.totalPaid;
        paymentOrigin = "ONLINE";
      } else if (isManual) {
        paymentOrigin = "MANUAL";
        if (manualStatus === "CASH_FULL") {
          totalPaid = rawPrice;
        } else if (manualStatus === "CASH_INSTALLMENT") {
          totalPaid = manualAmount;
        } else {
          totalPaid = 0;
        }
      }

      const remainingAmount = Math.max(0, Math.round(rawPrice - totalPaid));
      const isInstallmentCourse = course?.allow_installments || false;
      const totalInstallments = isInstallmentCourse ? (course?.installments_count || 3) : 1;
      const paidInstallmentsCount = hasOnlinePayment ? payInfo.count : (manualStatus === "CASH_FULL" ? 1 : (totalPaid > 0 ? 1 : 0));
      const remainingInstallmentsCount = remainingAmount <= 0 ? 0 : Math.max(0, totalInstallments - paidInstallmentsCount);

      let pStatus = "none";
      if (hasOnlinePayment) {
        if (totalPaid >= rawPrice && rawPrice > 0) pStatus = "PAID";
        else if (totalPaid > 0) pStatus = "PARTIAL";
      } else if (isManual) {
        if (manualStatus === "CASH_FULL") pStatus = "MANUAL_CASH_FULL";
        else if (manualStatus === "CASH_INSTALLMENT") pStatus = "MANUAL_CASH_PARTIAL";
        else pStatus = "FREE_SCHOLARSHIP";
      }

      return {
        studentId: e.student_id,
        studentName: profile?.full_name || "Étudiant",
        studentEmail: profile?.email || "",
        courseId: e.course_id,
        courseTitle: course?.title || "Cours",
        coursePrice: rawPrice,
        totalPaid,
        remainingAmount,
        isInstallmentCourse,
        totalInstallments,
        paidInstallmentsCount,
        remainingInstallmentsCount,
        progressPercent: e.progress_percent || 0,
        enrollmentStatus: e.status || "ACTIVE",
        enrolledAt: e.enrolled_at,
        paymentStatus: pStatus,
        paymentAmount: totalPaid,
        paymentOrigin,
        manualPaymentStatus: manualStatus,
        manualAmountPaid: manualAmount,
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
    const { studentId, courseId, paymentOption, paidAmount } = body;

    if (!studentId || !courseId) {
      return NextResponse.json({ error: "Données manquantes (studentId ou courseId)." }, { status: 400 });
    }

    const isAdmin = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));
    let targetCoursePrice = 0;
    if (!isAdmin) {
      const { data: course, error: courseErr } = await supabaseAdmin
        .from("courses")
        .select("instructor_id, price")
        .eq("id", courseId)
        .maybeSingle();

      if (courseErr || !course) {
        return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
      }

      if (course.instructor_id !== user.id) {
        return NextResponse.json({ error: "Vous n'êtes pas le formateur de ce cours." }, { status: 403 });
      }
      targetCoursePrice = Number(course.price) || 0;
    } else {
      const { data: course } = await supabaseAdmin.from("courses").select("price").eq("id", courseId).maybeSingle();
      targetCoursePrice = Number(course?.price) || 0;
    }

    const { data: existing } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Cet étudiant est déjà inscrit à ce cours." }, { status: 400 });
    }

    const manualStatus = paymentOption === "CASH_FULL" ? "CASH_FULL" : paymentOption === "CASH_INSTALLMENT" ? "CASH_INSTALLMENT" : "FREE_SCHOLARSHIP";
    const manualAmount = paymentOption === "FREE" ? 0 : (Number(paidAmount) || (paymentOption === "CASH_FULL" ? targetCoursePrice : 0));

    const { error: insertErr } = await supabaseAdmin
      .from("enrollments")
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: "ACTIVE",
        progress_percent: 0,
        created_at: new Date().toISOString(),
        enrollment_type: "MANUAL_INSTRUCTOR",
        manual_payment_status: manualStatus,
        manual_amount_paid: manualAmount
      });

    if (insertErr) {
      console.error("[students-api POST] error inserting enrollment:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    try {
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
