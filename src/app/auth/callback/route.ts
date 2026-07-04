import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[callback] exchangeCodeForSession error:', exchangeError.message);
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`);
  }

  // Ensure profile exists (fallback if DB trigger did not fire)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, plan, status, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const fullName =
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Utilisateur';

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email!,
      full_name: fullName,
      status: 'ACTIVE',
      plan: 'FREE',
    });

    if (insertError) {
      console.error('[callback] profile insert error:', insertError.message);
    }

    // Assign default STUDENT role if not already present
    const { data: studentRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'STUDENT')
      .single();

    if (studentRole) {
      await supabase.from('user_roles').upsert(
        { user_id: user.id, role_id: studentRole.id },
        { onConflict: 'user_id,role_id', ignoreDuplicates: true }
      );
    }
  }

  // Resolve primary role for redirect
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  let role = 'STUDENT';
  const roleNames = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];

  if (roleNames.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
  else if (roleNames.includes('ADMIN')) role = 'ADMIN';
  else if (roleNames.includes('FINANCE_ADMIN')) role = 'FINANCE_ADMIN';
  else if (roleNames.includes('ACADEMIC_ADMIN')) role = 'ACADEMIC_ADMIN';
  else if (roleNames.includes('SUPPORT_AGENT')) role = 'SUPPORT_AGENT';
  else if (roleNames.includes('INSTRUCTOR')) role = 'INSTRUCTOR';
  else if (roleNames.includes('TEACHING_ASSISTANT')) role = 'TEACHING_ASSISTANT';

  // /auth/confirmed is a special page — always honor it (email confirmation landing)
  if (next === '/auth/confirmed') {
    return NextResponse.redirect(`${origin}/auth/confirmed`);
  }

  // For all other `next` values, redirect based on role
  let targetRedirect: string;
  if (['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'ACADEMIC_ADMIN', 'SUPPORT_AGENT'].includes(role)) {
    targetRedirect = '/admin';
  } else if (['INSTRUCTOR', 'TEACHING_ASSISTANT'].includes(role)) {
    targetRedirect = '/instructor';
  } else {
    targetRedirect = '/dashboard';
  }

  return NextResponse.redirect(`${origin}${targetRedirect}`);
}
