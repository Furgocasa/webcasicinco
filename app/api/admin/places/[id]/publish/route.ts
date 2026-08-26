import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const body = await request.json();
    const { published } = body;

    // Actualizar el lugar
    const { data, error } = await supabase
      .from('places')
      .update({ 
        published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando lugar:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el lugar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      place: data,
    });

  } catch (error: any) {
    console.error('Error en actualización de lugar:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

