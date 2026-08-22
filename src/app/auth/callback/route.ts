import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Database } from '@/lib/supabase/types';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type'); // 'signup', 'recovery', 'invite', etc.
  const requestedRole = searchParams.get('role'); // 'STUDENT' or 'INSTRUCTOR'
  let next = searchParams.get('next') ?? '/dashboard';

  // Prevent Open Redirects: ensure it is a relative path starting with '/' and not '//'
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/dashboard';
  }

  const cookieStore = await cookies();
  const pendingCookiesToSet: Array<{ name: string; value: string; options?: any }> = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSetParam) {
          cookiesToSetParam.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore if headers already sent
            }
            pendingCookiesToSet.push({ name, value, options });
          });
        },
      },
    }
  );

  const redirectWithCookies = (targetUrl: string) => {
    const response = NextResponse.redirect(targetUrl);
    pendingCookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  };

  // ── Path 1: OTP / token_hash flow
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });

    if (error) {
      console.error('[callback] verifyOtp error:', error.message);
      return redirectWithCookies(
        `${origin}/login?error=auth-failed&reason=${encodeURIComponent(error.message)}`
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirectWithCookies(`${origin}/login?error=auth-failed`);

    const role = await bootstrapUserAndGetRole(user, requestedRole);
    return redirectWithCookies(`${origin}/auth/confirmed?role=${encodeURIComponent(role)}`);
  }

  // ── Path 2: OAuth PKCE code flow (Google OAuth + older Supabase magic links)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.warn('[callback] server exchangeCodeForSession warning:', exchangeError.message);
      // Pass code to client-side /auth/confirmed so client SDK can complete the exchange
      return redirectWithCookies(
        `${origin}/auth/confirmed?code=${encodeURIComponent(code)}&role=${encodeURIComponent(requestedRole || 'STUDENT')}&next=${encodeURIComponent(next)}`
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirectWithCookies(
        `${origin}/auth/confirmed?code=${encodeURIComponent(code)}&role=${encodeURIComponent(requestedRole || 'STUDENT')}&next=${encodeURIComponent(next)}`
      );
    }

    const role = await bootstrapUserAndGetRole(user, requestedRole);
    return redirectWithCookies(`${origin}/auth/confirmed?role=${encodeURIComponent(role)}&code=${encodeURIComponent(code)}`);
  }

  // Neither token_hash nor code present: fallback to /auth/confirmed for client-side hash/session detection
  return redirectWithCookies(`${origin}/auth/confirmed?role=${encodeURIComponent(requestedRole || 'STUDENT')}`);
}

/**
 * Bootstraps the user's profile and roles in the database using admin privileges and returns the resolved role name.
 */
