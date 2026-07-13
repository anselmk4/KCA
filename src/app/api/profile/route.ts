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

    // All supported profile fields
    const allowedFields: Record<string, string> = {
      name: 'full_name',
      bio: 'bio',
      nationality: 'nationality',
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

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[API /api/profile PUT] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (err: any) {
    console.error('[API /api/profile PUT] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}
