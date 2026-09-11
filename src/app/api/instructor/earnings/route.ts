import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 1. Fetch user profile
    const { data: profileData } = await dbClient
      .from('profiles')
      .select('id, plan, status')
      .eq('id', user.id)
      .maybeSingle();

    const profile = profileData || { plan: 'FREE', status: 'ACTIVE' };

    // 2. Fetch instructor's courses
    const { data: coursesData, error: coursesError } = await dbClient
      .from("courses")
      .select("id, title, status, price")
      .eq("instructor_id", user.id);

    if (coursesError) {
      return NextResponse.json({ error: coursesError.message }, { status: 400 });
    }

    const courses = coursesData || [];

    // Fetch instructor's payouts
    const { data: payoutsData } = await dbClient
      .from('payouts')
      .select('id, amount, status, created_at, payment_method, payment_reference, notes')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    const payoutsList = payoutsData || [];

    if (courses.length === 0) {
      return NextResponse.json({
        plan: profile.plan || 'FREE',
        transactions: [],
        payouts: payoutsList,
        totalRevenue: 0,
        pendingRevenue: 0,
        uniqueStudentsCount: 0
      });
    }

    const courseIds = courses.map((c) => c.id);
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // 3. Fetch enrollments for these courses (including manual payments)
    const { data: enrollmentsData } = await (dbClient
      .from("enrollments")
      .select("id, student_id, course_id, enrolled_at, created_at, enrollment_type, manual_payment_status, manual_amount_paid, profiles(full_name)")
      .in("course_id", courseIds) as any);

    const enrollmentsList = enrollmentsData || [];

    // 4. Fetch order items & recorded payments
    const { data: orderItems } = await dbClient
      .from("order_items")
      .select("order_id, course_id, final_price, unit_price")
      .in("course_id", courseIds);

    let recordedTransactions: any[] = [];
    const recordedPaidSumByUserCourse = new Map<string, number>();

    if (orderItems && orderItems.length > 0) {
      const orderIds = orderItems.map((oi) => oi.order_id);
      const orderItemMap = new Map(orderItems.map((oi) => [oi.order_id, oi.course_id]));

      const { data: payments } = await dbClient
        .from("payments")
        .select("id, order_id, amount, status, paid_at, created_at, user_id, provider, method")
        .in("order_id", orderIds);

      if (payments && payments.length > 0) {
        const studentIds = [...new Set(payments.map((p) => p.user_id))];
        const { data: studentProfiles } = await dbClient
          .from("profiles")
          .select("id, full_name")
          .in("id", studentIds);

        const profileMap = new Map(studentProfiles?.map((p) => [p.id, p.full_name]) || []);

        recordedTransactions = payments.map((p) => {
          const methodParts = (p.method || "").split("::");
          const courseId = orderItemMap.get(p.order_id) || methodParts[2] || "";
          const course = courseMap.get(courseId);
          const studentName = profileMap.get(p.user_id) || "Étudiant";
          const st = (p.status || "").toUpperCase();

          let normalizedStatus = "PENDING";
          if (st === "PAID" || st === "COMPLETED" || st === "SUCCESS") {
            normalizedStatus = "PAID";
            const userCourseKey = `${p.user_id}_${courseId}`;
            recordedPaidSumByUserCourse.set(
              userCourseKey,
              (recordedPaidSumByUserCourse.get(userCourseKey) || 0) + (Number(p.amount) || 0)
            );
          } else if (st === "FAILED" || st === "CANCELLED" || st === "REFUNDED" || st === "REJECTED") {
            normalizedStatus = "FAILED";
          }

          return {
            id: p.id,
            orderId: p.order_id,
            courseId,
            courseTitle: course?.title || "Formation",
            userId: p.user_id,
            studentName,
            amount: Number(p.amount) || 0,
            status: normalizedStatus,
            date: p.paid_at || p.created_at || new Date().toISOString(),
            method: p.provider || "CARTE"
          };
        });
      }
    }

    // 5. Build manual cash / direct payment transactions from enrollments
    // Strictly exclude free / scholarship / accès offert (FREE_SCHOLARSHIP / FREE / 0$)
    const manualTransactions: any[] = [];
    enrollmentsList.forEach((enr: any) => {
      const userCourseKey = `${enr.student_id}_${enr.course_id}`;
      const manualStatus = enr.manual_payment_status;
      const rawManualAmt = Number(enr.manual_amount_paid) || 0;

      // Accès offert / Bourse / Gratuit -> DO NOT count in revenue!
      if (manualStatus === "FREE_SCHOLARSHIP" || manualStatus === "FREE" || manualStatus === "BOURSE") {
        return;
      }

      const course = courseMap.get(enr.course_id);
      const coursePrice = Number(course?.price) || 0;
      const studentName = enr.profiles?.full_name || "Apprenant (Paiement direct)";

      let finalPaidAmount = 0;
      if (manualStatus === "CASH_FULL") {
        finalPaidAmount = rawManualAmt > 0 ? rawManualAmt : coursePrice;
      } else if (manualStatus === "CASH_INSTALLMENT" || rawManualAmt > 0) {
        finalPaidAmount = rawManualAmt;
      }

      const recordedSum = recordedPaidSumByUserCourse.get(userCourseKey) || 0;
      const remainingUnrecorded = finalPaidAmount - recordedSum;

      if (remainingUnrecorded > 0) {
        manualTransactions.push({
          id: `MANUAL-${enr.id}`,
          orderId: `MANUAL-${enr.id?.substring(0, 8) || "DIR"}`,
          courseId: enr.course_id,
          courseTitle: course?.title || "Formation",
          userId: enr.student_id,
          studentName,
          amount: remainingUnrecorded,
          status: "PAID",
          date: enr.enrolled_at || enr.created_at || new Date().toISOString(),
          method: "PAIEMENT_MANUEL_DIRECT"
        });
      }
    });

    const allTransactions = [...recordedTransactions, ...manualTransactions];

    // Keep ONLY transactions that are "PAID"
    const cleanTransactions = allTransactions.filter((t) => t.status === "PAID");

    const totalRevenue = cleanTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const uniqueStudentsCount = new Set(enrollmentsList.map((e: any) => e.student_id)).size;

    return NextResponse.json({
      plan: profile.plan || 'FREE',
      transactions: cleanTransactions,
      payouts: payoutsList,
      totalRevenue,
      pendingRevenue: 0,
      uniqueStudentsCount
    });

  } catch (err: any) {
    console.error("[GET /api/instructor/earnings] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
