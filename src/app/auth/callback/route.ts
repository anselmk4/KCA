import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

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

  const cookieStore = await cookies();
  const pendingCookiesToSet: Array<{ name: string; value: string; options?: any }> = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const role = await bootstrapUserAndGetRole(user);
    return redirectWithCookies(`${origin}/auth/confirmed?role=${role}`);
  }

  // ── Path 2: OAuth PKCE code flow (Google OAuth + older Supabase magic links)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.warn('[callback] server exchangeCodeForSession warning:', exchangeError.message);
      // Pass code to client-side /auth/confirmed so client SDK can complete the exchange
      return redirectWithCookies(
        `${origin}/auth/confirmed?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return redirectWithCookies(
        `${origin}/auth/confirmed?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      );
    }

    const role = await bootstrapUserAndGetRole(user);
    return redirectWithCookies(`${origin}/auth/confirmed?role=${role}&code=${encodeURIComponent(code)}`);
  }

  // Neither token_hash nor code present: fallback to /auth/confirmed for client-side hash/session detection
  return redirectWithCookies(`${origin}/auth/confirmed`);
}

/**
 * Bootstraps the user's profile and roles in the database using admin privileges and returns the resolved role name.
 */
async function bootstrapUserAndGetRole(user: any): Promise<string> {
  const fullName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  // Check existing DB roles first (for returning users)
  const { data: existingUserRoles } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const existingRoleNames: string[] =
    existingUserRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];

  let targetRole: string;
  if (existingRoleNames.length > 0) {
    if (existingRoleNames.includes('SUPER_ADMIN')) targetRole = 'SUPER_ADMIN';
    else if (existingRoleNames.includes('ADMIN')) targetRole = 'ADMIN';
    else if (existingRoleNames.includes('FINANCE_ADMIN')) targetRole = 'FINANCE_ADMIN';
    else if (existingRoleNames.includes('ACADEMIC_ADMIN')) targetRole = 'ACADEMIC_ADMIN';
    else if (existingRoleNames.includes('SUPPORT_AGENT')) targetRole = 'SUPPORT_AGENT';
    else if (existingRoleNames.includes('INSTRUCTOR')) targetRole = 'INSTRUCTOR';
    else if (existingRoleNames.includes('TEACHING_ASSISTANT')) targetRole = 'TEACHING_ASSISTANT';
    else targetRole = 'STUDENT';
  } else {
    targetRole = (user.user_metadata?.role || 'STUDENT').toUpperCase();
  }

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
