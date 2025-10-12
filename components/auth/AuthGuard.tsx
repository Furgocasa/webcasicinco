'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo,
}: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Esperar a que termine la carga

    // Si no requiere autenticación, permitir acceso
    if (!requireAuth) return;

    // Si requiere autenticación pero no hay usuario
    if (!user) {
      const redirect = redirectTo || '/login';
      router.push(redirect);
      return;
    }

    // Si requiere admin pero no es admin
    if (requireAdmin && !isAdmin) {
      router.push('/');
      return;
    }
  }, [user, loading, isAdmin, requireAuth, requireAdmin, redirectTo, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si requiere autenticación pero no hay usuario, no mostrar nada
  if (requireAuth && !user) {
    return null;
  }

  // Si requiere admin pero no es admin, no mostrar nada
  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
