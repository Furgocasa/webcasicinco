/**
 * API ENDPOINT: Migrar fotos pendientes
 * =====================================
 * 
 * Migra los 97 lugares restantes que tienen `photos` pero no `photo_urls`
 * Se ejecuta desde el dashboard admin o directamente
 * 
 * SEGURIDAD: Solo accesible para admins
 * 
 * Uso:
 *   POST /api/admin/migrate-remaining-photos
 *   Body: { limit?: number, dryRun?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { downloadAndUploadPhotosToSupabase } from '@/lib/google/places';
import type { GooglePlacePhoto } from '@/types/place';

interface PlaceToMigrate {
  id: string;
  google_place_id: string;
  name: string;
  category: string;
  province: string;
  photos: string[];
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar que el usuario es admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Se requiere rol admin' },
        { status: 403 }
      );
    }

    // Parsear parámetros
    const body = await request.json().catch(() => ({}));
    const { limit = 100, dryRun = false } = body;

    console.log('🔍 Buscando lugares con fotos pendientes de migración...');

    // Obtener lugares sin photo_urls pero con photos
    const { data: places, error: queryError } = await supabase
      .from('places')
      .select('id, google_place_id, name, category, province, photos, photo_urls')
      .eq('published', true)
      .not('photos', 'is', null)
      .is('photo_urls', null)
      .order('review_count', { ascending: false })
      .order('rating', { ascending: false })
      .limit(limit);

    if (queryError) {
      console.error('❌ Error al obtener lugares:', queryError);
      return NextResponse.json(
        { success: false, error: queryError.message },
        { status: 500 }
      );
    }

    if (!places || places.length === 0) {
      return NextResponse.json({
        success: true,
        message: '✅ No hay lugares pendientes de migración',
        migrated: 0,
        errors: 0,
      });
    }

    // Filtrar lugares que realmente necesitan migración
    const placesToMigrate = places.filter(place => {
      const hasPhotos = place.photos && Array.isArray(place.photos) && place.photos.length > 0;
      const hasSupabasePhotos = place.photo_urls && Array.isArray(place.photo_urls) && place.photo_urls.length > 0;
      return hasPhotos && !hasSupabasePhotos;
    }) as PlaceToMigrate[];

    console.log(`✅ Encontrados ${placesToMigrate.length} lugares para migrar`);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: `[DRY RUN] Se encontraron ${placesToMigrate.length} lugares para migrar`,
        places: placesToMigrate.map(p => ({
          name: p.name,
          category: p.category,
          province: p.province,
          photosCount: p.photos.length,
        })),
        dryRun: true,
      });
    }

    // Migrar cada lugar
    let successCount = 0;
    let errorCount = 0;
    const errors: { name: string; error: string }[] = [];

    for (let i = 0; i < placesToMigrate.length; i++) {
      const place = placesToMigrate[i];
      
      try {
        console.log(`\n[${i + 1}/${placesToMigrate.length}] 📸 Migrando: ${place.name}`);

        // Convertir photo_references a formato GooglePlacePhoto
        const googlePhotos: GooglePlacePhoto[] = place.photos.map(photoRef => ({
          photo_reference: photoRef,
          height: 1200,
          width: 1200,
          html_attributions: []
        }));

        // Descargar y subir fotos a Supabase
        const { supabaseUrls } = await downloadAndUploadPhotosToSupabase(
          googlePhotos,
          place.name,
          place.google_place_id,
          5 // Máximo 5 fotos
        );

        if (supabaseUrls.length === 0) {
          console.log(`   ⚠️ No se pudieron migrar fotos para ${place.name}`);
          errorCount++;
          errors.push({ name: place.name, error: 'No se pudieron descargar las fotos' });
          continue;
        }

        console.log(`   ✅ Subidas ${supabaseUrls.length} fotos para ${place.name}`);

        // Actualizar registro en la base de datos
        const { error: updateError } = await supabase
          .from('places')
          .update({
            photo_urls: supabaseUrls,
            updated_at: new Date().toISOString()
          })
          .eq('id', place.id);

        if (updateError) {
          console.error(`   ❌ Error actualizando BD para ${place.name}:`, updateError);
          errorCount++;
          errors.push({ name: place.name, error: updateError.message });
          continue;
        }

        successCount++;
        console.log(`   ✅ ${place.name} migrado correctamente`);

        // Pausa de 500ms entre migraciones para no saturar
        if (i < placesToMigrate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error: any) {
        console.error(`   ❌ Error migrando ${place.name}:`, error);
        errorCount++;
        errors.push({ name: place.name, error: error.message || 'Error desconocido' });
      }
    }

    // Calcular ahorro
    const totalPhotos = successCount * 5; // Aprox 5 fotos por lugar
    const monthlySavings = totalPhotos * 100 * 0.007; // 100 vistas/mes, $0.007 por foto
    const annualSavings = monthlySavings * 12;

    return NextResponse.json({
      success: true,
      message: `✅ Migración completada`,
      stats: {
        total: placesToMigrate.length,
        migrated: successCount,
        errors: errorCount,
        savings: {
          monthly: `$${monthlySavings.toFixed(2)}`,
          annual: `$${annualSavings.toFixed(2)}`,
        },
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('❌ Error en migración:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error del servidor',
      },
      { status: 500 }
    );
  }
}

// GET para verificar cuántos lugares faltan
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Contar lugares pendientes
    const { count, error } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('published', true)
      .not('photos', 'is', null)
      .is('photo_urls', null);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      remaining: count || 0,
      message: count === 0 
        ? '✅ Todos los lugares tienen fotos en Supabase'
        : `⚠️ Quedan ${count} lugares pendientes de migración`,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

