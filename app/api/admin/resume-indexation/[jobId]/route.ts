import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startFastIndexation } from '@/lib/indexation/indexer-fast';

/**
 * API para REANUDAR una indexación pausada
 * 
 * Reactiva el proceso desde donde se quedó
 * El indexer verá que debe continuar y seguirá procesando
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
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

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID requerido' },
        { status: 400 }
      );
    }

    console.log(`▶️ Reanudando trabajo ${jobId}...`);

    // Obtener el trabajo pausado
    const { data: job, error: fetchError } = await supabase
      .from('indexation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('admin_user_id', user.id)
      .eq('status', 'paused')
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'El trabajo no se encontró, no está pausado, o no tienes permisos' },
        { status: 404 }
      );
    }

    // Cancelar cualquier otro trabajo activo del admin
    await supabase
      .from('indexation_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        should_continue: false,
        error_log: { 
          cancelled: true, 
          reason: 'Otro trabajo fue reanudado',
          cancelled_at: new Date().toISOString()
        }
      })
      .eq('admin_user_id', user.id)
      .in('status', ['running', 'pending'])
      .neq('id', jobId);

    // Actualizar el estado a running y marcar should_continue = true
    const { data, error } = await supabase
      .from('indexation_jobs')
      .update({
        status: 'running',
        should_continue: true, // El indexer continuará
        paused_at: null, // Limpiar timestamp de pausa
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error reanudando trabajo:', error);
      return NextResponse.json(
        { error: `Error al reanudar el trabajo: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Trabajo ${jobId} reanudado, reiniciando proceso...`);

    // Reiniciar el proceso de indexación en background
    // Nota: El indexer es inteligente y saltará los lugares ya procesados
    const searchParams = job.search_params as { provinces: string[]; categories: string[]; minRating: number };
    
    // Ejecutar en background sin esperar
    Promise.resolve().then(async () => {
      try {
        // Pequeño delay para asegurar que el estado se actualice
        await new Promise(resolve => setTimeout(resolve, 500));
        await startFastIndexation(jobId, searchParams);
      } catch (err) {
        console.error('Error reanudando indexación:', err);
      }
    });

    // Delay antes de retornar para dar tiempo a que se actualice el estado
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      message: 'Indexación reanudada correctamente',
      job: data,
    });

  } catch (error: any) {
    console.error('Error en reanudar:', error);
    return NextResponse.json(
      { error: error.message || 'Error al reanudar la indexación' },
      { status: 500 }
    );
  }
}

