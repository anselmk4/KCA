import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// High-performance in-memory presence cache for instant T tracking per course
// Structure: courseId -> Map<userId, timestamp>
const activeCoursePresenceMap = new Map<string, Map<string, number>>();

// Clean up stale sessions older than 3 minutes (180,000 ms)
function getActiveOnlineCount(courseIdKey: string): number {
  const now = Date.now();
  const threeMinutesAgo = now - 3 * 60 * 1000;
  
  const courseMap = activeCoursePresenceMap.get(courseIdKey);
  if (!courseMap) return 0;

  let activeCount = 0;
  for (const [userId, lastHeartbeat] of courseMap.entries()) {
    if (lastHeartbeat >= threeMinutesAgo) {
      activeCount++;
    } else {
      courseMap.delete(userId); // Purge stale session
    }
  }

  return activeCount;
}

function registerUserPresence(courseIdKey: string, userId: string) {
  if (!activeCoursePresenceMap.has(courseIdKey)) {
    activeCoursePresenceMap.set(courseIdKey, new Map());
  }
  activeCoursePresenceMap.get(courseIdKey)!.set(userId, Date.now());
}

/**
 * Resolves the real course record (id, slug, instructor_id) whether passed an ID or a Slug
 */
async function resolveCourseInfo(idOrSlug: string) {
  const clean = idOrSlug.trim();
  const { data } = await supabaseAdmin
    .from("courses")
    .select("id, slug, instructor_id")
    .or(`id.eq.${clean},slug.eq.${clean}`)
    .maybeSingle();

  return data || null;
}

/**
 * GET /api/courses/[courseId]/presence
 * Returns real-time exact enrollment count, online connected count at instant T, and admin count.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawCourseId = resolvedParams.courseId;

    if (!rawCourseId) {
      return NextResponse.json({ error: "courseId est requis." }, { status: 400 });
    }

    const courseInfo = await resolveCourseInfo(rawCourseId);
    const targetCourseId = courseInfo?.id || rawCourseId;

    // 1. Exact count of active/completed enrollments from database
    const { count: enrolledCountData, error: enrollError } = await supabaseAdmin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", targetCourseId)
      .in("status", ["ACTIVE", "COMPLETED"]);

    if (enrollError) {
      console.error("[presence] Error fetching enrollments count:", enrollError);
    }

    const enrolledCount = enrolledCountData || 0;

    // 2. Exact online connected learners at instant T for this course
    let onlineCount = getActiveOnlineCount(targetCourseId);
    if (courseInfo?.slug) {
      onlineCount = Math.max(onlineCount, getActiveOnlineCount(courseInfo.slug));
    }

    // 3. Exact count of course instructors / admins
    let adminCount = 1;
    if (courseInfo?.instructor_id) {
      adminCount = 1;
    }

    return NextResponse.json({
      courseId: targetCourseId,
      slug: courseInfo?.slug || null,
      enrolledCount,
      onlineCount,
      adminCount,
    });
  } catch (err: any) {
    console.error("[GET /api/courses/[courseId]/presence] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors de la récupération de la présence." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[courseId]/presence
 * Heartbeat sent by client to register user as active on this course at instant T.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawCourseId = resolvedParams.courseId;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || req.headers.get("x-user-id") || `anonymous-${req.headers.get("x-forwarded-for") || "client"}`;

    if (rawCourseId && userId) {
      const courseInfo = await resolveCourseInfo(rawCourseId);
      const targetCourseId = courseInfo?.id || rawCourseId;

      registerUserPresence(targetCourseId, userId);
      if (courseInfo?.slug) {
        registerUserPresence(courseInfo.slug, userId);
      }

      // Update updated_at on user profile for DB audit trace
      if (user?.id) {
        await supabaseAdmin
          .from("profiles")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    console.error("[POST /api/courses/[courseId]/presence] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur enregistrement présence." },
      { status: 500 }
    );
  }
}
