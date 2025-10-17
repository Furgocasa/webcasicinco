import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

/**
 * POST - Buscar lugares manualmente en Google Places
 * Útil para añadir lugares específicos que no se capturaron en la indexación automática
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchTerm } = await request.json();

    if (!searchTerm || searchTerm.length < 3) {
      return NextResponse.json({ 
        error: 'Búsqueda debe tener al menos 3 caracteres' 
      }, { status: 400 });
    }

    // Buscar en Google Places Text Search
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query: searchTerm,
          region: 'es', // Priorizar España
          language: 'es',
          key: GOOGLE_PLACES_API_KEY,
        },
      }
    );

    if (response.data.status !== 'OK') {
      return NextResponse.json({ 
        error: 'No se encontraron resultados',
        places: []
      });
    }

    // Filtrar y formatear resultados
    const places = response.data.results
      .filter((place: any) => place.rating >= 4.7) // Solo ≥4.7
      .slice(0, 10) // Máximo 10 resultados
      .map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        address: place.formatted_address,
        location: place.geometry.location,
        types: place.types,
        photos: place.photos?.slice(0, 1).map((p: any) => p.photo_reference) || [],
      }));

    return NextResponse.json({
      success: true,
      places,
      count: places.length,
      cost: 0.032, // $0.032 por búsqueda Text Search
    });

  } catch (error: any) {
    console.error('Error en búsqueda manual:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

