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
    const { courseId, sectionId, title, passPercentage } = body;

    if (!courseId || !title) {
      return NextResponse.json({ error: 'courseId et title sont requis' }, { status: 400 });
    }

    // Verify course ownership
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 });
    }

    if (course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        course_id: courseId,
        section_id: sectionId || null,
        title,
        pass_percentage: passPercentage ?? 70,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[API /quizzes POST] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ quiz: data }, { status: 201 });
  } catch (err: any) {
    console.error('[API /quizzes POST] Unexpected error:', err);
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

    // Verify ownership through course
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('course_id')
      .eq('id', id)
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

    // Delete questions first (cascade safety)
    await supabase.from('questions').delete().eq('quiz_id', id);

    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API /quizzes DELETE] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
