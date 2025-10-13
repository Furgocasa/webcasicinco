'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserAccess } from '@/lib/hooks/useUserAccess';
import { useRouter } from 'next/navigation';
import PaywallModal from './PaywallModal';
import { Loader2 } from 'lucide-react';

interface AccessGuardProps {
  children: React.ReactNode;
  feature?: 'mapa' | 'chatbot' | 'rutas';
  requireAuth?: boolean; // Si true, requiere estar logueado
}

/**
 * Componente que protege contenido premium
 * 
 * Permite acceso a:
 * - Admins (siempre)
 * - Usuarios marcados como gratis por admin
 * - Usuarios en período de trial (30 días)
 * - Usuarios con suscripción activa
 * 
 * Bloquea acceso a:
 * - Usuarios sin login (si requireAuth=true)
 * - Usuarios fuera del trial sin suscripción
 */
export default function AccessGuard({ 
  children, 
  feature = 'mapa',
  requireAuth = true 
}: AccessGuardProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const accessInfo = useUserAccess();
  const [showPaywall, setShowPaywall] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Esperar a que termine de cargar auth
    if (authLoading) {
      setChecking(true);
      return;
    }

    // Si requiere auth y no hay usuario, redirigir a login
    if (requireAuth && !user) {
      router.push(`/login?redirect=/${feature}`);
      return;
    }

    // Si hay usuario pero no tiene acceso, mostrar paywall
    if (user && !accessInfo.hasAccess) {
      setShowPaywall(true);
      setChecking(false);
      return;
    }

    // Si tiene acceso, permitir continuar
    setChecking(false);
    setShowPaywall(false);
  }, [user, authLoading, accessInfo.hasAccess, requireAuth, feature, router]);

  // Mostrar loader mientras se verifica
  if (checking || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Mostrar paywall si no tiene acceso
  if (showPaywall && !accessInfo.hasAccess) {
    return (
      <>
        {/* Mostrar contenido difuminado de fondo */}
        <div className="filter blur-sm pointer-events-none">
          {children}
        </div>
        
        {/* Paywall modal */}
        <PaywallModal
          isOpen={true}
          onClose={() => {
            // Si está en trial, permitir cerrar y continuar
            if (accessInfo.isInTrial) {
              setShowPaywall(false);
            } else {
              // Si no tiene acceso, redirigir a pricing
              router.push('/pricing');
            }
          }}
          trialDaysRemaining={accessInfo.trialDaysRemaining}
          feature={feature}
        />
      </>
    );
  }

  // Si tiene acceso, mostrar contenido
  return <>{children}</>;
}

