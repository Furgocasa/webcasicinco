import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichPendingPlaces } from '@/lib/indexation/enricher-batch';

export async function POST(request: NextRequest) {
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

    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { batchSize = 100, skipGooglePhotos = true } = body;

    console.log(
      `[API] Iniciando enriquecimiento de hasta ${batchSize} lugares (skipGooglePhotos=${skipGooglePhotos})...`
    );

    // Ejecutar en background
    Promise.resolve().then(async () => {
      try {
        await enrichPendingPlaces(batchSize, user.id, { skipGooglePhotos });
      } catch (err) {
        console.error('Error en enriquecimiento:', err);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Enriquecimiento iniciado para hasta ${batchSize} lugares`,
      userId: user.id,
    });

  } catch (error: any) {
    console.error('Error iniciando enriquecimiento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al iniciar enriquecimiento' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🎯 CONTADORES UNIFICADOS: TODOS los lugares sin IA (incluye borradores)
    const { count: pending } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .is('ai_description', null);

    const { count: completed } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .not('ai_description', 'is', null);

    const { count: totalPlaces } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      stats: {
        pending: pending || 0,
        completed: completed || 0,
        totalPlaces: totalPlaces || 0,
        percentage: totalPlaces ? Math.round(((completed || 0) / totalPlaces) * 100) : 0,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

