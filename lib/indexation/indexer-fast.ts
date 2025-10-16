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
import { searchPlaces, searchNearbyPlaces, getPlaceDetails, extractProvinceFromPlaceData, extractCityFromPlaceData } from '../google/places';
import { shouldExcludeChain } from './searcher';
import { generatePlaceSlug } from '../utils/slugify';
import { strictCategorizePlaceByTypes, shouldExcludeFromCategory } from './category-filters';
import { IndexationLogger } from './logger';
import { getCitiesForProvince as getCitiesFromFile, type CityData } from './cities-database';
import { getAllCitiesFromSupabase, getCitiesFromSupabase } from './cities-supabase';
import { generateSearchStrategy, getStrategyDescription } from './search-strategies';

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
// 🔥 FUNCIÓN PARA PROCESAR LUGARES POR ZONA
async function processPlacesFromZone(
  placeIds: string[], 
  jobId: string, 
  supabase: ReturnType<typeof createAdminClient>,
  logger: IndexationLogger,
  minRating: number = 4.7, // ← Añadido parámetro minRating
  onProgress?: (processed: number, total: number) => Promise<void> // ← Callback de progreso
): Promise<{
  processed: number, 
  saved: number, 
  discarded: number, 
  errors: number,
  breakdown: {
    lowRating: number,
    lowReviews: number,
    duplicates: number,
    noRating: number,
    outOfSpain: number,
    invalidCategory: number
  }
}> {
  let processed = 0;
  let saved = 0;
  let discarded = 0;
  let errorsCount = 0;
  
  // Desglose detallado de descartados
  let countLowRating = 0;
  let countLowReviews = 0;
  let countDuplicates = 0;
  let countNoRating = 0;
  let countOutOfSpain = 0;
  let countInvalidCategory = 0;
  
  const total = placeIds.length;
  
  for (const placeId of placeIds) {
    if (!await shouldContinueJob(jobId, supabase)) {
      await logger.warning('⏸️ Procesamiento pausado por el administrador');
      break;
    }
    
    try {
      const details = await withRetry(
        () => getPlaceDetails(placeId),
        2, // 2 intentos (reducido de 3)
        15000, // 15 segundos por intento (reducido de 20s)
        logger,
        `Obtener detalles del lugar`
      );

      processed++; // Incrementar contador de procesados
      
      // Llamar callback de progreso si existe
      if (onProgress) {
        await onProgress(processed, total);
      }

      const province = extractProvinceFromPlaceData(details);
      const city = extractCityFromPlaceData(details);

      // Función para normalizar nombres de provincias (acepta tildes y variantes)
      const normalizeProvinceName = (name: string): string => {
        // Mapa de variantes (euskera/gallego/valenciano/catalán → castellano estándar)
        const variants: Record<string, string> = {
          // Euskera
          'Gipuzkoa': 'Guipúzcoa',
          'Bizkaia': 'Vizcaya',
          'Araba': 'Álava',
          // Gallego
          'La Coruña': 'A Coruña',
          'Orense': 'Ourense',
          // Valenciano/Catalán
          'Castelló': 'Castellón',
          'València': 'Valencia',
          'Alacant': 'Alicante',
          'Lleida': 'Lérida',
          'Girona': 'Gerona',
          // Variantes adicionales
          'Illes Balears': 'Baleares',
          'Islas Baleares': 'Baleares',
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

      // 🛡️ VALIDACIÓN CRÍTICA: Verificar que sea provincia española
      const normalizedProvince = normalizeProvinceName(province);
      const normalizedProvinceNoAccents = normalizedProvince
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const isSpanishProvince = spanishProvinces.some(sp => 
        sp.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalizedProvinceNoAccents
      );

      // 🔥 VALIDACIÓN CRÍTICA: Verificar que NO sea de otros países
      const nonSpanishIndicators = [
        'stockholms', 'län', 'suecia', 'sweden', 'stockholm', 'estocolmo',
        'paris', 'france', 'francia', 'london', 'england', 'reino unido',
        'berlin', 'germany', 'alemania', 'roma', 'italy', 'italia',
        'lisboa', 'portugal', 'madrid tapasbar', 'spansk restaurang',
        'tapasrestaurang', 'på söder', 'provincia de estocolmo'
      ];

      const hasNonSpanishIndicator = nonSpanishIndicators.some(indicator => 
        normalizedProvinceNoAccents.includes(indicator.toLowerCase()) ||
        details.name.toLowerCase().includes(indicator.toLowerCase()) ||
        details.formatted_address.toLowerCase().includes(indicator.toLowerCase())
      );

      if (!isSpanishProvince || hasNonSpanishIndicator) {
        discarded++;
        countOutOfSpain++; // ← Contador específico
        await logger.warning(`⚠️ Descartado (fuera de España): ${details.name} - ${province} (normalizado: ${normalizedProvince})`);
        continue;
      }

      // Verificar si ya existe
      const { data: existingPlace } = await supabase
        .from('places')
        .select('id')
        .eq('google_place_id', placeId)
        .single();

      if (existingPlace) {
        discarded++;
        countDuplicates++; // ← Contador específico
        await logger.warning(`⚠️ Descartado (duplicado): ${details.name}`);
        continue;
      }

      // Validar que tenga rating (algunos lugares no tienen)
      if (!details.rating || details.rating === null || details.rating === undefined) {
        discarded++;
        countNoRating++; // ← Contador específico
        await logger.warning(`⚠️ Descartado (sin rating): ${details.name}`);
        continue;
      }

      // Validar rating y reseñas
      if (details.rating < minRating) {
        discarded++;
        countLowRating++; // ← Contador específico
        await logger.warning(`⚠️ Descartado (rating bajo): ${details.name} - ${details.rating}`);
        continue;
      }

      if (details.user_ratings_total < 50) {
        discarded++;
        countLowReviews++; // ← Contador específico
        await logger.warning(`⚠️ Descartado (pocas reseñas): ${details.name} - ${details.user_ratings_total}`);
        continue;
      }

      // Categorizar
      const category = strictCategorizePlaceByTypes(details.types, details.name);
      if (!category || !['restaurante', 'bar', 'cafe', 'hotel'].includes(category)) {
        discarded++;
        countInvalidCategory++; // ← Contador específico
        await logger.warning(`⚠️ Descartado (categoría inválida): ${details.name} - ${category}`);
        continue;
      }

      // Generar slug único
      const slug = generatePlaceSlug(details.name, city);

      // Mapear provincia a región (Comunidad Autónoma)
      const getRegionFromProvince = (province: string): string => {
        const provinceToRegion: Record<string, string> = {
          // Andalucía
          'Almería': 'Andalucía', 'Cádiz': 'Andalucía', 'Córdoba': 'Andalucía', 'Granada': 'Andalucía',
          'Huelva': 'Andalucía', 'Jaén': 'Andalucía', 'Málaga': 'Andalucía', 'Sevilla': 'Andalucía',
          // Aragón
          'Huesca': 'Aragón', 'Teruel': 'Aragón', 'Zaragoza': 'Aragón',
          // Asturias
          'Asturias': 'Principado de Asturias',
          // Baleares
          'Baleares': 'Islas Baleares',
          // Canarias
          'Las Palmas': 'Canarias', 'Santa Cruz de Tenerife': 'Canarias',
          // Cantabria
          'Cantabria': 'Cantabria',
          // Castilla-La Mancha
          'Albacete': 'Castilla-La Mancha', 'Ciudad Real': 'Castilla-La Mancha', 'Cuenca': 'Castilla-La Mancha',
          'Guadalajara': 'Castilla-La Mancha', 'Toledo': 'Castilla-La Mancha',
          // Castilla y León
          'Ávila': 'Castilla y León', 'Burgos': 'Castilla y León', 'León': 'Castilla y León',
          'Palencia': 'Castilla y León', 'Salamanca': 'Castilla y León', 'Segovia': 'Castilla y León',
          'Soria': 'Castilla y León', 'Valladolid': 'Castilla y León', 'Zamora': 'Castilla y León',
          // Cataluña
          'Barcelona': 'Cataluña', 'Girona': 'Cataluña', 'Lleida': 'Cataluña', 'Tarragona': 'Cataluña',
          // Ceuta y Melilla
          'Ceuta': 'Ceuta', 'Melilla': 'Melilla',
          // Comunidad Valenciana
          'Alicante': 'Comunidad Valenciana', 'Castellón': 'Comunidad Valenciana', 'Valencia': 'Comunidad Valenciana',
          // Extremadura
          'Badajoz': 'Extremadura', 'Cáceres': 'Extremadura',
          // Galicia
          'A Coruña': 'Galicia', 'Lugo': 'Galicia', 'Ourense': 'Galicia', 'Pontevedra': 'Galicia',
          // La Rioja
          'La Rioja': 'La Rioja',
          // Madrid
          'Madrid': 'Comunidad de Madrid',
          // Murcia
          'Murcia': 'Región de Murcia',
          // Navarra
          'Navarra': 'Comunidad Foral de Navarra',
          // País Vasco
          'Álava': 'País Vasco', 'Guipúzcoa': 'País Vasco', 'Vizcaya': 'País Vasco',
          'Araba': 'País Vasco', 'Gipuzkoa': 'País Vasco', 'Bizkaia': 'País Vasco',
        };
        
        return provinceToRegion[province] || 'España'; // Fallback a España si no se encuentra
      };

      const region = getRegionFromProvince(normalizedProvince);

      // Guardar lugar
      const placeData = {
        google_place_id: placeId,
        slug: slug, // ✅ AGREGADO - slug requerido
        name: details.name,
        category: category,
        country: 'España', // ✅ AGREGADO - country requerido
        region: region, // ✅ AGREGADO - region requerido
        province: normalizedProvince,
        city: city,
        address: details.formatted_address,
        latitude: details.geometry?.location?.lat || 0, // ✅ AGREGADO - latitude requerido
        longitude: details.geometry?.location?.lng || 0, // ✅ AGREGADO - longitude requerido
        rating: details.rating,
        review_count: details.user_ratings_total,
        photos: details.photos ? details.photos.map((p: any) => p.photo_reference) : [],
        phone: details.formatted_phone_number,
        website: details.website,
        // opening_hours: (details as any).opening_hours?.weekday_text || [], // ❌ ELIMINADO - columna no existe en BD
        // geometry: details.geometry, // ❌ ELIMINADO - columna no existe en BD
        published: true,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('places')
        .insert(placeData);

      if (insertError) {
        discarded++; // Contar como error de guardado
        errorsCount++;
        await logger.error(`❌ Error guardando: ${details.name} - ${insertError.message}`);
        continue;
      }

      saved++;
      await logger.success(`✅ Guardado: ${details.name} (${category}, ${normalizedProvince})`);

    } catch (error: any) {
      processed++; // Incrementar procesados incluso si hay error
      discarded++; // Contar como error de procesamiento
      errorsCount++;
      await logger.error(`❌ Error procesando lugar ${placeId}: ${error.message}`);
      
      // Actualizar progreso incluso en caso de error
      if (onProgress) {
        await onProgress(processed, total);
      }
    }
  }
  
  return { 
    processed, 
    saved, 
    discarded, 
    errors: errorsCount,
    breakdown: {
      lowRating: countLowRating,
      lowReviews: countLowReviews,
      duplicates: countDuplicates,
      noRating: countNoRating,
      outOfSpain: countOutOfSpain,
      invalidCategory: countInvalidCategory
    }
  };
}

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
 * Ejecuta una función con reintentos y timeout
 * @param fn Función a ejecutar
 * @param maxRetries Número máximo de reintentos (default: 3)
 * @param timeoutMs Timeout en milisegundos por intento (default: 15000)
 * @param logger Logger opcional para registrar reintentos
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  timeoutMs: number = 15000,
  logger?: IndexationLogger,
  context?: string
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Aplicar timeout a la función
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout tras ${timeoutMs/1000}s`)), timeoutMs)
        )
      ]);
      
      // Si tuvo éxito después de varios intentos, registrarlo
      if (attempt > 1 && logger) {
        await logger.success(`✅ ${context || 'Operación'} exitosa en intento ${attempt}`);
      }
      
      return result;
    } catch (error: any) {
      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        throw new Error(`${context || 'Operación'} falló tras ${maxRetries} intentos: ${error.message}`);
      }
      
      // Calcular delay con backoff exponencial (máximo 5 segundos)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      
      if (logger) {
        await logger.warning(`⚠️ ${context || 'Operación'} falló en intento ${attempt}/${maxRetries}: ${error.message}, reintentando en ${delay}ms...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`${context || 'Operación'} falló tras ${maxRetries} intentos`);
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

  // Obtener el estado actual del trabajo para ver si es una reanudación
  const { data: currentJob } = await supabase
    .from('indexation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  const isResume = currentJob?.status === 'paused';
  
  if (isResume) {
    await logger.info('🔄 Reanudando indexación desde donde se quedó...');
  } else {
    await logger.info('🚀 Indexación rápida iniciada');
  }
  
  await logger.info(`Provincias: ${params.provinces.join(', ')}`);
  await logger.info(`Categorías: ${params.categories.join(', ')}`);
  await logger.info(`Rating mínimo: ${params.minRating}`);

  try {
    await supabase
      .from('indexation_jobs')
      .update({ 
        status: 'running', 
        started_at: isResume ? currentJob.started_at : new Date().toISOString(),
        should_continue: true // Asegurar que comienza en true
      })
      .eq('id', jobId);

    const allPlaceIds = new Set<string>();
    const processedIds = new Set<string>();
    
    // Recuperar contadores si es una reanudación
    let totalProcessed = isResume ? (currentJob.processed_places || 0) : 0;
    let approved = isResume ? (currentJob.successful_places || 0) : 0;
    let lowRating = isResume ? (currentJob.error_log?.lowRating || 0) : 0;
    let lowReviews = isResume ? (currentJob.error_log?.lowReviews || 0) : 0;
    let chains = isResume ? (currentJob.error_log?.chains || 0) : 0;
    let duplicates = isResume ? (currentJob.error_log?.duplicates || 0) : 0;
    let noRating = isResume ? (currentJob.error_log?.noRating || 0) : 0;
    let outOfSpain = isResume ? (currentJob.error_log?.outOfSpain || 0) : 0;
    let invalidCategory = isResume ? (currentJob.error_log?.invalidCategory || 0) : 0;
    let errors = isResume ? (currentJob.failed_places || 0) : 0;

    // Recuperar progreso de provincias/ciudades procesadas si es reanudación
    const processedProgress = isResume ? (currentJob.progress_state || {}) : {};

    // ==========================================
    // 🆕 CARGAR CIUDADES DESDE SUPABASE
    // ==========================================
    await logger.info('🗺️ Cargando ciudades desde Supabase...');
    
    const citiesCache = await getAllCitiesFromSupabase();
    
    if (citiesCache.size > 0) {
      await logger.info(`✅ Cargadas ${citiesCache.size} provincias desde Supabase (cache en memoria)`);
    } else {
      await logger.warning('⚠️ No se pudieron cargar ciudades de Supabase, usando archivo hardcodeado');
    }

    // ==========================================
    // FASE 1: BÚSQUEDA EXHAUSTIVA
    // ==========================================
    await logger.info('🔍 FASE 1: Búsqueda exhaustiva iniciada');

    for (const province of params.provinces) {
      // Verificar si debe continuar antes de cada provincia
      if (!await shouldContinueJob(jobId, supabase)) {
        await logger.warning('⏸️ Indexación pausada o cancelada por el administrador');
        await logger.close();
        // NO actualizar nada más - el estado ya fue cambiado por el API de pausa/cancel
        return;
      }

      // Verificar si esta provincia ya fue completamente procesada
      const provinceKey = `province_${province}`;
      if (processedProgress[provinceKey] === 'completed') {
        await logger.info(`⏭️ Saltando ${province} - ya procesada completamente`);
        continue;
      }

      for (const category of params.categories) {
        // Verificar si esta combinación provincia-categoría ya fue procesada
        const categoryKey = `${provinceKey}_${category}`;
        if (processedProgress[categoryKey] === 'completed') {
          await logger.info(`⏭️ Saltando ${province} - ${category} - ya procesada`);
          continue;
        }
        try {
          // SOLO 4 CATEGORÍAS PERMITIDAS
          // Términos amplios para capturar todos los tipos de establecimientos
          const searchTerms: Record<string, string> = {
            'restaurante': 'restaurantes',  // Se expandirá en search-strategies.ts
            'bar': 'bares',                 // Se expandirá en search-strategies.ts
            'cafe': 'cafeterías',           // Se expandirá en search-strategies.ts
            'hotel': 'hoteles',             // Se expandirá en search-strategies.ts
          };

          const searchTerm = searchTerms[category] || category;
          
          // 🆕 SISTEMA OPTIMIZADO: Obtener ciudades principales de la provincia
          // Primero intenta del cache de Supabase, luego fallback al archivo
          let cities: CityData[] = citiesCache.get(province) || [];
          
          if (cities.length === 0) {
            // Fallback: intentar cargar del archivo hardcodeado
            cities = getCitiesFromFile(province);
            
            if (cities.length > 0) {
              await logger.warning(`⚠️ ${province}: usando ${cities.length} ciudades del archivo (fallback)`);
            } else {
              await logger.warning(`⚠️ No hay ciudades configuradas para ${province}, saltando...`);
              continue;
            }
          } else {
            await logger.info(`📍 ${province}: ${cities.length} ciudades desde Supabase`);
          }

          await logger.info(`📍 ${province} - ${category.toUpperCase()}`);
          await logger.info(`   ${cities.length} ciudades a procesar con estrategia dinámica`);

        for (let i = 0; i < cities.length; i++) {
          const cityData = cities[i];
          
          // Verificar si esta ciudad ya fue procesada
          const cityKey = `${categoryKey}_city_${cityData.name}`;
          if (processedProgress[cityKey] === 'completed') {
            await logger.info(`⏭️ Saltando ${cityData.name} - ya procesada`);
            continue;
          }
          
          // Verificar si debe continuar cada 3 ciudades
          if (i % 3 === 0 && !await shouldContinueJob(jobId, supabase)) {
            await logger.warning('⏸️ Indexación pausada durante búsqueda');
            await logger.close();
            return;
          }
          
          try {
            // 🚀 GENERAR ESTRATEGIA OPTIMIZADA según tamaño de ciudad
            const strategy = generateSearchStrategy(cityData, searchTerm, province);
            
            await logger.info(`\n🏙️  ${getStrategyDescription(strategy)}`);
            await logger.info(`   Estrategia: ${strategy.strategyLevel} - ${strategy.searches.length} búsquedas`);
            
            const cityStartCount = allPlaceIds.size;
            let cityProcessed = 0;
            let citySaved = 0;
            let cityDiscarded = 0;
            
            // Array para acumular IDs únicos de esta ciudad
            const cityPlaceIds: string[] = [];
            
            // 📍 FASE 1: EJECUTAR TODAS LAS BÚSQUEDAS (RÁPIDO)
            await logger.info(`\n📍 FASE 1: Ejecutando ${strategy.searches.length} búsquedas...`);
            
            for (let searchIndex = 0; searchIndex < strategy.searches.length; searchIndex++) {
              const search = strategy.searches[searchIndex];
              
              await logger.info(`   🔍 Búsqueda ${searchIndex + 1}/${strategy.searches.length}: ${search.description}`);
              await logger.info(`   ⏳ Iniciando llamada a Google API...`);
              
              let placeIds: string[] = [];
              
              // Ejecutar búsqueda según tipo
              if (search.type === 'text') {
                placeIds = await withRetry(
                  () => searchPlaces({
                    location: search.query,
                    keyword: searchTerm,
                    minRating: 4.5, // Bajamos a 4.5 para obtener más, filtraremos en código
                    radius: 25000, // 25km radio por ciudad
                  }),
                  2, // 2 intentos (optimizado)
                  15000, // 15 segundos timeout
                  logger,
                  search.description
                );
              } else if (search.type === 'nearby' && search.coords) {
                const typeMap: Record<string, string> = {
                  'restaurantes': 'restaurant',
                  'bares tapas': 'bar',
                  'cafeterías coffee': 'cafe',
                  'hoteles alojamiento': 'lodging',
                };
                const nearbyType = typeMap[searchTerm] || 'restaurant';
                
                placeIds = await withRetry(
                  () => searchNearbyPlaces(
                    search.coords!.lat,
                    search.coords!.lng,
                    search.radius || 20000,
                    nearbyType
                  ),
                  2, // 2 intentos (reducido de 3)
                  15000, // 15 segundos (reducido de 20s)
                  logger,
                  search.description
                );
              }

              // Acumular IDs únicos para esta ciudad
              for (const id of placeIds) {
                if (!cityPlaceIds.includes(id)) {
                  cityPlaceIds.push(id);
                }
                if (!allPlaceIds.has(id)) {
                  allPlaceIds.add(id);
                }
              }
              
              await logger.info(`   ✅ Búsqueda ${searchIndex + 1}: ${placeIds.length} encontrados (${cityPlaceIds.length} únicos acumulados)`);
              
              // Actualizar total_places encontrados
              await logger.info(`   💾 Actualizando contador en BD...`);
              await supabase
                .from('indexation_jobs')
                .update({ total_places: allPlaceIds.size })
                .eq('id', jobId);
              
              // Pausa entre búsquedas (optimizada para balance velocidad/rate-limit)
              if (searchIndex < strategy.searches.length - 1) {
                await logger.info(`   ⏸️ Pausa de 10 segundos antes de siguiente búsqueda...`);
                await new Promise(r => setTimeout(r, 10000)); // 10 segundos (reducido de 12s)
                
                // Verificar si debe continuar después de la pausa
                if (!await shouldContinueJob(jobId, supabase)) {
                  await logger.warning('⏸️ Indexación pausada durante pausa entre búsquedas');
                  await logger.close();
                  return;
                }
              }
            }

            // ✅ FASE 2: PROCESAR TODOS LOS LUGARES DE ESTA CIUDAD
            await logger.info(`\n✅ FASE 2: Procesando ${cityPlaceIds.length} lugares únicos de ${cityData.name}...`);
            
            const searchResults = await processPlacesFromZone(
              cityPlaceIds, 
              jobId, 
              supabase, 
              logger,
              params.minRating, // Pasar el rating del usuario
              async (processed, total) => {
                // Callback de progreso: actualizar en tiempo real
                const progressPercent = Math.round((processed / total) * 100);
                await supabase
                  .from('indexation_jobs')
                  .update({
                    processed_places: totalProcessed + processed,
                    // El progreso se calcula: lugares procesados / total encontrados
                  })
                  .eq('id', jobId);
              }
            );
            
            cityProcessed += searchResults.processed;
            citySaved += searchResults.saved;
            cityDiscarded += searchResults.discarded;
            
            // Acumular en contadores globales
            totalProcessed += searchResults.processed;
            approved += searchResults.saved;
            errors += searchResults.errors;
            
            // ✅ USAR EL DESGLOSE DETALLADO
            lowRating += searchResults.breakdown.lowRating;
            lowReviews += searchResults.breakdown.lowReviews;
            duplicates += searchResults.breakdown.duplicates;
            noRating += searchResults.breakdown.noRating;
            outOfSpain += searchResults.breakdown.outOfSpain;
            invalidCategory += searchResults.breakdown.invalidCategory;
            
            // Actualizar contadores finales
                await supabase
                  .from('indexation_jobs')
                  .update({
                    processed_places: totalProcessed,
                    successful_places: approved,
                failed_places: errors,
                    error_log: {
                      approved,
                      lowRating,
                      lowReviews,
                  chains, // Siempre 0 por ahora (no detectamos cadenas aún)
                      duplicates,
                  noRating,
                  outOfSpain,
                  invalidCategory,
                      errors,
                  summary: `${approved} aprobados | ${lowRating + lowReviews + duplicates + noRating + outOfSpain + invalidCategory} descartados | ${errors} errores`
                    }
                  })
                  .eq('id', jobId);
                
            await logger.info(`   📊 ${cityData.name}: ${searchResults.saved} guardados, ${searchResults.discarded} descartados`);

            // Marcar esta ciudad como completada en el progreso
            processedProgress[cityKey] = 'completed';

            await supabase
              .from('indexation_jobs')
              .update({ 
                total_places: allPlaceIds.size,
                progress_state: processedProgress // Guardar progreso
              })
              .eq('id', jobId);

            await new Promise(r => setTimeout(r, 200));
          } catch (error: any) {
            await logger.error(`   Error en ${cityData.name}: ${error.message}`);
            // Continuar con la siguiente ciudad aunque falle una
          }
        }

        await logger.success(`✅ ${category}: ${allPlaceIds.size} lugares únicos acumulados`);
        
        // Marcar esta categoría como completada
        processedProgress[categoryKey] = 'completed';
        
        // Actualizar progreso en BD
        await supabase
          .from('indexation_jobs')
          .update({ progress_state: processedProgress })
          .eq('id', jobId);
        
        } catch (categoryError: any) {
          await logger.error(`❌ Error fatal en ${province} - ${category}: ${categoryError.message}`);
          // Continuar con la siguiente categoría aunque falle una
        }
      }
      
      // Marcar esta provincia como completada
      processedProgress[provinceKey] = 'completed';
      
      // Actualizar progreso en BD
      await supabase
        .from('indexation_jobs')
        .update({ progress_state: processedProgress })
        .eq('id', jobId);
    }

    // Finalizar
    await logger.success('🎉 Indexación rápida completada');

    await logger.info(`📊 RESUMEN:`);
    await logger.info(`   Total procesados: ${totalProcessed}`);
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
          summary: `${approved} aprobados | ${lowRating} rating bajo | ${lowReviews} pocas reseñas | ${chains} cadenas | ${duplicates} duplicados | ${errors} errores`
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
        error_log: {
          fatal_error: error.message,
          stack: error.stack
        }
      })
      .eq('id', jobId);
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