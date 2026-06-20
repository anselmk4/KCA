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
    const { id, title, slug, description, price, createdAt, category, level } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'title et slug sont requis' }, { status: 400 });
    }

    const categoryMap: Record<string, string> = {
      'Blockchain': 'fb9c0236-be6a-4dca-aeaf-b477c88e00cd',
      'Trading': '009ac13c-d11d-4534-ac66-4c2721d2e4b0',
      'Intelligence Artificielle': '989d3629-27ea-4f72-8c59-6f0d67e1560b',
      'Web3': '835d8056-a165-4765-ad81-1269511a9c2e',
      'DeFi': '14902f78-5882-4a0a-891a-88744fbdfc52',
      'NFT & Métavers': 'b6460629-d489-41e2-bd86-cedbb1873f5a',
      'Sécurité': 'b5a88db2-1425-47cd-824f-99b909010ae7',
      'Minage': '945f9e8a-c181-4bc9-91a6-26188c46232c'
    };
    const categoryId = categoryMap[category] || null;

    const levelMap: Record<string, string> = {
      'Débutant': 'BEGINNER',
      'Intermédiaire': 'INTERMEDIATE',
      'Avancé': 'ADVANCED',
      'Expert': 'EXPERT',
    };
    const mappedLevel = (levelMap[level] || 'BEGINNER') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

    const { data, error } = await supabase.from('courses').insert({
      id: id || undefined,
      title,
      slug,
      description: description || '',
      price: price ?? 0,
      status: 'DRAFT',
      instructor_id: user.id,
      category_id: categoryId,
      level: mappedLevel,
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
    if (updates.category !== undefined) {
      const categoryMap: Record<string, string> = {
        'Blockchain': 'fb9c0236-be6a-4dca-aeaf-b477c88e00cd',
        'Trading': '009ac13c-d11d-4534-ac66-4c2721d2e4b0',
        'Intelligence Artificielle': '989d3629-27ea-4f72-8c59-6f0d67e1560b',
        'Web3': '835d8056-a165-4765-ad81-1269511a9c2e',
        'DeFi': '14902f78-5882-4a0a-891a-88744fbdfc52',
        'NFT & Métavers': 'b6460629-d489-41e2-bd86-cedbb1873f5a',
        'Sécurité': 'b5a88db2-1425-47cd-824f-99b909010ae7',
        'Minage': '945f9e8a-c181-4bc9-91a6-26188c46232c'
      };
      sbUpdates.category_id = categoryMap[updates.category] || null;
    }
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
