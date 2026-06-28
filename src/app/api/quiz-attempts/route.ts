import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/quiz-attempts
 * Body: { quizId: string, courseId: string, answers: Record<string, number> }
 * Valide les réponses côté serveur, calcule le score, enregistre dans quiz_attempts.
 * Retourne { score, passed, attempt }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { quizId, courseId, answers } = body;
    // answers = { [questionId]: selectedIndex }

    if (!quizId || !courseId || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'quizId, courseId et answers sont requis' },
        { status: 400 }
      );
    }

    // 1. Vérifier que l'enrollment existe et est actif
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (enrollError || !enrollment) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas inscrit à ce cours' },
        { status: 403 }
      );
    }

    // 2. Vérifier que le quiz appartient au cours
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, pass_percentage')
      .eq('id', quizId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz introuvable' }, { status: 404 });
    }

    // 3. Récupérer les questions avec les bonnes réponses (validation serveur)
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, correct_index')
      .eq('quiz_id', quizId);

    if (qError || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions du quiz introuvables' }, { status: 404 });
    }

    // 4. Calculer le score côté serveur
    let correct = 0;
    for (const q of questions) {
      const submitted = answers[q.id];
      if (submitted !== undefined && submitted === q.correct_index) {
        correct++;
      }
    }

    const scorePercent = Math.round((correct / questions.length) * 100);
    const passThreshold = quiz.pass_percentage || 80;
    const passed = scorePercent >= passThreshold;

    // 5. Enregistrer la tentative dans Supabase
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        student_id: user.id,
        quiz_id: quizId,
        score: scorePercent,
        passed,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      console.error('[API /quiz-attempts POST] Supabase error:', attemptError.message);
      return NextResponse.json({ error: attemptError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        attempt,
        score: scorePercent,
        passed,
        correct,
        total: questions.length,
        passThreshold,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API /quiz-attempts POST] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

/**
 * GET /api/quiz-attempts?courseId=xxx
 * Retourne toutes les tentatives du student connecté pour un cours.
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

    // Récupérer les quiz IDs du cours
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId);

    const quizIds = (quizzes || []).map(q => q.id);

    if (quizIds.length === 0) {
      return NextResponse.json({ attempts: [] }, { status: 200 });
    }

    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('id, quiz_id, score, passed, created_at')
      .eq('student_id', user.id)
      .in('quiz_id', quizIds)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ attempts: attempts || [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
