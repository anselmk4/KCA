import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/certificates
 * Body: { courseId: string }
 * Vérifie côté serveur :
 *   1. Enrollment actif
 *   2. 100% des leçons complétées
 *   3. Tous les quiz du cours passés avec score >= pass_percentage
 * Si éligible → crée le certificat dans Supabase et retourne le certificat.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId est requis' }, { status: 400 });
    }

    // 1. Vérifier enrollment actif ou complété
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, progress_percent, status')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['ACTIVE', 'COMPLETED'])
      .maybeSingle();

    if (enrollError || !enrollment) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas inscrit à ce cours', eligible: false },
        { status: 403 }
      );
    }

    // 2. Vérifier que le cours existe et est publié
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, status')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Cours introuvable', eligible: false }, { status: 404 });
    }

    // 3. Calculer total des leçons du cours
    const { data: sections } = await supabase
      .from('course_sections')
      .select('id')
      .eq('course_id', courseId);

    const sectionIds = (sections || []).map(s => s.id);

    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .in('section_id', sectionIds.length > 0 ? sectionIds : ['__none__']);

    // 4. Vérifier leçons complétées
    const { count: completedLessons } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_id', enrollment.id)
      .eq('completed', true);

    const allLessonsDone =
      totalLessons !== null &&
      totalLessons > 0 &&
      completedLessons !== null &&
      completedLessons >= totalLessons;

    if (!allLessonsDone) {
      return NextResponse.json(
        {
          error: `Leçons non complétées : ${completedLessons || 0}/${totalLessons || 0}`,
          eligible: false,
          completedLessons: completedLessons || 0,
          totalLessons: totalLessons || 0,
        },
        { status: 400 }
      );
    }

    // 5. Vérifier tous les quiz du cours passés
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, pass_percentage, title')
      .eq('course_id', courseId);

    if (quizzes && quizzes.length > 0) {
      for (const quiz of quizzes) {
        const passThreshold = quiz.pass_percentage || 80;
        const { data: passedAttempts } = await supabase
          .from('quiz_attempts')
          .select('id')
          .eq('student_id', user.id)
          .eq('quiz_id', quiz.id)
          .gte('score', passThreshold)
          .limit(1);

        if (!passedAttempts || passedAttempts.length === 0) {
          return NextResponse.json(
            {
              error: `Quiz "${quiz.title}" non validé (score requis : ${passThreshold}%)`,
              eligible: false,
              failedQuiz: quiz.title,
            },
            { status: 400 }
          );
        }
      }
    }

    // 6. Vérifier si un certificat existe déjà
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('id, code, issued_at')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingCert) {
      return NextResponse.json(
        { certificate: existingCert, eligible: true, alreadyIssued: true },
        { status: 200 }
      );
    }

    // 7. Générer un code unique et créer le certificat
    const code = `CERT-${courseId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        student_id: user.id,
        course_id: courseId,
        code,
        issued_at: new Date().toISOString(),
        status: 'ISSUED',
      })
      .select()
      .single();

    if (certError) {
      console.error('[API /certificates POST] Supabase error:', certError.message);
      return NextResponse.json({ error: certError.message }, { status: 400 });
    }

    // 8. Marquer l'enrollment comme COMPLETED
    await supabase
      .from('enrollments')
      .update({ status: 'COMPLETED', progress_percent: 100 })
      .eq('id', enrollment.id);

    return NextResponse.json(
      { certificate, eligible: true, alreadyIssued: false },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API /certificates POST] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

/**
 * GET /api/certificates?courseId=xxx  (optionnel)
 * Retourne les certificats du student connecté.
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

    let query = supabase
      .from('certificates')
      .select('id, course_id, code, issued_at, status')
      .eq('student_id', user.id);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: certificates, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificates: certificates || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
