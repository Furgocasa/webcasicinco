/**
 * Motor de indexación de lugares
 * Busca, procesa y guarda lugares en la base de datos
 */

import { createAdminClient } from '@/lib/supabase/server';
import { searchPlaces } from '../google/places';
import { processPlace } from './processor'; // USAR EL PROCESSOR COMPLETO
import { geocodeAddress } from '../google/geocoding';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
          
          // ==========================================
          // FASE 1: BÚSQUEDA COMPLETA (rápida)
          // ==========================================
          console.log('\n🔍 ========== FASE 1: BÚSQUEDA ==========');
          for (const city of cities) {
            try {
              console.log(`\n🔍 Buscando ${searchTerm} en ${city}, ${province}...`);
              
              const placeIds = await searchPlaces({
                location: `${city}, ${province}, España`,
                keyword: searchTerm,
                minRating: params.minRating,
                radius: 50000, // 50km por ciudad
              });

              console.log(`   Respuesta: ${placeIds.length} lugares`);
              placeIds.forEach(id => allPlaceIds.add(id));
              console.log(`   📊 Total acumulado: ${allPlaceIds.size} lugares únicos\n`);
              
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
          
          console.log(`\n✅ BÚSQUEDA COMPLETADA: ${allPlaceIds.size} lugares únicos encontrados`);
          console.log('==========================================\n');
          
          // ==========================================
          // FASE 2: PROCESAMIENTO CON PROGRESO VISIBLE
          // ==========================================
          console.log('🔄 ========== FASE 2: PROCESAMIENTO ==========');
          
          const newPlaceIds = Array.from(allPlaceIds).filter(id => !processedPlaceIds.has(id));
          console.log(`🔄 Procesando ${newPlaceIds.length} lugares de ${category}...\n`);
          
          for (const placeId of newPlaceIds) {
            try {
              // Marcar como procesado PRIMERO
              processedPlaceIds.add(placeId);
              totalProcessed++;

              console.log(`\n📍 [${totalProcessed}/${allPlaceIds.size}] Procesando lugar ${placeId}...`);

              // VERIFICAR SI YA EXISTE EN LA BD (ahorro de procesamiento)
              const { data: existingPlace } = await supabase
                .from('places')
                .select('id, name')
                .eq('google_place_id', placeId)
                .single();

              if (existingPlace) {
                console.log(`⏭️  Ya existe en BD: "${existingPlace.name}"`);
                totalSkipped++;
                continue;
              }

              // ✅ PROCESAR LUGAR COMPLETO (fotos Supabase, IA, etc.)
              console.log(`🔄 Procesando datos de Google + IA...`);
              const result = await processPlace(placeId, true); // true = excluir cadenas

              if (!result.success) {
                if (result.error === 'Chain excluded') {
                  console.log(`⏭️  Cadena excluida`);
                  totalSkipped++;
                } else if (result.error?.includes('rating')) {
                  console.log(`⏭️  ${result.error}`);
                  totalLowRating++;
                } else if (result.error?.includes('reviews')) {
                  console.log(`⏭️  ${result.error}`);
                  totalLowReviews++;
                } else {
                  console.error(`❌ Error: ${result.error}`);
                  totalFailed++;
                }
                continue;
              }

              // GUARDAR EN BD con UPSERT (evita errores de duplicado)
              console.log(`💾 Guardando en base de datos...`);
              
              // ✅ MARCAR COMO PUBLICADO porque ya tiene IA y fotos
              const placeToSave = {
                ...result.place,
                published: true,  // ✅ AUTO-PUBLICAR después de procesar
              };
              
              const { data: savedPlace, error: saveError } = await supabase
                .from('places')
                .upsert(placeToSave, {
                  onConflict: 'google_place_id',
                  ignoreDuplicates: false,
                })
                .select('id, name')
                .single();

              if (saveError) {
                // Distinguir entre descartados y errores reales
                if (saveError.code === '23505' || saveError.message?.includes('duplicate') || saveError.message?.includes('unique')) {
                  console.log(`⏭️  Descartado: ${saveError.message} (slug o ID duplicado)`);
                  totalSkipped++;
                } else if (saveError.message?.includes('incomplete') || saveError.message?.includes('null value')) {
                  console.log(`⏭️  Descartado: Datos incompletos`);
                  totalSkipped++;
                } else {
                  // Error técnico real
                  console.error(`❌ ERROR TÉCNICO guardando: ${saveError.message} (código: ${saveError.code})`);
                  totalFailed++;
                }
              } else {
                console.log(`✅ "${savedPlace?.name}" guardado como PUBLICADO con ID ${savedPlace?.id}`);
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
              console.log(`⏳ Pausa de 1 segundo...\n`);
              await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error: any) {
              console.error(`❌ Error fatal procesando:`, error.message);
              console.error(error.stack);
              totalFailed++;
            }
          } // Fin for placeId
          
          console.log('\n✅ PROCESAMIENTO COMPLETADO');
          console.log('==========================================\n');
          
        } catch (error) {
          console.error(`❌ Error en categoría ${category} - ${province}:`, error);
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
