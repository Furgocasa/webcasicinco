'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Iconos de OAuth
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar si es admin
      const isAdmin = data.user?.user_metadata?.role === 'admin';

      // Configurar sesión persistente
      if (data.session) {
        // La sesión se mantiene automáticamente con las cookies
        // Supabase maneja la persistencia por defecto
        console.log('Sesión iniciada correctamente:', data.session.user.email);
      }

      toast.success('¡Bienvenido de nuevo!');

      // Redirigir según el rol
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (error: any) {
      console.error('Error en login:', error);
      setError(error.message || 'Error al iniciar sesión');
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError('');

    try {
      const supabase = createClient();
      
      // Obtener la URL base de la aplicación
      // En producción, usar NEXT_PUBLIC_APP_URL; en desarrollo, usar origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
          // No especificar queryParams.prompt permite a Google decidir automáticamente
          // Si el usuario ya autorizó, no pedirá confirmación de nuevo
        },
      });

      if (error) throw error;

      // La redirección sucede automáticamente
    } catch (error: any) {
      console.error('Error en login con Google:', error);
      setError(error.message || 'Error al iniciar sesión con Google');
      toast.error('Error al iniciar sesión con Google');
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center space-x-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <span className="text-2xl font-bold text-white">5</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            Casi <span className="text-primary">Cinco</span>
          </span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <p className="text-sm text-gray-600">
              Accede a tu cuenta para continuar
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                type="email"
                label="Correo electrónico"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/recuperar-password"
                  className="text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Iniciar sesión
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O continúa con</span>
                </div>
              </div>

              {/* Botón Google */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full flex items-center justify-center gap-3 border-2 hover:bg-gray-50"
                disabled={loadingGoogle}
              >
                {loadingGoogle ? '...' : (
                  <>
                    <GoogleIcon />
                    <span>Continuar con Google</span>
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link href="/registro" className="font-medium text-primary hover:underline">
                  Regístrate
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
