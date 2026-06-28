import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { quizId, text, choices, correctIndex } = body;

    if (!quizId || !text || !Array.isArray(choices) || choices.length < 2) {
      return NextResponse.json(
        { error: 'quizId, text et au moins 2 choices sont requis' },
        { status: 400 }
      );
    }

    // Verify ownership through quiz → course
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('course_id')
      .eq('id', quizId)
      .maybeSingle();

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz introuvable' }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', quiz.course_id)
      .maybeSingle();

    if (courseError || !course || course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        quiz_id: quizId,
        text,
        choices,
        correct_index: correctIndex ?? 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[API /questions POST] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ question: data }, { status: 201 });
  } catch (err: any) {
    console.error('[API /questions POST] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id est requis' }, { status: 400 });
    }

    // Verify ownership through question → quiz → course
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('quiz_id')
      .eq('id', id)
      .maybeSingle();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question introuvable' }, { status: 404 });
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('course_id')
      .eq('id', question.quiz_id)
      .maybeSingle();

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz introuvable' }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', quiz.course_id)
      .maybeSingle();

    if (courseError || !course || course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API /questions DELETE] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
