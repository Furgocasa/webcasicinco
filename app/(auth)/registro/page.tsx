'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Icono de Google
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user', // Por defecto, todos son usuarios normales
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }

      // Verificar si el usuario fue creado
      if (data.user) {
        console.log('Usuario creado exitosamente:', data.user.id);
        
        // Supabase puede requerir confirmación por email
        if (data.user.identities && data.user.identities.length === 0) {
          // Email ya registrado
          setError('Este email ya está registrado. Intenta iniciar sesión.');
          toast.error('Email ya registrado');
        } else {
          // Usuario creado correctamente
          toast.success('¡Cuenta creada! Verifica tu correo electrónico para confirmar tu cuenta.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } else {
        throw new Error('No se pudo crear el usuario');
      }
    } catch (error: any) {
      console.error('Error completo en registro:', error);
      const errorMsg = error.message || 'Error al crear la cuenta';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoadingGoogle(true);
    setError('');

    try {
      const supabase = createClient();
      
      // 🔥 FIX: Determinar URL base según dominio actual
      // Si estamos en casicinco.com, usar esa URL; sino usar localhost
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      const isProduction = currentHost.includes('casicinco.com');
      const baseUrl = isProduction ? 'https://www.casicinco.com' : 'http://localhost:3000';
      
      console.log('🔐 OAuth redirect URL:', `${baseUrl}/auth/callback`, 'Host:', currentHost);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
        },
      });

      if (error) throw error;

      // La redirección sucede automáticamente
    } catch (error: any) {
      console.error('Error en registro con Google:', error);
      setError(error.message || 'Error al registrarse con Google');
      toast.error('Error al registrarse con Google');
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
            <CardTitle>Crear cuenta</CardTitle>
            <p className="text-sm text-gray-600">
              Regístrate para guardar tus lugares favoritos
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
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

              <PasswordInput
                label="Contraseña"
                placeholder="••••••••"
                helperText="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <PasswordInput
                label="Confirmar contraseña"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />

              <Button type="submit" className="w-full" loading={loading}>
                Crear cuenta
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O regístrate con</span>
                </div>
              </div>

              {/* Botón Google */}
              <Button
                type="button"
                onClick={handleGoogleRegister}
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
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Inicia sesión
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Al registrarte, aceptas nuestros{' '}
                <Link href="/terminos" className="text-primary hover:underline">
                  términos y condiciones
                </Link>{' '}
                y{' '}
                <Link href="/privacidad" className="text-primary hover:underline">
                  política de privacidad
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
