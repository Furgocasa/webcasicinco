import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { constructWebhookEvent } from '@/lib/stripe/client';
import Stripe from 'stripe';

/**
 * Webhook de Stripe
 * Procesa eventos de pago y actualiza la base de datos
 * 
 * Nota: El body parsing raw es necesario para verificar la firma de Stripe
 * Next.js 14 maneja esto automáticamente con request.text()
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    // Verificar el webhook
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Procesar el evento según su tipo
    switch (event.type) {
      // Checkout completado
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }

      // Suscripción creada
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription, supabase);
        break;
      }

      // Suscripción actualizada
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      // Suscripción eliminada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      // Pago exitoso
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      // Pago fallido
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Maneja el evento checkout.session.completed
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  console.log('Checkout completed:', session.id);

  // El evento subscription.created se encargará de actualizar la suscripción
  // Aquí solo logueamos
}

/**
 * Maneja el evento customer.subscription.created
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription created:', subscription.id);

  const userId = subscription.metadata.user_id;
  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Determinar el plan
  const priceId = subscription.items.data[0].price.id;
  let plan = 'free';
  if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID) {
    plan = 'premium_monthly';
  } else if (priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
    plan = 'premium_yearly';
  } else if (priceId === process.env.STRIPE_ADMIN_MONTHLY_PRICE_ID) {
    plan = 'admin_monthly';
  }

  // Insertar suscripción en la BD
  const { error } = await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    plan,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  });

  if (error) {
    console.error('Error inserting subscription:', error);
    return;
  }

  // Actualizar límites del usuario
  await supabase
    .from('usage_limits')
    .update({
      plan,
      routes_limit: plan !== 'free' ? 999999 : 3,
      favorites_limit: plan !== 'free' ? 999999 : 10,
      ai_requests_limit: plan !== 'free' ? 999999 : 5,
    })
    .eq('user_id', userId);

  console.log('Subscription created successfully');
}

/**
 * Maneja el evento customer.subscription.updated
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription updated:', subscription.id);

  // Determinar el plan
  const priceId = subscription.items.data[0].price.id;
  let plan = 'free';
  if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID) {
    plan = 'premium_monthly';
  } else if (priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
    plan = 'premium_yearly';
  } else if (priceId === process.env.STRIPE_ADMIN_MONTHLY_PRICE_ID) {
    plan = 'admin_monthly';
  }

  // Actualizar suscripción
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  console.log('Subscription updated successfully');
}

/**
 * Maneja el evento customer.subscription.deleted
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  console.log('Subscription deleted:', subscription.id);

  // Obtener user_id
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!sub) return;

  // Actualizar estado
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Resetear a plan free
  await supabase
    .from('usage_limits')
    .update({
      plan: 'free',
      routes_limit: 3,
      favorites_limit: 10,
      ai_requests_limit: 5,
    })
    .eq('user_id', sub.user_id);

  console.log('Subscription deleted successfully');
}

/**
 * Maneja el evento invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('Invoice payment succeeded:', invoice.id);

  // Obtener user_id del customer
  const { data: customer } = await supabase
    .from('customers')
    .select('user_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (!customer) return;

  // Guardar factura
  await supabase.from('invoices').insert({
    user_id: customer.user_id,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer as string,
    amount_paid: invoice.amount_paid,
    amount_due: invoice.amount_due,
    currency: invoice.currency,
    status: invoice.status!,
    invoice_pdf: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
  });

  // Guardar pago si hay payment_intent
  if (invoice.payment_intent) {
    await supabase.from('payments').insert({
      user_id: customer.user_id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_customer_id: invoice.customer as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      description: invoice.description || 'Pago de suscripción',
    });
  }

  console.log('Invoice saved successfully');
}

/**
 * Maneja el evento invoice.payment_failed
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('Invoice payment failed:', invoice.id);

  // Obtener user_id
  const { data: customer } = await supabase
    .from('customers')
    .select('user_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (!customer) return;

  // Guardar factura con estado failed
  await supabase.from('invoices').insert({
    user_id: customer.user_id,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: invoice.customer as string,
    amount_paid: 0,
    amount_due: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    invoice_pdf: invoice.invoice_pdf,
    hosted_invoice_url: invoice.hosted_invoice_url,
  });

  // Aquí podrías enviar un email al usuario notificando el fallo

  console.log('Failed invoice saved');
}
