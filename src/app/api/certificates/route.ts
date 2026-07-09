import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/supabase/notifications-helper';

// Initialize admin client to bypass RLS restrictions on certificate creation and quiz queries
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/certificates
 * Body: { courseId: string }
 * Vérifie côté serveur :
 *   1. Enrollment actif
 *   2. 100% des leçons complétées (ou progress_percent >= 100)
 *   3. Tous les quiz du cours passés avec score >= pass_percentage
 * Si éligible → crée le certificat dans Supabase et retourne le certificat.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const activeClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, studentId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId est requis' }, { status: 400 });
    }

    let targetStudentId = user.id;

    if (studentId && studentId !== user.id) {
      // Verify instructor roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id);
      const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
      const isPrivileged = roles.some(r => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));
      if (!isPrivileged) {
        return NextResponse.json({ error: "Non autorisé à émettre ce certificat" }, { status: 403 });
      }
      targetStudentId = studentId;
    }

    // 1. Vérifier enrollment actif ou complété
    const { data: enrollment, error: enrollError } = await activeClient
      .from('enrollments')
      .select('id, progress_percent, status')
      .eq('student_id', targetStudentId)
      .eq('course_id', courseId)
      .in('status', ['ACTIVE', 'COMPLETED'])
      .maybeSingle();

    if (enrollError || !enrollment) {
      return NextResponse.json(
        { error: 'L\'inscription est introuvable ou inactive pour cet étudiant', eligible: false },
        { status: 403 }
      );
    }

    // 2. Vérifier que le cours existe et est publié
    const { data: course, error: courseError } = await activeClient
      .from('courses')
      .select('id, title, status')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Cours introuvable', eligible: false }, { status: 404 });
    }

    // 3. Calculer total des leçons du cours
    const { data: sections } = await activeClient
      .from('course_sections')
      .select('id')
      .eq('course_id', courseId);

    const sectionIds = (sections || []).map(s => s.id);

    const { count: totalLessons } = await activeClient
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .in('section_id', sectionIds.length > 0 ? sectionIds : ['__none__']);

    // 4. Vérifier leçons complétées
    const { count: completedLessons } = await activeClient
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_id', enrollment.id)
      .eq('completed', true);

    const allLessonsDone =
      (totalLessons !== null &&
        totalLessons > 0 &&
        completedLessons !== null &&
        completedLessons >= totalLessons) ||
      (enrollment.progress_percent !== null && enrollment.progress_percent >= 100);

    if (!allLessonsDone) {
      return NextResponse.json(
        {
          error: `Leçons non complétées : ${completedLessons || 0}/${totalLessons || 0} (requis: 100%)`,
          eligible: false,
          completedLessons: completedLessons || 0,
          totalLessons: totalLessons || 0,
        },
        { status: 400 }
      );
    }

    // 5. Vérifier tous les quiz du cours (le cumul doit être >= 80%)
    const { data: quizzes } = await activeClient
      .from('quizzes')
      .select('id, title')
      .eq('course_id', courseId);

    if (quizzes && quizzes.length > 0) {
      const quizIds = quizzes.map(q => q.id);
      const { data: attempts } = await activeClient
        .from('quiz_attempts')
        .select('quiz_id, score')
        .eq('student_id', targetStudentId)
        .in('quiz_id', quizIds);

      let totalBestScore = 0;
      quizzes.forEach(quiz => {
        const quizAttemptsForQuiz = attempts?.filter(a => a.quiz_id === quiz.id) || [];
        const bestScoreForQuiz = quizAttemptsForQuiz.length > 0 ? Math.max(...quizAttemptsForQuiz.map(a => a.score)) : 0;
        totalBestScore += bestScoreForQuiz;
      });
      const quizAverage = totalBestScore / quizzes.length;

      if (quizAverage < 80) {
        return NextResponse.json(
          {
            error: `Le cumul moyen des quiz doit être supérieur ou égal à 80% (Moyenne actuelle : ${Math.round(quizAverage)}%)`,
            eligible: false,
          },
          { status: 400 }
        );
      }
    }

    // 6. Vérifier si un certificat existe déjà
    const { data: existingCert } = await activeClient
      .from('certificates')
      .select('id, code, issued_at')
      .eq('student_id', targetStudentId)
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

    const { data: certificate, error: certError } = await activeClient
      .from('certificates')
      .insert({
        student_id: targetStudentId,
        course_id: courseId,
        code,
        issued_at: new Date().toISOString(),
        status: 'ISSUED',
      })
      .select()
      .single();

    if (certError) {
      console.error('[API /certificates POST] Supabase insert error:', certError.message);
      return NextResponse.json({ error: certError.message }, { status: 400 });
    }

    // 8. Marquer l'enrollment comme COMPLETED
    await activeClient
      .from('enrollments')
      .update({ status: 'COMPLETED', progress_percent: 100 })
      .eq('id', enrollment.id);

    // Notify the student that their certificate is available
    try {
      await createNotification({
        userId: targetStudentId,
        title: "Certificat disponible !",
        message: `Votre certificat pour la formation "${course.title}" a été généré avec succès.`,
        type: "SUCCESS",
        link: `/dashboard/certificates`
      });
    } catch (err) {
      console.error('[API certificates POST] Error triggering notification:', err);
    }

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
