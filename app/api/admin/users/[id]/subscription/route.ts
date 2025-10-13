import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

/**
 * PATCH /api/admin/users/[id]/subscription
 * Actualiza la suscripción de un usuario manualmente (solo admin)
 * Casos de uso: Soporte, emergencias, promociones especiales
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'Solo administradores pueden ejecutar esta acción' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { subscriptionType } = body;

    // Validar parámetros
    if (!subscriptionType || !['free', 'trial', 'premium_monthly', 'premium_yearly', 'none'].includes(subscriptionType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de suscripción inválido' },
        { status: 400 }
      );
    }

    // Crear cliente admin
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Obtener usuario actual
    const { data: { user: targetUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const currentMetadata = targetUser.user_metadata || {};

    // Aplicar cambios según el tipo
    let updatedMetadata = { ...currentMetadata };

    switch (subscriptionType) {
      case 'free':
        // Dar acceso gratis permanente
        updatedMetadata.is_free_user = true;
        updatedMetadata.trial_ends_at = null;
        break;

      case 'trial':
        // Dar trial de 30 días (o renovar)
        updatedMetadata.is_free_user = false;
        updatedMetadata.trial_ends_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;

      case 'premium_monthly':
      case 'premium_yearly':
        // Marcar como premium (NOTA: Esto NO crea suscripción en Stripe)
        updatedMetadata.is_free_user = false;
        updatedMetadata.trial_ends_at = null;
        
        // Crear/actualizar registro en tabla subscriptions
        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          plan: subscriptionType,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: subscriptionType === 'premium_monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
        break;

      case 'none':
        // Quitar todo acceso
        updatedMetadata.is_free_user = false;
        updatedMetadata.trial_ends_at = null;
        
        // Cancelar suscripción si existe
        await supabaseAdmin.from('subscriptions')
          .update({ status: 'canceled' })
          .eq('user_id', userId)
          .eq('status', 'active');
        break;
    }

    // Actualizar metadata del usuario
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: updatedMetadata }
    );

    if (updateError) {
      console.error('Error actualizando usuario:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Suscripción actualizada a: ${subscriptionType}`,
    });

  } catch (error: any) {
    console.error('Error en PATCH /api/admin/users/[id]/subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


