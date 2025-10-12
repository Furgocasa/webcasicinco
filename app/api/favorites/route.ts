import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener favoritos del usuario
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        *,
        place:places(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando favoritos:', error);
      return NextResponse.json(
        { error: 'Error al cargar los favoritos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      favorites: data || [],
    });

  } catch (error) {
    console.error('Error en API de favoritos:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { placeId } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: 'ID del lugar requerido' },
        { status: 400 }
      );
    }

    // Añadir a favoritos
    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        place_id: placeId,
      })
      .select()
      .single();

    if (error) {
      // Si ya existe, es un error 409
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya está en favoritos' },
          { status: 409 }
        );
      }

      console.error('Error añadiendo favorito:', error);
      return NextResponse.json(
        { error: 'Error al añadir a favoritos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      favorite: data,
    });

  } catch (error) {
    console.error('Error en API de favoritos:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json(
        { error: 'ID del lugar requerido' },
        { status: 400 }
      );
    }

    // Eliminar de favoritos
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('place_id', placeId);

    if (error) {
      console.error('Error eliminando favorito:', error);
      return NextResponse.json(
        { error: 'Error al eliminar de favoritos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Eliminado de favoritos',
    });

  } catch (error) {
    console.error('Error en API de favoritos:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
