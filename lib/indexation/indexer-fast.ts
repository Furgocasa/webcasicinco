/**
 * INDEXER RÁPIDO - FASE 1
 * Solo busca, filtra y guarda datos básicos (SIN IA, SIN fotos)
 * Los lugares se marcan como "needs_enrichment = true" para procesarlos después
 */

import { createAdminClient } from '@/lib/supabase/server';
import { searchPlaces, getPlaceDetails, categorizePlaceByTypes, extractProvinceFromPlaceData, extractCityFromPlaceData } from '../google/places';
import { shouldExcludeChain } from './searcher';
import { generatePlaceSlug } from '../utils/slugify';

interface IndexationParams {
  provinces: string[];
  categories: string[];
  minRating: number;
}

interface IndexationResult {
  totalFound: number;
  totalProcessed: number;
  approved: number; // Rating ≥ 4.7, reseñas ≥ 20
  discarded: number;
  discardedReasons: {
    lowRating: number;
    lowReviews: number;
    chains: number;
    duplicates: number;
    errors: number;
  };
}

/**
 * Busca lugares y los guarda como "pendientes de enriquecimiento"
 */
export async function startFastIndexation(
  jobId: string,
  params: IndexationParams
): Promise<void> {
  const supabase = createAdminClient();

  console.log(`\n[FAST-INDEX] ${'='.repeat(70)}`);
  console.log(`[FAST-INDEX] 🚀 INDEXACIÓN RÁPIDA INICIADA`);
  console.log(`[FAST-INDEX]    Job ID: ${jobId}`);
  console.log(`[FAST-INDEX]    Provincias: ${params.provinces.join(', ')}`);
  console.log(`[FAST-INDEX]    Categorías: ${params.categories.join(', ')}`);
  console.log(`[FAST-INDEX]    Rating mínimo: ${params.minRating}`);
  console.log(`[FAST-INDEX] ${'='.repeat(70)}\n`);

  try {
    await supabase
      .from('indexation_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', jobId);

    const allPlaceIds = new Set<string>();
    const processedIds = new Set<string>();
    
    let totalProcessed = 0;
    let approved = 0;
    let lowRating = 0;
    let lowReviews = 0;
    let chains = 0;
    let duplicates = 0;
    let errors = 0;

    // Ciudades principales por provincia
    const mainCities: Record<string, string[]> = {
      'Murcia': ['Murcia', 'Cartagena', 'Lorca', 'Molina de Segura', 'Mazarrón', 'Yecla', 'Jumilla', 'Cieza'],
      'Alicante': ['Alicante', 'Elche', 'Torrevieja', 'Benidorm', 'Orihuela', 'Alcoy', 'Dénia'],
      'Madrid': ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Getafe'],
      'Barcelona': ['Barcelona', 'Hospitalet', 'Terrassa', 'Badalona', 'Sabadell', 'Mataró'],
      'Valencia': ['Valencia', 'Gandía', 'Torrent', 'Paterna', 'Sagunto', 'Alzira'],
      'Sevilla': ['Sevilla', 'Dos Hermanas', 'Alcalá de Guadaíra', 'Utrera', 'Mairena'],
      'Málaga': ['Málaga', 'Marbella', 'Mijas', 'Vélez-Málaga', 'Fuengirola', 'Torremolinos'],
      'Granada': ['Granada', 'Motril', 'Almuñécar'],
      'Cádiz': ['Cádiz', 'Jerez de la Frontera', 'Algeciras', 'San Fernando'],
      'Córdoba': ['Córdoba', 'Lucena', 'Puente Genil'],
    };

    // ==========================================
    // FASE 1: BÚSQUEDA EXHAUSTIVA
    // ==========================================
    console.log('[FAST-INDEX] 🔍 FASE 1: BÚSQUEDA EXHAUSTIVA\n');

    for (const province of params.provinces) {
      for (const category of params.categories) {
        const searchTerms: Record<string, string> = {
          'restaurante': 'restaurantes',
          'hotel': 'hoteles',
          'spa': 'spa wellness',
          'bar': 'bares',
          'cafe': 'cafeterías',
          'experiencia': 'lugares turísticos',
          'monumento': 'monumentos',
        };

        const searchTerm = searchTerms[category] || category;
        const cities = mainCities[province] || [province];

        console.log(`\n[FAST-INDEX] 📍 ${province} - ${category.toUpperCase()}`);
        console.log(`[FAST-INDEX] Buscando en ${cities.length} ciudades...\n`);

        for (let i = 0; i < cities.length; i++) {
          const city = cities[i];
          
          try {
            const placeIds = await searchPlaces({
              location: `${city}, ${province}, España`,
              keyword: searchTerm,
              minRating: params.minRating,
              radius: 50000,
            });

            const newCount = allPlaceIds.size;
            placeIds.forEach(id => allPlaceIds.add(id));
            const added = allPlaceIds.size - newCount;

            console.log(`[FAST-INDEX]   [${i+1}/${cities.length}] ${city}: ${placeIds.length} resultados (${added} nuevos)`);

            await supabase
              .from('indexation_jobs')
              .update({ total_places: allPlaceIds.size })
              .eq('id', jobId);

            await new Promise(r => setTimeout(r, 500));
          } catch (error) {
            console.error(`[FAST-INDEX] Error en ${city}:`, error);
          }
        }

        console.log(`[FAST-INDEX] ✅ ${category}: ${allPlaceIds.size} lugares únicos acumulados\n`);
      }
    }

    console.log(`\n[FAST-INDEX] ✅ BÚSQUEDA COMPLETADA: ${allPlaceIds.size} lugares encontrados`);
    console.log(`[FAST-INDEX] ${'='.repeat(70)}\n`);

    // ==========================================
    // FASE 2: PROCESAMIENTO RÁPIDO (solo detalles básicos)
    // ==========================================
    console.log('[FAST-INDEX] 🔄 FASE 2: FILTRADO Y GUARDADO RÁPIDO\n');

    const placesToProcess = Array.from(allPlaceIds).filter(id => !processedIds.has(id));
    console.log(`[FAST-INDEX] Procesando ${placesToProcess.length} lugares...\n`);

    for (const placeId of placesToProcess) {
      try {
        processedIds.add(placeId);
        totalProcessed++;

        if (totalProcessed % 50 === 0) {
          console.log(`[FAST-INDEX] 📊 ${totalProcessed}/${allPlaceIds.size} (${Math.round((totalProcessed/allPlaceIds.size)*100)}%)`);
        }

        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('places')
          .select('id')
          .eq('google_place_id', placeId)
          .single();

        if (existing) {
          duplicates++;
          continue;
        }

        // Obtener detalles básicos
        const details = await getPlaceDetails(placeId);

        // Verificar cadena
        if (shouldExcludeChain(details.name, true)) {
          chains++;
          continue;
        }

        // Filtrar por rating
        if (!details.rating || details.rating < 4.7) {
          lowRating++;
          continue;
        }

        // Filtrar por reseñas
        if (!details.user_ratings_total || details.user_ratings_total < 20) {
          lowReviews++;
          continue;
        }

        // ✅ LUGAR APROBADO - Guardar datos básicos
        const category = categorizePlaceByTypes(details.types);
        const province = extractProvinceFromPlaceData(details);
        const city = extractCityFromPlaceData(details);
        const slug = generatePlaceSlug(details.name, city);

        const placeData = {
          google_place_id: details.place_id,
          slug,
          name: details.name,
          category,
          rating: details.rating,
          review_count: details.user_ratings_total,
          country: 'España',
          region: extractRegionFromProvince(province),
          province,
          city,
          address: details.formatted_address,
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
          phone: details.formatted_phone_number,
          website: details.website,
          price_level: details.price_level,
          google_maps_url: details.url,
          photos: details.photos ? JSON.stringify(details.photos.slice(0, 5)) : null,
          published: false, // ← No publicar aún
          needs_enrichment: true, // ← Marcar para enriquecer después
          enrichment_status: 'pending',
        };

        const { error: saveError } = await supabase
          .from('places')
          .upsert(placeData, { onConflict: 'google_place_id' });

        if (saveError) {
          if (saveError.code === '23505') {
            duplicates++;
          } else {
            errors++;
            console.error(`[FAST-INDEX] Error: ${saveError.message}`);
          }
        } else {
          approved++;
          if (approved % 50 === 0) {
            console.log(`[FAST-INDEX] ✅ ${approved} lugares aprobados`);
          }
        }

        // Actualizar cada 10 lugares
        if (totalProcessed % 10 === 0) {
          await supabase
            .from('indexation_jobs')
            .update({
              total_places: allPlaceIds.size,
              processed_places: totalProcessed,
              successful_places: approved,
              failed_places: errors,
              error_log: {
                approved,
                lowRating,
                lowReviews,
                chains,
                duplicates,
                errors,
                summary: `${approved} aprobados | ${lowRating} rating bajo | ${lowReviews} pocas reseñas | ${chains} cadenas | ${duplicates} duplicados | ${errors} errores`
              }
            })
            .eq('id', jobId);
        }

      } catch (error: any) {
        errors++;
        console.error(`[FAST-INDEX] Error procesando ${placeId}:`, error.message);
      }
    }

    // Finalizar
    console.log(`\n[FAST-INDEX] ✅ INDEXACIÓN RÁPIDA COMPLETADA`);
    console.log(`[FAST-INDEX] 📊 RESUMEN:`);
    console.log(`[FAST-INDEX]    Encontrados: ${allPlaceIds.size}`);
    console.log(`[FAST-INDEX]    Procesados: ${totalProcessed}`);
    console.log(`[FAST-INDEX]    ✅ Aprobados: ${approved} (pendientes de enriquecimiento)`);
    console.log(`[FAST-INDEX]    ⏭️  Descartados: ${lowRating + lowReviews + chains + duplicates}`);
    console.log(`[FAST-INDEX]       - Rating bajo: ${lowRating}`);
    console.log(`[FAST-INDEX]       - Pocas reseñas: ${lowReviews}`);
    console.log(`[FAST-INDEX]       - Cadenas: ${chains}`);
    console.log(`[FAST-INDEX]       - Duplicados: ${duplicates}`);
    console.log(`[FAST-INDEX]    ❌ Errores: ${errors}`);
    console.log(`[FAST-INDEX] ${'='.repeat(70)}\n`);

    await supabase
      .from('indexation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_places: totalProcessed,
        successful_places: approved,
        failed_places: errors,
        error_log: {
          approved,
          lowRating,
          lowReviews,
          chains,
          duplicates,
          errors,
          summary: `${approved} aprobados (pendientes enriquecimiento) | ${lowRating + lowReviews + chains + duplicates} descartados | ${errors} errores`
        }
      })
      .eq('id', jobId);

  } catch (error: any) {
    console.error('[FAST-INDEX] ERROR FATAL:', error);
    await supabase
      .from('indexation_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: { error: error.message }
      })
      .eq('id', jobId);
    throw error;
  }
}

function extractRegionFromProvince(province: string): string {
  const map: Record<string, string> = {
    'Murcia': 'Murcia', 'Alicante': 'Comunidad Valenciana', 'Valencia': 'Comunidad Valenciana',
    'Madrid': 'Madrid', 'Barcelona': 'Cataluña', 'Sevilla': 'Andalucía',
    'Málaga': 'Andalucía', 'Granada': 'Andalucía', 'Cádiz': 'Andalucía', 'Córdoba': 'Andalucía',
  };
  return map[province] || 'España';
}

