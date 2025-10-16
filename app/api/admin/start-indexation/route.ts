import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startFastIndexation } from '@/lib/indexation/indexer-fast'; // ✅ Nuevo indexer rápido

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

    // Verificar rol admin
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { provinces, categories, cities, minRating } = body;

    // Validar parámetros
    if (!provinces || provinces.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos una provincia' },
        { status: 400 }
      );
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos una categoría' },
        { status: 400 }
      );
    }

    // 🆕 PASO CRÍTICO: Cancelar trabajos previos del admin
    console.log(`🔄 Cancelando trabajos previos del admin ${user.id}...`);
    const { data: cancelledJobs } = await supabase
      .from('indexation_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        should_continue: false,
        error_log: { 
          cancelled: true, 
          reason: 'Nueva indexación iniciada - trabajo previo cancelado automáticamente',
          cancelled_at: new Date().toISOString()
        }
      })
      .eq('admin_user_id', user.id)
      .in('status', ['running', 'pending', 'paused'])
      .select();

    if (cancelledJobs && cancelledJobs.length > 0) {
      console.log(`✅ ${cancelledJobs.length} trabajo(s) previo(s) cancelado(s)`);
    }

    // Crear trabajo de indexación
    const { data: job, error: jobError } = await supabase
      .from('indexation_jobs')
      .insert({
        admin_user_id: user.id,
        status: 'pending',
        should_continue: true, // Iniciar como true
        search_params: {
          provinces,
          categories,
          cities: cities || undefined, // 🆕 Ciudades específicas (opcional)
          minRating: minRating || 4.7,
        },
        total_places: 0,
        processed_places: 0,
        successful_places: 0,
        failed_places: 0,
        logs: [], // Iniciar array de logs vacío
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creando trabajo:', jobError);
      return NextResponse.json(
        { error: `Error al crear el trabajo de indexación: ${jobError.message}` },
        { status: 500 }
      );
    }

    // Iniciar proceso de indexación RÁPIDA en background
    // FASE 1: Solo búsqueda + filtrado + guardado básico (SIN IA)
    Promise.resolve().then(async () => {
      try {
        await startFastIndexation(job.id, { provinces, categories, minRating: minRating || 4.7 });
      } catch (err) {
        console.error('Error en indexación rápida:', err);
      }
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        created_at: job.created_at,
      },
    });

  } catch (error) {
    console.error('Error iniciando indexación:', error);
    return NextResponse.json(
      { error: 'Error al iniciar la indexación' },
      { status: 500 }
    );
  }
}
