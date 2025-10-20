/**
 * API ENDPOINT: Migración de Fotos a Supabase
 * =============================================
 * 
 * Endpoint para migrar fotos de Google Places API a Supabase Storage
 * desde el panel de administración.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { downloadAndUploadPhotosToSupabase } from '@/lib/google/places';
import type { GooglePlacePhoto } from '@/types/place';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos (para migraciones grandes)

interface MigrationStats {
  total: number;
  migrated: number;
  errors: number;
  skipped: number;
  savings: number;
}

/**
 * POST - Iniciar migración de fotos
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { limit = 10, category, dryRun = false } = body;

    console.log(`\n🚀 Iniciando migración de fotos (limit: ${limit}, dryRun: ${dryRun})`);

    // Obtener lugares que necesitan migración
    let query = supabase
      .from('places')
      .select('id, place_id, name, category, province, photos, photo_urls')
      .eq('published', true)
      .not('photos', 'is', null)
      .order('review_count', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: places, error: queryError } = await query;

    if (queryError) {
      console.error('Error obteniendo lugares:', queryError);
      return NextResponse.json({ 
        error: 'Error al obtener lugares',
        details: queryError.message 
      }, { status: 500 });
    }

    if (!places || places.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay lugares pendientes de migración',
        stats: {
          total: 0,
          migrated: 0,
          errors: 0,
          skipped: 0,
          savings: 0
        }
      });
    }

    // Filtrar solo los que realmente necesitan migración
    const placesToMigrate = places.filter(place => {
      const hasPhotos = place.photos && Array.isArray(place.photos) && place.photos.length > 0;
      const hasSupabasePhotos = place.photo_urls && Array.isArray(place.photo_urls) && place.photo_urls.length > 0;
      return hasPhotos && !hasSupabasePhotos;
    });

    console.log(`📦 ${placesToMigrate.length} lugares necesitan migración`);

    if (placesToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos los lugares ya tienen fotos en Supabase',
        stats: {
          total: places.length,
          migrated: 0,
          errors: 0,
          skipped: places.length,
          savings: 0
        }
      });
    }

    const stats: MigrationStats = {
      total: placesToMigrate.length,
      migrated: 0,
      errors: 0,
      skipped: 0,
      savings: 0
    };

    const results = [];

    // Migrar cada lugar
    for (const place of placesToMigrate) {
      try {
        console.log(`\n📸 Migrando: ${place.name}`);

        if (dryRun) {
          console.log('   🔍 [DRY RUN] Simulando migración...');
          stats.migrated++;
          const estimatedSavings = place.photos.length * 100 * 0.007;
          stats.savings += estimatedSavings;
          
          results.push({
            id: place.id,
            name: place.name,
            status: 'simulated',
            photos: place.photos.length,
            savings: estimatedSavings
          });
          
          continue;
        }

        // Convertir photo_references a formato GooglePlacePhoto
        const googlePhotos: GooglePlacePhoto[] = place.photos.map((photoRef: string) => ({
          photo_reference: photoRef,
          height: 1200,
          width: 1200,
          html_attributions: []
        }));

        // Descargar y subir fotos a Supabase
        const { supabaseUrls } = await downloadAndUploadPhotosToSupabase(
          googlePhotos,
          place.name,
          place.place_id,
          5 // Máximo 5 fotos
        );

        if (supabaseUrls.length === 0) {
          console.log('   ⚠️ No se pudieron migrar fotos');
          stats.errors++;
          
          results.push({
            id: place.id,
            name: place.name,
            status: 'error',
            error: 'No se pudieron descargar las fotos'
          });
          
          continue;
        }

        console.log(`   ✅ Subidas ${supabaseUrls.length} fotos a Supabase`);

        // Actualizar registro en la base de datos
        const { error: updateError } = await supabase
          .from('places')
          .update({
            photo_urls: supabaseUrls,
            updated_at: new Date().toISOString()
          })
          .eq('id', place.id);

        if (updateError) {
          console.error('   ❌ Error actualizando BD:', updateError);
          stats.errors++;
          
          results.push({
            id: place.id,
            name: place.name,
            status: 'error',
            error: updateError.message
          });
          
          continue;
        }

        const savingsPerMonth = place.photos.length * 100 * 0.007;
        stats.migrated++;
        stats.savings += savingsPerMonth;

        console.log(`   💰 Ahorro: $${savingsPerMonth.toFixed(2)}/mes`);

        results.push({
          id: place.id,
          name: place.name,
          status: 'success',
          photos: supabaseUrls.length,
          savings: savingsPerMonth
        });

        // Pausa entre migraciones para no saturar APIs
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`   ❌ Error migrando ${place.name}:`, error);
        stats.errors++;
        
        results.push({
          id: place.id,
          name: place.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('\n✅ Migración completada');
    console.log(`   Migrados: ${stats.migrated}`);
    console.log(`   Errores: ${stats.errors}`);
    console.log(`   Ahorro: $${stats.savings.toFixed(2)}/mes`);

    return NextResponse.json({
      success: true,
      message: `Migración completada: ${stats.migrated} lugares`,
      stats,
      results,
      dryRun
    });

  } catch (error: any) {
    console.error('Error en migración:', error);
    return NextResponse.json({ 
      error: 'Error en la migración',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET - Obtener estadísticas de migración
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener estadísticas de la base de datos
    const { data: places, error: queryError } = await supabase
      .from('places')
      .select('photos, photo_urls')
      .eq('published', true);

    if (queryError) {
      return NextResponse.json({ 
        error: 'Error al obtener estadísticas',
        details: queryError.message 
      }, { status: 500 });
    }

    const stats = {
      total: places?.length || 0,
      withSupabasePhotos: 0,
      withGooglePhotos: 0,
      withoutPhotos: 0,
      pendingMigration: 0,
      estimatedMonthlyCost: 0,
      estimatedMonthlySavings: 0
    };

    places?.forEach(place => {
      const hasPhotos = place.photos && Array.isArray(place.photos) && place.photos.length > 0;
      const hasSupabasePhotos = place.photo_urls && Array.isArray(place.photo_urls) && place.photo_urls.length > 0;

      if (hasSupabasePhotos) {
        stats.withSupabasePhotos++;
      } else if (hasPhotos) {
        stats.withGooglePhotos++;
        stats.pendingMigration++;
        // Estimación: 100 vistas/mes por lugar, $0.007 por foto
        stats.estimatedMonthlyCost += place.photos.length * 100 * 0.007;
      } else {
        stats.withoutPhotos++;
      }
    });

    stats.estimatedMonthlySavings = stats.estimatedMonthlyCost;

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ 
      error: 'Error al obtener estadísticas',
      details: error.message 
    }, { status: 500 });
  }
}

