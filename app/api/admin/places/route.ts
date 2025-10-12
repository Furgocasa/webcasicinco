import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const province = searchParams.get('province');
    const search = searchParams.get('search');
    const published = searchParams.get('published'); // 'true', 'false', o null (todos)
    
    // PAGINACIÓN para evitar 413 Payload Too Large
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Máximo 100 por página
    const offset = (page - 1) * limit;

    // Construir query
    let query = supabase
      .from('places')
      .select('*', { count: 'exact' });

    // Filtros
    if (category) {
      query = query.eq('category', category);
    }

    if (province) {
      query = query.eq('province', province);
    }

    if (published !== null) {
      query = query.eq('published', published === 'true');
    }

    // Búsqueda por texto
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    // Ordenar y paginar
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error cargando lugares:', error);
      return NextResponse.json(
        { error: 'Error al cargar los lugares' },
        { status: 500 }
      );
    }

    console.log(`✅ Cargados ${data?.length || 0} lugares (página ${page} de ${Math.ceil((count || 0) / limit)})`);

    return NextResponse.json({
      success: true,
      places: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });

  } catch (error: any) {
    console.error('Error en API de lugares admin:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

