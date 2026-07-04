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

  const targetRole = user.user_metadata?.role || 'STUDENT';
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  // 1. Ensure profile exists (fallback if trigger did not fire)
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, plan, status, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        status: 'ACTIVE',
        plan: 'FREE',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[callback] profile insert error:', insertError.message);
    } else {
      profile = newProfile;
    }
  }

  // 2. Fetch the ID for the target role
  const { data: targetDbRole } = await supabase
    .from('roles')
    .select('id')
    .eq('name', targetRole)
    .single();

  if (targetDbRole) {
    // Check user's current roles
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id);

    const hasTargetRole = existingRoles?.some(r => r.role_id === targetDbRole.id);

    if (!hasTargetRole) {
      // If registering as INSTRUCTOR, remove STUDENT role if trigger auto-created it
      if (targetRole === 'INSTRUCTOR') {
        const { data: studentDbRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'STUDENT')
          .single();

        if (studentDbRole && existingRoles?.some(r => r.role_id === studentDbRole.id)) {
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user.id)
            .eq('role_id', studentDbRole.id);
        }
      }

      // Upsert the target role
      await supabase.from('user_roles').upsert(
        { user_id: user.id, role_id: targetDbRole.id },
        { onConflict: 'user_id,role_id', ignoreDuplicates: true }
      );
    }
  }

  // 3. Save role-specific details to the profile in the DB if needed
  if (targetRole === 'INSTRUCTOR') {
    const academyName = user.user_metadata?.academy_name || 'Mon Académie';
    const bio = user.user_metadata?.bio || '';
    await supabase
      .from('profiles')
      .update({
        plan: 'FREE',
        academy_name: academyName,
        bio: bio,
      })
      .eq('id', user.id);
  } else {
    // STUDENT
    const studentLevel = user.user_metadata?.student_level || 'Débutant';
    const interestCourse = user.user_metadata?.interest_course || 'blockchain';
    const levelMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
      'Débutant': 'BEGINNER',
      'Intermédiaire': 'INTERMEDIATE',
      'Avancé': 'ADVANCED',
    };
    await supabase
      .from('profiles')
      .update({
        level: levelMap[studentLevel] || 'BEGINNER',
      })
      .eq('id', user.id);

    // Auto-enroll in chosen course
    const COURSE_MAP: Record<string, string> = {
      blockchain: '10000000-0000-0000-0000-000000000001',
      trading: '10000000-0000-0000-0000-000000000002',
      ai: '10000000-0000-0000-0000-000000000003',
      web3: '10000000-0000-0000-0000-000000000004',
    };
    const courseId = COURSE_MAP[interestCourse] || interestCourse;

    await supabase.from('enrollments').upsert(
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
  // Pass resolved role so the page can bootstrap the session client-side
  if (next === '/auth/confirmed') {
    return NextResponse.redirect(`${origin}/auth/confirmed?role=${role}`);
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
