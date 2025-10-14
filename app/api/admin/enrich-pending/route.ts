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

    const body = await request.json();
    const { batchSize = 100 } = body;

    console.log(`[API] Iniciando enriquecimiento de hasta ${batchSize} lugares...`);

    // Ejecutar en background
    Promise.resolve().then(async () => {
      try {
        await enrichPendingPlaces(batchSize);
      } catch (err) {
        console.error('Error en enriquecimiento:', err);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Enriquecimiento iniciado para hasta ${batchSize} lugares`,
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

    // Obtener estadísticas de enriquecimiento
    const { data: stats } = await supabase
      .from('places')
      .select('enrichment_status', { count: 'exact' });

    const pending = stats?.filter(s => s.enrichment_status === 'pending').length || 0;
    const processing = stats?.filter(s => s.enrichment_status === 'processing').length || 0;
    const completed = stats?.filter(s => s.enrichment_status === 'completed').length || 0;
    const failed = stats?.filter(s => s.enrichment_status === 'failed').length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        pending,
        processing,
        completed,
        failed,
        total: stats?.length || 0,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

