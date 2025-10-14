/**
 * INDEXER RÁPIDO - FASE 1 (VERSIÓN PROFESIONAL)
 * Solo busca, filtra y guarda datos básicos (SIN IA, SIN fotos)
 * Los lugares se marcan como "needs_enrichment = true" para procesarlos después
 * 
 * MEJORAS PROFESIONALES:
 * - Logs en tiempo real guardados en BD
 * - Control de pausa/cancelación con should_continue
 * - Verificación cada N iteraciones para poder detener el proceso
 */

import { createAdminClient } from '@/lib/supabase/server';
import { searchPlaces, getPlaceDetails, extractProvinceFromPlaceData, extractCityFromPlaceData } from '../google/places';
import { shouldExcludeChain } from './searcher';
import { generatePlaceSlug } from '../utils/slugify';
import { strictCategorizePlaceByTypes, shouldExcludeFromCategory } from './category-filters';
import { IndexationLogger } from './logger';

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
 * Verifica si el trabajo debe continuar ejecutándose
 * Consulta el campo should_continue en la BD
 */
async function shouldContinueJob(jobId: string, supabase: ReturnType<typeof createAdminClient>): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('indexation_jobs')
      .select('should_continue, status')
      .eq('id', jobId)
      .single();
    
    // Si should_continue es false o el status cambió, detener
    return data?.should_continue === true && data?.status === 'running';
  } catch (error) {
    console.error('Error verificando should_continue:', error);
    return true; // En caso de error, continuar para no interrumpir sin motivo
  }
}

/**
 * Busca lugares y los guarda como "pendientes de enriquecimiento"
 */
