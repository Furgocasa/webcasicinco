import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Obtener la URL base de la aplicación
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  console.log('[OAuth Callback] Request:', { 
    hasCode: !!code, 
    error, 
    errorDescription,
    url: requestUrl.toString() 
  });

  // Si hay error en los parámetros de OAuth
  if (error) {
    console.error('[OAuth Callback] Error from OAuth provider:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || 'Error de autenticación')}`, baseUrl)
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      
      // 🔥 FIX: Intercambiar código por sesión
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('[OAuth Callback] Error exchanging code:', exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=exchange_error&message=${encodeURIComponent(exchangeError.message)}`, baseUrl)
        );
      }

      console.log('[OAuth Callback] Success! User:', data.user?.id, 'Email:', data.user?.email);

      // Usuario autenticado, verificar si es admin
      const isAdmin = data.user?.user_metadata?.role === 'admin';
      
      // 🔥 FIX: Crear respuesta con cookies explícitas
      // Determinar URL de destino
      let redirectUrl: URL;
      if (isAdmin) {
        console.log('[OAuth Callback] Admin user, redirecting to dashboard');
        redirectUrl = new URL('/admin/dashboard', baseUrl);
      } else {
        const isEmailVerification = requestUrl.searchParams.get('type') === 'email' || 
                                     requestUrl.searchParams.get('type') === 'signup';
        
        if (isEmailVerification) {
          console.log('[OAuth Callback] Email verification, redirecting to confirmation page');
          redirectUrl = new URL('/email-verified', baseUrl);
        } else {
          console.log('[OAuth Callback] Regular user login (OAuth), redirecting to home');
          redirectUrl = new URL('/', baseUrl);
        }
      }
      
      // Crear respuesta de redirección
      const response = NextResponse.redirect(redirectUrl);
      
      // Las cookies ya están configuradas por el createClient en el servidor
      // Solo necesitamos asegurar que la respuesta las propague correctamente
      return response;
      
    } catch (error: any) {
      console.error('[OAuth Callback] Exception:', error);
      return NextResponse.redirect(
        new URL(`/login?error=server_error&message=${encodeURIComponent(error.message || 'Error del servidor')}`, baseUrl)
      );
    }
  }

  // No hay code, redirigir a login
  console.log('[OAuth Callback] No code provided, redirecting to login');
  return NextResponse.redirect(new URL('/login?error=no_code', baseUrl));
}

