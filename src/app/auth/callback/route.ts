import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Auto-repair profile if it does not exist (Google Auth user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, plan, status, full_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
          
          // Create profile
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email!,
            full_name: fullName,
            status: 'ACTIVE',
            plan: 'FREE',
          });

          // Set default STUDENT role
          const { data: studentRole } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'STUDENT')
            .single();

          if (studentRole) {
            await supabase.from('user_roles').insert({
              user_id: user.id,
              role_id: studentRole.id
            });
          }
        }
        
        // Query user roles to redirect to correct panel
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id);

        let role = 'STUDENT';
        const roleNames = userRoles?.map((ur: any) => ur.roles?.name) || [];
        if (roleNames.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
        else if (roleNames.includes('ADMIN')) role = 'ADMIN';
        else if (roleNames.includes('FINANCE_ADMIN')) role = 'FINANCE_ADMIN';
        else if (roleNames.includes('ACADEMIC_ADMIN')) role = 'ACADEMIC_ADMIN';
        else if (roleNames.includes('SUPPORT_AGENT')) role = 'SUPPORT_AGENT';
        else if (roleNames.includes('INSTRUCTOR')) role = 'INSTRUCTOR';
        else if (roleNames.includes('TEACHING_ASSISTANT')) role = 'TEACHING_ASSISTANT';

        let targetRedirect = next;
        if (next !== '/auth/confirmed') {
          if (['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'ACADEMIC_ADMIN', 'SUPPORT_AGENT'].includes(role)) {
            targetRedirect = '/admin';
          } else if (['INSTRUCTOR', 'TEACHING_ASSISTANT'].includes(role)) {
            targetRedirect = '/instructor';
          } else {
            targetRedirect = '/dashboard';
          }
        }

        return NextResponse.redirect(`${origin}${targetRedirect}`);
      }
    }
  }

  // return the user to an error page
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
