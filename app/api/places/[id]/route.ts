import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generatePlaceSlug } from '@/lib/utils/slugify';

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
    const adminSupabase = createAdminClient();
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
    
    // Requerir rol admin para actualizar lugares
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Validar categoría si viene en el body
    const ALLOWED_CATEGORIES = ['restaurante', 'bar', 'cafe', 'hotel'];
    if (body.category && !ALLOWED_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: `Categoría no permitida. Solo: ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Si se cambia categoría, regenerar slug para SEO correcto
    if (body.category) {
      const { data: currentPlace } = await adminSupabase
        .from('places')
        .select('category, name, city, slug')
        .eq('id', id)
        .single();

      if (currentPlace && currentPlace.category !== body.category) {
        // Regenerar slug con nueva categoría
        const newSlug = generatePlaceSlug(currentPlace.name, currentPlace.city);
        body.slug = newSlug;
        
        console.log(`🔄 Categoría cambiada: ${currentPlace.category} → ${body.category}, slug: ${currentPlace.slug} → ${newSlug}`);
      }
    }

    // Usar cliente admin para evitar problemas de RLS
    const { data, error } = await adminSupabase
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

    // Si se actualizó categoría, invalidar cache del mapa (incrementar versión)
    if (body.category) {
      console.log('🔄 Categoría actualizada, cache del mapa se invalidará automáticamente en próxima carga');
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
    const adminSupabase = createAdminClient();
    const { id } = params;

    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Requerir rol admin
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const { error } = await adminSupabase
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
