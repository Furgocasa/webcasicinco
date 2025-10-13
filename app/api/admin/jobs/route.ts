import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Obtener todos los trabajos del admin
    const { data: jobs, error } = await supabase
      .from('indexation_jobs')
      .select('*')
      .eq('admin_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo trabajos:', error);
      return NextResponse.json(
        { error: 'Error al obtener los trabajos' },
        { status: 500 }
      );
    }

    // Parsear search_params y formatear respuesta
    const formattedJobs = jobs?.map(job => ({
      ...job,
      provinces: job.search_params?.provinces || [],
      categories: job.search_params?.categories || [],
      minRating: job.search_params?.minRating || 4.7,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });

  } catch (error) {
    console.error('Error obteniendo trabajos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los trabajos' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Usar cliente normal para autenticación
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

    // Usar cliente admin para DELETE (evita problemas de RLS)
    const adminSupabase = createAdminClient();
    
    const body = await request.json();
    const { jobId, deleteAll, filterStatus } = body;

    console.log('🗑️ DELETE request:', { jobId, deleteAll, filterStatus, userId: user.id });

    if (deleteAll) {
      // Eliminar múltiples trabajos según filtro
      let query = adminSupabase
        .from('indexation_jobs')
        .delete()
        .eq('admin_user_id', user.id);

      if (filterStatus && filterStatus.length > 0) {
        query = query.in('status', filterStatus);
      }

      const { data, error, count } = await query.select();

      console.log('🗑️ DELETE multiple result:', { count, error: error?.message });

      if (error) {
        console.error('❌ Error eliminando trabajos:', error);
        return NextResponse.json(
          { error: `Error al eliminar los trabajos: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${count || 0} trabajos eliminados correctamente`,
        deleted: count || 0,
      });
    } else if (jobId) {
      // Eliminar un trabajo específico
      const { data, error } = await adminSupabase
        .from('indexation_jobs')
        .delete()
        .eq('id', jobId)
        .eq('admin_user_id', user.id)
        .select()
        .single();

      console.log('🗑️ DELETE single result:', { deleted: !!data, error: error?.message });

      if (error) {
        console.error('❌ Error eliminando trabajo:', error);
        return NextResponse.json(
          { error: `Error al eliminar el trabajo: ${error.message}` },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Trabajo no encontrado o sin permisos' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Trabajo eliminado correctamente',
      });
    } else {
      return NextResponse.json(
        { error: 'Debe proporcionar jobId o deleteAll' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error eliminando trabajos:', error);
    return NextResponse.json(
      { error: 'Error al eliminar los trabajos' },
      { status: 500 }
    );
  }
}

