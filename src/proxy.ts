import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes privées à protéger
  const isPrivate =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/dashboard');

  if (!isPrivate) {
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

  // Vérification JWT côté serveur — ne peut pas être bypassé via localStorage
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Non authentifié → redirection login
  if (error || !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier le rôle pour les routes admin et instructor
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
      // Redirige vers le bon dashboard selon le rôle
      const redirect = isInstructor ? '/instructor' : '/dashboard';
      return NextResponse.redirect(new URL(redirect, request.url));
    }

    if (pathname.startsWith('/instructor') && !isInstructor && !isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/instructor/:path*',
    '/dashboard/:path*',
  ],
};
