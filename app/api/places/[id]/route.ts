import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error cargando lugar:', error);
      return NextResponse.json(
        { error: 'Lugar no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      place: data,
    });

  } catch (error) {
    console.error('Error en API de lugar:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('places')
      .update(body)
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

  } catch (error) {
    console.error('Error en API de lugar:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando lugar:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el lugar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lugar eliminado correctamente',
    });

  } catch (error) {
    console.error('Error en API de lugar:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
