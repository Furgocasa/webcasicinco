import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchPlaces } from '@/lib/google/places';
import { CATEGORIES } from '@/lib/utils/constants';

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
    const { query, province, categories, lat, lng } = body;

    // Validar parámetros
    if (!query && !province) {
      return NextResponse.json(
        { error: 'Se requiere al menos un criterio de búsqueda' },
        { status: 400 }
      );
    }

    // Construir consulta de búsqueda
    let searchQuery = query || '';
    
    if (province) {
      searchQuery += ` ${province}`;
    }

    if (categories && categories.length > 0) {
      searchQuery += ` ${categories.join(' ')}`;
    }

    // Buscar lugares en Google Maps
    const placeIds = await searchPlaces({
      keyword: searchQuery,
      latitude: lat,
      longitude: lng,
      radius: 10000, // Radio de 10km
      minRating: 4.7
    });

    return NextResponse.json({
      success: true,
      count: placeIds.length,
      places: placeIds,
    });

  } catch (error) {
    console.error('Error buscando lugares:', error);
    return NextResponse.json(
      { error: 'Error al buscar lugares en Google Maps' },
      { status: 500 }
    );
  }
}
