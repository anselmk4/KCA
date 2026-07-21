import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // 1. Load affiliations table to count referrals per referrer
    const affiliateCounts: Record<string, number> = {};
    try {
      const { data: affiliationsData, error: affErr } = await supabaseAdmin
        .from("affiliations" as any)
        .select("referrer_id");

      if (!affErr && affiliationsData) {
        affiliationsData.forEach((a: any) => {
          if (a.referrer_id) {
            affiliateCounts[a.referrer_id] = (affiliateCounts[a.referrer_id] || 0) + 1;
          }
        });
      }
    } catch (e) {
      console.warn("[/api/community/leaderboard] Affiliations query note:", e);
    }

    // 2. Load profiles
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, avatar_url, plan, affiliate_points, created_at")
      .limit(200);

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    // 3. Load user roles
    const roleMap: Record<string, string> = {};
    try {
      const { data: userRoles } = await supabaseAdmin
        .from("user_roles" as any)
        .select("user_id, roles(name)" as any);

      (userRoles || []).forEach((ur: any) => {
        if (ur.user_id && !roleMap[ur.user_id]) {
          roleMap[ur.user_id] = ur.roles?.name || "STUDENT";
        }
      });
    } catch (e) {
      console.warn("[/api/community/leaderboard] User roles query note:", e);
    }

    // 4. Load courses count per instructor
    const coursesCountMap: Record<string, number> = {};
    try {
      const { data: courses } = await supabaseAdmin
        .from("courses")
        .select("instructor_id");

      (courses || []).forEach((c: any) => {
        if (c.instructor_id) {
          coursesCountMap[c.instructor_id] = (coursesCountMap[c.instructor_id] || 0) + 1;
        }
      });
    } catch (e) {
      console.warn("[/api/community/leaderboard] Courses query note:", e);
    }

    // 5. Construct leaderboard user list
    const leaderboardList = (profiles || []).map((p: any) => {
      const affCount = affiliateCounts[p.id] || 0;
      const cCount = coursesCountMap[p.id] || 0;
      const points = (affCount * 100) + (cCount * 50) + (p.affiliate_points || 0);

      return {
        id: p.id,
        name: p.full_name || p.email?.split("@")[0] || "Membre Ansella",
        avatar: p.avatar_url || null,
        role: roleMap[p.id] || "STUDENT",
        plan: p.plan || "FREE",
        points,
        coursesCount: cCount,
        affiliatesCount: affCount,
        rank: 0,
      };
    });

    // 6. Sort primarily by affiliatesCount (descending), then points (descending)
    leaderboardList.sort((a, b) => {
      if (b.affiliatesCount !== a.affiliatesCount) {
        return b.affiliatesCount - a.affiliatesCount;
      }
      return b.points - a.points;
    });

    // 7. Assign ranks
    const rankedLeaderboard = leaderboardList.map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));

    return NextResponse.json({
      success: true,
      totalUsers: rankedLeaderboard.length,
      leaderboard: rankedLeaderboard,
    });
  } catch (err: any) {
    console.error("[/api/community/leaderboard] Error:", err);
    return NextResponse.json({ error: err?.message || "Erreur serveur" }, { status: 500 });
  }
}
