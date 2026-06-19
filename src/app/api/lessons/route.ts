import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify auth session from cookie
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { id, sectionId, title, description, content, videoUrl, durationMin, order } = body;

    if (!sectionId || !title) {
      return NextResponse.json({ error: 'sectionId et title sont requis' }, { status: 400 });
    }

    // Verify that the section belongs to a course owned by the current user (instructor)
    const { data: section, error: sectionError } = await supabase
      .from('course_sections')
      .select('course_id')
      .eq('id', sectionId)
      .maybeSingle();

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section introuvable' }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', section.course_id)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Cours de la section introuvable' }, { status: 404 });
    }

    if (course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data, error } = await supabase.from('lessons').insert({
      id: id || undefined,
      section_id: sectionId,
      title,
      description: description || '',
      content: content || '',
      video_url: videoUrl || '',
      duration_minutes: durationMin ?? 0,
      sort_order: order ?? 0,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error('[API /lessons POST] Supabase error:', error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ lesson: data }, { status: 201 });
  } catch (err: any) {
    console.error('[API /lessons POST] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id est requis' }, { status: 400 });
    }

    // Get lesson and verify ownership through section and course
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('section_id')
      .eq('id', id)
      .maybeSingle();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 });
    }

    const { data: section, error: sectionError } = await supabase
      .from('course_sections')
      .select('course_id')
      .eq('id', lesson.section_id)
      .maybeSingle();

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section de la leçon introuvable' }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', section.course_id)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Cours de la leçon introuvable' }, { status: 404 });
    }

    if (course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const sbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) sbUpdates.title = updates.title;
    if (updates.description !== undefined) sbUpdates.description = updates.description;
    if (updates.content !== undefined) sbUpdates.content = updates.content;
    if (updates.videoUrl !== undefined) sbUpdates.video_url = updates.videoUrl;
    if (updates.durationMin !== undefined) sbUpdates.duration_minutes = updates.durationMin;
    if (updates.order !== undefined) sbUpdates.sort_order = updates.order;
    sbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('lessons')
      .update(sbUpdates as any)
      .eq('id', id)
      .select().single();

    if (error) {
      console.error('[API /lessons PUT] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ lesson: data }, { status: 200 });
  } catch (err: any) {
    console.error('[API /lessons PUT] Unexpected error:', err);
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

    // Get lesson and verify ownership through section and course
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('section_id')
      .eq('id', id)
      .maybeSingle();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 });
    }

    const { data: section, error: sectionError } = await supabase
      .from('course_sections')
      .select('course_id')
      .eq('id', lesson.section_id)
      .maybeSingle();

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section de la leçon introuvable' }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', section.course_id)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Cours de la leçon introuvable' }, { status: 404 });
    }

    if (course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API /lessons DELETE] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API /lessons DELETE] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
