import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function canUserEditSection(userId: string, sectionId: string): Promise<boolean> {
  const { data: section } = await supabaseAdmin
    .from('course_sections')
    .select('course_id')
    .eq('id', sectionId)
    .maybeSingle();

  if (!section) return false;

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('instructor_id')
    .eq('id', section.course_id)
    .maybeSingle();

  if (!course) return false;
  if (course.instructor_id === userId) return true;

  const { data: collab } = await supabaseAdmin
    .from('course_collaborators')
    .select('id')
    .eq('course_id', section.course_id)
    .eq('collaborator_id', userId)
    .maybeSingle();

  if (collab) return true;

  try {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const metaRole = userData?.user?.user_metadata?.role;
    if (metaRole === 'SUPER_ADMIN' || metaRole === 'ADMIN') return true;
  } catch {
    // Ignore Auth error
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { id, sectionId, title, description, content, videoUrl, durationMin, order } = body;

    if (!sectionId || !title) {
      return NextResponse.json({ error: 'sectionId et title sont requis' }, { status: 400 });
    }

    const canEdit = await canUserEditSection(user.id, sectionId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.from('lessons').insert({
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

    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('section_id')
      .eq('id', id)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 });
    }

    const canEdit = await canUserEditSection(user.id, lesson.section_id);
    if (!canEdit) {
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

    const { data, error } = await supabaseAdmin
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

    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('section_id')
      .eq('id', id)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: 'Leçon introuvable' }, { status: 404 });
    }

    const canEdit = await canUserEditSection(user.id, lesson.section_id);
    if (!canEdit) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
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
