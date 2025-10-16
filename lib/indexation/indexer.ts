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
    console.log(`\n[INDEXACIÓN] ${'='.repeat(70)}`);
    console.log(`[INDEXACIÓN] 🚀 INICIANDO`);
    console.log(`[INDEXACIÓN]    Job ID: ${jobId}`);
    console.log(`[INDEXACIÓN]    Provincias: ${params.provinces.join(', ')}`);
    console.log(`[INDEXACIÓN]    Categorías: ${params.categories.join(', ')}`);
    console.log(`[INDEXACIÓN]    Rating mínimo: ${params.minRating}`);
    console.log(`[INDEXACIÓN] ${'='.repeat(70)}\n`);
    
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
    
    // Ciudades principales por provincia - OPTIMIZADO (solo top 5 para velocidad)
    const mainCitiesByProvince: Record<string, string[]> = {
      'Murcia': ['Murcia', 'Cartagena', 'Lorca', 'Molina de Segura', 'Mazarrón'],
      'Alicante': ['Alicante', 'Elche', 'Torrevieja', 'Benidorm', 'Orihuela'],
      'Madrid': ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés'],
      'Barcelona': ['Barcelona', 'Hospitalet de Llobregat', 'Terrassa', 'Badalona', 'Sabadell'],
      'Valencia': ['Valencia', 'Gandía', 'Torrent', 'Paterna', 'Sagunto'],
      'Sevilla': ['Sevilla', 'Dos Hermanas', 'Alcalá de Guadaíra', 'Utrera', 'Mairena del Aljarafe'],
      'Málaga': ['Málaga', 'Marbella', 'Mijas', 'Vélez-Málaga', 'Fuengirola'],
      'Granada': ['Granada', 'Motril', 'Almuñécar', 'Baza', 'Guadix'],
      'Cádiz': ['Cádiz', 'Jerez de la Frontera', 'Algeciras', 'San Fernando', 'El Puerto de Santa María'],
      'Córdoba': ['Córdoba', 'Lucena', 'Puente Genil', 'Montilla', 'Priego de Córdoba'],
      // Otras provincias: buscar solo en la capital (más rápido)
    };
    
    for (const province of params.provinces) {
      for (const category of params.categories) {
        try {
          // Términos de búsqueda mejorados para capturar más tipos de establecimientos
          const searchTerms: Record<string, string> = {
            'restaurante': 'restaurantes hamburgueserías pizzerías',
            'hotel': 'hoteles hostales',
            'spa': 'spa wellness',
            'bar': 'bares pubs',
            'experiencia': 'lugares turísticos',
            'monumento': 'monumentos museos',
          };
          
          const searchTerm = searchTerms[category] || category;
          const cities = mainCitiesByProvince[province] || [province];
          
          // ==========================================
          // FASE 1: BÚSQUEDA COMPLETA (rápida)
          // ==========================================
          console.log('\n[INDEXACIÓN] 🔍 ===== FASE 1: BÚSQUEDA =====');
          console.log(`[INDEXACIÓN] Ciudades a buscar: ${cities.length}`);
          
          let citiesSearched = 0;
          
          for (const city of cities) {
            try {
              citiesSearched++;
              console.log(`\n[INDEXACIÓN] 🔍 [${citiesSearched}/${cities.length}] Buscando ${searchTerm} en ${city}, ${province}...`);
              
              const placeIds = await searchPlaces({
                location: `${city}, ${province}, España`,
                keyword: searchTerm,
                minRating: params.minRating,
                radius: 50000, // 50km por ciudad
              });

              console.log(`   ✅ ${placeIds.length} resultados de ${city}`);
              
              const newPlacesCount = allPlaceIds.size;
              placeIds.forEach(id => allPlaceIds.add(id));
              const addedCount = allPlaceIds.size - newPlacesCount;
              
              console.log(`   🆕 ${addedCount} nuevos (${placeIds.length - addedCount} duplicados)`);
              console.log(`   📊 Total único: ${allPlaceIds.size} | Progreso búsqueda: ${Math.round((citiesSearched/cities.length)*100)}%\n`);
              
              // Actualizar total acumulado en tiempo real
              await supabase
                .from('indexation_jobs')
                .update({ total_places: allPlaceIds.size })
                .eq('id', jobId);
              
              // Pausa MÁS CORTA para no saturar (500ms en lugar de 1000ms)
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              console.error(`❌ Error buscando en ${city}:`, error);
            }
          }
          
          console.log(`\n[INDEXACIÓN] ✅ BÚSQUEDA COMPLETADA: ${allPlaceIds.size} lugares únicos`);
          console.log(`[INDEXACIÓN] ${'='.repeat(70)}\n`);
          
          // ==========================================
          // FASE 2: PROCESAMIENTO CON PROGRESO VISIBLE
          // ==========================================
          console.log(`[INDEXACIÓN] 🔄 ===== FASE 2: PROCESAMIENTO =====`);
          
          const newPlaceIds = Array.from(allPlaceIds).filter(id => !processedPlaceIds.has(id));
          console.log(`[INDEXACIÓN] 🔄 Procesando ${newPlaceIds.length} lugares de ${category}...\n`);
          
          for (const placeId of newPlaceIds) {
            try {
              // Marcar como procesado PRIMERO
              processedPlaceIds.add(placeId);
              totalProcessed++;

              // Log cada 10 lugares para no saturar consola
              if (totalProcessed % 10 === 0) {
                console.log(`[INDEXACIÓN] 📍 Procesando ${totalProcessed}/${allPlaceIds.size} (${Math.round((totalProcessed/allPlaceIds.size)*100)}%)`);
              }

              // VERIFICAR SI YA EXISTE EN LA BD (ahorro de procesamiento)
              const { data: existingPlace } = await supabase
                .from('places')
                .select('id, name')
                .eq('google_place_id', placeId)
                .single();

              if (existingPlace) {
                totalSkipped++;
                continue;
              }

              // ✅ PROCESAR LUGAR COMPLETO (fotos Supabase, IA, etc.)
              const result = await processPlace(placeId, true);

              if (!result.success) {
                // Clasificar sin logs individuales (solo cada 10)
                if (result.error === 'Chain excluded') {
                  totalSkipped++;
                } else if (result.error?.includes('rating') || result.error?.includes('Rating')) {
                  totalLowRating++;
                } else if (result.error?.includes('reviews') || result.error?.includes('reseñas') || result.error?.includes('Pocas')) {
                  totalLowReviews++;
                } else if (result.error?.includes('OpenAI') || result.error?.includes('timeout') || result.error?.includes('Google') || result.error?.includes('quota') || result.error?.includes('network')) {
                  totalFailed++;
                  if (totalFailed % 5 === 0) {
                    console.error(`[INDEXACIÓN] ❌ ${totalFailed} errores técnicos acumulados`);
                  }
                } else {
                  totalSkipped++;
                }
                continue;
              }

              // GUARDAR EN BD con UPSERT (evita errores de duplicado)
              const placeToSave = {
                ...result.place,
                published: true,
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
                if (saveError.code === '23505' || saveError.message?.includes('duplicate') || saveError.message?.includes('unique')) {
                  totalSkipped++;
                } else if (saveError.message?.includes('incomplete') || saveError.message?.includes('null value')) {
                  totalSkipped++;
                } else {
                  totalFailed++;
                  console.error(`[INDEXACIÓN] ❌ Error guardando: ${saveError.message}`);
                }
              } else {
                totalSuccessful++;
                if (totalSuccessful % 10 === 0) {
                  console.log(`[INDEXACIÓN] ✅ ${totalSuccessful} lugares guardados`);
                }
              }

              // Actualizar progreso en BD cada 5 lugares (no cada 1, ralentiza mucho)
              if (totalProcessed % 5 === 0) {
                await supabase
                  .from('indexation_jobs')
                  .update({
                    total_places: allPlaceIds.size,
                    processed_places: totalProcessed,
                    successful_places: totalSuccessful,
                    failed_places: totalFailed,
                    error_log: {
                      skipped: totalSkipped,
                      lowRating: totalLowRating,
                      lowReviews: totalLowReviews,
                      summary: `${totalSuccessful} guardados | ${totalSkipped} duplicados | ${totalLowRating} rating bajo | ${totalLowReviews} pocas reseñas | ${totalFailed} errores`
                    }
                  })
                  .eq('id', jobId);
              }

              // SIN pausas artificiales (las APIs ya tienen sus propios límites)

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
