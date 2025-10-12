import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBillingPortalSession } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
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

    // Obtener customer de Stripe
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'No se encontró información de pago' },
        { status: 404 }
      );
    }

    // Crear sesión del portal de facturación
    const session = await createBillingPortalSession({
      customerId: customer.stripe_customer_id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Error al abrir portal de facturación' },
      { status: 500 }
    );
  }
}
