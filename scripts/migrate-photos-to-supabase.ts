/**
 * SCRIPT DE MIGRACIÓN DE FOTOS A SUPABASE
 * ========================================
 * 
 * Migra fotos de Google Places API a Supabase Storage para:
 * - Reducir costos de $500+/mes a ~$0.50/mes (99.9% ahorro)
 * - Mejorar velocidad de carga (sin redirecciones)
 * - Mayor control sobre las imágenes
 * 
 * Uso:
 *   npx tsx scripts/migrate-photos-to-supabase.ts [--limit N] [--dry-run] [--category CATEGORY] [--diamond]
 * 
 * Ejemplos:
 *   npx tsx scripts/migrate-photos-to-supabase.ts --dry-run
 *   npx tsx scripts/migrate-photos-to-supabase.ts --limit 10
 *   npx tsx scripts/migrate-photos-to-supabase.ts --category restaurante
 *   npx tsx scripts/migrate-photos-to-supabase.ts --diamond   → tier diamante sin foto (pide a Google si hace falta)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// Proxy SSL corporativo / antivirus (scripts locales)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';
import { downloadAndUploadPhotosToSupabase, getPlacePhotos } from '@/lib/google/places';
import type { GooglePlacePhoto } from '@/types/place';

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const diamondMode = args.includes('--diamond');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;
const categoryIndex = args.indexOf('--category');
const category = categoryIndex !== -1 ? args[categoryIndex + 1] : undefined;

/** Tier diamante: 4.8+ y 1000+ reseñas (misma regla que tier-calculator) */
function hasSupabasePhotos(place: { photo_urls?: string[] | null }): boolean {
  return Boolean(
    place.photo_urls &&
      Array.isArray(place.photo_urls) &&
      place.photo_urls.length > 0 &&
      place.photo_urls[0]
  );
}

interface PlaceToMigrate {
  id: string;
  google_place_id: string;
  name: string;
  category: string;
  province: string;
  photos: string[];
}

/**
 * Obtener lugares que necesitan migración de fotos
 */
