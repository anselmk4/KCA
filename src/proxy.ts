import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPrivate =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/dashboard');

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

  if (!isPrivate && !isAuthPage) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Session ouverte -> Redirection si sur les pages d'auth
    if (isAuthPage) {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      const roleNames: string[] = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);

      const isAdmin = roleNames.some(r =>
        ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'ACADEMIC_ADMIN', 'SUPPORT_AGENT'].includes(r)
      );
      const isInstructor = roleNames.some(r =>
        ['INSTRUCTOR', 'TEACHING_ASSISTANT'].includes(r)
      );

      let targetRedirect = '/dashboard';
      if (isAdmin) {
        targetRedirect = '/admin';
      } else if (isInstructor) {
        targetRedirect = '/instructor';
      }

      return NextResponse.redirect(new URL(targetRedirect, request.url));
    }

    // Protection des rôles pour les pages privées
    if (pathname.startsWith('/admin') || pathname.startsWith('/instructor')) {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      const roleNames: string[] = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);

      const isAdmin = roleNames.some(r =>
        ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'ACADEMIC_ADMIN', 'SUPPORT_AGENT'].includes(r)
      );
      const isInstructor = roleNames.some(r =>
        ['INSTRUCTOR', 'TEACHING_ASSISTANT'].includes(r)
      );

      if (pathname.startsWith('/admin') && !isAdmin) {
        const redirect = isInstructor ? '/instructor' : '/dashboard';
        return NextResponse.redirect(new URL(redirect, request.url));
      }

      if (pathname.startsWith('/instructor') && !isInstructor && !isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  } else {
    // Pas de session -> Redirection si sur les pages privées
    if (isPrivate) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/instructor/:path*',
    '/dashboard/:path*',
    '/login',
    '/register',
    '/forgot-password',
  ],
};
