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

    // 5. Fetch courses with resilient fallback (handle missing type/slug columns and casing)
    let coursesData: any[] = [];
    try {
      // 5a. Check collaborator courses
      const { data: collabData } = await (admin as any)
        .from("course_collaborators")
        .select("course_id")
        .eq("collaborator_id", creatorId);
      const collabCourseIds: string[] = (collabData || [])
        .map((c: any) => c.course_id)
        .filter((id: any): id is string => Boolean(id));

      let courseQuery = (admin as any)
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (collabCourseIds.length > 0) {
        courseQuery = courseQuery.or(
          `instructor_id.eq.${creatorId},id.in.(${collabCourseIds.join(",")})`
        );
      } else {
        courseQuery = courseQuery.eq("instructor_id", creatorId);
      }

      const { data: fetchedCourses, error: courseErr } = await courseQuery;
      if (courseErr) {
        console.warn("[CreatorStorefront API] courses select(*) error, trying safe columns:", courseErr.message);
        const { data: fallbackCourses } = await (admin as any)
          .from("courses")
          .select("id, title, description, price, thumbnail_url, status, instructor_id")
          .eq("instructor_id", creatorId);
        coursesData = fallbackCourses || [];
      } else {
        coursesData = fetchedCourses || [];
      }
    } catch (err) {
      console.error("[CreatorStorefront API] Error fetching courses:", err);
    }

    // Filter out ARCHIVED courses, keep all published/active/draft courses by this author
    const formattedCourses = (coursesData || [])
      .filter((c: any) => {
        const s = String(c.status || "").toUpperCase();
        return s !== "ARCHIVED";
      })
      .map((c: any) => ({
        id: c.id,
        title: c.title || "Formation",
        slug: c.slug || c.id,
        description: c.short_description || c.description || "",
        price: Number(c.price) || 0,
        level: c.level || "Tous niveaux",
        thumbnail_url: c.thumbnail_url || c.cover_image_url || "/placeholder-course.jpg",
        type: c.type || "course",
        status: c.status || "PUBLISHED",
      }));

    // 6. Fetch published digital products
    const { data: digitalProductsData } = await (admin as any)
      .from("digital_products")
      .select(
        "id, author_id, title, description, cover_image_url, price, category, tags, status, file_name, file_size_bytes, preview_url, created_at, file_url"
      )
      .eq("author_id", creatorId)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    const isCurrentAuthor = currentUser && currentUser.id === creatorId;

    // Sanitize file_url for unauthenticated or non-author viewers
    const sanitizedProducts = (digitalProductsData || [])
      .filter((p: any) => String(p.status || "").toLowerCase() !== "archived")
      .map((p: any) => {
        const { file_url, ...safeRest } = p;
        return {
          ...safeRest,
          has_file: !!file_url,
          file_url: isCurrentAuthor ? file_url : undefined,
        };
      });

    return NextResponse.json({
      creator,
      courses: formattedCourses,
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
