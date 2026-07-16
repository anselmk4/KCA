import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service role admin client to bypass any client-side RLS constraints
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type'); // 'signup', 'recovery', 'invite', etc.
  let next = searchParams.get('next') ?? '/dashboard';
  // Prevent Open Redirects: ensure it is a relative path starting with '/' and not '//'
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard';
  }

  const supabase = await createClient();

  // ── Path 1: OTP / token_hash flow
  // Modern Supabase email confirmation links send ?token_hash=...&type=signup
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });

    if (error) {
      console.error('[callback] verifyOtp error:', error.message);
      return NextResponse.redirect(
        `${origin}/login?error=auth-failed&reason=${encodeURIComponent(error.message)}`
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/login?error=auth-failed`);

    const role = await bootstrapUserAndGetRole(user);
    return NextResponse.redirect(`${origin}/auth/confirmed?role=${role}`);
  }

  // ── Path 2: OAuth PKCE code flow (Google OAuth + older Supabase magic links)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[callback] exchangeCodeForSession error:', exchangeError.message);

      // If code exchange fails and we were expecting an email confirmation,
      // fall through to /auth/confirmed client-side so the SDK can retry.
      if (type === 'signup' || next === '/auth/confirmed') {
        return NextResponse.redirect(
          `${origin}/auth/confirmed?code=${code}&next=${encodeURIComponent(next)}`
        );
      }
      return NextResponse.redirect(`${origin}/login?error=auth-failed`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/login?error=auth-failed`);

    const role = await bootstrapUserAndGetRole(user);

    // Always redirect to /auth/confirmed when that was the intended destination
    if (next === '/auth/confirmed') {
      return NextResponse.redirect(`${origin}/auth/confirmed?role=${role}`);
    }

    // Otherwise redirect directly to the role dashboard
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

  // Neither token_hash nor code present
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}

/**
 * Bootstraps the user's profile and roles in the database using admin privileges and returns the resolved role name.
 */
async function bootstrapUserAndGetRole(user: any): Promise<string> {
  // Read intended role from metadata — default to STUDENT
  const targetRole: string = (user.user_metadata?.role || 'STUDENT').toUpperCase();
  const fullName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  console.log(`[callback] bootstrapUserAndGetRole — targetRole=${targetRole}, userId=${user.id}`);

  // 1. Ensure profile exists (using admin client to bypass RLS)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: user.id,
      email: user.email!,
      full_name: fullName,
      status: 'ACTIVE',
      plan: 'FREE',
    });
    if (insertError) {
      console.error('[callback] profile insert error:', insertError.message);
    }
  }

  // 2. Enforce the correct role — always clean up conflicting roles first
  const { data: targetDbRole } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', targetRole)
    .single();

  if (targetDbRole) {
    // ALWAYS remove STUDENT role when the intended role is INSTRUCTOR
    // This handles the race condition where the DB trigger auto-assigns STUDENT
    // before our callback has a chance to set the correct role.
    if (targetRole === 'INSTRUCTOR' || targetRole === 'TEACHING_ASSISTANT') {
      const { data: studentDbRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'STUDENT')
        .single();

      if (studentDbRole) {
        const { error: delErr } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role_id', studentDbRole.id);
        if (delErr) {
          console.error('[callback] error deleting STUDENT role for instructor:', delErr.message);
        } else {
          console.log('[callback] STUDENT role removed for INSTRUCTOR user');
        }
      }
    }

    // Assign the correct target role (upsert is safe — idempotent)
    const { error: upsertErr } = await supabaseAdmin.from('user_roles').upsert(
      { user_id: user.id, role_id: targetDbRole.id },
      { onConflict: 'user_id,role_id', ignoreDuplicates: true }
    );
    if (upsertErr) {
      console.error('[callback] error assigning target role:', upsertErr.message);
    } else {
      console.log(`[callback] Role ${targetRole} assigned to user ${user.id}`);
    }
  } else {
    console.error(`[callback] Role ${targetRole} not found in roles table — falling back to STUDENT`);
  }

  // 3. Save role-specific profile fields (using admin client to write)
  if (targetRole === 'INSTRUCTOR') {
    const academyName = user.user_metadata?.academy_name || 'Mon Académie';
    const bio = user.user_metadata?.bio || '';
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ plan: 'FREE', academy_name: academyName, bio })
      .eq('id', user.id);
    if (updateErr) {
      console.error('[callback] error updating instructor profile:', updateErr.message);
    }
  } else {
    const studentLevel = user.user_metadata?.student_level || 'Débutant';
    const interestCourse = user.user_metadata?.interest_course || 'blockchain';
    const levelMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
      Débutant: 'BEGINNER',
      Intermédiaire: 'INTERMEDIATE',
      Avancé: 'ADVANCED',
    };
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ level: levelMap[studentLevel] || 'BEGINNER' })
      .eq('id', user.id);
    if (updateErr) {
      console.error('[callback] error updating student profile:', updateErr.message);
    }

    const COURSE_MAP: Record<string, string> = {
      blockchain: '10000000-0000-0000-0000-000000000001',
      trading: '10000000-0000-0000-0000-000000000002',
      ai: '10000000-0000-0000-0000-000000000003',
      web3: '10000000-0000-0000-0000-000000000004',
    };
    const courseId = COURSE_MAP[interestCourse] || interestCourse;
    const { error: enrollErr } = await supabaseAdmin.from('enrollments').upsert(
      {
        student_id: user.id,
        course_id: courseId,
        progress_percent: 0,
        status: 'ACTIVE',
        enrolled_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,course_id', ignoreDuplicates: true }
    );
    if (enrollErr) {
      console.error('[callback] error auto-enrolling student:', enrollErr.message);
    }
  }

  // 4. Resolve the final role name
  // Trust targetRole from metadata first as it represents the registration intention
  if (['INSTRUCTOR', 'TEACHING_ASSISTANT', 'ADMIN', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'ACADEMIC_ADMIN', 'SUPPORT_AGENT'].includes(targetRole)) {
    return targetRole;
  }

  const { data: userRoles } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  let role = 'STUDENT';
  const roleNames: string[] =
    userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];

  if (roleNames.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
  else if (roleNames.includes('ADMIN')) role = 'ADMIN';
  else if (roleNames.includes('FINANCE_ADMIN')) role = 'FINANCE_ADMIN';
  else if (roleNames.includes('ACADEMIC_ADMIN')) role = 'ACADEMIC_ADMIN';
  else if (roleNames.includes('SUPPORT_AGENT')) role = 'SUPPORT_AGENT';
  else if (roleNames.includes('INSTRUCTOR')) role = 'INSTRUCTOR';
  else if (roleNames.includes('TEACHING_ASSISTANT')) role = 'TEACHING_ASSISTANT';

  return role;
}
