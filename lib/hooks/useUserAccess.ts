import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';

export interface UserAccessInfo {
  hasAccess: boolean;
  isAdmin: boolean;
  isFreeUser: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  trialEndsAt: Date | null;
  subscriptionPlan: 'free' | 'premium_monthly' | 'premium_yearly' | 'admin_monthly' | null;
  subscriptionStatus: string | null;
  needsSubscription: boolean;
}

/**
 * Hook para verificar el acceso del usuario y estado de suscripción
 * 
 * Reglas de acceso:
 * 1. Admin: Acceso total siempre
 * 2. Usuario marcado como gratis por admin: Acceso total siempre
 * 3. Usuario en trial (30 días): Acceso total temporal
 * 4. Usuario con suscripción activa: Acceso total
 * 5. Resto: Sin acceso (necesita suscribirse)
 */
export function useUserAccess(): UserAccessInfo {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [accessInfo, setAccessInfo] = useState<UserAccessInfo>({
    hasAccess: false,
    isAdmin: false,
    isFreeUser: false,
    isInTrial: false,
    trialDaysRemaining: 0,
    trialEndsAt: null,
    subscriptionPlan: null,
    subscriptionStatus: null,
    needsSubscription: false,
  });

  useEffect(() => {
    if (!user) {
      setAccessInfo({
        hasAccess: false,
        isAdmin: false,
        isFreeUser: false,
        isInTrial: false,
        trialDaysRemaining: 0,
        trialEndsAt: null,
        subscriptionPlan: null,
        subscriptionStatus: null,
        needsSubscription: false,
      });
      return;
    }

    const checkAccess = async () => {
      try {
        // Obtener metadata del usuario
        const role = user.user_metadata?.role || 'user';
        const isFreeUser = user.user_metadata?.is_free_user === true;
        const trialEndsAt = user.user_metadata?.trial_ends_at 
          ? new Date(user.user_metadata.trial_ends_at) 
          : null;

        // Verificar si es admin
        const isAdmin = role === 'admin';

        // Calcular días restantes de trial
        let trialDaysRemaining = 0;
        let isInTrial = false;
        
        if (trialEndsAt) {
          const now = new Date();
          const diff = trialEndsAt.getTime() - now.getTime();
          trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
          isInTrial = trialDaysRemaining > 0;
        }

        // Obtener suscripción activa
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        const subscriptionPlan = subscription?.plan || null;
        const subscriptionStatus = subscription?.status || null;
        const hasActiveSubscription = subscriptionStatus === 'active';

        // Determinar si tiene acceso
        const hasAccess = isAdmin || isFreeUser || isInTrial || hasActiveSubscription;

        // Determinar si necesita suscripción
        const needsSubscription = !isAdmin && !isFreeUser && !isInTrial && !hasActiveSubscription;

        setAccessInfo({
          hasAccess,
          isAdmin,
          isFreeUser,
          isInTrial,
          trialDaysRemaining,
          trialEndsAt,
          subscriptionPlan,
          subscriptionStatus,
          needsSubscription,
        });
      } catch (error) {
        console.error('Error checking user access:', error);
      }
    };

    checkAccess();
  }, [user]);

  return accessInfo;
}

/**
 * Hook simple para verificar solo si el usuario tiene acceso
 */
export function useHasAccess(): boolean {
  const { hasAccess } = useUserAccess();
  return hasAccess;
}

/**
 * Hook para obtener mensaje de estado del usuario
 */
export function useUserAccessMessage(): string {
  const info = useUserAccess();
  
  if (info.isAdmin) {
    return 'Administrador - Acceso Total';
  }
  
  if (info.isFreeUser) {
    return 'Usuario Gratis - Acceso Total';
  }
  
  if (info.isInTrial) {
    return `Prueba Gratis - ${info.trialDaysRemaining} días restantes`;
  }
  
  if (info.subscriptionPlan === 'premium_monthly') {
    return 'Premium Mensual - Activo';
  }
  
  if (info.subscriptionPlan === 'premium_yearly') {
    return 'Premium Anual - Activo';
  }
  
  return 'Suscripción requerida';
}

