import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize admin client to query across relationships securely
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PLAN_COMMISSION_CONFIG: Record<string, { commissionRate: number; instructorShare: number }> = {
  FREE: { commissionRate: 0.20, instructorShare: 0.80 },
  BASE: { commissionRate: 0.10, instructorShare: 0.90 },
  PRO: { commissionRate: 0.05, instructorShare: 0.95 },
  MAX: { commissionRate: 0.00, instructorShare: 1.00 },
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

    // 1. Fetch user's profile to get plan
    const { data: profileData } = await dbClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle();

    const profile = profileData || { plan: 'FREE' };

    // 2. Fetch instructor's courses
    const { data: courses, error: coursesError } = await dbClient
      .from("courses")
      .select("id, title, status, price, category, level, rating")
      .eq("instructor_id", user.id);

    if (coursesError) {
      return NextResponse.json({ error: coursesError.message }, { status: 400 });
    }

    const myCourses = courses || [];
    const courseIds = myCourses.map((c) => c.id);

    // 3. Fetch enrollments for these courses
    let enrollments: any[] = [];
    if (courseIds.length > 0) {
      const { data: enrollData } = await dbClient
        .from('enrollments')
        .select('student_id, course_id, progress_percent, status, enrolled_at')
        .in('course_id', courseIds);
      enrollments = enrollData || [];
    }

    // 4. Calculate KPIs
    const totalStudents = new Set(enrollments.map((e) => e.student_id)).size;
    const completedCount = enrollments.filter((e) => e.progress_percent === 100).length;
    const avgProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / enrollments.length)
      : 0;

    // Calculate rating
    const ratedCourses = myCourses.filter((c) => c.rating !== null && c.rating > 0);
    const avgRating = ratedCourses.length > 0
      ? ratedCourses.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedCourses.length
      : 0;

    // 5. Calculate Weekly Inscriptions (last 7 weeks)
    const weeklyInscriptions = Array(7).fill(0);
    const weeksLabels = Array(7).fill('');
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const startOfWeek = new Date(now.getTime() - (6 - i) * 7 * 24 * 60 * 60 * 1000);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Label (e.g. S-6 down to "Cette semaine")
      weeksLabels[i] = i === 6 ? "Cette semaine" : `S-${6 - i}`;

      // Filter enrollments in this range
      weeklyInscriptions[i] = enrollments.filter((e) => {
        if (!e.enrolled_at) return false;
        const date = new Date(e.enrolled_at);
        return date >= startOfWeek && date < endOfWeek;
      }).length;
    }

    // 6. Calculate Financial totals from Payments for their courses
    let totalRevenue = 0;
    const instructorPlan = profile.plan || 'FREE';
    const planConfig = PLAN_COMMISSION_CONFIG[instructorPlan] || PLAN_COMMISSION_CONFIG.FREE;

    if (courseIds.length > 0) {
      const { data: orderItems } = await dbClient
        .from("order_items")
        .select("order_id")
        .in("course_id", courseIds);

      const orderIds = orderItems?.map((oi) => oi.order_id) || [];

      if (orderIds.length > 0) {
        const { data: payments } = await dbClient
          .from("payments")
          .select("amount")
          .in("order_id", orderIds)
          .eq("status", "PAID");

        totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      }
    }

    const platformCommission = totalRevenue * planConfig.commissionRate;
    const netRevenue = totalRevenue * planConfig.instructorShare;

    const hasServiceRole = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && 
                              process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    return NextResponse.json({
      plan: instructorPlan,
      courses: myCourses,
      enrollmentsCount: enrollments.length,
      totalStudents,
      completedCount,
      avgProgress,
      avgRating,
      weeklyLabels: weeksLabels,
      weeklyEnrollments: weeklyInscriptions,
      totalRevenue,
      platformCommission,
      netRevenue,
      hasServiceRole,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    });

  } catch (err: any) {
    console.error('[API instructor/analytics GET] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
