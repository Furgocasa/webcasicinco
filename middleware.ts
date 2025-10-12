import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware para proteger rutas /admin/*
 * Verifica que el usuario esté autenticado y sea admin
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  
  try {
    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Rutas que requieren autenticación (pero no admin)
    const protectedRoutes = ['/mapa', '/ruta', '/perfil'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Rutas admin
    const isAdminRoute = pathname.startsWith('/admin');

    // Si es ruta protegida (no admin) y no hay usuario → login con parámetro de retorno
    if (isProtectedRoute && (userError || !user)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Si es ruta admin
    if (isAdminRoute) {
      // Si no hay usuario, redirigir a login
      if (userError || !user) {
        console.log('No user found, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Verificar si el usuario es admin
      const role = user.user_metadata?.role;

      if (role !== 'admin') {
        console.log('User is not admin, redirecting to home');
        return NextResponse.redirect(new URL('/', request.url));
      }

      console.log('Admin access granted for:', user.email);
    }
  } catch (error) {
    console.error('Error in middleware auth check:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/mapa/:path*',
    '/ruta/:path*',
    '/perfil/:path*'
  ],
};
