import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[API /api/profile GET] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (err: any) {
    console.error('[API /api/profile GET] Unexpected error:', err);
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

    // Map incoming fields strictly to verified database column names
    const allowedFields: Record<string, string> = {
      name: 'full_name',
      full_name: 'full_name',
      bio: 'bio',
      nationality: 'nationality',
      country: 'nationality', // Map to verified DB column 'nationality'
      phone: 'phone',
      phone_number: 'phone', // Map to verified DB column 'phone'
      gender: 'gender',
      website: 'website',
      twitter: 'twitter',
      linkedin: 'linkedin',
      youtube: 'youtube',
      instagram: 'instagram',
      avatar_url: 'avatar_url',
      specialty: 'specialty',
      academy_name: 'academy_name',
      academy_tagline: 'academy_tagline',
      academic_background: 'academic_background',
      certifications: 'certifications',
      payment_methods: 'payment_methods',
      preferred_payment_method: 'preferred_payment_method',
    };

    const updates: Record<string, any> = {};
    for (const [bodyKey, dbCol] of Object.entries(allowedFields)) {
      if (body[bodyKey] !== undefined) {
        updates[dbCol] = body[bodyKey];
      }
    }

    // Ensure non-existent columns are never passed to profiles table
    delete updates.country;
    delete updates.phone_number;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
    }

    let { data, error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[API /api/profile PUT] Trying with supabaseAdmin fallback:', error.message);
      const { supabaseAdmin } = await import('@/lib/supabase/admin');
      const adminRes = await supabaseAdmin
        .from('profiles')
        .update(updates as any)
        .eq('id', user.id)
        .select()
        .maybeSingle();

      data = adminRes.data;
      error = adminRes.error;
    }

    if (error) {
      console.error('[API /api/profile PUT] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sync Auth user_metadata as well
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/admin');
      const currentMeta = user.user_metadata || {};
      const metaUpdates: Record<string, any> = {};
      if (updates.full_name) {
        metaUpdates.full_name = updates.full_name;
        metaUpdates.name = updates.full_name;
      }
      if (updates.nationality) {
        metaUpdates.nationality = updates.nationality;
        metaUpdates.country = updates.nationality;
      }
      if (updates.phone) {
        metaUpdates.phone = updates.phone;
        metaUpdates.phone_number = updates.phone;
      }
      if (updates.gender) {
        metaUpdates.gender = updates.gender;
      }
      if (updates.academy_name) {
        metaUpdates.academy_name = updates.academy_name;
      }

      if (Object.keys(metaUpdates).length > 0) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...currentMeta,
            ...metaUpdates,
          },
        });
      }
    } catch (metaErr) {
      console.warn('[API /api/profile PUT] user_metadata sync warning:', metaErr);
    }

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (err: any) {
    console.error('[API /api/profile PUT] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
