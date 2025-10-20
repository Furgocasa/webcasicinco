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
 *   npx tsx scripts/migrate-photos-to-supabase.ts [--limit N] [--dry-run] [--category CATEGORY]
 * 
 * Ejemplos:
 *   npx tsx scripts/migrate-photos-to-supabase.ts --dry-run
 *   npx tsx scripts/migrate-photos-to-supabase.ts --limit 10
 *   npx tsx scripts/migrate-photos-to-supabase.ts --category restaurante
 */

import { createClient } from '@supabase/supabase-js';
import { downloadAndUploadPhotosToSupabase } from '@/lib/google/places';
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
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;
const categoryIndex = args.indexOf('--category');
const category = categoryIndex !== -1 ? args[categoryIndex + 1] : undefined;

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
  console.log('\n🔍 Buscando lugares con fotos pendientes de migración...');
  
  let query = supabase
    .from('places')
    .select('id, google_place_id, name, category, province, photos, photo_urls')
    .eq('published', true)
    .not('photos', 'is', null)
    .is('photo_urls', null)  // Solo lugares sin fotos en Supabase
    .order('review_count', { ascending: false })
    .order('rating', { ascending: false });
  
  // Filtrar por categoría si se especifica
  if (category) {
    query = query.eq('category', category);
    console.log(`   📁 Filtrando por categoría: ${category}`);
  }
  
  // Limitar resultados si se especifica
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
  
  // Filtrar solo los que no tienen photo_urls o tienen array vacío
  const placesNeedingMigration = data.filter(place => {
    const hasPhotos = place.photos && Array.isArray(place.photos) && place.photos.length > 0;
    const hasSupabasePhotos = place.photo_urls && Array.isArray(place.photo_urls) && place.photo_urls.length > 0;
    return hasPhotos && !hasSupabasePhotos;
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
    console.log(`   Google Photos: ${place.photos.length} fotos`);
    
    if (dryRun) {
      console.log('   🔍 [DRY RUN] Simulando migración...');
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('   ✅ [DRY RUN] Migración simulada exitosamente');
      return true;
    }
    
    // Convertir photo_references a formato GooglePlacePhoto
    const googlePhotos: GooglePlacePhoto[] = place.photos.map(photoRef => ({
      photo_reference: photoRef,
      height: 1200,
      width: 1200,
      html_attributions: []
    }));
    
    // Descargar y subir fotos a Supabase
    const { supabaseUrls, photoReferences } = await downloadAndUploadPhotosToSupabase(
      googlePhotos,
      place.name,
      place.google_place_id,
      5 // Máximo 5 fotos
    );
    
    if (supabaseUrls.length === 0) {
      console.log('   ⚠️ No se pudieron migrar fotos (puede ser problema de red o API)');
      return false;
    }
    
    console.log(`   ✅ Subidas ${supabaseUrls.length} fotos a Supabase`);
    
    // Actualizar registro en la base de datos
    const { error: updateError } = await supabase
      .from('places')
      .update({
        photo_urls: supabaseUrls,
        // Mantener photos como backup
        updated_at: new Date().toISOString()
      })
      .eq('id', place.id);
    
    if (updateError) {
      console.error('   ❌ Error actualizando base de datos:', updateError);
      return false;
    }
    
    console.log('   ✅ Base de datos actualizada');
    
    // Calcular ahorro
    const savingsPerMonth = place.photos.length * 100 * 0.007; // 100 vistas/mes, $0.007 por foto
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
  
  // Obtener lugares a migrar
  const places = await getPlacesToMigrate();
  
  if (places.length === 0) {
    console.log('\n✅ No hay lugares pendientes de migración. ¡Todo está actualizado!');
    return;
  }
  
  // Calcular estadísticas
  const totalPhotos = places.reduce((sum, p) => sum + p.photos.length, 0);
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
      const savings = place.photos.length * 100 * 0.007;
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

