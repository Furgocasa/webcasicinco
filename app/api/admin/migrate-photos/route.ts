import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import axios from 'axios';

export const maxDuration = 300; // 5 minutos máximo por request

/**
 * POST /api/admin/migrate-photos
 * Migra fotos de lugares desde Google Photos API a Supabase Storage
 * CRÍTICO para ahorrar costos
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar que el usuario sea admin
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
        { success: false, error: 'Solo administradores pueden migrar fotos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { batchSize = 50, offset = 0 } = body;

    // Crear cliente admin para Supabase
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener lugares que NO tienen photo_urls pero SÍ tienen photos
    const { data: places, error: placesError } = await supabaseAdmin
      .from('places')
      .select('id, google_place_id, name, photos')
      .is('photo_urls', null) // Solo los que no tienen photo_urls
      .not('photos', 'is', null) // Que sí tengan photos
      .range(offset, offset + batchSize - 1);

    if (placesError) {
      console.error('Error obteniendo lugares:', placesError);
      return NextResponse.json({
        success: false,
        error: placesError.message
      }, { status: 500 });
    }

    if (!places || places.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay más lugares para migrar',
        processed: 0,
        successful: 0,
        failed: 0,
      });
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ placeId: string; error: string }>,
    };

    // Procesar cada lugar
    for (const place of places) {
      results.processed++;

      try {
        const photoReferences = place.photos as string[];
        if (!photoReferences || photoReferences.length === 0) {
          continue;
        }

        const supabaseUrls: string[] = [];

        // Descargar y subir cada foto
        for (let i = 0; i < Math.min(photoReferences.length, 5); i++) {
          try {
            const photoRef = photoReferences[i];

            // 1. Descargar desde Google
            const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoRef}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
            
            const response = await axios.get(googleUrl, {
              responseType: 'arraybuffer',
              timeout: 15000,
            });

            // 2. Subir a Supabase Storage
            const fileName = `${place.google_place_id}_${i}.jpg`;
            const filePath = `places/${place.google_place_id}/${fileName}`;

            const { error: uploadError } = await supabaseAdmin.storage
              .from('place-photos')
              .upload(filePath, response.data, {
                contentType: 'image/jpeg',
                cacheControl: '31536000', // 1 año
                upsert: true,
              });

            if (uploadError) {
              console.error(`Error subiendo foto ${i} de ${place.name}:`, uploadError);
              continue;
            }

            // 3. Obtener URL pública
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('place-photos')
              .getPublicUrl(filePath);

            supabaseUrls.push(publicUrl);

            // Pausa para no saturar
            if (i < photoReferences.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (photoError: any) {
            console.error(`Error procesando foto ${i} de ${place.name}:`, photoError.message);
            // Continuar con siguiente foto
          }
        }

        // 4. Actualizar BD con photo_urls
        if (supabaseUrls.length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from('places')
            .update({ photo_urls: supabaseUrls })
            .eq('id', place.id);

          if (updateError) {
            results.failed++;
            results.errors.push({ placeId: place.id, error: updateError.message });
          } else {
            results.successful++;
            console.log(`✅ ${place.name}: ${supabaseUrls.length} fotos migradas`);
          }
        } else {
          results.failed++;
          results.errors.push({ placeId: place.id, error: 'No se pudo descargar ninguna foto' });
        }

      } catch (error: any) {
        results.failed++;
        results.errors.push({ placeId: place.id, error: error.message });
        console.error(`Error migrando ${place.name}:`, error);
      }

      // Pausa entre lugares para no saturar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      success: true,
      message: `Migración completada: ${results.successful}/${results.processed} lugares`,
      ...results,
    });

  } catch (error: any) {
    console.error('Error en migración de fotos:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/migrate-photos
 * Obtiene estadísticas de migración
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    // Crear cliente admin
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Estadísticas
    const { count: totalPlaces } = await supabaseAdmin
      .from('places')
      .select('*', { count: 'exact', head: true });

    const { count: withPhotoUrls } = await supabaseAdmin
      .from('places')
      .select('*', { count: 'exact', head: true })
      .not('photo_urls', 'is', null);

    const { count: withPhotos } = await supabaseAdmin
      .from('places')
      .select('*', { count: 'exact', head: true })
      .not('photos', 'is', null);

    const { count: needsMigration } = await supabaseAdmin
      .from('places')
      .select('*', { count: 'exact', head: true })
      .is('photo_urls', null)
      .not('photos', 'is', null);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalPlaces || 0,
        withPhotoUrls: withPhotoUrls || 0,
        withPhotos: withPhotos || 0,
        needsMigration: needsMigration || 0,
        percentageMigrated: totalPlaces ? Math.round((withPhotoUrls || 0) / totalPlaces * 100) : 0,
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

