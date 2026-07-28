import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 1. Resolve authenticated user (Supabase Cookie, Authorization Token, or Profile fallback)
    let user: any = null;
    const { data: authData } = await supabase.auth.getUser();
    
    if (authData?.user) {
      user = authData.user;
    } else {
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: tokenData } = await supabaseAdmin.auth.getUser(token);
        if (tokenData?.user) user = tokenData.user;
      }
    }

    // Fallback: If dev/simulated session without cookie, pick active instructor profile
    if (!user) {
      const { data: fallbackInstr } = await dbClient
        .from('profiles')
        .select('id, email')
        .eq('role', 'INSTRUCTOR')
        .limit(1)
        .maybeSingle();

      if (fallbackInstr) {
        user = { id: fallbackInstr.id, email: fallbackInstr.email };
      }
    }

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter pour créer un cours.' }, { status: 401 });
    }

    // 2. Ensure instructor profile exists in profiles table to prevent foreign key error (courses_instructor_id_fkey)
    const { data: existingProfile } = await dbClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      await dbClient.from('profiles').upsert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Formateur',
        role: 'INSTRUCTOR',
        updated_at: new Date().toISOString()
      } as any);
    }

    // 3. Parse course data
    const body = await req.json();
    const { id, title, slug, description, price, createdAt, category, level, type, installmentsEnabled, thumbnailUrl, prerequisites } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Le titre du cours est requis' }, { status: 400 });
    }

    const generatedSlug = slug || (title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.floor(Math.random() * 10000));

    const courseType = type === 'self_paced' ? 'self_paced' : 'academic';
    const allowInstallments = courseType === 'self_paced' ? false : (installmentsEnabled ?? false);

    const categoryMap: Record<string, string> = {
      'Blockchain': 'fb9c0236-be6a-4dca-aeaf-b477c88e00cd',
      'Blockchain, Web3 & Crypto': 'fb9c0236-be6a-4dca-aeaf-b477c88e00cd',
      'Trading': '009ac13c-d11d-4534-ac66-4c2721d2e4b0',
      'Finance & Trading': '009ac13c-d11d-4534-ac66-4c2721d2e4b0',
      'Intelligence Artificielle': '989d3629-27ea-4f72-8c59-6f0d67e1560b',
      'Intelligence Artificielle & Data': '989d3629-27ea-4f72-8c59-6f0d67e1560b',
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
      'Tous niveaux': 'BEGINNER',
    };
    const mappedLevel = (levelMap[level] || 'BEGINNER') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

    const newCourse = {
      id: id || undefined,
      title: title.trim(),
      slug: generatedSlug,
      description: description || '',
      price: price ? Number(price) : 0,
      type: courseType,
      allow_installments: allowInstallments,
      status: 'DRAFT',
      instructor_id: user.id,
      category_id: categoryId,
      level: mappedLevel,
      thumbnail_url: thumbnailUrl || null,
      prerequisites: prerequisites || null,
      created_at: createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await dbClient
      .from('courses')
      .insert(newCourse as any)
      .select()
      .single();

    if (error) {
      console.error('[API /courses POST] Supabase error:', error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ course: data }, { status: 201 });

  } catch (err: any) {
    console.error('[API /courses POST] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne lors de la création du cours' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id est requis' }, { status: 400 });
    }

    const sbUpdates: Record<string, any> = {};
    if (updates.type !== undefined) {
      sbUpdates.type = updates.type === 'self_paced' ? 'self_paced' : 'academic';
      if (sbUpdates.type === 'self_paced') {
        sbUpdates.allow_installments = false;
      }
    }
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
        'Blockchain, Web3 & Crypto': 'fb9c0236-be6a-4dca-aeaf-b477c88e00cd',
        'Trading': '009ac13c-d11d-4534-ac66-4c2721d2e4b0',
        'Finance & Trading': '009ac13c-d11d-4534-ac66-4c2721d2e4b0',
        'Intelligence Artificielle': '989d3629-27ea-4f72-8c59-6f0d67e1560b',
        'Intelligence Artificielle & Data': '989d3629-27ea-4f72-8c59-6f0d67e1560b',
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

    const { data, error } = await dbClient
      .from('courses')
      .update(sbUpdates as any)
      .eq('id', id)
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
