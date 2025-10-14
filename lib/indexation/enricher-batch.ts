/**
 * ENRICHER - FASE 2
 * Toma lugares "aprobados" (needs_enrichment = true) y los enriquece con:
 * - Fotos descargadas a Supabase Storage
 * - Descripción generada con IA
 * - Resumen de reseñas con IA
 * - Highlights con IA
 * Luego los marca como published = true
 */

import { createAdminClient } from '../supabase/server';
import { getPlaceDetails, downloadAndUploadPhotosToSupabase, extractReviews } from '../google/places';
import { generatePlaceDescription, summarizeReviews, generateHighlights } from '../ai/openai';

export interface EnrichmentResult {
  totalPending: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

/**
 * Enriquece lugares pendientes (needs_enrichment = true)
 */
export async function enrichPendingPlaces(
  batchSize: number = 100
): Promise<EnrichmentResult> {
  const supabase = createAdminClient();

  console.log('\n[ENRICHER] 🎨 INICIANDO ENRIQUECIMIENTO CON IA');
  console.log(`[ENRICHER] Tamaño de lote: ${batchSize}\n`);

  // Obtener lugares pendientes
  const { data: pendingPlaces, error: fetchError } = await supabase
    .from('places')
    .select('*')
    .eq('needs_enrichment', true)
    .eq('enrichment_status', 'pending')
    .limit(batchSize);

  if (fetchError) {
    throw new Error(`Error obteniendo lugares pendientes: ${fetchError.message}`);
  }

  if (!pendingPlaces || pendingPlaces.length === 0) {
    console.log('[ENRICHER] ℹ️  No hay lugares pendientes de enriquecimiento');
    return {
      totalPending: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };
  }

  console.log(`[ENRICHER] 📋 ${pendingPlaces.length} lugares a enriquecer\n`);

  let processed = 0;
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const place of pendingPlaces) {
    processed++;

    try {
      console.log(`[ENRICHER] [${processed}/${pendingPlaces.length}] Enriqueciendo "${place.name}"...`);

      // Marcar como "processing"
      await supabase
        .from('places')
        .update({ enrichment_status: 'processing' })
        .eq('id', place.id);

      // 1. Obtener detalles completos (incluye reseñas)
      const details = await getPlaceDetails(place.google_place_id);
      const reviews = extractReviews(details);

      // 2. Descargar fotos a Supabase
      const { supabaseUrls } = await downloadAndUploadPhotosToSupabase(
        details.photos || [],
        place.name,
        place.google_place_id,
        5
      );

      // 3. Generar contenido con IA
      const description = await generatePlaceDescription({
        name: place.name,
        category: place.category,
        city: place.city,
        province: place.province,
        rating: place.rating,
        review_count: place.review_count,
        price_level: place.price_level,
        reviews: reviews.map(r => r.text || '').filter(Boolean),
      });

      const reviewSummary = await summarizeReviews(
        reviews.map(r => r.text || '').filter(Boolean)
      );

      const highlights = await generateHighlights({
        name: place.name,
        category: place.category,
        rating: place.rating,
        reviews: reviews.map(r => r.text || '').filter(Boolean),
        description,
      });

      // 4. Actualizar lugar con toda la info
      const { error: updateError } = await supabase
        .from('places')
        .update({
          photo_urls: supabaseUrls,
          ai_description: description,
          ai_review_summary: reviewSummary,
          ai_highlights: highlights,
          needs_enrichment: false,
          enrichment_status: 'completed',
          published: true, // ✅ Ahora sí publicar
          updated_at: new Date().toISOString(),
        })
        .eq('id', place.id);

      if (updateError) {
        throw new Error(`Error actualizando: ${updateError.message}`);
      }

      successful++;
      console.log(`[ENRICHER] ✅ "${place.name}" enriquecido y publicado\n`);

      // Pausa para no saturar OpenAI
      await new Promise(r => setTimeout(r, 2000));

    } catch (error: any) {
      failed++;
      errors.push(`${place.name}: ${error.message}`);
      
      console.error(`[ENRICHER] ❌ Error en "${place.name}": ${error.message}\n`);

      // Marcar como failed
      await supabase
        .from('places')
        .update({ enrichment_status: 'failed' })
        .eq('id', place.id);
    }
  }

  console.log(`\n[ENRICHER] ✅ ENRIQUECIMIENTO COMPLETADO`);
  console.log(`[ENRICHER] 📊 Procesados: ${processed} | Exitosos: ${successful} | Fallidos: ${failed}\n`);

  return {
    totalPending: pendingPlaces.length,
    processed,
    successful,
    failed,
    errors
  };
}

