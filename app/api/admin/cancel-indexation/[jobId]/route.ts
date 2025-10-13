import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Actualizar el estado del job a failed (no existe 'cancelled' en el enum)
    const { data, error } = await supabase
      .from('indexation_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: { cancelled: true, reason: 'Cancelado manualmente por el administrador' }
      })
      .eq('id', jobId)
      .eq('status', 'running') // Solo cancelar si está corriendo
      .select()
      .single();

    if (error) {
      console.error('Error cancelando trabajo:', error);
      return NextResponse.json(
        { error: `Error al cancelar el trabajo: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'El trabajo no se encontró o no está en ejecución' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Indexación cancelada correctamente',
      job: data,
    });

  } catch (error: any) {
    console.error('Error en cancelación:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cancelar la indexación' },
      { status: 500 }
    );
  }
}

