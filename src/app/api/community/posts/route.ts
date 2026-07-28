import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/community/posts
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    const { data: posts, error } = await dbClient
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ posts: [] }, { status: 200 });
    }

    return NextResponse.json({ posts: posts || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ posts: [] }, { status: 200 });
  }
}

/**
 * POST /api/community/posts
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
      return NextResponse.json({ error: "Le contenu est requis" }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    // Fetch profile
    const { data: profile } = await dbClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const newPost = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title?.trim() || null,
      content: content.trim(),
      category: category || "REFLECTIONS",
      resource_url: resourceUrl?.trim() || null,
      media_urls: Array.isArray(mediaUrls) ? mediaUrls : null,
      likes_count: 0,
      author_name: profile?.full_name || user.email?.split("@")[0] || "Membre",
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
      console.error("[POST /api/community/posts] Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/community/posts] Unexpected error:", err);
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
