import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users
 * Obtener lista de todos los usuarios (solo admins)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar que el usuario sea admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Se requiere rol de administrador' },
        { status: 403 }
      );
    }

    // Obtener todos los usuarios directamente de auth.users
    // Usar service_role para acceso completo a auth.users
    const { data: { users: authUsers }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Error al obtener lista de usuarios'
      }, { status: 500 });
    }

    // Obtener info de suscripciones activas para cada usuario
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, plan, status')
      .eq('status', 'active');

    const subscriptionMap = new Map(
      subscriptions?.map(sub => [sub.user_id, sub]) || []
    );

    // Formatear usuarios con toda la info
    const users = authUsers.map((authUser: any) => {
      const subscription = subscriptionMap.get(authUser.id);
      const metadata = authUser.user_metadata || {};
      const isFreeUser = metadata.is_free_user === true;
      const trialEndsAt = metadata.trial_ends_at ? new Date(metadata.trial_ends_at) : null;
      
      // Calcular días de trial restantes
      let trialDaysRemaining = 0;
      let isInTrial = false;
      if (trialEndsAt) {
        const now = new Date();
        const diff = trialEndsAt.getTime() - now.getTime();
        trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        isInTrial = trialDaysRemaining > 0;
      }

      return {
        id: authUser.id,
        email: authUser.email,
        role: metadata.role || 'user',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        full_name: metadata.full_name,
        avatar_url: metadata.avatar_url,
        // Suscripción
        subscription_plan: subscription?.plan || null,
        subscription_status: subscription?.status || null,
        is_free_user: isFreeUser,
        // Trial
        trial_ends_at: trialEndsAt?.toISOString() || null,
        trial_days_remaining: trialDaysRemaining,
        is_in_trial: isInTrial,
      };
    });

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Error en GET /api/admin/users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
}

