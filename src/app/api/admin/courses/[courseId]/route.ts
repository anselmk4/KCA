import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getCallerRole(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("roles!inner(name)")
    .eq("user_id", userId) as any;

  if (!data || data.length === 0) return null;
  const names: string[] = data.map((ur: any) => ur.roles?.name).filter(Boolean);
  const priority = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "ACADEMIC_ADMIN", "FINANCE_ADMIN", "SUPPORT_AGENT"];
  for (const p of priority) {
    if (names.includes(p)) return p;
  }
  return names[0] || null;
}

const MODERATION_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "ACADEMIC_ADMIN"];

// ─── GET /api/admin/courses/[courseId] ────────────────────────────────────
// Returns complete course details with sections, lessons, quizzes & instructor profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const role = await getCallerRole(user.id);
    if (!role || !MODERATION_ROLES.includes(role)) {
      return NextResponse.json({ error: "Accès refusé - rôle de modération requis" }, { status: 403 });
    }

    // 1. Course details
    const { data: course, error: courseErr } = await supabaseAdmin
      .from("courses")
      .select(`
        *,
        categories (id, name),
        profiles:instructor_id (id, full_name, email, avatar_url, academy_name)
      `)
      .eq("id", courseId)
      .single();

    if (courseErr || !course) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    // 2. Sections
    const { data: sections } = await supabaseAdmin
      .from("course_sections")
      .select("*")
      .eq("course_id", courseId)
      .order("order", { ascending: true });

    const sectionIds = (sections || []).map(s => s.id);

    // 3. Lessons for all sections
    let lessons: any[] = [];
    if (sectionIds.length > 0) {
      const { data: lessonData } = await supabaseAdmin
        .from("lessons")
        .select("*")
        .in("section_id", sectionIds)
        .order("order", { ascending: true });
      lessons = lessonData || [];
    }

    // 4. Quizzes
    const { data: quizzes } = await supabaseAdmin
      .from("quizzes")
      .select("*")
      .eq("course_id", courseId);

    // Nest lessons inside sections
    const enrichedSections = (sections || []).map(sec => ({
      ...sec,
      lessons: lessons.filter(l => l.section_id === sec.id),
    }));

    return NextResponse.json({
      course,
      sections: enrichedSections,
      quizzes: quizzes || [],
      stats: {
        totalSections: sections?.length || 0,
        totalLessons: lessons.length,
        totalDurationMin: lessons.reduce((sum, l) => sum + (l.duration_min || l.durationMin || 0), 0),
        hasQuiz: (quizzes?.length || 0) > 0,
      }
    });
  } catch (err: any) {
    console.error("[api/admin/courses/[courseId] GET]", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// ─── PUT /api/admin/courses/[courseId] ────────────────────────────────────
// Admin updates course metadata or lesson content directly
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const role = await getCallerRole(user.id);
    if (!role || !MODERATION_ROLES.includes(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { type, courseData, lessonData, sectionData } = body;

    if (type === "course") {
      // Update course metadata
      const allowed = ["title", "slug", "description", "price", "category_id", "level", "allow_installments", "installments_count", "prerequisites", "learning_outcomes"];
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      for (const k of allowed) {
        if (courseData[k] !== undefined) updates[k] = courseData[k];
      }

      const { data: updated, error } = await supabaseAdmin
        .from("courses")
        .update(updates)
        .eq("id", courseId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, course: updated });
    }

    if (type === "lesson") {
      // Update a specific lesson
      const { lessonId, title, description, content, video_url, duration_min } = lessonData;
      if (!lessonId) return NextResponse.json({ error: "lessonId requis" }, { status: 400 });

      const { data: updatedLesson, error } = await supabaseAdmin
        .from("lessons")
        .update({
          title,
          description,
          content,
          video_url,
          duration_min,
          updated_at: new Date().toISOString()
        })
        .eq("id", lessonId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, lesson: updatedLesson });
    }

    if (type === "section") {
      // Update a specific section
      const { sectionId, title, order } = sectionData;
      if (!sectionId) return NextResponse.json({ error: "sectionId requis" }, { status: 400 });

      const { data: updatedSec, error } = await supabaseAdmin
        .from("course_sections")
        .update({ title, order })
        .eq("id", sectionId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, section: updatedSec });
    }

    return NextResponse.json({ error: "Type de modification invalide ('course', 'lesson', 'section')" }, { status: 400 });
  } catch (err: any) {
    console.error("[api/admin/courses/[courseId] PUT]", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
