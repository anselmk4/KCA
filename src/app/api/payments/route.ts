import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize admin client to bypass client RLS when retrieving transactions for the user
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROVIDER_MAP: Record<string, string> = {
  STRIPE: "Stripe / Carte",
  PAYPAL: "PayPal",
  MOBILE_MONEY: "Mobile Money",
  CRYPTO: "Cryptomonnaie",
  MANUAL: "Validation manuelle",
};

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 1. Fetch the user's completed payments
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, amount, status, provider, paid_at")
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

    // 2. Fetch order items to match payments with courses
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("order_id, course_id")
      .in("order_id", orderIds);

    if (itemsError) {
      console.error('[API payments GET] Error fetching order items:', itemsError.message);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const orderItems = itemsData || [];
    const courseIds = [...new Set(orderItems.map((item) => item.course_id))];

    // 3. Fetch courses
    const { data: coursesData } = await supabaseAdmin
      .from("courses")
      .select("id, title, instructor_id")
      .in("id", courseIds);

    const courses = coursesData || [];
    const instructorIds = [...new Set(courses.map((c) => c.instructor_id).filter(Boolean))];

    // 4. Fetch instructor profile names
    const { data: instructorsData } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", instructorIds);

    const instructors = instructorsData || [];
    const instructorMap = new Map(instructors.map((i) => [i.id, i.full_name]));
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // 5. Build display transactions response
    const transactions = payments.map((p) => {
      const item = orderItems.find((oi) => oi.order_id === p.order_id);
      const course = item ? courseMap.get(item.course_id) : null;
      const instructorName = course ? instructorMap.get(course.instructor_id) || "Formateur Kuettu" : "—";
      const courseTitle = course ? course.title : "Formation Spécialisée";

      return {
        id: p.id,
        courseId: course?.id || "",
        courseTitle,
        instructorName,
        amount: p.amount || 0,
        method: PROVIDER_MAP[p.provider] || p.provider || "Carte",
        date: p.paid_at || new Date().toISOString(),
      };
    });

    // Sort chronologically descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions });

  } catch (err: any) {
    console.error('[API payments GET] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
