import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del trabajo' },
        { status: 400 }
      );
    }

    // Obtener estado del trabajo
    const { data: job, error } = await supabase
      .from('indexation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error obteniendo estado:', error);
      return NextResponse.json(
        { error: 'Error al obtener el estado del trabajo' },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Trabajo no encontrado' },
        { status: 404 }
      );
    }

    // Calcular progreso
    const progress = job.total_places > 0 
      ? Math.round((job.processed_places / job.total_places) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        provinces: job.provinces,
        categories: job.categories,
        total_places: job.total_places,
        processed_places: job.processed_places,
        successful_places: job.successful_places,
        failed_places: job.failed_places,
        progress,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        error_message: job.error_message,
      },
    });

  } catch (error) {
    console.error('Error obteniendo estado:', error);
    return NextResponse.json(
      { error: 'Error al obtener el estado' },
      { status: 500 }
    );
  }
}