async function bootstrapUserAndGetRole(user: any, requestedRole?: string | null): Promise<string> {
  const fullName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  const { isAuthorizedSuperAdmin } = await import('@/lib/rbac');
  const isSuperAdminAllowed = isAuthorizedSuperAdmin(user.email);

  // Check existing DB roles first (for returning users)
  const { data: existingUserRoles } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const existingRoleNames: string[] =
    existingUserRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];

  let targetRole = 'STUDENT';

  if (isSuperAdminAllowed) {
    targetRole = 'SUPER_ADMIN';
  } else {
    // If user is not authorized for Super Admin but had it in DB, strip it immediately
    if (existingRoleNames.includes('SUPER_ADMIN')) {
      console.warn(`[callback] Stripping unauthorized SUPER_ADMIN role from ${user.email}`);
      const { data: superAdminRole } = await supabaseAdmin.from('roles').select('id').eq('name', 'SUPER_ADMIN').single();
      if (superAdminRole) {
        await supabaseAdmin.from('user_roles').delete().eq('user_id', user.id).eq('role_id', superAdminRole.id);
      }
    }

    // Role priority:
    // 1. Explicit request from registration (role=INSTRUCTOR or role=STUDENT)
    const sanitizedReq = requestedRole?.toUpperCase();
    if (sanitizedReq === 'INSTRUCTOR' || sanitizedReq === 'TEACHING_ASSISTANT') {
      targetRole = sanitizedReq;
    } else if (sanitizedReq === 'STUDENT') {
      targetRole = 'STUDENT';
    } else if (existingRoleNames.length > 0) {
      // 2. Returning user without param -> preserve existing DB role
      if (existingRoleNames.includes('INSTRUCTOR')) targetRole = 'INSTRUCTOR';
      else if (existingRoleNames.includes('TEACHING_ASSISTANT')) targetRole = 'TEACHING_ASSISTANT';
      else if (existingRoleNames.includes('ADMIN')) targetRole = 'ADMIN';
      else if (existingRoleNames.includes('FINANCE_ADMIN')) targetRole = 'FINANCE_ADMIN';
      else if (existingRoleNames.includes('ACADEMIC_ADMIN')) targetRole = 'ACADEMIC_ADMIN';
      else if (existingRoleNames.includes('SUPPORT_AGENT')) targetRole = 'SUPPORT_AGENT';
      else targetRole = 'STUDENT';
    } else {
      // 3. New user without param -> metadata or default STUDENT
      const rawRole = (user.user_metadata?.role || 'STUDENT').toUpperCase();
      targetRole = (rawRole === 'INSTRUCTOR' || rawRole === 'TEACHING_ASSISTANT') ? rawRole : 'STUDENT';
    }
  }

  console.log(`[callback] bootstrapUserAndGetRole — targetRole=${targetRole}, userId=${user.id}`);

  // 1. Ensure profile exists and is activated if email confirmed
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, status')
    .eq('id', user.id)
    .maybeSingle();

  const isConfirmed = !!user.email_confirmed_at;

  if (!profile) {
    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: user.id,
      email: user.email!,
      full_name: fullName,
      status: isConfirmed ? 'ACTIVE' : 'INACTIVE',
      plan: 'FREE',
    });
    if (insertError) {
      console.error('[callback] profile insert error:', insertError.message);
    }
  } else if (isConfirmed && profile.status === 'INACTIVE') {
    await supabaseAdmin
      .from('profiles')
      .update({ status: 'ACTIVE' })
      .eq('id', user.id);
  }

  // 2. Enforce the correct role in user_roles table
  const { data: targetDbRole } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', targetRole as any)
    .single();

  if (targetDbRole) {
    // If user is INSTRUCTOR: clean up STUDENT role
    if (targetRole === 'INSTRUCTOR' || targetRole === 'TEACHING_ASSISTANT') {
      const { data: studentDbRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'STUDENT')
        .single();

      if (studentDbRole) {
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role_id', studentDbRole.id);
      }
    }

    // If user is STUDENT: clean up INSTRUCTOR role if converting
    if (targetRole === 'STUDENT') {
      const { data: instructorDbRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'INSTRUCTOR')
        .single();

      if (instructorDbRole) {
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role_id', instructorDbRole.id);
      }
    }

    // Assign the target role (upsert is safe — idempotent)
    await supabaseAdmin.from('user_roles').upsert(
      { user_id: user.id, role_id: targetDbRole.id },
      { onConflict: 'user_id,role_id', ignoreDuplicates: true }
    );
  }

  // 3. Save role-specific profile fields
  if (targetRole === 'INSTRUCTOR') {
    const academyName = user.user_metadata?.academy_name || 'Mon Académie';
    const bio = user.user_metadata?.bio || '';
    await supabaseAdmin
      .from('profiles')
      .update({ plan: 'FREE', academy_name: academyName, bio })
      .eq('id', user.id);
  } else if (targetRole === 'STUDENT') {
    const studentLevel = user.user_metadata?.student_level || 'Débutant';
    const interestCourse = user.user_metadata?.interest_course || 'blockchain';
    const levelMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
      Débutant: 'BEGINNER',
      Intermédiaire: 'INTERMEDIATE',
      Avancé: 'ADVANCED',
    };
    await supabaseAdmin
      .from('profiles')
      .update({ level: levelMap[studentLevel] || 'BEGINNER' })
      .eq('id', user.id);

    const COURSE_MAP: Record<string, string> = {
      blockchain: '10000000-0000-0000-0000-000000000001',
      trading: '10000000-0000-0000-0000-000000000002',
      ai: '10000000-0000-0000-0000-000000000003',
      web3: '10000000-0000-0000-0000-000000000004',
    };
    const courseId = COURSE_MAP[interestCourse] || interestCourse;
    await supabaseAdmin.from('enrollments').upsert(
      {
        student_id: user.id,
        course_id: courseId,
        progress_percent: 0,
        status: 'ACTIVE',
        enrolled_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,course_id', ignoreDuplicates: true }
    );
  }

  return targetRole;
}
