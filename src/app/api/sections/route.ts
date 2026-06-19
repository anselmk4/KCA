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
    const { id, courseId, title, order } = body;

    if (!courseId || !title) {
      return NextResponse.json({ error: 'courseId et title sont requis' }, { status: 400 });
    }

    // Verify that the course belongs to the current user (instructor)
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

    const { data, error } = await supabase.from('course_sections').insert({
      id: id || undefined,
      course_id: courseId,
      title,
      sort_order: order ?? 0,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error('[API /sections POST] Supabase error:', error.message, error.details);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ section: data }, { status: 201 });
  } catch (err: any) {
    console.error('[API /sections POST] Unexpected error:', err);
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
    const { id, title, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'id est requis' }, { status: 400 });
    }

    // Get section and verify course ownership
    const { data: section, error: sectionError } = await supabase
      .from('course_sections')
      .select('course_id')
      .eq('id', id)
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

    const sbUpdates: Record<string, any> = {};
    if (title !== undefined) sbUpdates.title = title;
    if (order !== undefined) sbUpdates.sort_order = order;

    const { data, error } = await supabase
      .from('course_sections')
      .update(sbUpdates as any)
      .eq('id', id)
      .select().single();

    if (error) {
      console.error('[API /sections PUT] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ section: data }, { status: 200 });
  } catch (err: any) {
    console.error('[API /sections PUT] Unexpected error:', err);
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

    // Get section and verify course ownership
    const { data: section, error: sectionError } = await supabase
      .from('course_sections')
      .select('course_id')
      .eq('id', id)
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

    const { error } = await supabase
      .from('course_sections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API /sections DELETE] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API /sections DELETE] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
