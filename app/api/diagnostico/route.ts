import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint temporal de diagnóstico
 * Verifica qué variables de entorno están disponibles
 * ⚠️ ELIMINAR ANTES DE PRODUCCIÓN
 */
export async function GET() {
  const variables = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ FALTA',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ FALTA',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ FALTA',
    
    // Google
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Configurada' : '❌ FALTA',
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY ? '✅ Configurada' : '❌ FALTA',
    
    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ FALTA',
    
    // Stripe
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ FALTA',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Configurada' : '❌ FALTA',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configurada' : '❌ FALTA',
  };

  // Mostrar primeros 10 caracteres de cada variable (para verificar que sean las correctas)
  const valoresCortos = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY?.substring(0, 15) + '...',
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY?.substring(0, 15) + '...',
  };

  return NextResponse.json({
    success: true,
    variables,
    valoresCortos,
    mensaje: '⚠️ Este endpoint es solo para diagnóstico. Eliminar antes de producción.',
    timestamp: new Date().toISOString(),
  });
}

