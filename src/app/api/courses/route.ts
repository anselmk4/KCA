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
    const { id, title, slug, description, price, createdAt } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'title et slug sont requis' }, { status: 400 });
    }

    const { data, error } = await supabase.from('courses').insert({
      id: id || undefined,
      title,
      slug,
      description: description || '',
      price: price ?? 0,
      status: 'DRAFT',
      instructor_id: user.id,
      created_at: createdAt || new Date().toISOString(),
      updated_at: createdAt || new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error('[API /courses POST] Supabase error:', error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ course: data }, { status: 201 });
  } catch (err: any) {
    console.error('[API /courses POST] Unexpected error:', err);
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

    // Map camelCase updates to snake_case Supabase columns
    const sbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) sbUpdates.title = updates.title;
    if (updates.description !== undefined) sbUpdates.description = updates.description;
    if (updates.price !== undefined) sbUpdates.price = updates.price;
    if (updates.status !== undefined) sbUpdates.status = updates.status;
    if (updates.slug !== undefined) sbUpdates.slug = updates.slug;
    if (updates.thumbnailUrl !== undefined) sbUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.previewVideoUrl !== undefined) sbUpdates.preview_video_url = updates.previewVideoUrl;
    if (updates.level !== undefined) {
      const levelMap: Record<string, string> = {
        'Débutant': 'BEGINNER',
        'Intermédiaire': 'INTERMEDIATE',
        'Avancé': 'ADVANCED',
        'Expert': 'EXPERT',
      };
      sbUpdates.level = levelMap[updates.level] || updates.level;
    }
    sbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('courses')
      .update(sbUpdates as any)
      .eq('id', id)
      .eq('instructor_id', user.id) // RLS: only own courses
      .select().single();

    if (error) {
      console.error('[API /courses PUT] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ course: data }, { status: 200 });
  } catch (err: any) {
    console.error('[API /courses PUT] Unexpected error:', err);
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

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('instructor_id', user.id);

    if (error) {
      console.error('[API /courses DELETE] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API /courses DELETE] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
