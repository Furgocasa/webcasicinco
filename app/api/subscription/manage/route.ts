import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * POST /api/subscription/manage
 * Gestionar suscripción (cancelar, cambiar plan, reactivar)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
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

    const body = await request.json();
    const { action, newPlan } = body; // action: 'cancel' | 'change_plan' | 'reactivate'

    // Obtener suscripción actual
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No tienes una suscripción activa' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'cancel':
        // Cancelar al final del período
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        await supabase
          .from('subscriptions')
          .update({ cancel_at_period_end: true, canceled_at: new Date().toISOString() })
          .eq('id', subscription.id);

        return NextResponse.json({
          success: true,
          message: 'Suscripción cancelada. Tendrás acceso hasta el final del período actual.',
        });

      case 'reactivate':
        // Reactivar suscripción cancelada
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: false,
        });

        await supabase
          .from('subscriptions')
          .update({ cancel_at_period_end: false, canceled_at: null })
          .eq('id', subscription.id);

        return NextResponse.json({
          success: true,
          message: 'Suscripción reactivada correctamente',
        });

      case 'change_plan':
        if (!newPlan) {
          return NextResponse.json(
            { success: false, error: 'Plan no especificado' },
            { status: 400 }
          );
        }

        // Cambiar plan (Stripe maneja el prorate automáticamente)
        const newPriceId = newPlan === 'premium_monthly' 
          ? process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
          : process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;

        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: 'create_prorations', // Ajustar precio proporcionalmente
        });

        await supabase
          .from('subscriptions')
          .update({ plan: newPlan })
          .eq('id', subscription.id);

        return NextResponse.json({
          success: true,
          message: `Plan cambiado a ${newPlan}. El cambio se reflejará en tu próxima factura.`,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Acción no válida' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error gestionando suscripción' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription/manage
 * Obtener información de la suscripción actual
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Obtener suscripción
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
        message: 'Sin suscripción activa',
      });
    }

    // Obtener detalles de Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    
    // Obtener precio del primer item
    const priceItem = stripeSubscription.items.data[0];
    const amount = priceItem?.price?.unit_amount || 0;
    const currency = priceItem?.price?.currency || 'eur';

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        nextInvoiceAmount: amount / 100, // Convertir de centavos a euros
        currency: currency,
      },
    });
  } catch (error: any) {
    console.error('Error getting subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error obteniendo suscripción' },
      { status: 500 }
    );
  }
}

