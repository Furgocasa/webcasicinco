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
import { categorizePlaceWithAI } from '../ai/categorize';

export interface EnrichmentResult {
  totalPending: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface EnrichmentOptions {
  /** Si true (por defecto), NO descarga fotos de Google Places Photo API */
  skipGooglePhotos?: boolean;
}

/**
 * Enriquece lugares pendientes (needs_enrichment = true)
 */
export async function enrichPendingPlaces(
  batchSize: number = 100,
  adminUserId?: string,
  options: EnrichmentOptions = {}
): Promise<EnrichmentResult> {
  // Por defecto: cero coste Google Photos (solo IA + datos ya en BD)
  const skipGooglePhotos =
    options.skipGooglePhotos ??
    process.env.SKIP_GOOGLE_PHOTOS !== 'false';
  const supabase = createAdminClient();

  console.log('\n[ENRICHER] 🎨 INICIANDO ENRIQUECIMIENTO CON IA');
  console.log(`[ENRICHER] Tamaño de lote: ${batchSize}`);
  console.log(
    `[ENRICHER] Fotos Google: ${skipGooglePhotos ? '❌ DESACTIVADAS (0€ fotos)' : '⚠️ ACTIVADAS (coste por foto)'}\n`
  );

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
  let discardedByAI = 0;
  const errors: string[] = [];

  for (const place of pendingPlaces) {
    processed++;

    try {
      console.log(`[ENRICHER] [${processed}/${pendingPlaces.length}] Enriqueciendo "${place.name}"...`);

      // Log cada 10 lugares para no saturar
      if (processed % 10 === 0) {
        console.log(`[ENRICHER] 📊 Progreso: ${processed}/${pendingPlaces.length} (${successful} publicados, ${discardedByAI} descartados)`);
      }

      // Marcar como "processing"
      await supabase
        .from('places')
        .update({ enrichment_status: 'processing' })
        .eq('id', place.id);

      // 1. Obtener detalles completos (incluye reseñas)
      const details = await getPlaceDetails(place.google_place_id);
      const reviews = extractReviews(details);

      // 1.5. CATEGORIZACIÓN INTELIGENTE CON IA
      const categorization = await categorizePlaceWithAI({
        name: place.name,
        googleTypes: details.types || [],
        description: undefined, // Google Places API no tiene editorial_summary en detalles básicos
        reviews: reviews.slice(0, 5).map(r => r.text || ''),
      });

      // Si la IA lo marca como "descartado", no procesar
      if (categorization.category === 'descartado') {
        console.log(`[ENRICHER] ⏭️  "${place.name}" descartado por IA: ${categorization.reason}`);
        
        await supabase
          .from('places')
          .update({ 
            enrichment_status: 'failed',
            needs_enrichment: false,
          })
          .eq('id', place.id);
        
        discardedByAI++;
        continue;
      }

      console.log(`[ENRICHER]   Categoría IA: ${categorization.category} (confianza: ${categorization.confidence})`);

      // 2. Fotos: reutilizar Supabase existente; NO descargar de Google salvo opt-in explícito
      let supabaseUrls: string[] = Array.isArray(place.photo_urls)
        ? place.photo_urls.filter(Boolean)
        : [];

      if (!skipGooglePhotos && supabaseUrls.length === 0) {
        const photoReferences = place.photos || [];
        if (photoReferences.length > 0) {
          const photosArray = photoReferences.map((ref: string) => ({
            photo_reference: ref,
          }));
          const { supabaseUrls: downloadedUrls } = await downloadAndUploadPhotosToSupabase(
            photosArray,
            place.name,
            place.google_place_id,
            5
          );
          supabaseUrls = downloadedUrls;
        }
      } else if (skipGooglePhotos) {
        console.log(
          `[ENRICHER]   📷 Fotos Google omitidas (${supabaseUrls.length} ya en Supabase)`
        );
      }

      // 3. Generar contenido con IA (usar la categoría correcta de la IA)
      const description = await generatePlaceDescription({
        name: place.name,
        category: categorization.category, // ✅ Usar categoría de la IA
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
        category: categorization.category, // ✅ Usar categoría de la IA
        rating: place.rating,
        reviews: reviews.map(r => r.text || '').filter(Boolean),
        description,
      });

      // 4. Actualizar lugar con toda la info (incluyendo categoría correcta)
      const { error: updateError } = await supabase
        .from('places')
        .update({
          category: categorization.category, // ✅ ACTUALIZAR categoría con la correcta de IA
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
  console.log(`[ENRICHER] 📊 Procesados: ${processed} | Exitosos: ${successful} | Descartados IA: ${discardedByAI} | Fallidos: ${failed}\n`);

  return {
    totalPending: pendingPlaces.length,
    processed,
    successful,
    failed,
    errors
  };
}

