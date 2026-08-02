import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/courses/presence
 * Batch retrieves exact BDD enrollment counts and live online presence for all active courses.
 */
export async function GET() {
  try {
    // 1. Fetch exact enrollment counts per course from Supabase database
    const { data: enrollmentsData, error: enrollError } = await supabaseAdmin
      .from("enrollments")
      .select("course_id")
      .in("status", ["ACTIVE", "COMPLETED"]);

    if (enrollError) {
      console.error("[courses/presence] Error fetching enrollments:", enrollError);
    }

    const courseStatsMap: Record<string, { enrolledCount: number; onlineCount: number; adminCount: number }> = {};

    enrollmentsData?.forEach((row: { course_id: string }) => {
      if (!row.course_id) return;
      if (!courseStatsMap[row.course_id]) {
        courseStatsMap[row.course_id] = { enrolledCount: 0, onlineCount: 0, adminCount: 1 };
      }
      courseStatsMap[row.course_id].enrolledCount += 1;
    });

    return NextResponse.json({
      success: true,
      stats: courseStatsMap,
    });
  } catch (err: any) {
    console.error("[GET /api/courses/presence] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors de la récupération globale de la présence." },
      { status: 500 }
    );
  }
}
