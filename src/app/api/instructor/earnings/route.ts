import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize admin client to query all payments securely on behalf of the instructor
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Determine the database client: use supabaseAdmin if the service role key is valid, otherwise use the authenticated user's client (which satisfies RLS checked columns)
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 1. Fetch user's profile to check if they exist and retrieve plan
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
    if (courses.length === 0) {
      return NextResponse.json({
        plan: profile.plan || 'FREE',
        transactions: [],
        totalRevenue: 0,
        pendingRevenue: 0,
        uniqueStudentsCount: 0
      });
    }

    const courseIds = courses.map((c) => c.id);
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // 3. Fetch order items for these courses
    const { data: orderItems, error: itemsError } = await dbClient
      .from("order_items")
      .select("order_id, course_id")
      .in("course_id", courseIds);

    if (itemsError || !orderItems || orderItems.length === 0) {
      return NextResponse.json({
        plan: profile.plan || 'FREE',
        transactions: [],
        totalRevenue: 0,
        pendingRevenue: 0,
        uniqueStudentsCount: 0
      });
    }

    const orderIds = orderItems.map((oi) => oi.order_id);
    const orderItemMap = new Map(orderItems.map((oi) => [oi.order_id, oi.course_id]));

    // 4. Fetch payments using dbClient (which bypasses RLS when using service role key, otherwise falls back to instructor session)
    const { data: payments, error: paymentsError } = await dbClient
      .from("payments")
      .select("id, order_id, amount, status, paid_at, user_id, provider")
      .in("order_id", orderIds);

    if (paymentsError || !payments || payments.length === 0) {
      return NextResponse.json({
        plan: profile.plan || 'FREE',
        transactions: [],
        totalRevenue: 0,
        pendingRevenue: 0,
        uniqueStudentsCount: 0
      });
    }

    const studentIds = [...new Set(payments.map((p) => p.user_id))];

    // 5. Fetch student profiles (names)
    const { data: studentProfiles } = await dbClient
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds);

    const profileMap = new Map(studentProfiles?.map((p) => [p.id, p.full_name]) || []);

    // 6. Map payments to display transactions
    const transactions = payments.map((p) => {
      const courseId = orderItemMap.get(p.order_id) || "";
      const course = courseMap.get(courseId);
      const studentName = profileMap.get(p.user_id) || "Étudiant";
      
      let payMethod: string = p.provider || "STRIPE";
      if (payMethod === "MOBILE_MONEY") payMethod = "MoMo";

      return {
        id: p.id,
        orderId: p.order_id,
        courseId,
        courseTitle: course?.title || "Formation",
        userId: p.user_id,
        studentName,
        amount: p.amount || 0,
        method: payMethod,
        date: p.paid_at || new Date().toISOString(),
        status: p.status || "PAID",
      };
    });

    // 7. Fetch all payouts for this instructor
    const { data: payoutsData, error: payoutsErr } = await dbClient
      .from('payouts')
      .select('id, amount, status, created_at, payment_method, payment_reference, notes')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    if (payoutsErr) {
      console.warn('[API instructor/earnings GET] Payouts fetch warning:', payoutsErr.message);
    }

    const hasServiceRole = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && 
                              process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    return NextResponse.json({
      plan: profile.plan || 'FREE',
      transactions,
      payouts: payoutsData || [],
      hasServiceRole,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    });

  } catch (err: any) {
    console.error('[API instructor/earnings GET] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
