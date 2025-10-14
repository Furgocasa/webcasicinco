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
  logger: IndexationLogger
): Promise<{processed: number, saved: number, discarded: number}> {
  let processed = 0;
  let saved = 0;
  let discarded = 0;
  
  for (const placeId of placeIds) {
    if (!await shouldContinueJob(jobId, supabase)) {
      await logger.warning('⏸️ Procesamiento pausado por el administrador');
      break;
    }
    
    try {
      const details = await withRetry(
        () => getPlaceDetails(placeId),
        3, // 3 intentos
        8000, // 8 segundos por intento (más rápido)
        logger,
        `Obtener detalles del lugar`
      );

      const province = extractProvinceFromPlaceData(details);
      const city = extractCityFromPlaceData(details);

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
        discarded++; // Contar como descartado - fuera de España
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
        discarded++; // Contar como duplicado
        await logger.warning(`⚠️ Descartado (duplicado): ${details.name}`);
        continue;
      }

      // Validar rating y reseñas
      if (details.rating < 4.7) {
        discarded++; // Contar como rating bajo
        await logger.warning(`⚠️ Descartado (rating bajo): ${details.name} - ${details.rating}`);
        continue;
      }

      if (details.user_ratings_total < 50) {
        discarded++; // Contar como pocas reseñas
        await logger.warning(`⚠️ Descartado (pocas reseñas): ${details.name} - ${details.user_ratings_total}`);
        continue;
      }

      // Categorizar
      const category = strictCategorizePlaceByTypes(details.types, details.name);
      if (!category || !['restaurante', 'bar', 'cafe', 'hotel'].includes(category)) {
        discarded++; // Contar como categoría inválida
        await logger.warning(`⚠️ Descartado (categoría inválida): ${details.name} - ${category}`);
        continue;
      }

      // Generar slug único
      const slug = generatePlaceSlug(details.name, city);

      // Guardar lugar
      const placeData = {
        google_place_id: placeId,
        slug: slug, // ✅ AGREGADO - slug requerido
        name: details.name,
        category: category,
        province: normalizedProvince,
        city: city,
        address: details.formatted_address,
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
        discarded++; // Contar como error
        await logger.error(`❌ Error guardando: ${details.name} - ${insertError.message}`);
        continue;
      }

      saved++;
      await logger.success(`✅ Guardado: ${details.name} (${category}, ${normalizedProvince})`);

    } catch (error: any) {
      discarded++; // Contar como error
      await logger.error(`❌ Error procesando lugar ${placeId}: ${error.message}`);
    }
    
    processed++;
  }
  
  return { processed, saved, discarded };
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

    // Ciudades principales por provincia (COBERTURA COMPLETA - Todas las provincias españolas)
    const mainCities: Record<string, string[]> = {
      // Andalucía
      'Almería': ['Almería', 'Roquetas de Mar', 'El Ejido', 'Níjar', 'Vícar', 'Huércal-Overa', 'Adra', 'Vera', 'Mojácar'],
      'Cádiz': ['Cádiz', 'Jerez de la Frontera', 'Algeciras', 'San Fernando', 'El Puerto de Santa María', 'Chiclana', 'La Línea', 'Sanlúcar', 'Barbate', 'Rota', 'Conil', 'Tarifa'],
      'Córdoba': ['Córdoba', 'Lucena', 'Puente Genil', 'Montilla', 'Priego', 'Palma del Río', 'Pozoblanco', 'Baena', 'Cabra', 'Aguilar', 'Rute'],
      'Granada': ['Granada', 'Motril', 'Almuñécar', 'Baza', 'Guadix', 'Loja', 'Armilla', 'Albolote', 'Maracena', 'Salobreña', 'Huétor Vega'],
      'Huelva': ['Huelva', 'Lepe', 'Almonte', 'Moguer', 'Isla Cristina', 'Ayamonte', 'Punta Umbría', 'Cartaya', 'Aracena'],
      'Jaén': ['Jaén', 'Linares', 'Andújar', 'Úbeda', 'Martos', 'Alcalá la Real', 'Baeza', 'Villacarrillo', 'Bailén'],
      'Málaga': ['Málaga', 'Marbella', 'Mijas', 'Vélez-Málaga', 'Fuengirola', 'Torremolinos', 'Estepona', 'Benalmádena', 'Ronda', 'Antequera', 'Nerja', 'Torrox'],
      'Sevilla': ['Sevilla', 'Dos Hermanas', 'Alcalá de Guadaíra', 'Utrera', 'Mairena', 'Écija', 'La Rinconada', 'Carmona', 'Lebrija', 'Coria del Río', 'Los Palacios'],
      // Aragón
      'Huesca': ['Huesca', 'Monzón', 'Barbastro', 'Jaca', 'Sabiñánigo', 'Binéfar', 'Fraga', 'Ainsa'],
      'Teruel': ['Teruel', 'Alcañiz', 'Andorra', 'Calamocha', 'Albarracín', 'Mora de Rubielos'],
      'Zaragoza': ['Zaragoza', 'Calatayud', 'Utebo', 'Ejea de los Caballeros', 'Cuarte de Huerva', 'Tarazona', 'Caspe', 'Borja'],
      // Asturias
      'Asturias': ['Oviedo', 'Gijón', 'Avilés', 'Siero', 'Langreo', 'Mieres', 'Castrillón', 'Llanera', 'Llanes', 'Cangas de Onís', 'Ribadesella'],
      // Baleares
      'Baleares': ['Palma', 'Calvià', 'Manacor', 'Ibiza', 'Alcúdia', 'Mahón', 'Ciutadella', 'Sóller', 'Pollensa'],
      // Canarias
      'Las Palmas': ['Las Palmas', 'Telde', 'Santa Lucía', 'Arucas', 'Agüimes', 'Ingenio', 'Puerto del Rosario', 'Arrecife', 'Maspalomas'],
      'Santa Cruz de Tenerife': ['Santa Cruz de Tenerife', 'San Cristóbal de La Laguna', 'Arona', 'Adeje', 'Los Realejos', 'Puerto de la Cruz', 'La Orotava', 'Los Llanos de Aridane'],
      // Cantabria
      'Cantabria': ['Santander', 'Torrelavega', 'Castro Urdiales', 'Camargo', 'El Astillero', 'Laredo', 'Santoña', 'Comillas', 'Potes'],
      // Castilla-La Mancha
      'Albacete': ['Albacete', 'Hellín', 'Villarrobledo', 'Almansa', 'La Roda', 'Caudete', 'Yeste', 'Tobarra', 'Chinchilla'],
      'Ciudad Real': ['Ciudad Real', 'Puertollano', 'Tomelloso', 'Alcázar de San Juan', 'Valdepeñas', 'Manzanares', 'Daimiel', 'Almagro'],
      'Cuenca': ['Cuenca', 'Tarancón', 'Quintanar del Rey', 'San Clemente', 'Motilla del Palancar', 'Las Pedroñeras'],
      'Guadalajara': ['Guadalajara', 'Azuqueca de Henares', 'Sigüenza', 'Molina de Aragón', 'Yunquera de Henares', 'Brihuega'],
      'Toledo': ['Toledo', 'Talavera de la Reina', 'Illescas', 'Seseña', 'Torrijos', 'Ocaña', 'Mora', 'Consuegra'],
      // Castilla y León
      'Ávila': ['Ávila', 'Arévalo', 'Arenas de San Pedro', 'El Barco de Ávila', 'Sotillo de la Adrada'],
      'Burgos': ['Burgos', 'Aranda de Duero', 'Miranda de Ebro', 'Briviesca', 'Lerma', 'Belorado'],
      'León': ['León', 'Ponferrada', 'San Andrés del Rabanedo', 'Astorga', 'La Bañeza', 'Villablino', 'Sahagún'],
      'Palencia': ['Palencia', 'Guardo', 'Aguilar de Campoo', 'Venta de Baños', 'Cervera de Pisuerga'],
      'Salamanca': ['Salamanca', 'Béjar', 'Ciudad Rodrigo', 'Peñaranda de Bracamonte', 'Alba de Tormes', 'La Alberca'],
      'Segovia': ['Segovia', 'Cuéllar', 'San Ildefonso', 'El Espinar', 'Cantalejo', 'Sepúlveda'],
      'Soria': ['Soria', 'Almazán', 'El Burgo de Osma', 'Ágreda', 'San Leonardo de Yagüe'],
      'Valladolid': ['Valladolid', 'Medina del Campo', 'Laguna de Duero', 'Arroyo de la Encomienda', 'Tordesillas', 'Peñafiel'],
      'Zamora': ['Zamora', 'Benavente', 'Toro', 'Villalpando', 'Puebla de Sanabria'],
      // Cataluña
      'Barcelona': ['Barcelona', 'Hospitalet', 'Terrassa', 'Badalona', 'Sabadell', 'Mataró', 'Granollers', 'Sitges', 'Vic', 'Manresa', 'Rubí', 'Cornellà'],
      'Girona': ['Girona', 'Figueres', 'Lloret de Mar', 'Blanes', 'Olot', 'Salt', 'Platja d\'Aro', 'Roses', 'Cadaqués', 'Tossa de Mar'],
      'Lleida': ['Lleida', 'Balaguer', 'Tàrrega', 'Mollerussa', 'La Seu d\'Urgell', 'Vielha'],
      'Tarragona': ['Tarragona', 'Reus', 'Salou', 'Cambrils', 'El Vendrell', 'Valls', 'Torredembarra', 'Amposta', 'Calafell'],
      // Comunidad Valenciana
      'Alicante': ['Alicante', 'Elche', 'Torrevieja', 'Benidorm', 'Orihuela', 'Alcoy', 'Dénia', 'Jávea', 'Calpe', 'Altea', 'Villena', 'Elda'],
      'Castellón': ['Castellón', 'Vila-real', 'Burriana', 'Vinaròs', 'Onda', 'Benicarló', 'Peñíscola', 'Benicàssim', 'Morella'],
      'Valencia': ['Valencia', 'Gandía', 'Torrent', 'Paterna', 'Sagunto', 'Alzira', 'Cullera', 'Burjassot', 'Mislata', 'Requena', 'Xàtiva', 'Ontinyent'],
      // Extremadura
      'Badajoz': ['Badajoz', 'Mérida', 'Don Benito', 'Almendralejo', 'Villanueva de la Serena', 'Zafra', 'Olivenza', 'Jerez de los Caballeros'],
      'Cáceres': ['Cáceres', 'Plasencia', 'Navalmoral de la Mata', 'Coria', 'Trujillo', 'Jaraíz de la Vera'],
      // Galicia
      'A Coruña': ['A Coruña', 'Santiago de Compostela', 'Ferrol', 'Carballo', 'Oleiros', 'Culleredo', 'Arteixo', 'Betanzos', 'Narón', 'Ames', 'Cambre', 'Ribeira'],
      'Lugo': ['Lugo', 'Viveiro', 'Monforte de Lemos', 'Vilalba', 'Sarria', 'Foz', 'Ribadeo'],
      'Ourense': ['Ourense', 'Verín', 'O Carballiño', 'Ribadavia', 'Xinzo de Limia', 'Celanova', 'Allariz'],
      'Pontevedra': ['Vigo', 'Pontevedra', 'Vilagarcía de Arousa', 'Redondela', 'Cangas', 'Marín', 'Sanxenxo', 'O Grove', 'Cambados', 'Baiona'],
      // La Rioja
      'La Rioja': ['Logroño', 'Calahorra', 'Arnedo', 'Haro', 'Alfaro', 'Nájera', 'Santo Domingo de la Calzada'],
      // Madrid
      'Madrid': ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Getafe', 'Torrejón', 'Parla', 'Coslada', 'Pozuelo', 'Las Rozas', 'Majadahonda'],
      // Murcia
      'Murcia': ['Murcia', 'Cartagena', 'Lorca', 'Molina de Segura', 'Mazarrón', 'Yecla', 'Jumilla', 'Cieza', 'Águilas', 'San Javier', 'Totana', 'Alcantarilla'],
      // Navarra
      'Navarra': ['Pamplona', 'Tudela', 'Barañáin', 'Burlada', 'Estella', 'Tafalla', 'Villava', 'Sangüesa'],
      // País Vasco
      'Álava': ['Vitoria-Gasteiz', 'Llodio', 'Amurrio', 'Salvatierra', 'Laguardia'],
      'Araba': ['Vitoria-Gasteiz', 'Llodio', 'Amurrio', 'Salvatierra', 'Laguardia'], // Variante euskera
      'Guipúzcoa': ['San Sebastián', 'Irún', 'Éibar', 'Rentería', 'Zarautz', 'Mondragón', 'Hernani', 'Hondarribia', 'Tolosa', 'Azpeitia', 'Pasaia', 'Lasarte-Oria', 'Andoain', 'Errenteria', 'Oñati', 'Bergara', 'Beasain', 'Ordizia', 'Legazpi', 'Villabona', 'Usurbil', 'Lezo', 'Oiartzun', 'Astigarraga', 'Hernialde', 'Albiztur', 'Asteasu', 'Zizurkil', 'Aia', 'Zestoa'],
      'Gipuzkoa': ['San Sebastián', 'Irún', 'Éibar', 'Rentería', 'Zarautz', 'Mondragón', 'Hernani', 'Hondarribia', 'Tolosa', 'Azpeitia', 'Pasaia', 'Lasarte-Oria', 'Andoain', 'Errenteria', 'Oñati', 'Bergara', 'Beasain', 'Ordizia', 'Legazpi', 'Villabona', 'Usurbil', 'Lezo', 'Oiartzun', 'Astigarraga', 'Hernialde', 'Albiztur', 'Asteasu', 'Zizurkil', 'Aia', 'Zestoa'], // Variante euskera
      'Vizcaya': ['Bilbao', 'Barakaldo', 'Getxo', 'Portugalete', 'Sestao', 'Durango', 'Basauri', 'Santurce', 'Bermeo', 'Gernika'],
      'Bizkaia': ['Bilbao', 'Barakaldo', 'Getxo', 'Portugalete', 'Sestao', 'Durango', 'Basauri', 'Santurce', 'Bermeo', 'Gernika'], // Variante euskera
      // Ceuta y Melilla
      'Ceuta': ['Ceuta'],
      'Melilla': ['Melilla'],
    };

    // 🔥 IMPORTANTE: Si una provincia no tiene ciudades definidas, usar fallback inteligente
    // En lugar de solo [provincia], buscar en la provincia + "principales ciudades"
    const getCitiesForProvince = (province: string): string[] => {
      // Si está en mainCities, usar esa lista
      if (mainCities[province]) {
        return mainCities[province];
      }
      
      // Si no está definida, usar estrategia de búsqueda amplia
      // Esto cubre provincias pequeñas que no están en mainCities
      return [
        province, // Capital/provincia
        `${province} centro`,
        `${province} ciudad`,
      ];
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
        // NO actualizar nada más - el estado ya fue cambiado por el API de pausa/cancel
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
          const cities = getCitiesForProvince(province);

          await logger.info(`📍 ${province} - ${category.toUpperCase()}`);
          await logger.info(`   Buscando en ${cities.length} ciudades...`);

        for (let i = 0; i < cities.length; i++) {
          const city = cities[i];
          
          // Verificar si debe continuar cada 3 ciudades
          if (i % 3 === 0 && !await shouldContinueJob(jobId, supabase)) {
            await logger.warning('⏸️ Indexación pausada durante búsqueda');
            await logger.close();
            // NO actualizar nada más - el estado ya fue cambiado por el API de pausa/cancel
            return;
          }
          
          try {
            // 🔥 BÚSQUEDA MÚLTIPLE POR ZONAS: Buscar en diferentes puntos de la ciudad para obtener MÁS resultados
            const searchLocations = [
              `${searchTerm} ${city} ${province} España`, // Búsqueda más específica
              `${searchTerm} ${city} centro ${province} España`, // Centro
              `${searchTerm} ${city} norte ${province} España`, // Norte
              `${searchTerm} ${city} sur ${province} España`, // Sur
              `${searchTerm} ${city} este ${province} España`, // Este
              `${searchTerm} ${city} oeste ${province} España`, // Oeste
            ];
            
            const cityStartCount = allPlaceIds.size;
            let cityProcessed = 0;
            let citySaved = 0;
            let cityDiscarded = 0;
            
            // 🔥 PROCESAMIENTO POR ZONA: Buscar y procesar inmediatamente
            for (let zoneIndex = 0; zoneIndex < searchLocations.length; zoneIndex++) {
              const location = searchLocations[zoneIndex];
              
              await logger.info(`   🔍 Zona ${zoneIndex + 1}/${searchLocations.length}: "${location}"`);
              
              const placeIds = await withRetry(
                () => searchPlaces({
                  location: location,
                  keyword: searchTerm,
                  minRating: params.minRating,
                  radius: 30000, // Reducir radio para más precisión
                }),
                3, // 3 intentos
                10000, // 10 segundos por intento (más realista)
                logger,
                `Buscar en ${location}`
              );
              
              await logger.info(`   📍 Zona ${zoneIndex + 1}/${searchLocations.length}: ${placeIds.length} resultados → Procesando...`);
              
              // Procesar inmediatamente los lugares encontrados en esta zona
              const zoneResults = await processPlacesFromZone(placeIds, jobId, supabase, logger);
              cityProcessed += zoneResults.processed;
              citySaved += zoneResults.saved;
              cityDiscarded += zoneResults.discarded;
              
              // Acumular en contadores globales
              totalProcessed += zoneResults.processed;
              approved += zoneResults.saved;
              lowRating += zoneResults.discarded; // Simplificado - todos van a lowRating por ahora
              
              // 🔥 ACTUALIZAR CONTADORES EN TIEMPO REAL
          await supabase
            .from('indexation_jobs')
            .update({
              processed_places: totalProcessed,
              successful_places: approved,
                  failed_places: lowRating + lowReviews + chains + duplicates + errors,
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
              
              await logger.info(`   ✅ Zona ${zoneIndex + 1}/${searchLocations.length}: ${zoneResults.saved} guardados, ${zoneResults.discarded} descartados`);
              
              // Pequeña pausa entre zonas para no saturar
              await new Promise(r => setTimeout(r, 500));
            }

            // 🔥 BÚSQUEDA NEARBY: Buscar lugares cercanos por coordenadas (complementa text search)
            try {
              // Obtener coordenadas aproximadas de la ciudad (esto es una aproximación)
              const cityCoordinates: Record<string, {lat: number, lng: number}> = {
                'San Sebastián': { lat: 43.3183, lng: -1.9812 },
                'Irún': { lat: 43.3391, lng: -1.7893 },
                'Éibar': { lat: 43.1844, lng: -2.4731 },
                'Rentería': { lat: 43.3122, lng: -1.9014 },
                'Zarautz': { lat: 43.2844, lng: -2.1719 },
                'Mondragón': { lat: 43.0644, lng: -2.4897 },
                'Hernani': { lat: 43.2667, lng: -1.9833 },
                'Hondarribia': { lat: 43.3631, lng: -1.7914 },
                'Tolosa': { lat: 43.1333, lng: -2.0667 },
                'Azpeitia': { lat: 43.1833, lng: -2.2667 },
                'Pasaia': { lat: 43.3167, lng: -1.9167 },
              };

              const coords = cityCoordinates[city];
              if (coords) {
                await logger.info(`   📍 Nearby search en ${city}...`);
                
                const nearbyPlaceIds = await withRetry(
                  () => searchNearbyPlaces(
                    coords.lat, 
                    coords.lng, 
                    30000, // 30km radio
                    'restaurant' // Tipo específico
                  ),
                  3, // 3 intentos
                  10000, // 10 segundos
                  logger,
                  `Búsqueda nearby en ${city}`
                );

                await logger.info(`   📍 Nearby search: ${nearbyPlaceIds.length} resultados → Procesando...`);
                
                // Procesar inmediatamente los lugares nearby
                const nearbyResults = await processPlacesFromZone(nearbyPlaceIds, jobId, supabase, logger);
                cityProcessed += nearbyResults.processed;
                citySaved += nearbyResults.saved;
                cityDiscarded += nearbyResults.discarded;
                
                // Acumular en contadores globales
                totalProcessed += nearbyResults.processed;
                approved += nearbyResults.saved;
                lowRating += nearbyResults.discarded; // Simplificado
                
                // 🔥 ACTUALIZAR CONTADORES EN TIEMPO REAL
                await supabase
                  .from('indexation_jobs')
                  .update({
                    processed_places: totalProcessed,
                    successful_places: approved,
                    failed_places: lowRating + lowReviews + chains + duplicates + errors,
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
                
                await logger.info(`   ✅ Nearby: ${nearbyResults.saved} guardados, ${nearbyResults.discarded} descartados`);
              }
            } catch (nearbyError: any) {
              await logger.warning(`   ⚠️ Nearby search falló en ${city}: ${nearbyError.message}`);
            }

            await logger.info(`   📊 Total ${city}: ${cityProcessed} procesados, ${citySaved} guardados, ${cityDiscarded} descartados`);

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