import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession, createStripeCustomer } from '@/lib/stripe/client';
import { PLANS } from '@/lib/stripe/plans';
import type { SubscriptionPlan } from '@/types/stripe';

export async function POST(request: NextRequest) {
  try {
    const { planId, trialDays } = await request.json();

    // Validar planId
    if (!planId || !PLANS[planId as SubscriptionPlan]) {
      return NextResponse.json(
        { error: 'Plan inválido' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as SubscriptionPlan];

    // Verificar que el plan tenga priceId configurado
    if (!plan.stripePriceId) {
      console.error('❌ Stripe Price ID no configurado para plan:', planId);
      console.error('Configura en .env.local:');
      console.error(`  STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxx (para plan mensual)`);
      console.error(`  STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxx (para plan anual)`);
      return NextResponse.json(
        { error: `Plan "${plan.name}" no disponible. Falta configurar STRIPE_PRICE_ID en variables de entorno. Revisa la consola del servidor.` },
        { status: 500 }
      );
    }

    // Obtener usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar si ya tiene customer en Stripe
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let stripeCustomerId: string;

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Crear customer en Stripe
      const stripeCustomer = await createStripeCustomer({
        email: user.email!,
        name: user.user_metadata?.name,
        metadata: {
          user_id: user.id,
        },
      });

      stripeCustomerId = stripeCustomer.id;

      // Guardar en Supabase
      await supabase.from('customers').insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        email: user.email!,
        name: user.user_metadata?.name,
      });
    }

    // Crear sesión de checkout
    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: plan.stripePriceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      trialDays: trialDays || 0,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear sesión de pago' },
      { status: 500 }
    );
  }
}
