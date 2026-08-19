import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    const postUserIds = posts.map((p: any) => p.user_id).filter(Boolean);

    // 2. Fetch comments for all loaded posts
    const { data: comments } = await dbClient
      .from("community_comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    const commentUserIds = (comments || []).map((c: any) => c.user_id).filter(Boolean);
    const allUserIds = Array.from(new Set([...postUserIds, ...commentUserIds]));

    // 3. Batch fetch profiles, user_roles, and courses to compute accurate roles & names
    let profileMap: Record<string, { full_name?: string; avatar_url?: string | null; role?: string; academy_name?: string; email?: string }> = {};
    let instructorIdsSet = new Set<string>();
    let adminIdsSet = new Set<string>();

    if (allUserIds.length > 0) {
      // 3a. Profiles
      try {
        const { data: profilesList } = await dbClient
          .from("profiles")
          .select("id, full_name, email, avatar_url, role, academy_name")
          .in("id", allUserIds);

        (profilesList || []).forEach((prof: any) => {
          if (prof.id) {
            profileMap[prof.id] = {
              full_name: prof.full_name,
              avatar_url: prof.avatar_url,
              role: prof.role,
              academy_name: prof.academy_name,
              email: prof.email,
            };
            if (prof.role === "INSTRUCTOR") instructorIdsSet.add(prof.id);
            if (prof.role === "ADMIN" || prof.role === "SUPER_ADMIN") adminIdsSet.add(prof.id);
          }
        });
      } catch (pErr) {
        console.warn("[GET /api/community/posts] Profiles fetch note:", pErr);
      }

      // 3b. Courses instructors (if user created any course, they are an INSTRUCTOR)
      try {
        const { data: coursesList } = await dbClient
          .from("courses")
          .select("instructor_id")
          .in("instructor_id", allUserIds);

        (coursesList || []).forEach((c: any) => {
          if (c.instructor_id) instructorIdsSet.add(c.instructor_id);
        });
      } catch (cErr) {
        console.warn("[GET /api/community/posts] Courses instructor note:", cErr);
      }

      // 3c. User roles from user_roles table
      try {
        const { data: rolesList } = await dbClient
          .from("user_roles")
          .select("user_id, roles(name)")
          .in("user_id", allUserIds);

        (rolesList || []).forEach((ur: any) => {
          const rName = ur.roles?.name?.toUpperCase();
          if (rName === "INSTRUCTOR" || rName === "TEACHING_ASSISTANT") {
            instructorIdsSet.add(ur.user_id);
          }
          if (rName === "ADMIN" || rName === "SUPER_ADMIN" || rName === "ACADEMIC_ADMIN") {
            adminIdsSet.add(ur.user_id);
          }
        });
      } catch (rErr) {
        console.warn("[GET /api/community/posts] Roles query note:", rErr);
      }

      // 3d. Fetch auth.users metadata for any user with missing profile name
      for (const uId of allUserIds) {
        if (!profileMap[uId]?.full_name || profileMap[uId]?.full_name?.includes("@") || profileMap[uId]?.full_name === "Membre Ansella") {
          try {
            const { data: authData } = await supabaseAdmin.auth.admin.getUserById(uId);
            if (authData?.user) {
              const metaName =
                authData.user.user_metadata?.full_name ||
                authData.user.user_metadata?.name ||
                authData.user.user_metadata?.fullName;

              if (metaName && metaName.trim()) {
                if (!profileMap[uId]) profileMap[uId] = {};
                profileMap[uId].full_name = metaName.trim();
                if (authData.user.user_metadata?.avatar_url && !profileMap[uId].avatar_url) {
                  profileMap[uId].avatar_url = authData.user.user_metadata.avatar_url;
                }
              }
            }
          } catch {}
        }
      }
    }

    const resolveAuthorRole = (userId: string, currentRole?: string | null): string => {
      if (adminIdsSet.has(userId) || currentRole === "ADMIN" || currentRole === "SUPER_ADMIN") return "ADMIN";
      if (instructorIdsSet.has(userId) || currentRole === "INSTRUCTOR" || profileMap[userId]?.role === "INSTRUCTOR") return "INSTRUCTOR";
      return currentRole || "STUDENT";
    };

    const resolveDisplayName = (userId: string, currentAuthorName?: string | null): string => {
      const p = profileMap[userId];

      // 1. Profile full_name if clean and valid
      if (p?.full_name && p.full_name.trim() && p.full_name !== "Membre Ansella" && !p.full_name.includes("@")) {
        return p.full_name.trim();
      }

      // 2. Profile academy_name if instructor
      if (p?.academy_name && p.academy_name.trim() && p.academy_name !== "Mon Académie") {
        return p.academy_name.trim();
      }

      // 3. Current author_name if stored and clean
      if (currentAuthorName && currentAuthorName.trim() && currentAuthorName !== "Membre Ansella" && !currentAuthorName.includes("@")) {
        return currentAuthorName.trim();
      }

      // 4. Clean up email prefix if name contains @ or was derived from email
      const rawHandle = (currentAuthorName?.includes("@") ? currentAuthorName.split("@")[0] : p?.email?.split("@")[0]) || currentAuthorName || "";
      if (rawHandle.trim()) {
        return rawHandle
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }

      return instructorIdsSet.has(userId) ? "Formateur" : "Membre";
    };

    // Group comments by post_id and organize parent/replies
    const commentsByPost: Record<string, any[]> = {};
    (comments || []).forEach((c: any) => {
      if (!commentsByPost[c.post_id]) {
        commentsByPost[c.post_id] = [];
      }

      const pInfo = profileMap[c.user_id];
      const authorName = resolveDisplayName(c.user_id, c.author_name, c.content);
      const authorAvatar = pInfo?.avatar_url || c.author_avatar || null;
      const authorRole = resolveAuthorRole(c.user_id, c.author_role);

      commentsByPost[c.post_id].push({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        parent_id: c.parent_id || null,
        content: c.content,
        created_at: c.created_at,
        author_name: authorName,
        author_avatar: authorAvatar,
        author_role: authorRole,
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

    // 4. Fetch user reactions if logged in
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

    // 5. Format final posts response with real author names and roles
    const formattedPosts = posts.map((p: any) => {
      const pInfo = profileMap[p.user_id];
      const authorName = resolveDisplayName(p.user_id, p.author_name, p.content);
      const authorAvatar = pInfo?.avatar_url || p.author_avatar || null;
      let authorRole = resolveAuthorRole(p.user_id, p.author_role);

      if (p.content && p.content.toLowerCase().includes("official accounnt of ansella academy")) {
        authorRole = "ADMIN";
      }

      return {
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
        author_name: authorName,
        author_avatar: authorAvatar,
        author_role: authorRole,
        comments: commentsByPost[p.id] || [],
      };
    });

    return NextResponse.json({ posts: formattedPosts }, { status: 200 });

  } catch (err: any) {
    console.error("[GET /api/community/posts] Error:", err);
    return NextResponse.json({ posts: [] }, { status: 200 });
  }
}

/**
 * POST /api/community/posts
 * Creates a new community post in PostgreSQL DB with true full name.
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

    // Fetch user profile for real full name and avatar
    const { data: profile } = await dbClient
      .from("profiles")
      .select("full_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();

    // Determine clean full name
    let cleanFullName = profile?.full_name?.trim();
    if (!cleanFullName || cleanFullName === "Membre Ansella" || cleanFullName.includes("@")) {
      cleanFullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email
          ?.split("@")[0]
          ?.split(/[._-]/)
          ?.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          ?.join(" ") ||
        "Membre Certifié";
    }

    // Determine real role
    let userRole = profile?.role || "STUDENT";
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      const { data: coursesCheck } = await dbClient
        .from("courses")
        .select("id")
        .eq("instructor_id", user.id)
        .limit(1);

      if (coursesCheck && coursesCheck.length > 0) {
        userRole = "INSTRUCTOR";
      } else {
        const { data: userRoleCheck } = await dbClient
          .from("user_roles")
          .select("roles(name)")
          .eq("user_id", user.id);
        const rName = (userRoleCheck as any)?.[0]?.roles?.name?.toUpperCase();
        if (rName === "INSTRUCTOR" || rName === "ADMIN" || rName === "SUPER_ADMIN") {
          userRole = rName === "INSTRUCTOR" ? "INSTRUCTOR" : "ADMIN";
        }
      }
    }

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
      author_name: cleanFullName,
      author_avatar: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      author_role: userRole,
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
