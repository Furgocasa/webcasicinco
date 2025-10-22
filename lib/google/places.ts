/**
 * Funciones para interactuar con Google Places API
 */

import axios from 'axios';
import type { GooglePlaceData, GooglePlacePhoto, GoogleReview } from '@/types/place';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

interface SearchPlacesParams {
  query?: string;      // 🆕 Query completo (prioritario si existe)
  location?: string;   // Ubicación (legacy, para compatibilidad)
  latitude?: number;
  longitude?: number;
  radius?: number;     // en metros
  type?: string;
  keyword?: string;
  minRating?: number;
}

/**
 * Busca lugares usando Text Search de Google Places CON PAGINACIÓN Y CACHÉ
 * Soporta query completo O construcción legacy con keyword/location
 * 
 * OPTIMIZACIÓN: Cachea resultados en BD para evitar búsquedas duplicadas
 * - Ahorra ~$0.032 por búsqueda cacheada
 * - Caché expira en 30 días
 */
export async function searchPlaces(params: SearchPlacesParams): Promise<string[]> {
  try {
    const { query: providedQuery, location, latitude, longitude, radius = 50000, type, keyword, minRating = 4.7 } = params;
    
    // 🆕 PRIORIZAR query completo si existe, sino construir legacy
    let query: string;
    if (providedQuery) {
      query = providedQuery; // ✅ Usar query directo: "hamburgueserías Madrid, Madrid, España"
    } else {
      // Legacy: construir query
      query = keyword || type || 'restaurant';
      if (location) {
        query += ` in ${location}`;
      }
    }

    // Logs mínimos (solo para debugging crítico)
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('❌ GOOGLE_MAPS_API_KEY no está configurada');
    }

    // ✅ OPTIMIZACIÓN: Verificar caché primero (no afecta funcionalidad si falla)
    const cacheKey = `${query}|${latitude || ''}|${longitude || ''}|${radius}|${type || ''}`;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: cachedResult, error: cacheError } = await supabase
        .from('search_cache')
        .select('place_ids, result_count')
        .eq('search_query', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!cacheError && cachedResult && cachedResult.place_ids) {
        const cachedIds = cachedResult.place_ids as string[];
        console.log(`💾 CACHÉ HIT: "${query}" (${cachedIds.length} lugares) - Ahorro: $0.032`);
        
        // Actualizar last_used_at
        await supabase
          .from('search_cache')
          .update({ last_used_at: new Date().toISOString() })
          .eq('search_query', cacheKey);
        
        return cachedIds;
      }
    } catch (cacheCheckError) {
      // Si falla el caché, continuar normalmente sin afectar funcionalidad
      console.log('⚠️ Caché no disponible, buscando en Google API...');
    }

    // ❌ CACHÉ MISS: Buscar en Google API (comportamiento original)
    console.log(`🔍 Buscando en Google API: "${query}"`);
    const allPlaceIds: string[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 999; // ✅ SIN LÍMITE REAL - Google pagina hasta que no haya más (normalmente 3-5 páginas)

    // PAGINAR HASTA EL FINAL - obtener TODOS los resultados que Google tenga
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
            region: 'es',  // 🔒 Sesgo hacia España (region bias)
          },
        });

        // Verificar errores
        if (response.data.error_message) {
          console.error(`❌ Google API Error: ${response.data.error_message}`);
        }

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
          // Manejo especial de límites de cuota para esperar y reintentar
          const status = response.data.status as string;
          if (status === 'OVER_QUERY_LIMIT' || status === 'RESOURCE_EXHAUSTED') {
            console.warn('⏳ Límite de cuota alcanzado. Esperando 60s antes de continuar...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            continue; // reintentar misma página
          }
          console.log(`⚠️ Status: ${response.data.status} - Terminando búsqueda`);
          break;
        }

        if (response.data.status === 'ZERO_RESULTS') {
          break;
        }

        // 🔍 DEBUG: Log de la query y resultados para investigar
        console.log(`🔍 DEBUG - Query: "${query}"`);
        console.log(`🔍 DEBUG - Resultados: ${response.data.results.length}`);
        if (response.data.results.length > 0) {
          console.log(`🔍 DEBUG - Primer resultado: ${response.data.results[0].name} - ${response.data.results[0].formatted_address}`);
        }

        // Agregar resultados (sin logs individuales)
        response.data.results.forEach((place: any) => {
          if (!allPlaceIds.includes(place.place_id)) {
            allPlaceIds.push(place.place_id);
          }
        });

        pageToken = response.data.next_page_token;
        pageCount++;

        console.log(`   📄 Página ${pageCount}: +${response.data.results.length} resultados | Total: ${allPlaceIds.length}`);

      } catch (error: any) {
        console.error('❌ Error en paginación:', error.message);
        if (error.response) {
          console.error('   Status:', error.response.status);
          console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        break;
      }
    } while (pageToken && pageCount < maxPages);

    console.log('\n========== FIN BÚSQUEDA GOOGLE PLACES ==========');
    console.log(`✅ TOTAL: ${allPlaceIds.length} lugares encontrados\n`);

    // ✅ OPTIMIZACIÓN: Guardar en caché para futuras búsquedas (no afecta funcionalidad si falla)
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase.from('search_cache').upsert({
        search_query: cacheKey,
        province: location || null,
        city: null,
        category: type || null,
        place_ids: allPlaceIds,
        result_count: allPlaceIds.length,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'search_query'
      });

      console.log(`💾 Guardado en caché: "${query}" (${allPlaceIds.length} lugares) - Ahorro futuro: $0.032`);
    } catch (cacheSaveError) {
      // Si falla guardar en caché, no afecta el resultado
      console.log('⚠️ No se pudo guardar en caché, pero la búsqueda fue exitosa');
    }

    return allPlaceIds;
  } catch (error: any) {
    console.error('❌ ERROR FATAL en searchPlaces:', error.message);
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
 * ✅ OPTIMIZADO: Sin campo 'photos' (ahorro $0.005 por llamada)
 * Usar getPlacePhotos() si necesitas referencias de fotos
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceData> {
  try {
    const response = await axios.get(`${PLACES_API_BASE}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'place_id,name,rating,user_ratings_total,formatted_address,address_components,geometry,price_level,formatted_phone_number,website,reviews,types,url',
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
 * Obtiene solo las referencias de fotos de un lugar
 * Coste: $0.005 (Atmosphere Data)
 * Usar solo cuando realmente necesites fotos nuevas
 */
export async function getPlacePhotos(placeId: string): Promise<string[]> {
  try {
    const response = await axios.get(`${PLACES_API_BASE}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'photos',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    const photos = response.data.result?.photos || [];
    return photos.map((p: any) => p.photo_reference);
  } catch (error) {
    console.error('Error getting place photos:', error);
    return [];
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
 * Descarga fotos desde Google y las sube a Supabase Storage
 * NUEVO: Ahorra costos - solo descarga 1 vez, muestra desde Supabase siempre
 */
export async function downloadAndUploadPhotosToSupabase(
  photos: GooglePlacePhoto[],
  placeName: string,
  placeId: string,
  maxPhotos: number = 5
): Promise<{ supabaseUrls: string[], photoReferences: string[] }> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const photoReferences: string[] = [];
    const supabaseUrls: string[] = [];
    const photosToProcess = photos.slice(0, maxPhotos);

    for (let i = 0; i < photosToProcess.length; i++) {
      const photo = photosToProcess[i];
      const photoRef = photo.photo_reference;
      photoReferences.push(photoRef);

      try {
        // 1. Descargar foto desde Google
        const googlePhotoUrl = getPlacePhotoUrl(photoRef, 1200);
        const response = await axios.get(googlePhotoUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
        });

        // 2. Preparar nombre de archivo único
        const fileName = `${placeId}_${i}.jpg`;
        const filePath = `places/${placeId}/${fileName}`;

        // 3. Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('place-photos')
          .upload(filePath, response.data, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true, // Sobrescribir si ya existe
          });

        if (uploadError) {
          console.error(`Error subiendo foto ${i} a Supabase:`, uploadError);
          continue;
        }

        // 4. Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('place-photos')
          .getPublicUrl(filePath);

        supabaseUrls.push(publicUrl);
        console.log(`✅ Foto ${i + 1}/${photosToProcess.length} subida a Supabase`);

      } catch (photoError) {
        console.error(`Error procesando foto ${i}:`, photoError);
        // Continuar con la siguiente foto
      }

      // Pausa para no saturar
      if (i < photosToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { supabaseUrls, photoReferences };

  } catch (error) {
    console.error('Error downloading and uploading photos:', error);
    // Fallback: devolver solo referencias si falla Supabase
    return { 
      supabaseUrls: [], 
      photoReferences: photos.slice(0, maxPhotos).map(p => p.photo_reference) 
    };
  }
}

/**
 * LEGACY: Descarga múltiples fotos de un lugar (solo construye URLs de Google)
 * @deprecated Usar downloadAndUploadPhotosToSupabase en su lugar
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
