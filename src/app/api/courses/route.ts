import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY && 
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin 
      : supabase;

    // 1. Resolve authenticated user
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

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter pour créer un cours.' }, { status: 401 });
    }

    // Check user role
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', user.id) as any;

    const roleNames: string[] = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);
    const canCreateCourse = roleNames.some(r => ['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'TEACHING_ASSISTANT'].includes(r));

    if (!canCreateCourse) {
      return NextResponse.json({ error: 'Accès refusé. Rôle formateur ou administrateur requis.' }, { status: 403 });
    }

    // 2. Ensure instructor profile exists in profiles table
    const { data: existingProfile } = await dbClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      await (dbClient.from('profiles') as any).upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Formateur',
        role: 'INSTRUCTOR',
        updated_at: new Date().toISOString()
      });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      category, 
      level, 
      price, 
      type = 'academic',
      learningOutcomes,
      prerequisites
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Le titre du cours est requis' }, { status: 400 });
    }

    // Map Category
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

    const categoryId = categoryMap[category] || 'fb9c0236-be6a-4dca-aeaf-b477c88e00cd';

    // Map Level
    const levelMap: Record<string, string> = {
      'Débutant': 'BEGINNER',
      'Intermédiaire': 'INTERMEDIATE',
      'Avancé': 'ADVANCED',
      'Expert': 'EXPERT',
    };
    const mappedLevel = levelMap[level] || 'BEGINNER';

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    // Prepare course insert payload
    const coursePayload: Record<string, any> = {
      instructor_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      slug: uniqueSlug,
      description: description || null,
      level: mappedLevel,
      price: price ? parseFloat(price) : 0,
      status: 'DRAFT',
      type: type === 'self_paced' ? 'self_paced' : 'academic',
      allow_installments: type === 'academic',
      installments_count: type === 'academic' ? 3 : 1,
      learning_outcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let { data, error } = await dbClient
      .from('courses')
      .insert(coursePayload as any)
      .select()
      .single();

    if (error && (error.message?.toLowerCase().includes("type") || error.message?.toLowerCase().includes("schema cache"))) {
      delete coursePayload.type;
      const retryRes = await dbClient
        .from('courses')
        .insert(coursePayload as any)
        .select()
        .single();

      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error('[API /courses POST] Supabase insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Auto-create initial section
    if (data) {
      try {
        await dbClient.from('course_sections').insert({
          course_id: data.id,
          title: 'Module 1 : Introduction',
          sort_order: 1
        });
      } catch (secErr) {
        console.warn('[API /courses POST] Warning creating initial section:', secErr);
      }
    }

    return NextResponse.json({ course: data }, { status: 201 });
  } catch (err: any) {
    console.error('[API /courses POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
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

    // BOLA Authorization Check: Verify caller is course owner or admin
    const { data: existingCourse, error: fetchErr } = await dbClient
      .from('courses')
      .select('id, instructor_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existingCourse) {
      return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 });
    }

    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', user.id) as any;

    const roleNames: string[] = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);
    const isAdmin = roleNames.some(r => ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_ADMIN'].includes(r));
    const isOwner = existingCourse.instructor_id === user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé. Vous n'êtes pas autorisé à modifier ce cours." }, { status: 403 });
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
    if (updates.status !== undefined && isAdmin) sbUpdates.status = updates.status;
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

    let { data, error } = await dbClient
      .from('courses')
      .update(sbUpdates as any)
      .eq('id', id)
      .select().single();

    // Fallback if 'type' column missing in schema cache
    if (error && (error.message?.toLowerCase().includes("type") || error.message?.toLowerCase().includes("schema cache"))) {
      delete sbUpdates.type;
      const retryRes = await dbClient
        .from('courses')
        .update(sbUpdates as any)
        .eq('id', id)
        .select().single();

      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error('[API /courses PUT] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ course: data });
  } catch (err: any) {
    console.error('[API /courses PUT] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
