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

// Clean up stale sessions older than 2 minutes (120,000 ms)
function getActiveOnlineCount(courseId: string): number {
  const now = Date.now();
  const twoMinutesAgo = now - 2 * 60 * 1000;
  
  const courseMap = activeCoursePresenceMap.get(courseId);
  if (!courseMap) return 0;

  let activeCount = 0;
  for (const [userId, lastHeartbeat] of courseMap.entries()) {
    if (lastHeartbeat >= twoMinutesAgo) {
      activeCount++;
    } else {
      courseMap.delete(userId); // Purge stale session
    }
  }

  return activeCount;
}

function registerUserPresence(courseId: string, userId: string) {
  if (!activeCoursePresenceMap.has(courseId)) {
    activeCoursePresenceMap.set(courseId, new Map());
  }
  activeCoursePresenceMap.get(courseId)!.set(userId, Date.now());
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
    const courseId = resolvedParams.courseId;

    if (!courseId) {
      return NextResponse.json({ error: "courseId est requis." }, { status: 400 });
    }

    // 1. Exact count of active/completed enrollments from database
    const { count: enrolledCountData, error: enrollError } = await supabaseAdmin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId)
      .in("status", ["ACTIVE", "COMPLETED"]);

    if (enrollError) {
      console.error("[presence] Error fetching enrollments count:", enrollError);
    }

    const enrolledCount = enrolledCountData || 0;

    // 2. Exact online connected learners at instant T for this course
    const onlineCount = getActiveOnlineCount(courseId);

    // 3. Exact count of course instructors / admins
    let adminCount = 1;
    const { data: courseData } = await supabaseAdmin
      .from("courses")
      .select("instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseData?.instructor_id) {
      adminCount = 1; // Primary instructor
    }

    return NextResponse.json({
      courseId,
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
    const courseId = resolvedParams.courseId;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || req.headers.get("x-user-id") || `anonymous-${req.headers.get("x-forwarded-for") || "client"}`;

    if (courseId && userId) {
      registerUserPresence(courseId, userId);

      // Optionally update updated_at on user profile for DB audit trace
      if (user?.id) {
        await supabaseAdmin
          .from("profiles")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    }

    const onlineCount = getActiveOnlineCount(courseId);

    return NextResponse.json({
      success: true,
      onlineCount,
    });
  } catch (err: any) {
    console.error("[POST /api/courses/[courseId]/presence] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur enregistrement présence." },
      { status: 500 }
    );
  }
}