export async function startFastIndexation(
  jobId: string,
  params: IndexationParams
): Promise<void> {
  const supabase = createAdminClient();
  const logger = new IndexationLogger(jobId);

  await logger.info('🚀 Indexación rápida iniciada');
  await logger.info(`Provincias: ${params.provinces.join(', ')}`);
  await logger.info(`Categorías: ${params.categories.join(', ')}`);
  await logger.info(`Rating mínimo: ${params.minRating}`);

  try {
    await supabase
      .from('indexation_jobs')
      .update({ 
        status: 'running', 
        started_at: new Date().toISOString(),
        should_continue: true // Asegurar que comienza en true
      })
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

    // Ciudades principales por provincia (COBERTURA MÁXIMA - 12 ciudades)
    const mainCities: Record<string, string[]> = {
      'Murcia': ['Murcia', 'Cartagena', 'Lorca', 'Molina de Segura', 'Mazarrón', 'Yecla', 'Jumilla', 'Cieza', 'Águilas', 'San Javier', 'Totana', 'Alcantarilla'],
      'Alicante': ['Alicante', 'Elche', 'Torrevieja', 'Benidorm', 'Orihuela', 'Alcoy', 'Dénia', 'Jávea', 'Calpe', 'Altea', 'Villena', 'Elda'],
      'Madrid': ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Getafe', 'Torrejón', 'Parla', 'Coslada', 'Pozuelo', 'Las Rozas', 'Majadahonda'],
      'Barcelona': ['Barcelona', 'Hospitalet', 'Terrassa', 'Badalona', 'Sabadell', 'Mataró', 'Granollers', 'Sitges', 'Vic', 'Manresa', 'Rubí', 'Cornellà'],
      'Valencia': ['Valencia', 'Gandía', 'Torrent', 'Paterna', 'Sagunto', 'Alzira', 'Cullera', 'Burjassot', 'Mislata', 'Requena', 'Xàtiva', 'Ontinyent'],
      'Sevilla': ['Sevilla', 'Dos Hermanas', 'Alcalá de Guadaíra', 'Utrera', 'Mairena', 'Écija', 'La Rinconada', 'Carmona', 'Lebrija', 'Coria del Río', 'Los Palacios', 'Osuna'],
      'Málaga': ['Málaga', 'Marbella', 'Mijas', 'Vélez-Málaga', 'Fuengirola', 'Torremolinos', 'Estepona', 'Benalmádena', 'Ronda', 'Antequera', 'Nerja', 'Torrox'],
      'Granada': ['Granada', 'Motril', 'Almuñécar', 'Baza', 'Guadix', 'Loja', 'Armilla', 'Albolote', 'Maracena', 'Salobreña', 'Huétor Vega', 'Atarfe'],
      'Cádiz': ['Cádiz', 'Jerez de la Frontera', 'Algeciras', 'San Fernando', 'El Puerto de Santa María', 'Chiclana', 'La Línea', 'Sanlúcar', 'Barbate', 'Rota', 'Conil', 'Tarifa'],
      'Córdoba': ['Córdoba', 'Lucena', 'Puente Genil', 'Montilla', 'Priego', 'Palma del Río', 'Pozoblanco', 'Baena', 'Cabra', 'Aguilar', 'Rute', 'Fernán Núñez'],
      'A Coruña': ['A Coruña', 'Santiago de Compostela', 'Ferrol', 'Carballo', 'Oleiros', 'Culleredo', 'Arteixo', 'Betanzos', 'Narón', 'Ames', 'Cambre', 'Ribeira'],
      'Albacete': ['Albacete', 'Hellín', 'Villarrobledo', 'Almansa', 'La Roda', 'Caudete', 'Yeste', 'Tobarra', 'Tarazona', 'Chinchilla', 'Madrigueras', 'Alcalá del Júcar'],
    };

    // ==========================================
    // FASE 1: BÚSQUEDA EXHAUSTIVA
    // ==========================================
    await logger.info('🔍 FASE 1: Búsqueda exhaustiva iniciada');

    for (const province of params.provinces) {
      // Verificar si debe continuar antes de cada provincia
      if (!await shouldContinueJob(jobId, supabase)) {
        await logger.warning('⏸️ Indexación pausada o cancelada por el administrador');
        await logger.close();
        return;
      }

      for (const category of params.categories) {
        try {
          // SOLO 4 CATEGORÍAS PERMITIDAS
          const searchTerms: Record<string, string> = {
            'restaurante': 'restaurantes',
            'bar': 'bares tapas',
            'cafe': 'cafeterías coffee',
            'hotel': 'hoteles alojamiento',
          };

          const searchTerm = searchTerms[category] || category;
          const cities = mainCities[province] || [province];

          await logger.info(`📍 ${province} - ${category.toUpperCase()}`);
          await logger.info(`   Buscando en ${cities.length} ciudades...`);

        for (let i = 0; i < cities.length; i++) {
          const city = cities[i];
          
          // Verificar si debe continuar cada 3 ciudades
          if (i % 3 === 0 && !await shouldContinueJob(jobId, supabase)) {
            await logger.warning('⏸️ Indexación pausada durante búsqueda');
            await logger.close();
            return;
          }
          
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

            await logger.info(`   [${i+1}/${cities.length}] ${city}: ${placeIds.length} resultados (${added} nuevos)`);

            await supabase
              .from('indexation_jobs')
              .update({ total_places: allPlaceIds.size })
              .eq('id', jobId);

            await new Promise(r => setTimeout(r, 200));
          } catch (error: any) {
            await logger.error(`   Error en ${city}: ${error.message}`);
            // Continuar con la siguiente ciudad aunque falle una
          }
        }

        await logger.success(`✅ ${category}: ${allPlaceIds.size} lugares únicos acumulados`);
        
        } catch (categoryError: any) {
          await logger.error(`❌ Error fatal en ${province} - ${category}: ${categoryError.message}`);
          // Continuar con la siguiente categoría aunque falle una
        }
      }
    }

    await logger.success(`✅ Búsqueda completada: ${allPlaceIds.size} lugares encontrados`);

    // ==========================================
    // FASE 2: PROCESAMIENTO RÁPIDO (solo detalles básicos)
    // ==========================================
    await logger.info('🔄 FASE 2: Filtrado y guardado rápido iniciado');

    const placesToProcess = Array.from(allPlaceIds).filter(id => !processedIds.has(id));
    await logger.info(`Procesando ${placesToProcess.length} lugares...`);

    for (const placeId of placesToProcess) {
      // Verificar si debe continuar cada 10 lugares
      if (totalProcessed % 10 === 0 && !await shouldContinueJob(jobId, supabase)) {
        await logger.warning('⏸️ Indexación pausada durante procesamiento');
        await logger.close();
        return;
      }

      try {
        processedIds.add(placeId);
        totalProcessed++;

        if (totalProcessed % 50 === 0) {
          await logger.info(`📊 Progreso: ${totalProcessed}/${allPlaceIds.size} (${Math.round((totalProcessed/allPlaceIds.size)*100)}%)`);
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

        // ✅ LUGAR APROBADO - Categorizar con filtro estricto
        const category = strictCategorizePlaceByTypes(details.types, details.name);
        
        // Si no encaja en ninguna de las 4 categorías, descartar
        if (!category) {
          chains++; // Contar como "descartado - categoría no válida"
          continue;
        }

        // Verificar filtro específico de categoría (ej: evitar autocaravanas en hoteles)
        if (shouldExcludeFromCategory(details.name, details.types, category)) {
          chains++; // Contar como "descartado - no cumple criterios de categoría"
          continue;
        }

        const province = extractProvinceFromPlaceData(details);
        const city = extractCityFromPlaceData(details);

        // 🛡️ VALIDACIÓN CRÍTICA: Verificar que sea provincia española
        // Función para normalizar nombres de provincias (acepta tildes y variantes)
        const normalizeProvinceName = (name: string): string => {
          // Mapa de variantes (euskera/gallego → castellano estándar)
          const variants: Record<string, string> = {
            'Gipuzkoa': 'Guipúzcoa',
            'Bizkaia': 'Vizcaya',
            'Araba': 'Álava',
            'La Coruña': 'A Coruña',
            'Orense': 'Ourense',
          };
          
          // Buscar en el mapa de variantes (comparación sin tildes, case-insensitive)
          const normalizedInput = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const variantKey = Object.keys(variants).find(
            key => key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalizedInput
          );
          
          return variantKey ? variants[variantKey] : name;
        };

        const spanishProvinces = [
          'Albacete', 'Alicante', 'Almería', 'Álava', 'Asturias', 'Ávila', 'Badajoz', 'Baleares',
          'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real',
          'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca',
          'Jaén', 'A Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga',
          'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 'Segovia', 'Sevilla',
          'Soria', 'Tarragona', 'Santa Cruz de Tenerife', 'Teruel', 'Toledo', 'Valencia', 'Valladolid',
          'Zamora', 'Zaragoza', 'Ceuta', 'Melilla',
          'Guipúzcoa', 'Vizcaya' // Añadir variantes castellanas explícitas
        ];

        // Normalizar provincia y comparar sin tildes (case-insensitive)
        const normalizedProvince = normalizeProvinceName(province);
        const normalizedProvinceNoAccents = normalizedProvince
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

        const isSpanishProvince = spanishProvinces.some(sp => 
          sp.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalizedProvinceNoAccents
        );

        if (!isSpanishProvince) {
          chains++; // Contar como descartado - fuera de España
          await logger.warning(`⚠️ Descartado (fuera de España): ${details.name} - ${province} (normalizado: ${normalizedProvince})`);
          continue;
        }

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
            await logger.success(`✅ ${approved} lugares aprobados`);
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
        await logger.error(`Error procesando lugar: ${error.message}`);
      }
    }

    // Finalizar
    await logger.success('🎉 Indexación rápida completada');
    await logger.info(`📊 RESUMEN:`);
    await logger.info(`   Encontrados: ${allPlaceIds.size}`);
    await logger.info(`   Procesados: ${totalProcessed}`);
    await logger.success(`   ✅ Aprobados: ${approved} (pendientes de enriquecimiento)`);
    await logger.info(`   ⏭️ Descartados: ${lowRating + lowReviews + chains + duplicates}`);
    await logger.info(`      - Rating bajo: ${lowRating}`);
    await logger.info(`      - Pocas reseñas: ${lowReviews}`);
    await logger.info(`      - Cadenas: ${chains}`);
    await logger.info(`      - Duplicados: ${duplicates}`);
    if (errors > 0) {
      await logger.warning(`   ❌ Errores: ${errors}`);
    }

    // Guardar logs finales
    await logger.close();

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
    await logger.error(`ERROR FATAL: ${error.message}`, { stack: error.stack });
    await logger.close();
    
    await supabase
      .from('indexation_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: { error: error.message, stack: error.stack }
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

