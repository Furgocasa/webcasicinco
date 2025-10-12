import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error en OAuth callback:', error);
      // Redirigir a login con error
      return NextResponse.redirect(new URL('/login?error=oauth_error', requestUrl.origin));
    }

    // Usuario autenticado, verificar si es admin
    const isAdmin = data.user?.user_metadata?.role === 'admin';
    
    // Redirigir según rol
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', requestUrl.origin));
    }
  }

  // Redirigir al home
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}

