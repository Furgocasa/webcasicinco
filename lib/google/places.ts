/**
 * Funciones para interactuar con Google Places API
 */

import axios from 'axios';
import type { GooglePlaceData, GooglePlacePhoto, GoogleReview } from '@/types/place';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

interface SearchPlacesParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // en metros
  type?: string;
  keyword?: string;
  minRating?: number;
}

/**
 * Busca lugares usando Text Search de Google Places CON PAGINACIÓN
 */
export async function searchPlaces(params: SearchPlacesParams): Promise<string[]> {
  try {
    const { location, latitude, longitude, radius = 50000, type, keyword, minRating = 4.7 } = params;
    
    let query = keyword || type || 'restaurant';
    if (location) {
      query += ` in ${location}`;
    }

    const allPlaceIds: string[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 20; // Límite muy alto - Google normalmente solo devuelve 3 páginas, pero no limitamos artificialmente

    // PAGINAR para obtener TODOS los resultados disponibles
    do {
      try {
        // Esperar si hay pageToken (Google requiere delay)
        if (pageToken) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const response: any = await axios.get(`${PLACES_API_BASE}/textsearch/json`, {
          params: {
            query,
            location: latitude && longitude ? `${latitude},${longitude}` : undefined,
            radius,
            type,
            key: GOOGLE_MAPS_API_KEY,
            pagetoken: pageToken,
          },
        });

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
          console.log(`⚠️ Google API status: ${response.data.status}`);
          break;
        }

        // NO FILTRAR AQUÍ - Devolver TODOS los resultados
        // El filtrado se hará después al obtener detalles completos
        response.data.results.forEach((place: any) => {
          if (!allPlaceIds.includes(place.place_id)) {
            allPlaceIds.push(place.place_id);
          }
        });

        pageToken = response.data.next_page_token;
        pageCount++;

        console.log(`  📄 Página ${pageCount}: ${response.data.results.length} resultados (filtrado después)`);

      } catch (error) {
        console.error('Error en paginación:', error);
        break;
      }
    } while (pageToken && pageCount < maxPages);

    console.log(`✅ Total con paginación: ${allPlaceIds.length} lugares`);

    return allPlaceIds;
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
}

/**
 * Busca lugares cercanos usando Nearby Search
 */
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 5000,
  type?: string
): Promise<string[]> {
  try {
    const response = await axios.get(`${PLACES_API_BASE}/nearbysearch/json`, {
      params: {
        location: `${latitude},${longitude}`,
        radius,
        type,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    // NO FILTRAR - devolver todos y filtrar después
    return response.data.results.map((place: any) => place.place_id);
  } catch (error) {
    console.error('Error searching nearby places:', error);
    throw error;
  }
}

/**
 * Obtiene los detalles completos de un lugar
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceData> {
  try {
    const response = await axios.get(`${PLACES_API_BASE}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'place_id,name,rating,user_ratings_total,formatted_address,address_components,geometry,price_level,formatted_phone_number,website,photos,reviews,types,url',
        language: 'es',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
}

/**
 * Obtiene la URL de una foto de Google Places
 */
export function getPlacePhotoUrl(
  photoReference: string,
  maxWidth: number = 800
): string {
  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Descarga múltiples fotos de un lugar
 */
export async function downloadPlacePhotos(
  photos: GooglePlacePhoto[],
  maxPhotos: number = 5
): Promise<string[]> {
  try {
    const photoUrls: string[] = [];
    const photosToDownload = photos.slice(0, maxPhotos);

    for (const photo of photosToDownload) {
      const url = getPlacePhotoUrl(photo.photo_reference, 1200);
      photoUrls.push(url);
    }

    return photoUrls;
  } catch (error) {
    console.error('Error downloading place photos:', error);
    throw error;
  }
}

/**
 * Extrae las reseñas de un lugar
 */
export function extractReviews(placeData: GooglePlaceData): GoogleReview[] {
  return placeData.reviews || [];
}

/**
 * Categoriza un lugar según sus types de Google
 * PRIORIZA tipos específicos sobre genéricos
 */
export function categorizePlaceByTypes(types: string[]): string {
  if (!types || types.length === 0) {
    return 'experiencia';
  }

  // ORDEN DE PRIORIDAD: tipos específicos primero, genéricos al final
  const priorityMap: Array<{ type: string; category: string; priority: number }> = [
    // Alta prioridad - Tipos específicos
    { type: 'restaurant', category: 'restaurante', priority: 10 },
    { type: 'meal_takeaway', category: 'restaurante', priority: 9 },
    { type: 'meal_delivery', category: 'restaurante', priority: 9 },
    { type: 'food', category: 'restaurante', priority: 8 },
    
    { type: 'lodging', category: 'hotel', priority: 10 },
    { type: 'hotel', category: 'hotel', priority: 10 },
    
    { type: 'spa', category: 'spa', priority: 10 },
    { type: 'beauty_salon', category: 'spa', priority: 9 },
    { type: 'hair_care', category: 'spa', priority: 8 },
    
    { type: 'bar', category: 'bar', priority: 10 },
    { type: 'night_club', category: 'bar', priority: 9 },
    { type: 'cafe', category: 'bar', priority: 8 },
    
    { type: 'museum', category: 'monumento', priority: 10 },
    { type: 'art_gallery', category: 'monumento', priority: 9 },
    
    // Baja prioridad - Tipos genéricos
    { type: 'tourist_attraction', category: 'experiencia', priority: 3 },
    { type: 'point_of_interest', category: 'experiencia', priority: 1 },
  ];

  // Buscar el tipo con mayor prioridad
  let bestMatch: { category: string; priority: number } | null = null;

  for (const type of types) {
    const match = priorityMap.find(m => m.type === type);
    if (match) {
      if (!bestMatch || match.priority > bestMatch.priority) {
        bestMatch = { category: match.category, priority: match.priority };
      }
    }
  }

  return bestMatch?.category || 'experiencia';
}

/**
 * Extrae la provincia desde address_components (administrative_area_level_2)
 */
export function extractProvinceFromPlaceData(placeData: GooglePlaceData): string {
  if (!placeData.address_components) {
    // Fallback al método antiguo si no hay address_components
    return extractProvinceFromAddressLegacy(placeData.formatted_address);
  }

  // Buscar administrative_area_level_2 (provincia)
  const provinceComponent = placeData.address_components.find((component: any) =>
    component.types.includes('administrative_area_level_2')
  );

  if (provinceComponent) {
    return provinceComponent.long_name;
  }

  // Si no hay nivel 2, intentar con nivel 1 (comunidad autónoma)
  const regionComponent = placeData.address_components.find((component: any) =>
    component.types.includes('administrative_area_level_1')
  );

  if (regionComponent) {
    return regionComponent.long_name;
  }

  // Último fallback
  return extractProvinceFromAddressLegacy(placeData.formatted_address);
}

/**
 * Extrae la ciudad desde address_components (locality)
 */
export function extractCityFromPlaceData(placeData: GooglePlaceData): string {
  if (!placeData.address_components) {
    // Fallback al método antiguo si no hay address_components
    return extractCityFromAddressLegacy(placeData.formatted_address);
  }

  // Buscar locality (ciudad)
  const cityComponent = placeData.address_components.find((component: any) =>
    component.types.includes('locality')
  );

  if (cityComponent) {
    return cityComponent.long_name;
  }

  // Si no hay locality, intentar con sublocality
  const sublocalityComponent = placeData.address_components.find((component: any) =>
    component.types.includes('sublocality') || component.types.includes('sublocality_level_1')
  );

  if (sublocalityComponent) {
    return sublocalityComponent.long_name;
  }

  // Si no, intentar con administrative_area_level_3
  const areaComponent = placeData.address_components.find((component: any) =>
    component.types.includes('administrative_area_level_3')
  );

  if (areaComponent) {
    return areaComponent.long_name;
  }

  // Último fallback
  return extractCityFromAddressLegacy(placeData.formatted_address);
}

/**
 * Extrae la provincia de una dirección formateada (MÉTODO LEGACY - FALLBACK)
 */
function extractProvinceFromAddressLegacy(address: string): string {
  const provinces = [
    'Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla',
    'Huesca', 'Teruel', 'Zaragoza',
    'Asturias',
    'Islas Baleares', 'Baleares',
    'Las Palmas', 'Santa Cruz de Tenerife',
    'Cantabria',
    'Ávila', 'Burgos', 'León', 'Palencia', 'Salamanca', 'Segovia', 'Soria', 'Valladolid', 'Zamora',
    'Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara', 'Toledo',
    'Barcelona', 'Girona', 'Lleida', 'Tarragona',
    'Alicante', 'Castellón', 'Valencia',
    'Badajoz', 'Cáceres',
    'A Coruña', 'Lugo', 'Ourense', 'Pontevedra',
    'La Rioja',
    'Madrid',
    'Murcia',
    'Navarra',
    'Álava', 'Gipuzkoa', 'Bizkaia',
  ];

  for (const province of provinces) {
    if (address.includes(province)) {
      return province;
    }
  }

  return 'España';
}

/**
 * Extrae la ciudad de una dirección formateada (MÉTODO LEGACY - FALLBACK)
 */
function extractCityFromAddressLegacy(address: string): string {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Normalmente la ciudad está en la penúltima posición
    return parts[parts.length - 2].replace(/\d{5}/, '').trim();
  }
  return '';
}

/**
 * FUNCIONES LEGACY PARA COMPATIBILIDAD (usar las nuevas funciones arriba)
 * @deprecated Usar extractProvinceFromPlaceData en su lugar
 */
export function extractProvinceFromAddress(address: string): string {
  return extractProvinceFromAddressLegacy(address);
}

/**
 * @deprecated Usar extractCityFromPlaceData en su lugar
 */
export function extractCityFromAddress(address: string): string {
  return extractCityFromAddressLegacy(address);
}
