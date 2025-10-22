/**
 * Procesador de lugares - Obtiene datos de Google, genera contenido IA y guarda en DB
 */

import { createAdminClient } from '../supabase/server';
import {
  getPlaceDetails,
  downloadPlacePhotos,
  downloadAndUploadPhotosToSupabase,
  extractReviews,
  categorizePlaceByTypes,
  extractProvinceFromPlaceData,
  extractCityFromPlaceData,
} from '../google/places';
import {
  generatePlaceDescription,
  summarizeReviews,
  generateHighlights,
} from '../ai/openai';
import { generatePlaceSlug } from '../utils/slugify';
import { shouldExcludeChain } from './searcher';
import type { Place } from '@/types/place';

export interface ProcessPlaceResult {
  success: boolean;
  place?: Partial<Place>;
  error?: string;
  cost: number;
}

/**
 * Procesa un lugar completo: obtiene datos, genera IA, guarda en DB
 */
export async function processPlace(
  placeId: string,
  excludeChains: boolean = false
): Promise<ProcessPlaceResult> {
  let cost = 0;

  try {
    // 1. Obtener detalles del lugar de Google
    const placeDetails = await getPlaceDetails(placeId);
    cost += 0.012; // ✅ OPTIMIZADO: Sin 'photos' (antes $0.017)

    // Verificar si es cadena y debe excluirse
    if (shouldExcludeChain(placeDetails.name, excludeChains)) {
      return {
        success: false,
        error: 'Chain excluded',
        cost,
      };
    }

    // Verificar rating mínimo (4.7)
    if (!placeDetails.rating || placeDetails.rating < 4.7) {
      return {
        success: false,
        error: `Rating demasiado bajo: ${placeDetails.rating} (mínimo 4.7)`,
        cost,
      };
    }

    // Verificar número mínimo de reseñas (20)
    if (!placeDetails.user_ratings_total || placeDetails.user_ratings_total < 20) {
      return {
        success: false,
        error: `Pocas reseñas: ${placeDetails.user_ratings_total} (mínimo 20)`,
        cost,
      };
    }

    // 2. ✅ OPTIMIZACIÓN: Guardar solo referencias de fotos (sin descargar aún)
    // Las fotos se descargarán DESPUÉS de validar IA para ahorrar costes
    const photoReferences = placeDetails.photos 
      ? placeDetails.photos.slice(0, 3).map((p: any) => p.photo_reference)
      : [];

    // 3. Extraer reseñas
    const reviews = extractReviews(placeDetails);

    // 4. Generar contenido con IA
    
    const category = categorizePlaceByTypes(placeDetails.types);
    const province = extractProvinceFromPlaceData(placeDetails);
    const city = extractCityFromPlaceData(placeDetails);

    let description, reviewSummary, highlights;

    try {
      // Generar descripción
      description = await generatePlaceDescription({
        name: placeDetails.name,
        category,
        city,
        province,
        rating: placeDetails.rating,
        review_count: placeDetails.user_ratings_total,
        price_level: placeDetails.price_level,
        reviews: reviews.map(r => r.text || '').filter(Boolean),
      });
      cost += 0.015;
    } catch (aiError: any) {
      return {
        success: false,
        error: `Error OpenAI generando descripción: ${aiError.message}`,
        cost,
      };
    }

    try {
      // Generar resumen de reseñas
      reviewSummary = await summarizeReviews(reviews.map(r => r.text || '').filter(Boolean));
      cost += 0.008;
    } catch (aiError: any) {
      return {
        success: false,
        error: `Error OpenAI resumiendo reseñas: ${aiError.message}`,
        cost,
      };
    }

    try {
      // Generar highlights
      highlights = await generateHighlights({
        name: placeDetails.name,
        category,
        rating: placeDetails.rating,
        reviews: reviews.map(r => r.text || '').filter(Boolean),
        description: description,
      });
      cost += 0.008;
    } catch (aiError: any) {
      return {
        success: false,
        error: `Error OpenAI generando highlights: ${aiError.message}`,
        cost,
      };
    }

    // ✅ OPTIMIZACIÓN: NO descargar fotos en indexación inicial
    // Las fotos se descargarán SOLO en fase de enriquecimiento (5 fotos)
    // Esto evita duplicar descargas (antes: 3 aquí + 5 en enriquecimiento = 8 total)
    // Ahora: 0 aquí + 5 en enriquecimiento = 5 total → Ahorro 37%
    const supabaseUrls: string[] = []; // Sin fotos hasta enriquecimiento

    // 5. Preparar datos del lugar
    const slug = generatePlaceSlug(placeDetails.name, city);
    
    const placeData: Partial<Place> = {
      google_place_id: placeDetails.place_id,
      slug,
      name: placeDetails.name,
      category: category as any,
      rating: placeDetails.rating,
      review_count: placeDetails.user_ratings_total,
      country: 'España',
      region: extractRegionFromProvince(province),
      province,
      city,
      address: placeDetails.formatted_address,
      latitude: placeDetails.geometry.location.lat,
      longitude: placeDetails.geometry.location.lng,
      phone: placeDetails.formatted_phone_number,
      website: placeDetails.website,
      price_level: placeDetails.price_level,
      ai_description: description,
      ai_review_summary: reviewSummary,
      ai_highlights: highlights,
      photos: photoReferences, // Mantener referencias para backward compatibility
      photo_urls: supabaseUrls, // NUEVO: URLs de Supabase Storage
      google_maps_url: placeDetails.url,
      published: false,
      featured: false,
    };

    // 6. RETORNAR datos procesados (el indexer los guardará)
    
    return {
      success: true,
      place: placeData,
      cost,
    };
  } catch (error: any) {
    console.error('[PROCESSOR] Error processing place:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      cost,
    };
  }
}

