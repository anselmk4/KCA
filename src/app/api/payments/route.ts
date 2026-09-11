import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const PROVIDER_MAP: Record<string, string> = {
  STRIPE: "Carte bancaire / Stripe",
  PAYPAL: "PayPal Account",
  MOBILE_MONEY: "Mobile Money",
  CRYPTO: "Cryptomonnaie (Solana)",
  CRYPTO_BTC: "Bitcoin (BTC - On-Chain)",
  MANUAL: "Validation manuelle",
};

const CARRIER_NAMES: Record<string, string> = {
  AIRTEL: "Airtel Money",
  ORANGE: "Orange Money",
  VODACOM: "M-Pesa / Vodacom",
  MPESA: "M-Pesa",
  AFRICELL: "AfriMoney",
  MTN: "MTN Mobile Money",
  MOOV: "Moov Money",
};

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

    // 1. Fetch user's PAID payments
    const { data: paymentsData, error: paymentsError } = await dbClient
      .from("payments")
      .select("id, order_id, amount, status, provider, method, paid_at, created_at")
      .eq("user_id", user.id)
      .eq("status", "PAID");

    if (paymentsError) {
      console.error('[API payments GET] Error fetching payments:', paymentsError.message);
      return NextResponse.json({ error: paymentsError.message }, { status: 400 });
    }

    const payments = paymentsData || [];
    const orderIds = payments.map((p) => p.order_id).filter(Boolean);

    // 2. Fetch order items
    let orderItems: any[] = [];
    if (orderIds.length > 0) {
      const { data: itemsData } = await dbClient
        .from("order_items")
        .select("order_id, course_id, unit_price, final_price")
        .in("order_id", orderIds);
      orderItems = itemsData || [];
    }

    const orderItemMap = new Map(orderItems.map((item) => [item.order_id, item.course_id]));

    // 3. Fetch user enrollments (to cover direct cash installments & manual registrations)
    const { data: userEnrollments } = await (dbClient
      .from("enrollments" as any) as any)
      .select("id, course_id, manual_payment_status, manual_amount_paid, enrolled_at, created_at, enrollment_type")
      .eq("student_id", user.id);

    const enrollmentsList = userEnrollments || [];
    const enrollmentCourseIds = enrollmentsList.map((e: any) => e.course_id);

    // Gather all distinct course IDs
    const extractedCourseIds = new Set<string>(orderItems.map((item) => item.course_id));
    payments.forEach((p) => {
      const methodParts = (p.method || "").split("::");
      if (methodParts[2]) extractedCourseIds.add(methodParts[2]);
    });
    enrollmentCourseIds.forEach((cId: string) => {
      if (cId) extractedCourseIds.add(cId);
    });

    const allCourseIds = [...extractedCourseIds].filter(Boolean);

    // 4. Fetch courses
    let courses: any[] = [];
    if (allCourseIds.length > 0) {
      const { data: coursesData } = await (dbClient
        .from("courses" as any) as any)
        .select("id, title, price, allow_installments, installments_count, instructor_id")
        .in("id", allCourseIds);
      courses = coursesData || [];
    }

    const instructorIds = [...new Set(courses.map((c) => c.instructor_id).filter(Boolean))];

    // 5. Fetch instructor profiles
    let instructorMap = new Map<string, string>();
    if (instructorIds.length > 0) {
      const { data: instructorsData } = await dbClient
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);
      instructorMap = new Map(instructorsData?.map((i) => [i.id, i.full_name]) || []);
    }

    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // Calculate total paid per course for this student from recorded payments
    const courseTotalPaidMap = new Map<string, number>();
    const coursePaymentCountMap = new Map<string, number>();
    const courseHasPaymentRecords = new Set<string>();

    payments.forEach((p) => {
      const methodParts = (p.method || "").split("::");
      const cId = orderItemMap.get(p.order_id) || methodParts[2];
      if (cId) {
        courseHasPaymentRecords.add(cId);
        courseTotalPaidMap.set(cId, (courseTotalPaidMap.get(cId) || 0) + (Number(p.amount) || 0));
        coursePaymentCountMap.set(cId, (coursePaymentCountMap.get(cId) || 0) + 1);
      }
    });

    // Cross-check with manual_amount_paid in enrollments to ensure we never underreport
    enrollmentsList.forEach((enr: any) => {
      const cId = enr.course_id;
      const manualAmt = Number(enr.manual_amount_paid) || 0;
      const course = courseMap.get(cId);
      const rawPrice = Number(course?.price) || 0;
      const effectiveManual = enr.manual_payment_status === "CASH_FULL"
        ? (manualAmt > 0 ? manualAmt : rawPrice)
        : manualAmt;

      if (effectiveManual > 0) {
        const currentSum = courseTotalPaidMap.get(cId) || 0;
        if (effectiveManual > currentSum) {
          courseTotalPaidMap.set(cId, effectiveManual);
        }
      }
    });

    // 6. Build display transactions from payments table
    const transactions = payments.map((p) => {
      const methodParts = (p.method || "").split("::");
      const cId = orderItemMap.get(p.order_id) || methodParts[2] || "";
      const course: any = cId ? courseMap.get(cId) : null;
      const instructorName = course ? instructorMap.get(course.instructor_id) || "Formateur Kuettu" : "—";
      const courseTitle = course ? course.title : "Formation Spécialisée";

      const rawCoursePrice = parseFloat((course?.price as any) || 0);
      const totalPaidForCourse = courseTotalPaidMap.get(cId) || Number(p.amount) || 0;
      const totalPaymentsCount = coursePaymentCountMap.get(cId) || 1;

      // Determine installments details
      const isInstallmentCourse = course?.allow_installments || false;
      const totalInstallments = isInstallmentCourse ? (course?.installments_count || 3) : 1;
      
      // Calculate remaining balance
      const remainingAmount = Math.max(0, Math.round(rawCoursePrice - totalPaidForCourse));
      const isFullyPaid = remainingAmount <= 0;

      // Parse provider details
      const rawMethod = p.method || "";
      const carrierCode = (methodParts[0] ? methodParts[0].toUpperCase() : "") as keyof typeof CARRIER_NAMES;
      const carrierName = (CARRIER_NAMES as any)[carrierCode] || carrierCode;

      const providerKey = (p.provider || "") as keyof typeof PROVIDER_MAP;
      let methodDetail = PROVIDER_MAP[providerKey] || p.provider || "Paiement en ligne";
      if (p.provider === "MOBILE_MONEY" && carrierName) {
        methodDetail = `Mobile Money (${carrierName})`;
      } else if (p.provider === "PAYPAL") {
        methodDetail = `PayPal (Compte vérifié)`;
      } else if (p.provider === "CRYPTO") {
        methodDetail = `Solana / Crypto Web3`;
      } else if (p.provider === "MANUAL") {
        methodDetail = `Tranche / Paiement direct formateur`;
      }

      return {
        id: p.id,
        orderId: p.order_id,
        courseId: cId,
        courseTitle,
        instructorName,
        amount: Number(p.amount) || 0,
        totalCoursePrice: rawCoursePrice,
        totalPaidForCourse,
        remainingAmount,
        isFullyPaid,
        isInstallmentCourse,
        totalInstallments,
        paidInstallmentsCount: totalPaymentsCount,
        remainingInstallmentsCount: isFullyPaid ? 0 : Math.max(0, totalInstallments - totalPaymentsCount),
        method: methodDetail,
        rawProvider: p.provider,
        rawMethod,
        date: p.paid_at || p.created_at || new Date().toISOString(),
      };
    });

    // 7. Add fallback transaction for manual enrollments if no payments rows exist
    enrollmentsList.forEach((enr: any) => {
      const cId = enr.course_id;
      if (courseHasPaymentRecords.has(cId)) return;

      const manualStatus = enr.manual_payment_status;
      const manualAmt = Number(enr.manual_amount_paid) || 0;
      if (manualStatus === "FREE_SCHOLARSHIP" || manualStatus === "FREE") return;

      const course = courseMap.get(cId);
      const rawPrice = Number(course?.price) || 0;
      let effectivePaid = 0;
      if (manualStatus === "CASH_FULL") {
        effectivePaid = manualAmt > 0 ? manualAmt : rawPrice;
      } else if (manualAmt > 0) {
        effectivePaid = manualAmt;
      }

      if (effectivePaid > 0) {
        const isInstallmentCourse = course?.allow_installments || false;
        const totalInstallments = isInstallmentCourse ? (course?.installments_count || 3) : 1;
        const remainingAmount = Math.max(0, Math.round(rawPrice - effectivePaid));
        const isFullyPaid = remainingAmount <= 0;

        transactions.push({
          id: `MANUAL-${enr.id}`,
          orderId: `MANUAL-${enr.id?.substring(0, 8) || "DIR"}`,
          courseId: cId,
          courseTitle: course?.title || "Formation",
          instructorName: course ? instructorMap.get(course.instructor_id) || "Formateur Kuettu" : "—",
          amount: effectivePaid,
          totalCoursePrice: rawPrice,
          totalPaidForCourse: effectivePaid,
          remainingAmount,
          isFullyPaid,
          isInstallmentCourse,
          totalInstallments,
          paidInstallmentsCount: 1,
          remainingInstallmentsCount: isFullyPaid ? 0 : Math.max(0, totalInstallments - 1),
          method: "Paiement direct formateur",
          rawProvider: "MANUAL",
          rawMethod: `MANUAL::${manualStatus}::${cId}`,
          date: enr.enrolled_at || enr.created_at || new Date().toISOString(),
        });
      }
    });

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions });
  } catch (err: any) {
    console.error('[API payments GET] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
