import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API para PAUSAR una indexación en progreso
 * 
 * Marca el campo should_continue = false para que el indexer se detenga
 * en la próxima verificación (cada 3 ciudades o cada 10 lugares procesados)
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

    console.log(`⏸️ Pausando trabajo ${jobId}...`);

    // Actualizar el estado del job a paused y marcar should_continue = false
    const { data, error } = await supabase
      .from('indexation_jobs')
      .update({
        status: 'paused',
        should_continue: false, // El indexer verá esto y se detendrá
        paused_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('admin_user_id', user.id) // Solo puede pausar sus propios trabajos
      .eq('status', 'running') // Solo pausar si está corriendo
      .select()
      .single();

    if (error) {
      console.error('Error pausando trabajo:', error);
      return NextResponse.json(
        { error: `Error al pausar el trabajo: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'El trabajo no se encontró, no está en ejecución, o no tienes permisos' },
        { status: 404 }
      );
    }

    console.log(`✅ Trabajo ${jobId} pausado correctamente`);

    return NextResponse.json({
      success: true,
      message: 'Indexación pausada correctamente',
      job: data,
    });

  } catch (error: any) {
    console.error('Error en pausar:', error);
    return NextResponse.json(
      { error: error.message || 'Error al pausar la indexación' },
      { status: 500 }
    );
  }
}

