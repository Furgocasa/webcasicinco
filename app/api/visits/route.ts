import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Obtener visitas del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener visitas del usuario con información del lugar
    const { data, error } = await supabase
      .from('user_visits')
      .select(`
        *,
        place:places(*)
      `)
      .eq('user_id', user.id)
      .order('visited_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo visitas:', error);
      return NextResponse.json(
        { error: 'Error al obtener visitas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      visits: data || [],
    });

  } catch (error: any) {
    console.error('Error en API de visitas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// POST - Registrar una visita
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { place_id, notes, rating } = body;

    if (!place_id) {
      return NextResponse.json(
        { error: 'place_id es requerido' },
        { status: 400 }
      );
    }

    // Registrar visita
    const { data, error } = await supabase
      .from('user_visits')
      .insert({
        user_id: user.id,
        place_id,
        notes,
        rating,
        visited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error registrando visita:', error);
      return NextResponse.json(
        { error: 'Error al registrar visita' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      visit: data,
    });

  } catch (error: any) {
    console.error('Error en API de visitas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una visita
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const visit_id = searchParams.get('id');

    if (!visit_id) {
      return NextResponse.json(
        { error: 'ID de visita requerido' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_visits')
      .delete()
      .eq('id', visit_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error eliminando visita:', error);
      return NextResponse.json(
        { error: 'Error al eliminar visita' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {
    console.error('Error en API de visitas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

