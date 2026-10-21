import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/supabase/notifications-helper";
import { sendEmail } from "@/lib/email";

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

    // Get instructor's courses (resilient to 'type' column presence in DB)
    let courses: any[] = [];
    const coursesRes = await (dbClient
      .from("courses" as any) as any)
      .select("id, title, slug, price, type, allow_installments, installments_count")
      .eq("instructor_id", user.id);

    if (coursesRes.error) {
      console.warn("[students-api] courses query with 'type' failed, falling back without 'type':", coursesRes.error.message);
      const fallbackRes = await (dbClient
        .from("courses" as any) as any)
        .select("id, title, slug, price, allow_installments, installments_count")
        .eq("instructor_id", user.id);
      courses = fallbackRes.data || [];
    } else {
      courses = coursesRes.data || [];
    }

    // If no owned courses, check collaborator courses or if admin
    if (courses.length === 0) {
      const { data: collabData } = await (dbClient
        .from("course_collaborators" as any) as any)
        .select("course_id")
        .eq("collaborator_id", user.id);
      const collabCourseIds = (collabData || []).map((c: any) => c.course_id);
      if (collabCourseIds.length > 0) {
        const { data: collabCourses } = await (dbClient
          .from("courses" as any) as any)
          .select("id, title, slug, price, allow_installments, installments_count")
          .in("id", collabCourseIds);
        courses = collabCourses || [];
      } else if (roles.some((r: any) => ["SUPER_ADMIN", "ADMIN"].includes(r))) {
        const { data: allCourses } = await (dbClient
          .from("courses" as any) as any)
          .select("id, title, slug, price, allow_installments, installments_count")
          .limit(100);
        courses = allCourses || [];
      }
    }

    const formattedCourses = (courses || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      type: c.type || "academic"
    }));

    if (!courses || courses.length === 0) {
      return NextResponse.json(studentId ? { error: "Aucun cours trouvé pour ce formateur." } : { enrollments: [], courses: [], sessions: [] });
    }

    const courseIds = (courses || []).map((c: any) => c.id);
    const courseMap = new Map<string, any>((courses || []).map((c: any) => [c.id, c]));

    // Fetch sessions for all these courses safely (never crash if table doesn't exist yet)
    let rawSessions: any[] = [];
    try {
      const { data: sessData, error: sessErr } = await (dbClient
        .from("course_sessions" as any) as any)
        .select("id, course_id, name, status, start_date, end_date, max_capacity, is_default")
        .in("course_id", courseIds);
      if (!sessErr && sessData) {
        rawSessions = sessData;
      }
    } catch (e) {
      console.warn("[students-api] course_sessions query warning:", e);
    }
    const sessionMap = new Map<string, any>((rawSessions || []).map((s: any) => [s.id, s]));

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

      let enrollments: any[] = [];
      const enrSingleRes = await (dbClient
        .from("enrollments" as any) as any)
        .select("id, course_id, session_id, progress_percent, status, enrolled_at, enrollment_type, manual_payment_status, manual_amount_paid")
        .eq("student_id", studentId)
        .in("course_id", courseIds);

      if (enrSingleRes.error) {
        console.warn("[students-api] single student enrollments query with session_id failed, falling back without session_id:", enrSingleRes.error.message);
        const fallbackSingle = await (dbClient
          .from("enrollments" as any) as any)
          .select("id, course_id, progress_percent, status, enrolled_at, enrollment_type, manual_payment_status, manual_amount_paid")
          .eq("student_id", studentId)
          .in("course_id", courseIds);
        enrollments = fallbackSingle.data || [];
      } else {
        enrollments = enrSingleRes.data || [];
      }

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

      const enrolledCourseIds = (enrollments as any[]).map((e: any) => e.course_id);

      // Get sections & lessons for lesson completion statistics
      const { data: sections } = await dbClient
        .from("course_sections")
        .select("id, course_id")
        .in("course_id", enrolledCourseIds);
      const sectionIds = sections?.map((s: any) => s.id) || [];
      const sectionCourseMap = new Map<string, any>(sections?.map((s: any) => [s.id, s.course_id]) || []);

      const { data: lessons } = await dbClient
        .from("lessons")
        .select("id, section_id")
        .in("section_id", sectionIds);

      const lessonCountByCourse = new Map<string, number>();
      lessons?.forEach((l: any) => {
        const cId = sectionCourseMap.get(l.section_id);
        if (cId) lessonCountByCourse.set(cId, (lessonCountByCourse.get(cId) || 0) + 1);
      });

      const enrollmentIds = (enrollments as any[]).map((e: any) => e.id);
      const completedLessonIds = new Set<string>();

      if (enrollmentIds.length > 0) {
        const { data: lessonProgress } = await dbClient
          .from("lesson_progress")
          .select("lesson_id, completed")
          .in("enrollment_id", enrollmentIds)
          .eq("completed", true);
        lessonProgress?.forEach((lp: any) => { if (lp.lesson_id) completedLessonIds.add(lp.lesson_id); });
      }

      const completedByCourse = new Map<string, number>();
      lessons?.forEach((l: any) => {
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
      const orderItemCourseMap = new Map<string, any>(orderItems?.map((oi: any) => [oi.order_id, oi.course_id]) || []);

      // Calculate total paid and number of payments per course for this student
      const paySumByCourse = new Map<string, { totalAmount: number; count: number; lastDate: string | null; status: string }>();

      const { data: paidUserPayments } = await dbClient
        .from("payments")
        .select("order_id, status, amount, paid_at, created_at, method")
        .eq("user_id", studentId)
        .eq("status", "PAID");

      paidUserPayments?.forEach((p: any) => {
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
      const certMap = new Map<string, any>(certs?.map((c: any) => [c.course_id, c.issued_at]) || []);

      // Assemble course details
      const courseDetails = (enrollments as any[]).map((e: any) => {
        const course = courseMap.get(e.course_id);
        const payInfo = paySumByCourse.get(e.course_id);
        const certDate = certMap.get(e.course_id) || null;

        const rawPrice = parseFloat((course?.price as any) || 0);
        const onlinePaid = payInfo ? payInfo.totalAmount : 0;
        const isManual = (e as any).enrollment_type === 'MANUAL_INSTRUCTOR' || onlinePaid === 0;
        const manualStatus = (e as any).manual_payment_status || (isManual ? 'FREE_SCHOLARSHIP' : 'NOT_APPLICABLE');
        const manualAmount = parseFloat((e as any).manual_amount_paid || 0);

        let totalPaid = 0;
        let paymentOrigin: "ONLINE" | "MANUAL" = "ONLINE";

        if (manualStatus === "CASH_FULL") {
          totalPaid = rawPrice > 0 ? rawPrice : Math.max(manualAmount, onlinePaid);
          paymentOrigin = "MANUAL";
        } else if (manualAmount > 0 && onlinePaid > 0) {
          totalPaid = Math.max(manualAmount, onlinePaid);
          paymentOrigin = manualAmount >= onlinePaid ? "MANUAL" : "ONLINE";
        } else if (manualAmount > 0) {
          totalPaid = manualAmount;
          paymentOrigin = "MANUAL";
        } else if (onlinePaid > 0) {
          totalPaid = onlinePaid;
          paymentOrigin = "ONLINE";
        } else {
          totalPaid = 0;
          paymentOrigin = isManual ? "MANUAL" : "ONLINE";
        }

        const remainingAmount = Math.max(0, Math.round(rawPrice - totalPaid));
        const isInstallmentCourse = course?.allow_installments || false;
        const totalInstallments = isInstallmentCourse ? (course?.installments_count || 3) : 1;
        const paidInstallmentsCount = (payInfo && payInfo.count > 0) ? payInfo.count : (manualStatus === "CASH_FULL" ? 1 : (totalPaid > 0 ? 1 : 0));
        const remainingInstallmentsCount = remainingAmount <= 0 ? 0 : Math.max(0, totalInstallments - paidInstallmentsCount);

        let pStatus = "none";
        if (manualStatus === "FREE_SCHOLARSHIP" && totalPaid === 0) {
          pStatus = "FREE_SCHOLARSHIP";
        } else if (totalPaid >= rawPrice && rawPrice > 0) {
          pStatus = paymentOrigin === "MANUAL" ? "MANUAL_CASH_FULL" : "PAID";
        } else if (totalPaid > 0) {
          pStatus = paymentOrigin === "MANUAL" ? "MANUAL_CASH_PARTIAL" : "PARTIAL";
        }

        const sess: any = (e as any).session_id ? sessionMap.get((e as any).session_id) : null;

        return {
          courseId: e.course_id,
          courseTitle: course?.title || "Cours",
          courseSlug: course?.slug || "",
          coursePrice: rawPrice,
          courseType: course?.type || "academic",
          sessionId: (e as any).session_id || null,
          sessionName: sess?.name || null,
          sessionStatus: sess?.status || null,
          sessionStartDate: sess?.start_date || null,
          sessionEndDate: sess?.end_date || null,
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
    let enrData: any[] = [];
    const enrRes = await (dbClient
      .from("enrollments" as any) as any)
      .select("id, student_id, course_id, session_id, progress_percent, status, enrolled_at, enrollment_type, manual_payment_status, manual_amount_paid")
      .in("course_id", courseIds);

    if (enrRes.error) {
      console.warn("[students-api] enrollments query with session_id failed, falling back without session_id:", enrRes.error.message);
      const fallbackEnr = await (dbClient
        .from("enrollments" as any) as any)
        .select("id, student_id, course_id, progress_percent, status, enrolled_at, enrollment_type, manual_payment_status, manual_amount_paid")
        .in("course_id", courseIds);

      if (fallbackEnr.error) {
        console.error("[students-api] error fetching enrollments:", fallbackEnr.error);
        return NextResponse.json({ error: fallbackEnr.error.message }, { status: 400 });
      }
      enrData = fallbackEnr.data || [];
    } else {
      enrData = enrRes.data || [];
    }

    const sessionsList = (rawSessions || []).map((s: any) => ({
      id: s.id,
      courseId: s.course_id,
      courseTitle: courseMap.get(s.course_id)?.title || "",
      name: s.name,
      status: s.status,
      startDate: s.start_date,
      endDate: s.end_date,
      maxCapacity: s.max_capacity,
      isDefault: s.is_default || false,
    }));

    if (!enrData || enrData.length === 0) {
      return NextResponse.json({
        enrollments: [],
        courses: formattedCourses,
        sessions: sessionsList,
      });
    }

    const studentIds = [...new Set((enrData as any[]).map((e: any) => e.student_id))];

    const { data: profiles } = await dbClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    const profileMap = new Map<string, any>(profiles?.map((p: any) => [p.id, p]) || []);

    const { data: orderItems } = await dbClient
      .from("order_items")
      .select("order_id, course_id")
      .in("course_id", courseIds);
    const orderItemMap = new Map<string, any>(orderItems?.map((oi: any) => [oi.order_id, oi.course_id]) || []);

    // Track total paid per (student_id, course_id)
    const paymentMap = new Map<string, { totalPaid: number; count: number; status: string }>();

    if (studentIds.length > 0) {
      const { data: paidPayments } = await dbClient
        .from("payments")
        .select("order_id, status, amount, user_id, method")
        .in("user_id", studentIds)
        .eq("status", "PAID");

      paidPayments?.forEach((p: any) => {
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
    const certSet = new Set(certs?.map((c: any) => `${c.student_id}_${c.course_id}`) || []);

    const rows = (enrData as any[]).map((e: any) => {
      const profile = profileMap.get(e.student_id);
      const course = courseMap.get(e.course_id);
      const payInfo = paymentMap.get(`${e.student_id}_${e.course_id}`);

      const rawPrice = parseFloat((course?.price as any) || 0);
      const onlinePaid = payInfo ? payInfo.totalPaid : 0;
      const isManual = (e as any).enrollment_type === 'MANUAL_INSTRUCTOR' || onlinePaid === 0;
      const manualStatus = (e as any).manual_payment_status || (isManual ? 'FREE_SCHOLARSHIP' : 'NOT_APPLICABLE');
      const manualAmount = parseFloat((e as any).manual_amount_paid || 0);

      let totalPaid = 0;
      let paymentOrigin: "ONLINE" | "MANUAL" = "ONLINE";

      if (manualStatus === "CASH_FULL") {
        totalPaid = rawPrice > 0 ? rawPrice : Math.max(manualAmount, onlinePaid);
        paymentOrigin = "MANUAL";
      } else if (manualAmount > 0 && onlinePaid > 0) {
        totalPaid = Math.max(manualAmount, onlinePaid);
        paymentOrigin = manualAmount >= onlinePaid ? "MANUAL" : "ONLINE";
      } else if (manualAmount > 0) {
        totalPaid = manualAmount;
        paymentOrigin = "MANUAL";
      } else if (onlinePaid > 0) {
        totalPaid = onlinePaid;
        paymentOrigin = "ONLINE";
      } else {
        totalPaid = 0;
        paymentOrigin = isManual ? "MANUAL" : "ONLINE";
      }

      const remainingAmount = Math.max(0, Math.round(rawPrice - totalPaid));
      const isInstallmentCourse = course?.allow_installments || false;
      const totalInstallments = isInstallmentCourse ? (course?.installments_count || 3) : 1;
      const paidInstallmentsCount = (payInfo && payInfo.count > 0) ? payInfo.count : (manualStatus === "CASH_FULL" ? 1 : (totalPaid > 0 ? 1 : 0));
      const remainingInstallmentsCount = remainingAmount <= 0 ? 0 : Math.max(0, totalInstallments - paidInstallmentsCount);

      let pStatus = "none";
      if (manualStatus === "FREE_SCHOLARSHIP" && totalPaid === 0) {
        pStatus = "FREE_SCHOLARSHIP";
      } else if (totalPaid >= rawPrice && rawPrice > 0) {
        pStatus = paymentOrigin === "MANUAL" ? "MANUAL_CASH_FULL" : "PAID";
      } else if (totalPaid > 0) {
        pStatus = paymentOrigin === "MANUAL" ? "MANUAL_CASH_PARTIAL" : "PARTIAL";
      }

      const sess: any = (e as any).session_id ? sessionMap.get((e as any).session_id) : null;

      return {
        studentId: e.student_id,
        studentName: profile?.full_name || "Étudiant",
        studentEmail: profile?.email || "",
        courseId: e.course_id,
        courseTitle: course?.title || "Cours",
        courseType: course?.type || "academic",
        coursePrice: rawPrice,
        sessionId: (e as any).session_id || null,
        sessionName: sess?.name || null,
        sessionStatus: sess?.status || null,
        sessionStartDate: sess?.start_date || null,
        sessionEndDate: sess?.end_date || null,
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

    return NextResponse.json({
      enrollments: rows,
      courses: formattedCourses,
      sessions: sessionsList,
    });
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
    const isAuthorized = roles.some((r: any) => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));
    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Rôle insuffisant." }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      studentEmail,
      studentName,
      courseId,
      sessionId,
      paymentOption,
      paidAmount,
      notifyEmail = true
    } = body;

    if ((!studentId && !studentEmail) || !courseId) {
      return NextResponse.json({ error: "Données manquantes (l'identifiant ou l'email de l'étudiant ainsi que le cours sont requis)." }, { status: 400 });
    }

    const isAdmin = roles.some((r: any) => ["SUPER_ADMIN", "ADMIN"].includes(r));
    let targetCoursePrice = 0;
    let courseTitle = "Formation";
    
    // Fetch course details & verify authorization
    const { data: course, error: courseErr } = await supabaseAdmin
      .from("courses")
      .select("id, title, instructor_id, price")
      .eq("id", courseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    if (!isAdmin && course.instructor_id !== user.id) {
      return NextResponse.json({ error: "Vous n'êtes pas le formateur de ce cours." }, { status: 403 });
    }

    targetCoursePrice = Number(course.price) || 0;
    courseTitle = course.title || "Formation";

    // 1. Resolve student ID and Profile
    let effectiveStudentId = studentId;
    let targetStudentEmail = studentEmail ? studentEmail.trim().toLowerCase() : "";
    let targetStudentName = studentName ? studentName.trim() : "";

    if (!effectiveStudentId && targetStudentEmail) {
      // Find in profiles
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", targetStudentEmail)
        .maybeSingle();

      if (profile) {
        effectiveStudentId = profile.id;
        if (!targetStudentName && profile.full_name) {
          targetStudentName = profile.full_name;
        }
      } else {
        // Find in auth.users
        const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuth = authList?.users?.find(
          (u) => u.email?.toLowerCase() === targetStudentEmail
        );

        if (existingAuth) {
          effectiveStudentId = existingAuth.id;
          if (!targetStudentName) {
            targetStudentName = existingAuth.user_metadata?.full_name || targetStudentEmail.split("@")[0];
          }
          // Ensure profile exists
          await supabaseAdmin.from("profiles").upsert({
            id: effectiveStudentId,
            email: targetStudentEmail,
            full_name: targetStudentName,
            role: "STUDENT"
          });
        } else {
          // Create new user account in Supabase Auth
          const { data: newUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
            email: targetStudentEmail,
            email_confirm: true,
            user_metadata: {
              full_name: targetStudentName || targetStudentEmail.split("@")[0]
            }
          });

          if (createAuthErr || !newUser?.user) {
            return NextResponse.json({
              error: "Impossible de créer le compte pour cet email : " + (createAuthErr?.message || "Erreur auth.")
            }, { status: 400 });
          }

          effectiveStudentId = newUser.user.id;
          if (!targetStudentName) {
            targetStudentName = targetStudentEmail.split("@")[0];
          }

          // Create student profile
          await supabaseAdmin.from("profiles").upsert({
            id: effectiveStudentId,
            email: targetStudentEmail,
            full_name: targetStudentName,
            role: "STUDENT",
            created_at: new Date().toISOString()
          });

          // Assign STUDENT role in user_roles
          const { data: studentRole } = await supabaseAdmin
            .from("roles")
            .select("id")
            .eq("name", "STUDENT")
            .maybeSingle();

          if (studentRole) {
            await supabaseAdmin.from("user_roles").upsert({
              user_id: effectiveStudentId,
              role_id: studentRole.id
            });
          }
        }
      }
    }

    if (!effectiveStudentId) {
      return NextResponse.json({ error: "Impossible de résoudre l'identifiant de l'étudiant." }, { status: 400 });
    }

    // Retrieve email and name if not already set
    if (!targetStudentEmail || !targetStudentName) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", effectiveStudentId)
        .maybeSingle();
      if (prof) {
        if (!targetStudentEmail) targetStudentEmail = prof.email || "";
        if (!targetStudentName) targetStudentName = prof.full_name || "";
      }
    }

    // 2. Check existing enrollment
    const { data: existing } = await supabaseAdmin
      .from("enrollments")
      .select("id, status")
      .eq("student_id", effectiveStudentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json({ error: `Cet apprenant (${targetStudentEmail || targetStudentName}) est déjà inscrit et actif à ce cours.` }, { status: 400 });
      } else {
        // Re-activate suspended / inactive enrollment
        const manualStatus = paymentOption === "CASH_FULL" ? "CASH_FULL" : paymentOption === "CASH_INSTALLMENT" ? "CASH_INSTALLMENT" : "FREE_SCHOLARSHIP";
        const manualAmount = paymentOption === "FREE" ? 0 : (Number(paidAmount) || (paymentOption === "CASH_FULL" ? targetCoursePrice : 0));

        await (supabaseAdmin.from("enrollments" as any) as any)
          .update({
            status: "ACTIVE",
            session_id: sessionId || null,
            manual_payment_status: manualStatus,
            manual_amount_paid: manualAmount,
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
      }
    } else {
      const manualStatus = paymentOption === "CASH_FULL" ? "CASH_FULL" : paymentOption === "CASH_INSTALLMENT" ? "CASH_INSTALLMENT" : "FREE_SCHOLARSHIP";
      const manualAmount = paymentOption === "FREE" ? 0 : (Number(paidAmount) || (paymentOption === "CASH_FULL" ? targetCoursePrice : 0));

      const { error: insertErr } = await (supabaseAdmin
        .from("enrollments" as any) as any)
        .insert({
          student_id: effectiveStudentId,
          course_id: courseId,
          session_id: sessionId || null,
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

      // If manual payment > 0, generate order & payment record for audit and invoices
      if (manualAmount > 0) {
        try {
          const orderId = crypto.randomUUID();
          await (supabaseAdmin.from("orders") as any).insert({
            id: orderId,
            user_id: effectiveStudentId,
            order_number: `MAN-${Date.now()}`,
            subtotal: manualAmount,
            total: manualAmount,
            total_amount: manualAmount,
            status: "COMPLETED",
            created_at: new Date().toISOString(),
          });

          await supabaseAdmin.from("order_items").insert({
            id: crypto.randomUUID(),
            order_id: orderId,
            course_id: courseId,
            unit_price: targetCoursePrice || manualAmount,
            final_price: manualAmount,
          });

          await supabaseAdmin.from("payments").insert({
            id: crypto.randomUUID(),
            order_id: orderId,
            user_id: effectiveStudentId,
            amount: manualAmount,
            currency: "USD",
            status: "PAID",
            provider: "MANUAL",
            method: manualStatus === "CASH_FULL" ? "MANUAL::CASH_FULL" : "MANUAL::CASH_INSTALLMENT",
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        } catch (payErr) {
          console.warn("[students-api POST] Could not create manual order/payment record:", payErr);
        }
      }
    }

    // 3. In-App Notification
    try {
      await createNotification({
        userId: effectiveStudentId,
        title: "Nouvelle inscription à une formation !",
        message: `Votre formateur vous a inscrit avec succès au cours "${courseTitle}". Vos cours sont immédiatement accessibles.`,
        type: "INFO",
        link: `/dashboard/courses`
      });
    } catch (notifErr) {
      console.error("Error creating student invite notification:", notifErr);
    }

    // 4. Welcome Email Notification
    if (notifyEmail && targetStudentEmail) {
      try {
        const studentGreeting = targetStudentName ? `Bonjour ${targetStudentName},` : "Bonjour,";
        const emailContent = `
          <h2>Félicitations ! Vous êtes inscrit à une formation</h2>
          <p>${studentGreeting}</p>
          <p>Votre formateur vient de valider votre inscription au cours <strong>"${courseTitle}"</strong> sur la plateforme Ansella.</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #1e293b;">Détails de l'inscription :</p>
            <p style="margin: 4px 0 0 0; color: #475569;">• Cours : <strong>${courseTitle}</strong></p>
            <p style="margin: 4px 0 0 0; color: #475569;">• Statut : <strong style="color: #16a34a;">Actif &amp; Débloqué</strong></p>
          </div>
          <p>Vous pouvez dès maintenant vous connecter à votre espace étudiant et commencer à suivre vos cours :</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://ansella.app/dashboard/courses" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: bold; text-decoration: none;">
              Accéder à mes cours
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Si vous n'avez pas encore défini votre mot de passe, vous pouvez utiliser la fonction "Mot de passe oublié" avec cet email (${targetStudentEmail}).</p>
        `;

        await sendEmail(
          targetStudentEmail,
          `Accès accordé : ${courseTitle}`,
          emailContent
        );
      } catch (emailErr) {
        console.warn("[students-api POST] Email dispatch error:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `L'apprenant ${targetStudentName || targetStudentEmail} a été enrôlé avec succès au cours "${courseTitle}".`
    });
  } catch (err: any) {
    console.error("[students-api POST] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne du serveur." }, { status: 500 });
  }
}

