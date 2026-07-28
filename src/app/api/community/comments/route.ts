import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/community/comments
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { postId, content, parentId } = body;

    if (!postId || !content || !content.trim()) {
      return NextResponse.json({ error: "postId et content requis" }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    const { data: profile } = await dbClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const newComment = {
      id: crypto.randomUUID(),
      post_id: postId,
      user_id: user.id,
      parent_id: parentId || null,
      content: content.trim(),
      author_name: profile?.full_name || user.email?.split("@")[0] || "Membre",
      author_avatar: profile?.avatar_url || null,
      author_role: profile?.role || "STUDENT",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await dbClient
      .from("community_comments")
      .insert(newComment)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/community/comments] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/community/comments
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { commentId, content } = body;

    if (!commentId || !content || !content.trim()) {
      return NextResponse.json({ error: "commentId et content requis" }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    const { data, error } = await dbClient
      .from("community_comments")
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ comment: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/community/comments?id=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase) as any;

    const { error } = await dbClient
      .from("community_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
