import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/community/posts
 * Returns posts with comments and current user's reaction from PostgreSQL DB.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    // 1. Fetch posts from DB
    const { data: posts, error: postsErr } = await dbClient
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (postsErr) {
      console.error("[GET /api/community/posts] Posts query error:", postsErr.message);
      return NextResponse.json({ posts: [] }, { status: 200 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] }, { status: 200 });
    }

    const postIds = posts.map((p: any) => p.id);

    // 2. Fetch comments for all loaded posts
    const { data: comments } = await dbClient
      .from("community_comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    // Group comments by post_id and organize parent/replies
    const commentsByPost: Record<string, any[]> = {};
    (comments || []).forEach((c: any) => {
      if (!commentsByPost[c.post_id]) {
        commentsByPost[c.post_id] = [];
      }
      commentsByPost[c.post_id].push({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        parent_id: c.parent_id || null,
        content: c.content,
        created_at: c.created_at,
        author_name: c.author_name || "Membre",
        author_avatar: c.author_avatar || null,
        author_role: c.author_role || "STUDENT",
        replies: [],
      });
    });

    // Structure nested replies
    Object.keys(commentsByPost).forEach((pId) => {
      const allList = commentsByPost[pId];
      const parentList: any[] = [];
      const replyMap = new Map<string, any[]>();

      allList.forEach((c) => {
        if (c.parent_id) {
          if (!replyMap.has(c.parent_id)) replyMap.set(c.parent_id, []);
          replyMap.get(c.parent_id)!.push(c);
        } else {
          parentList.push(c);
        }
      });

      parentList.forEach((parent) => {
        parent.replies = replyMap.get(parent.id) || [];
      });

      commentsByPost[pId] = parentList;
    });

    // 3. Fetch user reactions if logged in
    let userReactionsMap: Record<string, string> = {};
    if (user) {
      const { data: reactions } = await dbClient
        .from("community_post_reactions")
        .select("post_id, reaction_type")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      (reactions || []).forEach((r: any) => {
        userReactionsMap[r.post_id] = r.reaction_type;
      });
    }

    // 4. Format final posts response
    const formattedPosts = posts.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      category: p.category || "REFLECTIONS",
      title: p.title || null,
      content: p.content,
      resource_url: p.resource_url || null,
      media_urls: p.media_urls || null,
      likes_count: p.likes_count || 0,
      reactions_count: p.reactions_count || { LIKE: p.likes_count || 0, BRAVO: 0, INTERESTING: 0, GENIUS: 0, LOVE: 0 },
      user_reaction: userReactionsMap[p.id] || null,
      created_at: p.created_at,
      author_name: p.author_name || "Membre Ansella",
      author_avatar: p.author_avatar || null,
      author_role: p.author_role || "STUDENT",
      comments: commentsByPost[p.id] || [],
    }));

    return NextResponse.json({ posts: formattedPosts }, { status: 200 });

  } catch (err: any) {
    console.error("[GET /api/community/posts] Error:", err);
    return NextResponse.json({ posts: [] }, { status: 200 });
  }
}

/**
 * POST /api/community/posts
 * Creates a new community post in PostgreSQL DB.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, resourceUrl, mediaUrls } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Le contenu est requis." }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    // Fetch user profile for display name and avatar
    const { data: profile } = await dbClient
      .from("profiles")
      .select("full_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();

    const newPost = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title?.trim() || null,
      content: content.trim(),
      category: category || "REFLECTIONS",
      resource_url: resourceUrl?.trim() || null,
      media_urls: Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : null,
      likes_count: 0,
      reactions_count: { LIKE: 0, BRAVO: 0, INTERESTING: 0, GENIUS: 0, LOVE: 0 },
      author_name: profile?.full_name || user.email?.split("@")[0] || "Membre Ansella",
      author_avatar: profile?.avatar_url || null,
      author_role: profile?.role || "STUDENT",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await dbClient
      .from("community_posts")
      .insert(newPost)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/community/posts] Insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      post: {
        ...data,
        comments: [],
        user_reaction: null,
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/community/posts] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/community/posts
 * Handles post reactions (LIKE, BRAVO, INTERESTING, GENIUS, LOVE) with DB persistence.
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { postId, reactionType } = body;

    if (!postId || !reactionType) {
      return NextResponse.json({ error: "postId et reactionType sont requis." }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    // Fetch existing post
    const { data: post, error: postErr } = await dbClient
      .from("community_posts")
      .select("id, likes_count, reactions_count")
      .eq("id", postId)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    }

    // Check current reaction
    const { data: existingReaction } = await dbClient
      .from("community_post_reactions")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    let reactionsCount = post.reactions_count || { LIKE: post.likes_count || 0, BRAVO: 0, INTERESTING: 0, GENIUS: 0, LOVE: 0 };
    let newReactionType: string | null = reactionType;

    if (existingReaction && existingReaction.reaction_type === reactionType) {
      // Toggle off
      newReactionType = null;
      await dbClient.from("community_post_reactions").delete().eq("id", existingReaction.id);
      reactionsCount[reactionType] = Math.max((reactionsCount[reactionType] || 1) - 1, 0);
    } else {
      if (existingReaction) {
        // Change existing reaction
        reactionsCount[existingReaction.reaction_type] = Math.max((reactionsCount[existingReaction.reaction_type] || 1) - 1, 0);
        await dbClient.from("community_post_reactions").update({ reaction_type: reactionType }).eq("id", existingReaction.id);
      } else {
        // Insert new reaction
        await dbClient.from("community_post_reactions").insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        });
      }
      reactionsCount[reactionType] = (reactionsCount[reactionType] || 0) + 1;
    }

    const totalLikes = Object.values(reactionsCount).reduce((a: any, b: any) => Number(a) + Number(b), 0);

    // Update post counts
    await dbClient
      .from("community_posts")
      .update({
        likes_count: totalLikes,
        reactions_count: reactionsCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", postId);

    return NextResponse.json({
      success: true,
      user_reaction: newReactionType,
      likes_count: totalLikes,
      reactions_count: reactionsCount
    });

  } catch (err: any) {
    console.error("[PATCH /api/community/posts] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/community/posts?id=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    const { error } = await dbClient
      .from("community_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