async function getPlacesToMigrate(): Promise<PlaceToMigrate[]> {
  if (diamondMode) {
    console.log('\n💎 Buscando DIAMANTES (4.8+ / 1000+ reseñas) sin foto en Supabase...');

    let query = supabase
      .from('places')
      .select('id, google_place_id, name, category, province, photos, photo_urls, rating, review_count')
      .eq('published', true)
      .gte('rating', 4.8)
      .gte('review_count', 1000)
      .not('google_place_id', 'is', null)
      .order('review_count', { ascending: false })
      .order('rating', { ascending: false });

    if (category) {
      query = query.eq('category', category);
      console.log(`   📁 Filtrando por categoría: ${category}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('❌ Error al obtener diamantes:', error);
      throw error;
    }

    const diamondsWithoutPhoto = (data || []).filter((place) => !hasSupabasePhotos(place));

    if (limit) {
      console.log(`   🎯 Limitando a ${limit} lugares`);
      return diamondsWithoutPhoto.slice(0, limit) as PlaceToMigrate[];
    }

    console.log(`✅ ${diamondsWithoutPhoto.length} diamantes sin foto en Supabase`);
    return diamondsWithoutPhoto as PlaceToMigrate[];
  }

  console.log('\n🔍 Buscando lugares con fotos pendientes de migración...');

  let query = supabase
    .from('places')
    .select('id, google_place_id, name, category, province, photos, photo_urls')
    .eq('published', true)
    .not('photos', 'is', null)
    .is('photo_urls', null)
    .order('review_count', { ascending: false })
    .order('rating', { ascending: false });

  if (category) {
    query = query.eq('category', category);
    console.log(`   📁 Filtrando por categoría: ${category}`);
  }

  if (limit) {
    query = query.limit(limit);
    console.log(`   🎯 Limitando a ${limit} lugares`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error al obtener lugares:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.log('✅ No hay lugares pendientes de migración');
    return [];
  }

  const placesNeedingMigration = data.filter((place) => {
    const hasPhotos = place.photos && Array.isArray(place.photos) && place.photos.length > 0;
    return hasPhotos && !hasSupabasePhotos(place);
  });

  console.log(`✅ Encontrados ${placesNeedingMigration.length} lugares para migrar`);

  return placesNeedingMigration as PlaceToMigrate[];
}

/**
 * Migrar fotos de un lugar específico
 */
async function migratePlace(place: PlaceToMigrate): Promise<boolean> {
  try {
    console.log(`\n📸 Migrando: ${place.name} (${place.category} - ${place.province})`);

    let photoRefs: string[] =
      place.photos && Array.isArray(place.photos) ? place.photos.filter(Boolean) : [];

    // Diamantes: siempre pedir refs frescas a Google (las de BD pueden estar caducadas)
    if (diamondMode && place.google_place_id && !dryRun) {
      const freshRefs = await getPlacePhotos(place.google_place_id);
      if (freshRefs.length > 0) {
        photoRefs = freshRefs;
      }
    } else if (photoRefs.length === 0 && place.google_place_id) {
      console.log('   🔍 Sin refs en BD — consultando Google Places...');
      if (!dryRun) {
        photoRefs = await getPlacePhotos(place.google_place_id);
      } else {
        console.log('   🔍 [DRY RUN] Pediría foto a Google Places API');
        photoRefs = ['dry-run-ref'];
      }
    }

    console.log(`   Referencias de foto: ${photoRefs.length}`);

    if (photoRefs.length === 0) {
      console.log('   ⚠️ Google no devolvió fotos para este lugar');
      return false;
    }

    if (dryRun) {
      console.log('   🔍 [DRY RUN] Simulando migración...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log('   ✅ [DRY RUN] Migración simulada exitosamente');
      return true;
    }

    const maxPhotos = diamondMode ? 1 : 5;

    const googlePhotos: GooglePlacePhoto[] = photoRefs.map((photoRef) => ({
      photo_reference: photoRef,
      height: 1200,
      width: 1200,
      html_attributions: [],
    }));

    const { supabaseUrls, photoReferences } = await downloadAndUploadPhotosToSupabase(
      googlePhotos,
      place.name,
      place.google_place_id,
      maxPhotos
    );

    let finalUrls = supabaseUrls;
    let finalRefs = photoReferences;

    // Reintento con refs frescas si las de BD estaban caducadas
    if (finalUrls.length === 0 && place.google_place_id) {
      console.log('   🔄 Refs caducadas — pidiendo nuevas a Google...');
      const freshRefs = await getPlacePhotos(place.google_place_id);
      if (freshRefs.length > 0) {
        const retryPhotos: GooglePlacePhoto[] = freshRefs.map((photoRef: string) => ({
          photo_reference: photoRef,
          height: 1200,
          width: 1200,
          html_attributions: [],
        }));
        const retry = await downloadAndUploadPhotosToSupabase(
          retryPhotos,
          place.name,
          place.google_place_id,
          maxPhotos
        );
        finalUrls = retry.supabaseUrls;
        finalRefs = retry.photoReferences;
      }
    }

    if (finalUrls.length === 0) {
      console.log('   ⚠️ No se pudieron migrar fotos (puede ser problema de red o API)');
      return false;
    }
    
    console.log(`   ✅ Subidas ${finalUrls.length} fotos a Supabase`);
    
    const { error: updateError } = await supabase
      .from('places')
      .update({
        photo_urls: finalUrls,
        photos: finalRefs.length > 0 ? finalRefs : place.photos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', place.id);
    
    if (updateError) {
      console.error('   ❌ Error actualizando base de datos:', updateError);
      return false;
    }
    
    console.log('   ✅ Base de datos actualizada');
    
    // Calcular ahorro
    const savingsPerMonth = finalUrls.length * 100 * 0.007;
    console.log(`   💰 Ahorro estimado: $${savingsPerMonth.toFixed(2)}/mes`);
    
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error migrando ${place.name}:`, error);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   MIGRACIÓN DE FOTOS A SUPABASE                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  if (dryRun) {
    console.log('\n⚠️  MODO DRY RUN: No se modificarán datos');
  }

  if (diamondMode) {
    console.log('\n💎 MODO DIAMANTE: 4.8+ / 1000+ reseñas — mínimo 1 foto vía Google si falta');
  }
  
  // Obtener lugares a migrar
  const places = await getPlacesToMigrate();
  
  if (places.length === 0) {
    console.log('\n✅ No hay lugares pendientes de migración. ¡Todo está actualizado!');
    return;
  }
  
  // Calcular estadísticas
  const totalPhotos = places.reduce(
    (sum, p) => sum + (p.photos?.length || (diamondMode ? 1 : 0)),
    0
  );
  const estimatedSavings = totalPhotos * 100 * 0.007; // 100 vistas/mes por foto
  
  console.log('\n📊 ESTADÍSTICAS:');
  console.log(`   Lugares a migrar: ${places.length}`);
  console.log(`   Total de fotos: ${totalPhotos}`);
  console.log(`   Ahorro estimado: $${estimatedSavings.toFixed(2)}/mes ($${(estimatedSavings * 12).toFixed(2)}/año)`);
  
  if (dryRun) {
    console.log('\n🔍 [DRY RUN] Procesando lugares...');
  } else {
    console.log('\n🚀 Iniciando migración...');
    console.log('   ⏱️  Tiempo estimado: ~2 segundos por foto');
  }
  
  // Migrar cada lugar
  let successCount = 0;
  let errorCount = 0;
  let totalSavings = 0;
  
  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    console.log(`\n[${i + 1}/${places.length}]`);
    
    const success = await migratePlace(place);
    
    if (success) {
      successCount++;
      const savings = (diamondMode ? 1 : place.photos?.length || 1) * 100 * 0.007;
      totalSavings += savings;
    } else {
      errorCount++;
    }
    
    // Pausa entre migraciones para no saturar APIs
    if (!dryRun && i < places.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Resumen final
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   RESUMEN DE MIGRACIÓN                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`💰 Ahorro logrado: $${totalSavings.toFixed(2)}/mes ($${(totalSavings * 12).toFixed(2)}/año)`);
  
  if (dryRun) {
    console.log('\n⚠️  Este fue un DRY RUN. Para ejecutar la migración real, ejecuta sin --dry-run');
  } else {
    console.log('\n🎉 ¡Migración completada!');
  }
}

// Ejecutar
main().catch(console.error);

