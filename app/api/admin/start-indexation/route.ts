import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startIndexation } from '@/lib/indexation/indexer';

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
    const { provinces, categories, minRating } = body;

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

    // Crear trabajo de indexación
    const { data: job, error: jobError } = await supabase
      .from('indexation_jobs')
      .insert({
        admin_user_id: user.id,
        status: 'pending',
        search_params: {
          provinces,
          categories,
          minRating: minRating || 4.7,
        },
        total_places: 0,
        processed_places: 0,
        successful_places: 0,
        failed_places: 0,
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

    // Iniciar proceso de indexación en background (no bloqueante)
    // El proceso se ejecuta de forma asíncrona sin bloquear la respuesta
    Promise.resolve().then(async () => {
      try {
        await startIndexation(job.id, { provinces, categories, minRating: minRating || 4.7 });
      } catch (err) {
        console.error('Error en indexación:', err);
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
