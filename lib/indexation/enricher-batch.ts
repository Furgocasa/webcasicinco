/**
 * ENRICHER - FASE 2
 * Toma lugares pendientes (needs_enrichment = true, sin ai_description) y los enriquece con:
 * - Fotos descargadas a Supabase Storage (opcional)
 * - Descripción generada con IA
 * - Resumen de reseñas con IA
 * - Highlights con IA
 * Luego los marca como published = true
 */

import { createAdminClient } from '../supabase/server';
import { getPlaceDetails, downloadAndUploadPhotosToSupabase, extractReviews, getPlacePhotos } from '../google/places';
import { generatePlaceDescription, summarizeReviews, generateHighlights } from '../ai/openai';
import { categorizePlaceWithAI } from '../ai/categorize';
import { calculateQualityTier } from '../utils/tier-calculator';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EnrichmentResult {
  totalPending: number;
  processed: number;
  successful: number;
  failed: number;
  queued: number;
  errors: string[];
}

export interface EnrichmentOptions {
  /** Si true (por defecto), NO descarga fotos de Google Places Photo API */
  skipGooglePhotos?: boolean;
  /** Si true (por defecto), encola fichas vacías publicadas por error en Fase 1 */
  queueLegacy?: boolean;
}

/**
 * Encola fichas vacías que Fase 1 publicó por error: despublica y marca needs_enrichment.
 */
export async function queueEmptyPlacesForEnrichment(
  supabase: SupabaseClient
): Promise<number> {
  const { data, error } = await supabase
    .from('places')
    .update({
      needs_enrichment: true,
      published: false,
      enrichment_status: 'pending',
    })
    .is('ai_description', null)
    .eq('enrichment_status', 'pending')
    .eq('published', true)
    .select('id');

  if (error) {
    console.error('[ENRICHER] Error encolando fichas vacías:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * Enriquece lugares pendientes (needs_enrichment = true, sin IA)
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
  const queueLegacy = options.queueLegacy ?? true;
  const supabase = createAdminClient();

  console.log('\n[ENRICHER] 🎨 INICIANDO ENRIQUECIMIENTO CON IA');
  console.log(`[ENRICHER] Tamaño de lote: ${batchSize}`);
  console.log(
    `[ENRICHER] Fotos Google: ${skipGooglePhotos ? '❌ DESACTIVADAS (0€ fotos)' : '⚠️ ACTIVADAS (coste por foto)'}\n`
  );

  let queued = 0;
  if (queueLegacy) {
    queued = await queueEmptyPlacesForEnrichment(supabase);
    if (queued > 0) {
      console.log(`[ENRICHER] 📥 ${queued} fichas vacías encoladas (despublicadas hasta enriquecer)\n`);
    }
  }

  // Lugares pendientes de Fase 2 (incluye legacy mal publicados en Fase 1)
  const { data: pendingPlaces, error: fetchError } = await supabase
    .from('places')
    .select('*')
    .eq('needs_enrichment', true)
    .eq('enrichment_status', 'pending')
    .is('ai_description', null)
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
      queued,
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

      // Mapear categorías: BD solo acepta restaurante | bar | hotel
      let finalCategory = categorization.category;
      if (finalCategory === 'cafe') {
        finalCategory = 'bar';
        console.log('[ENRICHER]   ↪️ cafe → bar (categoría permitida en BD)');
      }

      // 2. Fotos: diamantes SIEMPRE piden al menos 1 a Google si no hay en Supabase
      const isDiamond =
        calculateQualityTier(place.rating, place.review_count || 0) === 'diamond';

      let supabaseUrls: string[] = Array.isArray(place.photo_urls)
        ? place.photo_urls.filter(Boolean)
        : [];

      const photoRefsFromDetails =
        details.photos?.map((p: { photo_reference: string }) => p.photo_reference) || [];
      let photoReferences = (
        place.photos && place.photos.length > 0 ? place.photos : photoRefsFromDetails
      ) as string[];

      const mustFetchGooglePhotos = !skipGooglePhotos || isDiamond;

      if (mustFetchGooglePhotos && photoReferences.length === 0 && place.google_place_id) {
        photoReferences = await getPlacePhotos(place.google_place_id);
        if (photoReferences.length > 0) {
          console.log(`[ENRICHER]   📷 ${photoReferences.length} refs obtenidas de Google Places`);
        }
      }

      if (mustFetchGooglePhotos && supabaseUrls.length === 0 && photoReferences.length > 0) {
        const maxPhotos = isDiamond ? 1 : 5;
        const photosArray = photoReferences.map((ref: string) => ({
          photo_reference: ref,
          height: 1200,
          width: 1200,
        }));
        const { supabaseUrls: downloadedUrls } = await downloadAndUploadPhotosToSupabase(
          photosArray,
          place.name,
          place.google_place_id,
          maxPhotos
        );
        supabaseUrls = downloadedUrls;
        console.log(`[ENRICHER]   📷 ${supabaseUrls.length} fotos subidas a Supabase`);
      } else if (skipGooglePhotos && !isDiamond) {
        console.log(
          `[ENRICHER]   📷 Fotos Google omitidas (${supabaseUrls.length} ya en Supabase)`
        );
      } else if (isDiamond && supabaseUrls.length === 0) {
        console.log('[ENRICHER]   ⚠️ Diamante sin foto: Google no devolvió imágenes');
      }

      // 3. Generar contenido con IA (usar la categoría correcta de la IA)
      const description = await generatePlaceDescription({
        name: place.name,
        category: finalCategory, // ✅ Usar categoría mapeada
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
        category: finalCategory, // ✅ Usar categoría mapeada
        rating: place.rating,
        reviews: reviews.map(r => r.text || '').filter(Boolean),
        description,
      });

      // 4. Actualizar lugar con toda la info (incluyendo categoría correcta)
      const { error: updateError } = await supabase
        .from('places')
        .update({
          category: finalCategory, // ✅ ACTUALIZAR categoría (mapeada a BD)
          photos: photoReferences.length > 0 ? photoReferences : place.photos,
          photo_urls: supabaseUrls,
          ai_description: description,
          ai_review_summary: reviewSummary,
          ai_highlights: highlights,
          needs_enrichment: false,
          enrichment_status: 'completed',
          published: true, // ✅ Publicar solo tras Fase 2
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
    queued,
    errors
  };
}