/**
 * Extrae la región a partir de la provincia
 */
function extractRegionFromProvince(province: string): string {
  const provinceToRegion: Record<string, string> = {
    Almería: 'Andalucía',
    Cádiz: 'Andalucía',
    Córdoba: 'Andalucía',
    Granada: 'Andalucía',
    Huelva: 'Andalucía',
    Jaén: 'Andalucía',
    Málaga: 'Andalucía',
    Sevilla: 'Andalucía',
    Huesca: 'Aragón',
    Teruel: 'Aragón',
    Zaragoza: 'Aragón',
    Asturias: 'Asturias',
    'Islas Baleares': 'Islas Baleares',
    Baleares: 'Islas Baleares',
    'Las Palmas': 'Canarias',
    'Santa Cruz de Tenerife': 'Canarias',
    Cantabria: 'Cantabria',
    Ávila: 'Castilla y León',
    Burgos: 'Castilla y León',
    León: 'Castilla y León',
    Palencia: 'Castilla y León',
    Salamanca: 'Castilla y León',
    Segovia: 'Castilla y León',
    Soria: 'Castilla y León',
    Valladolid: 'Castilla y León',
    Zamora: 'Castilla y León',
    Albacete: 'Castilla-La Mancha',
    'Ciudad Real': 'Castilla-La Mancha',
    Cuenca: 'Castilla-La Mancha',
    Guadalajara: 'Castilla-La Mancha',
    Toledo: 'Castilla-La Mancha',
    Barcelona: 'Cataluña',
    Girona: 'Cataluña',
    Lleida: 'Cataluña',
    Tarragona: 'Cataluña',
    Alicante: 'Comunidad Valenciana',
    Castellón: 'Comunidad Valenciana',
    Valencia: 'Comunidad Valenciana',
    Badajoz: 'Extremadura',
    Cáceres: 'Extremadura',
    'A Coruña': 'Galicia',
    Lugo: 'Galicia',
    Ourense: 'Galicia',
    Pontevedra: 'Galicia',
    'La Rioja': 'La Rioja',
    Madrid: 'Madrid',
    Murcia: 'Murcia',
    Navarra: 'Navarra',
    Álava: 'País Vasco',
    Gipuzkoa: 'País Vasco',
    Bizkaia: 'País Vasco',
  };

  return provinceToRegion[province] || 'España';
}

/**
 * Procesa múltiples lugares de forma secuencial
 */
export async function processPlaces(
  placeIds: string[],
  excludeChains: boolean,
  onProgress?: (current: number, total: number, placeName: string) => void
): Promise<{
  successful: number;
  failed: number;
  totalCost: number;
  errors: Array<{ placeId: string; error: string }>;
}> {
  let successful = 0;
  let failed = 0;
  let totalCost = 0;
  const errors: Array<{ placeId: string; error: string }> = [];

  for (let i = 0; i < placeIds.length; i++) {
    const placeId = placeIds[i];
    
    try {
      // Pequeña pausa para no saturar las APIs
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const result = await processPlace(placeId, excludeChains);
      totalCost += result.cost;

      if (result.success) {
        successful++;
        if (onProgress && result.place) {
          onProgress(i + 1, placeIds.length, result.place.name || 'Unknown');
        }
      } else {
        failed++;
        errors.push({ placeId, error: result.error || 'Unknown error' });
      }
    } catch (error: any) {
      failed++;
      totalCost += 0.02; // Coste aproximado de llamadas fallidas
      errors.push({ placeId, error: error.message });
    }
  }

  return {
    successful,
    failed,
    totalCost,
    errors,
  };
}
