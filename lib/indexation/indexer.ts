/**
 * Motor de indexación de lugares
 * Busca, procesa y guarda lugares en la base de datos
 */

import { createAdminClient } from '@/lib/supabase/server';
import { searchPlaces, getPlaceDetails, extractProvinceFromPlaceData, extractCityFromPlaceData } from '../google/places';
import { geocodeAddress } from '../google/geocoding';
import { categorizePlace } from '../ai/categorizer';

interface IndexationParams {
  provinces: string[];
  categories: string[];
  minRating: number;
}

/**
 * Inicia el proceso de indexación
 */
export async function startIndexation(
  jobId: string,
  params: IndexationParams
): Promise<void> {
  const supabase = createAdminClient();

  try {
    // Actualizar estado del job a "running"
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 INICIANDO INDEXACIÓN`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Provincias: ${params.provinces.join(', ')}`);
    console.log(`   Categorías: ${params.categories.join(', ')}`);
    console.log(`   Rating mínimo: ${params.minRating}`);
    console.log(`${'='.repeat(80)}\n`);
    
    const { error: updateError } = await supabase
      .from('indexation_jobs')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('❌ Error actualizando estado del job:', updateError);
      throw updateError;
    }

    console.log('✅ Job marcado como "running" en la base de datos\n');

    const allPlaceIds: Set<string> = new Set();
    const processedPlaceIds: Set<string> = new Set(); // Track de procesados para evitar duplicados

    // Contadores globales
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalLowRating = 0;
    let totalLowReviews = 0;

    // 1. BUSCAR Y PROCESAR POR CATEGORÍA (progresivo)
    console.log('🔍 Iniciando búsqueda y procesamiento progresivo...\n');
    
    // Ciudades por provincia - LISTA COMPLETA para máxima cobertura
    const mainCitiesByProvince: Record<string, string[]> = {
      'Murcia': [
        'Murcia', 'Cartagena', 'Lorca', 'Molina de Segura', 'Alcantarilla',
        'Mazarrón', 'Yecla', 'Jumilla', 'Cieza', 'Águilas', 'San Javier',
        'Torre-Pacheco', 'Las Torres de Cotillas', 'San Pedro del Pinatar',
        'Totana', 'Archena', 'Caravaca de la Cruz', 'Alhama de Murcia'
      ],
      'Alicante': [
        'Alicante', 'Elche', 'Torrevieja', 'Orihuela', 'Benidorm', 'Alcoy',
        'San Vicente del Raspeig', 'Elda', 'Villena', 'Dénia', 'Calpe',
        'Altea', 'Jávea', 'Petrer', 'Santa Pola', 'Guardamar del Segura'
      ],
      'Madrid': ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés'],
      'Barcelona': ['Barcelona', 'Hospitalet de Llobregat', 'Terrassa', 'Badalona', 'Sabadell'],
      'Valencia': ['Valencia', 'Gandía', 'Torrent', 'Paterna', 'Sagunto'],
      // Agregar más según necesidad
    };
    
    for (const province of params.provinces) {
      for (const category of params.categories) {
        try {
          const searchTerms: Record<string, string> = {
            'restaurante': 'restaurantes',
            'hotel': 'hoteles',
            'spa': 'spa wellness',
            'bar': 'bares',
            'experiencia': 'lugares turísticos',
            'monumento': 'monumentos museos',
          };
          
          const searchTerm = searchTerms[category] || category;
          const cities = mainCitiesByProvince[province] || [province];
          
          // Buscar en cada ciudad importante
          for (const city of cities) {
            try {
              console.log(`🔍 Buscando ${searchTerm} en ${city}, ${province}...`);
              
              const placeIds = await searchPlaces({
                location: `${city}, ${province}, España`,
                keyword: searchTerm,
                minRating: params.minRating,
                radius: 50000, // 50km por ciudad
              });

              placeIds.forEach(id => allPlaceIds.add(id));
              console.log(`✅ ${placeIds.length} lugares encontrados en ${city}`);
              
              // Actualizar total acumulado en tiempo real
              await supabase
                .from('indexation_jobs')
                .update({ total_places: allPlaceIds.size })
                .eq('id', jobId);
              
              // Pausa para no saturar la API
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error(`❌ Error buscando en ${city}:`, error);
            }
          }
          
          console.log(`📊 Total acumulado: ${allPlaceIds.size} lugares únicos`);
          
          // PROCESAR INMEDIATAMENTE los lugares nuevos de esta categoría
          const newPlaceIds = Array.from(allPlaceIds).filter(id => !processedPlaceIds.has(id));
          console.log(`🔄 Procesando ${newPlaceIds.length} lugares nuevos de ${category}...\n`);
          
          for (const placeId of newPlaceIds) {
            try {
              // Marcar como procesado PRIMERO
              processedPlaceIds.add(placeId);
              totalProcessed++;

              console.log(`📍 [${totalProcessed}/${allPlaceIds.size}] Procesando lugar...`);

              // Obtener detalles completos del lugar
              const placeDetails = await getPlaceDetails(placeId);

              // Verificar rating
              if (!placeDetails.rating || placeDetails.rating < params.minRating) {
                console.log(`⏭️  Rating bajo: ${placeDetails.rating || 'N/A'}`);
                totalLowRating++;
                continue;
              }

              // Verificar reseñas
              if (!placeDetails.user_ratings_total || placeDetails.user_ratings_total < 20) {
                console.log(`⏭️  Pocas reseñas: ${placeDetails.user_ratings_total || 0}`);
                totalLowReviews++;
                continue;
              }

              // Extraer información de ubicación
              const province = extractProvinceFromPlaceData(placeDetails);
              const city = extractCityFromPlaceData(placeDetails);
              
              // Categorizar usando IA
              const placeCategory = await categorizePlace(
                placeDetails.name,
                placeDetails.types || [],
                placeDetails.formatted_address
              );

              // Verificar si ya existe
              const { data: existingPlace } = await supabase
                .from('places')
                .select('id, name')
                .eq('google_place_id', placeId)
                .single();

              if (existingPlace) {
                console.log(`⏭️  "${existingPlace.name}" ya existe`);
                totalSkipped++;
                continue;
              }

              // Generar slug único
              const slug = generateSlug(placeDetails.name, city, province);

              // Preparar datos para insertar
              const placeData = {
                google_place_id: placeId,
                slug,
                name: placeDetails.name,
                category: placeCategory,
                country: 'España',
                region: getCommunityFromProvince(province),
                province,
                city,
                address: placeDetails.formatted_address || '',
                latitude: placeDetails.geometry?.location?.lat,
                longitude: placeDetails.geometry?.location?.lng,
                rating: placeDetails.rating,
                review_count: placeDetails.user_ratings_total,
                price_level: placeDetails.price_level || null,
                phone: placeDetails.formatted_phone_number || null,
                website: placeDetails.website || null,
                google_maps_url: placeDetails.url,
                photos: placeDetails.photos?.slice(0, 5).map(p => p.photo_reference) || [],
                published: false,
              };

              // Insertar en la base de datos
              const { error: insertError } = await supabase
                .from('places')
                .insert(placeData);

              if (insertError) {
                console.error(`❌ Error: ${insertError.message}`);
                totalFailed++;
              } else {
                console.log(`✅ "${placeDetails.name}" guardado`);
                totalSuccessful++;
              }

              // Actualizar progreso en BD
              await supabase
                .from('indexation_jobs')
                .update({
                  total_places: allPlaceIds.size,
                  processed_places: totalProcessed,
                  successful_places: totalSuccessful,
                  failed_places: totalFailed,
                })
                .eq('id', jobId);

              // Pausa para no saturar APIs
              await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error: any) {
              console.error(`❌ Error procesando:`, error.message);
              totalFailed++;
            }
          }
          
        } catch (error) {
          console.error(`❌ Error buscando ${category} en ${province}:`, error);
        }
      }
    }

    // 3. FINALIZAR JOB
    console.log('\n' + '='.repeat(80));
    console.log('✅ INDEXACIÓN COMPLETADA');
    console.log(`📊 RESUMEN FINAL:`);
    console.log(`   - Total encontrados: ${allPlaceIds.size}`);
    console.log(`   - Total procesados: ${totalProcessed}`);
    console.log(`   - ✅ Guardados exitosamente: ${totalSuccessful}`);
    console.log(`   - ⏭️  Ya existían (duplicados): ${totalSkipped}`);
    console.log(`   - 📉 Rating bajo (<${params.minRating}): ${totalLowRating}`);
    console.log(`   - 📊 Pocas reseñas (<20): ${totalLowReviews}`);
    console.log(`   - ❌ Errores al guardar: ${totalFailed}`);
    console.log('='.repeat(80) + '\n');
    
    await supabase
      .from('indexation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_places: totalProcessed,
        successful_places: totalSuccessful,
        failed_places: totalFailed,
        error_log: {
          skipped: totalSkipped,
          lowRating: totalLowRating,
          lowReviews: totalLowReviews,
          summary: `${totalSuccessful} nuevos | ${totalLowRating} rating bajo | ${totalLowReviews} pocas reseñas | ${totalSkipped} duplicados | ${totalFailed} errores`
        }
      })
      .eq('id', jobId);

  } catch (error) {
    console.error('❌ Error en indexación:', error);
    const supabase = createAdminClient();
    await supabase
      .from('indexation_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      .eq('id', jobId);
    throw error;
  }
}

// FUNCIONES AUXILIARES

function generateSlug(name: string, city: string, province: string): string {
  const sanitized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const citySlug = city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
  
  return `${sanitized}-${citySlug}`;
}

function getCommunityFromProvince(province: string): string {
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
