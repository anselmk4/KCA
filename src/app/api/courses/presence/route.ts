import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/courses/presence
 * Batch retrieves exact BDD enrollment counts and live online presence for all active courses.
 * Maps by both course ID (UUID) and course slug.
 */
export async function GET() {
  try {
    // 1. Fetch all published courses with id & slug
    const { data: coursesData } = await supabaseAdmin
      .from("courses")
      .select("id, slug");

    const courseSlugMap = new Map<string, string>();
    coursesData?.forEach((c: { id: string; slug?: string | null }) => {
      if (c.slug) courseSlugMap.set(c.id, c.slug);
    });

    // 2. Fetch exact enrollment counts per course from Supabase database
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
      const cId = row.course_id;

      if (!courseStatsMap[cId]) {
        courseStatsMap[cId] = { enrolledCount: 0, onlineCount: 0, adminCount: 1 };
      }
      courseStatsMap[cId].enrolledCount += 1;

      // Also map by slug if available
      const slug = courseSlugMap.get(cId);
      if (slug) {
        if (!courseStatsMap[slug]) {
          courseStatsMap[slug] = courseStatsMap[cId];
        }
      }
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
