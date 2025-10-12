import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del trabajo' },
        { status: 400 }
      );
    }

    // Actualizar estado del trabajo a "paused"
    const { data, error } = await supabase
      .from('indexation_jobs')
      .update({ 
        status: 'paused',
      })
      .eq('id', jobId)
      .eq('admin_user_id', user.id) // Solo el creador puede pausar
      .select()
      .single();

    if (error) {
      console.error('Error pausando indexación:', error);
      return NextResponse.json(
        { error: 'Error al pausar la indexación' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Trabajo no encontrado o no tienes permisos' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: data,
    });

  } catch (error) {
    console.error('Error pausando indexación:', error);
    return NextResponse.json(
      { error: 'Error al pausar la indexación' },
      { status: 500 }
    );
  }
}
