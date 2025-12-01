import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Convierte texto a slug URL-friendly (sin tildes ni caracteres especiales)
 */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^a-z0-9-]/g, ''); // Solo letras, números y guiones
}

/**
 * Middleware para:
 * 1. Redirigir URLs con tildes/caracteres especiales (SEO - evitar contenido duplicado)
 * 2. Proteger rutas /admin/* y /perfil
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 🔥 REDIRECCIÓN 301: URLs con caracteres especiales → URLs limpias
  // Ejemplo: /bar/M%C3%A1laga/... → /bar/malaga/...
  const categoryMatch = pathname.match(/^\/(restaurante|bar|hotel|cafe)\/([^/]+)\/(.+)$/);
  
  if (categoryMatch) {
    const [, category, province, slug] = categoryMatch;
    const cleanProvince = toSlug(decodeURIComponent(province));
    
    // Si la provincia tiene caracteres especiales, redirigir a URL limpia
    if (province !== cleanProvince) {
      const cleanUrl = `/${category}/${cleanProvince}/${slug}`;
      console.log('🔄 Redirecting:', pathname, '→', cleanUrl);
      
      // Redirección 301 permanente (SEO-friendly)
      return NextResponse.redirect(new URL(cleanUrl, request.url), 301);
    }
  }

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
  
  try {
    // 🔥 FIX: Obtener PRIMERO la sesión (más confiable que getUser en middleware)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('🔐 Middleware check:', {
      path: pathname,
      hasSession: !!session,
      sessionError: sessionError?.message,
      userEmail: session?.user?.email,
      role: session?.user?.user_metadata?.role,
    });

    const user = session?.user;

    // Rutas que requieren autenticación (solo /perfil, NO /mapa ni /ruta que son públicas)
    const protectedRoutes = ['/perfil'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Rutas admin
    const isAdminRoute = pathname.startsWith('/admin');

    // Si es ruta protegida (no admin) y no hay usuario → login con parámetro de retorno
    if (isProtectedRoute && (sessionError || !user)) {
      console.log('❌ Protected route without session, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Si es ruta admin
    if (isAdminRoute) {
      // Si no hay usuario, redirigir a login
      if (sessionError || !user) {
        console.log('❌ Admin route: No session found, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Verificar si el usuario es admin
      const role = user.user_metadata?.role;

      if (role !== 'admin') {
        console.log('❌ Admin route: User is not admin, redirecting to home. User:', user.email, 'Role:', role);
        return NextResponse.redirect(new URL('/', request.url));
      }

      console.log('✅ Admin access granted for:', user.email);
    }
  } catch (error) {
    console.error('❌ Error in middleware auth check:', error);
    // 🔥 FIX: Solo redirigir a login si es ruta admin o perfil
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/admin') || pathname.startsWith('/perfil')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Rutas admin y perfil protegidas
    '/admin/:path*',
    '/perfil/:path*',
    // Rutas de lugares - necesitamos capturar province/slug
    '/(restaurante|bar|hotel|cafe)/:path*'
  ],
};
