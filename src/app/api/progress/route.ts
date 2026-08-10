import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/supabase/notifications-helper';

/**
 * POST /api/progress
 * Body: { lessonId: string, courseId: string, completed: boolean }
 * Enregistre la progression d'une leçon dans Supabase.
 * Recalcule progress_percent sur l'enrollment.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { lessonId, courseId, completed } = body;

    if (!lessonId || !courseId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'lessonId, courseId et completed sont requis' },
        { status: 400 }
      );
    }

    // 1. Vérifier que l'enrollment existe
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (enrollError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment introuvable ou inactif' },
        { status: 403 }
      );
    }

    // 2. Vérifier que la leçon appartient bien au cours
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, section_id, course_sections!inner(course_id)')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 });
    }

    const lessonCourseId = (lesson as any).course_sections?.course_id;
    if (lessonCourseId !== courseId) {
      return NextResponse.json(
        { error: 'Leçon n\'appartient pas au cours spécifié' },
        { status: 403 }
      );
    }

    // 3. Upsert lesson_progress
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: 'enrollment_id,lesson_id' }
      )
      .select()
      .single();

    if (progressError) {
      console.error('[API /progress POST] Supabase error:', progressError.message);
      return NextResponse.json({ error: progressError.message }, { status: 400 });
    }

    // 4. Recalculer progress_percent sur l'enrollment
    // Total leçons du cours
    const { data: allSections } = await supabase
      .from('course_sections')
      .select('id')
      .eq('course_id', courseId);

    const sectionIds = (allSections || []).map(s => s.id);

    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .in('section_id', sectionIds.length > 0 ? sectionIds : ['__none__']);

    const { count: completedCount } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_id', enrollment.id)
      .eq('completed', true);

    const progressPercent =
      totalLessons && totalLessons > 0
        ? Math.round(((completedCount || 0) / totalLessons) * 100)
        : 0;

    await supabase
      .from('enrollments')
      .update({ progress_percent: progressPercent })
      .eq('id', enrollment.id);

    // 5. Trigger notifications for validating chapter or course completion
    if (completed) {
      try {
        const { data: courseData } = await supabase
          .from('courses')
          .select('title, instructor_id')
          .eq('id', courseId)
          .maybeSingle();

        if (courseData?.instructor_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          const studentName = profile?.full_name || 'Un apprenant';
          const courseTitle = courseData.title || 'Formation';

          if (progressPercent >= 100) {
            await createNotification({
              userId: courseData.instructor_id,
              title: "Cours complété !",
              message: `Félicitations ! L'apprenant "${studentName}" a complété à 100% votre cours "${courseTitle}".`,
              type: "SUCCESS",
              link: `/instructor/students`
            });
          } else {
            const { data: lessonData } = await supabase
              .from('lessons')
              .select('title')
              .eq('id', lessonId)
              .maybeSingle();

            const lessonTitle = lessonData?.title || 'un chapitre';
            await createNotification({
              userId: courseData.instructor_id,
              title: "Chapitre validé !",
              message: `L'apprenant "${studentName}" a validé la leçon "${lessonTitle}" dans votre cours "${courseTitle}".`,
              type: "INFO",
              link: `/instructor/students`
            });
          }
        }
      } catch (err) {
        console.error('[API progress POST] Error sending notifications:', err);
      }
    }

    return NextResponse.json(
      { progress, progressPercent },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[API /progress POST] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

/**
 * GET /api/progress?courseId=xxx
 * Retourne la liste des lesson_progress pour le student connecté sur un cours.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId est requis' }, { status: 400 });
    }

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ progress: [] }, { status: 200 });
    }

    const { data: progress, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, completed_at')
      .eq('enrollment_id', enrollment.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ progress: progress || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
