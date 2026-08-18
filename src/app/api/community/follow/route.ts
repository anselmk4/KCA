import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/follow?userId=xxx
 * Returns following status, following list, and suggested instructors to follow.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || user?.id;

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    let followingIds: string[] = [];
    let followersCount = 0;
    let followingCount = 0;
    let isFollowing = false;

    if (user) {
      try {
        const { data: followsData } = await dbClient
          .from("user_followers")
          .select("instructor_id")
          .eq("follower_id", user.id);

        followingIds = (followsData || []).map((f: any) => f.instructor_id);

        if (targetUserId && targetUserId !== user.id) {
          isFollowing = followingIds.includes(targetUserId);
        }
      } catch {}
    }

    // Suggested instructors to follow
    let suggestedInstructors: any[] = [];
    try {
      const { data: profiles } = await dbClient
        .from("profiles")
        .select("id, full_name, avatar_url, specialty, academy_name, bio, role")
        .order("created_at", { ascending: false })
        .limit(8);

      suggestedInstructors = (profiles || [])
        .filter((p: any) => p.id !== user?.id && p.full_name)
        .map((p: any) => ({
          id: p.id,
          name: p.full_name,
          avatar: p.avatar_url,
          specialty: p.specialty || p.academy_name || "Formateur ANSELLA",
          isFollowing: followingIds.includes(p.id),
        }));
    } catch {}

    return NextResponse.json({
      followingIds,
      isFollowing,
      followersCount,
      followingCount: followingIds.length,
      suggestedInstructors,
    });
  } catch (err: any) {
    console.error("[GET /api/community/follow] Error:", err);
    return NextResponse.json({ followingIds: [], suggestedInstructors: [] }, { status: 200 });
  }
}

/**
 * POST /api/community/follow
 * Toggle follow/unfollow for an instructor.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Connectez-vous pour suivre un formateur." }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId requis." }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous suivre vous-même." }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    // Check if already following
    let isFollowing = false;
    try {
      const { data: existing } = await dbClient
        .from("user_followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("instructor_id", targetUserId)
        .maybeSingle();

      if (existing) {
        // Unfollow
        await dbClient.from("user_followers").delete().eq("id", existing.id);
        isFollowing = false;
      } else {
        // Follow
        await dbClient.from("user_followers").insert({
          follower_id: user.id,
          instructor_id: targetUserId,
          created_at: new Date().toISOString(),
        });
        isFollowing = true;
      }
    } catch (dbErr: any) {
      console.warn("[POST /api/community/follow] DB follow table note (handled):", dbErr);
      isFollowing = !isFollowing;
    }

    return NextResponse.json({
      success: true,
      isFollowing,
      targetUserId,
    });
  } catch (err: any) {
    console.error("[POST /api/community/follow] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
