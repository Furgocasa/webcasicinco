import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // SOLUCIÓN: Cargar TODOS los lugares en múltiples peticiones si es necesario
    let allData: any[] = [];
    let totalCount = 0;
    let currentOffset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      // Construir query para este lote
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

      // Ordenar por fecha de creación (más recientes primero)
      query = query
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + batchSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error cargando lugares:', error);
        return NextResponse.json(
          { error: 'Error al cargar los lugares' },
          { status: 500 }
        );
      }

      if (currentOffset === 0) {
        totalCount = count || 0;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        currentOffset += batchSize;
        
        // Si obtuvimos menos de batchSize, no hay más datos
        if (data.length < batchSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Cargados ${allData.length} lugares en total`);

    return NextResponse.json({
      success: true,
      places: allData,
      total: totalCount,
    });

  } catch (error: any) {
    console.error('Error en API de lugares admin:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

