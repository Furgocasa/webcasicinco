import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/user/access
 * Verifica el estado de acceso del usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Obtener usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

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
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const hasActiveSubscription = subscription?.status === 'active';

    // Determinar si tiene acceso
    const hasAccess = isAdmin || isFreeUser || isInTrial || hasActiveSubscription;

    // Determinar si necesita suscripción
    const needsSubscription = !isAdmin && !isFreeUser && !isInTrial && !hasActiveSubscription;

    return NextResponse.json({
      success: true,
      access: {
        hasAccess,
        isAdmin,
        isFreeUser,
        isInTrial,
        trialDaysRemaining,
        trialEndsAt,
        subscriptionPlan: subscription?.plan || null,
        subscriptionStatus: subscription?.status || null,
        subscriptionEndsAt: subscription?.current_period_end || null,
        needsSubscription,
      },
    });
  } catch (error) {
    console.error('Error checking user access:', error);
    return NextResponse.json(
      { success: false, error: 'Error al verificar acceso' },
      { status: 500 }
    );
  }
}

