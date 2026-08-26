import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const categoryMatch = pathname.match(/^\/(restaurante|bar|hotel|cafe)\/([^/]+)\/(.+)$/);

  if (categoryMatch) {
    const [, category, province, slug] = categoryMatch;
    const cleanProvince = toSlug(decodeURIComponent(province));

    if (province !== cleanProvince) {
      const cleanUrl = `/${category}/${cleanProvince}/${slug}`;
      return NextResponse.redirect(new URL(cleanUrl, request.url), 301);
    }
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    const isProtectedRoute = pathname.startsWith('/perfil');
    const isAdminRoute = pathname.startsWith('/admin');

    if (isProtectedRoute && (userError || !user)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminRoute) {
      if (userError || !user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const role = user.user_metadata?.role;
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } catch {
    if (pathname.startsWith('/admin') || pathname.startsWith('/perfil')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/perfil/:path*',
    '/(restaurante|bar|hotel|cafe)/:path*',
  ],
};
