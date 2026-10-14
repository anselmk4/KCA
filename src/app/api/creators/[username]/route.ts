import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/creators/[username]
 * Public endpoint to fetch creator storefront information:
 * - Profile details (name, bio, specialty, avatar, links, academy)
 * - Published courses
 * - Published digital products (without file_url for unauthenticated visitors)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const decoded = decodeURIComponent(username || "").trim();

    if (!decoded) {
      return NextResponse.json({ error: "Identifiant créateur requis." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let targetIdentifier = decoded;

    // Handle "me" alias
    if (targetIdentifier.toLowerCase() === "me") {
      if (currentUser?.id) {
        targetIdentifier = currentUser.id;
      }
    }

    let creator: any = null;

    // 1. Try direct UUID lookup
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      targetIdentifier
    );

    if (isUUID) {
      const { data } = await (admin as any)
        .from("profiles")
        .select(
          "id, full_name, bio, specialty, avatar_url, academy_name, nationality, website, twitter, linkedin, youtube, instagram"
        )
        .eq("id", targetIdentifier)
        .maybeSingle();

      creator = data;
    }

    // 2. Try match by username or slug if column exists
    if (!creator && !isUUID && targetIdentifier.toLowerCase() !== "me") {
      try {
        const { data: byUsername } = await (admin as any)
          .from("profiles")
          .select(
            "id, full_name, bio, specialty, avatar_url, academy_name, nationality, website, twitter, linkedin, youtube, instagram"
          )
          .eq("username", targetIdentifier)
          .maybeSingle();
        if (byUsername) creator = byUsername;
      } catch {
        // column may not exist, ignore
      }
    }

    // 3. Try match by full_name (with hyphens replaced by spaces)
    if (!creator && targetIdentifier.toLowerCase() !== "me") {
      const cleanName = targetIdentifier.replace(/[-_]/g, " ").trim();
      const { data: byName } = await (admin as any)
        .from("profiles")
        .select(
          "id, full_name, bio, specialty, avatar_url, academy_name, nationality, website, twitter, linkedin, youtube, instagram"
        )
        .ilike("full_name", `%${cleanName}%`)
        .maybeSingle();

      if (byName) creator = byName;
    }

    // 4. Fallback if "me" was requested anonymously, find first instructor with published content
    if (!creator && targetIdentifier.toLowerCase() === "me") {
      // Find author of latest published digital product or course
      const { data: latestDp } = await (admin as any)
        .from("digital_products")
        .select("author_id")
        .eq("status", "published")
        .limit(1)
        .maybeSingle();

      const fallbackAuthorId = latestDp?.author_id;
      if (fallbackAuthorId) {
        const { data: fallbackProfile } = await (admin as any)
          .from("profiles")
          .select(
            "id, full_name, bio, specialty, avatar_url, academy_name, nationality, website, twitter, linkedin, youtube, instagram"
          )
          .eq("id", fallbackAuthorId)
          .maybeSingle();
        if (fallbackProfile) creator = fallbackProfile;
      }
    }

    if (!creator) {
      return NextResponse.json(
        { error: "Créateur introuvable.", creator: null, courses: [], digitalProducts: [] },
        { status: 404 }
      );
    }

    const creatorId = creator.id;

    // 5. Fetch published courses
    const { data: coursesData } = await (admin as any)
      .from("courses")
      .select("id, title, slug, description, price, level, thumbnail_url, type")
      .eq("instructor_id", creatorId)
      .eq("status", "PUBLISHED")
      .order("created_at", { ascending: false });

    // 6. Fetch published digital products
    const { data: digitalProductsData } = await (admin as any)
      .from("digital_products")
      .select(
        "id, author_id, title, description, cover_image_url, price, category, tags, status, file_name, file_size_bytes, preview_url, created_at, file_url"
      )
      .eq("author_id", creatorId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    const isCurrentAuthor = currentUser && currentUser.id === creatorId;

    // Sanitize file_url for unauthenticated or non-author viewers
    const sanitizedProducts = (digitalProductsData || []).map((p: any) => {
      const { file_url, ...safeRest } = p;
      return {
        ...safeRest,
        has_file: !!file_url,
        file_url: isCurrentAuthor ? file_url : undefined,
      };
    });

    return NextResponse.json({
      creator,
      courses: coursesData || [],
      digitalProducts: sanitizedProducts,
    });
  } catch (err: any) {
    console.error("[CreatorStorefront API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du chargement de la vitrine.", creator: null, courses: [], digitalProducts: [] },
      { status: 500 }
    );
  }
}
