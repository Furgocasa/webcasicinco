import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

/**
 * POST - Buscar lugares manualmente en Google Places API (New)
 * Útil para añadir lugares específicos que no se capturaron en la indexación automática
 * 
 * Usa Places API (New) con endpoint:
 * https://places.googleapis.com/v1/places:searchText
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
        success: false,
        error: 'Búsqueda debe tener al menos 3 caracteres' 
      }, { status: 400 });
    }

    // Verificar que la API key existe
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('❌ GOOGLE_PLACES_API_KEY no configurada');
      return NextResponse.json({
        success: false,
        error: 'API Key de Google no configurada en el servidor',
        details: 'Contacta al administrador del sistema'
      }, { status: 500 });
    }

    console.log('🔍 Búsqueda manual (Places API New):', { 
      searchTerm, 
      apiKeyExists: true,
      apiKeyLength: GOOGLE_PLACES_API_KEY.length 
    });

    // Buscar en Google Places API (New) - Text Search
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery: searchTerm,
        languageCode: 'es',
        regionCode: 'ES',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.location,places.types,places.photos'
        },
      }
    );

    console.log('📡 Google Places API (New) Response:', {
      places_count: response.data.places?.length || 0,
      searchTerm,
    });

    // Verificar si hay resultados
    if (!response.data.places || response.data.places.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No se encontraron lugares que coincidan con tu búsqueda',
        googleStatus: 'ZERO_RESULTS',
        details: 'Intenta con otro término de búsqueda',
        places: []
      }, { status: 400 });
    }

    // Filtrar y formatear resultados
    const places = response.data.places
      .filter((place: any) => place.rating >= 4.7) // Solo ≥4.7
      .slice(0, 10) // Máximo 10 resultados
      .map((place: any) => ({
        place_id: place.id,
        name: place.displayName?.text || place.displayName,
        rating: place.rating,
        user_ratings_total: place.userRatingCount,
        address: place.formattedAddress,
        location: {
          lat: place.location?.latitude,
          lng: place.location?.longitude,
        },
        types: place.types || [],
        photos: place.photos?.slice(0, 1).map((p: any) => p.name) || [],
      }));

    return NextResponse.json({
      success: true,
      places,
      count: places.length,
      cost: 0.032, // $0.032 por búsqueda Text Search
    });

  } catch (error: any) {
    console.error('❌ Error en búsqueda manual:', error);
    
    // Manejo de errores específicos de Google Places API (New)
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('Google API Error:', {
        status,
        error: data.error,
        message: data.message,
      });
      
      let friendlyMessage = 'Error en la API de Google';
      
      if (status === 403) {
        friendlyMessage = 'API Key sin permisos. Verifica que Places API (New) esté habilitada';
      } else if (status === 400) {
        friendlyMessage = 'Búsqueda inválida. Intenta con otro término';
      } else if (status === 429) {
        friendlyMessage = 'Límite de consultas excedido. Intenta más tarde';
      }
      
      return NextResponse.json({ 
        success: false,
        error: friendlyMessage,
        googleStatus: data.error?.status || 'UNKNOWN',
        details: data.error?.message || data.message || 'Sin detalles adicionales'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Error desconocido en la búsqueda'
    }, { status: 500 });
  }
}

