import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar rol admin
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Verificar configuración de APIs (solo server-side)
    const config = {
      googleMapsConfigured: !!(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.GOOGLE_PLACES_API_KEY),
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      stripeConfigured: !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY),
    };

    return NextResponse.json({
      success: true,
      config,
    });

  } catch (error: any) {
    console.error('Error verificando configuración:', error);
    return NextResponse.json(
      { error: error.message || 'Error al verificar configuración' },
      { status: 500 }
    );
  }
}

