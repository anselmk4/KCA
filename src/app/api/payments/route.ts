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
    if (payments.length === 0) {
      return NextResponse.json({ transactions: [] });
    }

    const orderIds = payments.map((p) => p.order_id);

    // 2. Fetch order items
    const { data: itemsData } = await dbClient
      .from("order_items")
      .select("order_id, course_id, unit_price, final_price")
      .in("order_id", orderIds);

    const orderItems = itemsData || [];
    const courseIds = [...new Set(orderItems.map((item) => item.course_id))];

    // 3. Fetch courses
    const { data: coursesData } = await (dbClient
      .from("courses" as any) as any)
      .select("id, title, price, allow_installments, installments_count, instructor_id")
      .in("id", courseIds);

    const courses: any[] = coursesData || [];
    const instructorIds = [...new Set(courses.map((c) => c.instructor_id).filter(Boolean))];

    // 4. Fetch instructor profiles
    const { data: instructorsData } = await dbClient
      .from("profiles")
      .select("id, full_name")
      .in("id", instructorIds);

    const instructorMap = new Map(instructorsData?.map((i) => [i.id, i.full_name]) || []);
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // Calculate total paid per course for this student
    const courseTotalPaidMap = new Map<string, number>();
    const coursePaymentCountMap = new Map<string, number>();

    payments.forEach((p) => {
      const item = orderItems.find((oi) => oi.order_id === p.order_id);
      if (item?.course_id) {
        const cId = item.course_id;
        courseTotalPaidMap.set(cId, (courseTotalPaidMap.get(cId) || 0) + (p.amount || 0));
        coursePaymentCountMap.set(cId, (coursePaymentCountMap.get(cId) || 0) + 1);
      }
    });

    // 5. Build detailed display transactions
    const transactions = payments.map((p) => {
      const item = orderItems.find((oi) => oi.order_id === p.order_id);
      const course: any = item ? courseMap.get(item.course_id) : null;
      const instructorName = course ? instructorMap.get(course.instructor_id) || "Formateur Kuettu" : "—";
      const courseTitle = course ? course.title : "Formation Spécialisée";

      const rawCoursePrice = parseFloat((course?.price as any) || 0);
      const cId = course?.id || "";
      const totalPaidForCourse = courseTotalPaidMap.get(cId) || p.amount || 0;
      const totalPaymentsCount = coursePaymentCountMap.get(cId) || 1;

      // Determine installments details
      const isInstallmentCourse = course?.allow_installments || false;
      const totalInstallments = isInstallmentCourse ? (course?.installments_count || 3) : 1;
      
      // Calculate remaining balance
      const remainingAmount = Math.max(0, Math.round(rawCoursePrice - totalPaidForCourse));
      const isFullyPaid = remainingAmount <= 0;

      // Parse provider details
      const rawMethod = p.method || "";
      const methodParts = rawMethod.split("::");
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
        methodDetail = `Validation par l'Académie`;
      }

      return {
        id: p.id,
        orderId: p.order_id,
        courseId: cId,
        courseTitle,
        instructorName,
        amount: p.amount || 0,
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

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions });
  } catch (err: any) {
    console.error('[API payments GET] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
