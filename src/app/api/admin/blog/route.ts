import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BLOG_POSTS_SEO, BlogPostSeo } from "@/data/blog-posts";

// Fallback in-memory cache for blog posts in case table is not yet migrated in Supabase
let dynamicBlogPosts: BlogPostSeo[] = [...BLOG_POSTS_SEO];

async function verifyAdminAuth(supabase: any): Promise<{ isAdmin: boolean; user: any }> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { isAdmin: false, user: null };

  try {
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("roles!inner(name)")
      .eq("user_id", user.id) as any;

    const roleNames: string[] = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);
    const isAdmin = roleNames.some((r) =>
      ["SUPER_ADMIN", "ADMIN", "MODERATOR", "ACADEMIC_ADMIN"].includes(r)
    );
    return { isAdmin, user };
  } catch {
    return { isAdmin: false, user };
  }
}

export async function GET(req: NextRequest) {
  try {
    // Attempt to load from Supabase if table exists
    const { data: dbPosts, error } = await (supabaseAdmin as any)
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbPosts && dbPosts.length > 0) {
      const formatted: BlogPostSeo[] = dbPosts.map((p: any) => ({
        slug: p.slug,
        title: p.title,
        metaTitle: p.meta_title || p.title,
        metaDesc: p.meta_desc || p.excerpt,
        excerpt: p.excerpt || "",
        publishedAt: p.published_at ? p.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        readTimeMinutes: p.read_time_minutes || 5,
        category: p.category || "Général",
        author: {
          name: p.author_name || "Équipe ANSELLA",
          role: p.author_role || "Rédaction",
          avatarUrl: p.author_avatar || undefined,
        },
        contentHtml: p.content_html || "",
        tags: p.tags || [],
      }));
      return NextResponse.json({ posts: formatted, source: "database" });
    }

    return NextResponse.json({ posts: dynamicBlogPosts, source: "memory_fallback" });
  } catch (err: any) {
    return NextResponse.json({ posts: dynamicBlogPosts, source: "memory_fallback" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, user } = await verifyAdminAuth(supabase);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Action réservée aux administrateurs" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      slug,
      metaTitle,
      metaDesc,
      excerpt,
      category,
      authorName,
      authorRole,
      contentHtml,
      tags,
      readTimeMinutes,
      isDraft,
    } = body;

    if (!title || !contentHtml) {
      return NextResponse.json({ error: "Le titre et le contenu HTML sont requis." }, { status: 400 });
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newPost: BlogPostSeo = {
      slug: cleanSlug,
      title: title.trim(),
      metaTitle: metaTitle?.trim() || `${title.trim()} | Blog ANSELLA`,
      metaDesc: metaDesc?.trim() || excerpt?.trim() || title.trim(),
      excerpt: excerpt?.trim() || "",
      publishedAt: new Date().toISOString().slice(0, 10),
      readTimeMinutes: Number(readTimeMinutes) || Math.max(1, Math.ceil((contentHtml || "").replace(/<[^>]*>/g, "").split(/\s+/).length / 200)),
      category: category || "Business & Monétisation",
      author: {
        name: authorName?.trim() || "Équipe ANSELLA",
        role: authorRole?.trim() || "Rédaction & Pédagogie",
      },
      contentHtml,
      tags: Array.isArray(tags) ? tags : (tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
    };

    // Try saving in Supabase
    try {
      await (supabaseAdmin as any).from("blog_posts").insert({
        slug: newPost.slug,
        title: newPost.title,
        meta_title: newPost.metaTitle,
        meta_desc: newPost.metaDesc,
        excerpt: newPost.excerpt,
        category: newPost.category,
        author_name: newPost.author.name,
        author_role: newPost.author.role,
        content_html: newPost.contentHtml,
        tags: newPost.tags,
        read_time_minutes: newPost.readTimeMinutes,
        status: isDraft ? "DRAFT" : "PUBLISHED",
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not insert into blog_posts table in Supabase:", e);
    }

    // Also update dynamic in-memory list
    const existingIdx = dynamicBlogPosts.findIndex((p) => p.slug === cleanSlug);
    if (existingIdx >= 0) {
      dynamicBlogPosts[existingIdx] = newPost;
    } else {
      dynamicBlogPosts.unshift(newPost);
    }

    return NextResponse.json({ success: true, post: newPost }, { status: 201 });
  } catch (err: any) {
    console.error("[API /admin/blog POST] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, user } = await verifyAdminAuth(supabase);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Action réservée aux administrateurs" }, { status: 403 });
    }

    const body = await req.json();
    const {
      originalSlug,
      title,
      slug,
      metaTitle,
      metaDesc,
      excerpt,
      category,
      authorName,
      authorRole,
      contentHtml,
      tags,
      readTimeMinutes,
    } = body;

    if (!originalSlug || !title) {
      return NextResponse.json({ error: "originalSlug et title sont requis" }, { status: 400 });
    }

    const cleanSlug = (slug || originalSlug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const updatedPost: BlogPostSeo = {
      slug: cleanSlug,
      title: title.trim(),
      metaTitle: metaTitle?.trim() || `${title.trim()} | Blog ANSELLA`,
      metaDesc: metaDesc?.trim() || excerpt?.trim() || title.trim(),
      excerpt: excerpt?.trim() || "",
      publishedAt: new Date().toISOString().slice(0, 10),
      readTimeMinutes: Number(readTimeMinutes) || Math.max(1, Math.ceil((contentHtml || "").replace(/<[^>]*>/g, "").split(/\s+/).length / 200)),
      category: category || "Business & Monétisation",
      author: {
        name: authorName?.trim() || "Équipe ANSELLA",
        role: authorRole?.trim() || "Rédaction",
      },
      contentHtml: contentHtml || "",
      tags: Array.isArray(tags) ? tags : (tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
    };

    // Update in Supabase
    try {
      await (supabaseAdmin as any)
        .from("blog_posts")
        .update({
          slug: updatedPost.slug,
          title: updatedPost.title,
          meta_title: updatedPost.metaTitle,
          meta_desc: updatedPost.metaDesc,
          excerpt: updatedPost.excerpt,
          category: updatedPost.category,
          author_name: updatedPost.author.name,
          author_role: updatedPost.author.role,
          content_html: updatedPost.contentHtml,
          tags: updatedPost.tags,
          read_time_minutes: updatedPost.readTimeMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", originalSlug);
    } catch (e) {
      console.warn("Could not update blog_posts in Supabase:", e);
    }

    // Update in memory
    const idx = dynamicBlogPosts.findIndex((p) => p.slug === originalSlug);
    if (idx >= 0) {
      dynamicBlogPosts[idx] = updatedPost;
    } else {
      dynamicBlogPosts.unshift(updatedPost);
    }

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, user } = await verifyAdminAuth(supabase);

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Action réservée aux administrateurs" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "slug est requis" }, { status: 400 });
    }

    try {
      await (supabaseAdmin as any).from("blog_posts").delete().eq("slug", slug);
    } catch {}

    dynamicBlogPosts = dynamicBlogPosts.filter((p) => p.slug !== slug);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
