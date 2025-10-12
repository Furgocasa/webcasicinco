import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // Obtener la URL base de la aplicación
  // En producción, usar NEXT_PUBLIC_APP_URL; en desarrollo, usar requestUrl.origin
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error en OAuth callback:', error);
      // Redirigir a login con error
      return NextResponse.redirect(new URL('/login?error=oauth_error', baseUrl));
    }

    // Usuario autenticado, verificar si es admin
    const isAdmin = data.user?.user_metadata?.role === 'admin';
    
    // Redirigir según rol
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', baseUrl));
    }
  }

  // Redirigir al home
  return NextResponse.redirect(new URL('/', baseUrl));
}

