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
        await enrichPendingPlaces(batchSize, user.id);
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

    // Obtener estadísticas de enriquecimiento (usando agregación en BD, no JS)
    const { count: pending } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('needs_enrichment', true)
      .eq('enrichment_status', 'pending');

    const { count: processing } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('enrichment_status', 'processing');

    const { count: completed } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('enrichment_status', 'completed');

    const { count: failed } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('enrichment_status', 'failed');

    return NextResponse.json({
      success: true,
      stats: {
        pending: pending || 0,
        processing: processing || 0,
        completed: completed || 0,
        failed: failed || 0,
        total: (pending || 0) + (processing || 0) + (completed || 0) + (failed || 0),
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

