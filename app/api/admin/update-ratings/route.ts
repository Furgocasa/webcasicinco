import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos max
export const fetchCache = 'force-no-store';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

/**
 * Obtiene solo rating y reseñas de un lugar (campos básicos)
 * Coste: $0.005 (vs $0.017 con todos los campos)
 */
async function getPlaceBasicInfo(placeId: string) {
  try {
    const response = await axios.get(`${PLACES_API_BASE}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'place_id,name,rating,user_ratings_total', // Solo campos básicos
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google API error: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error) {
    console.error('Error getting place basic info:', error);
    throw error;
  }
}

/**
 * POST - Actualizar ratings de lugares
 * Body: { 
 *   mode: 'all' | 'critical' | 'old',
 *   batchSize?: number,
 *   offset?: number 
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const mode = body.mode || 'critical'; // 'all' | 'critical' | 'old'
    const batchSize = body.batchSize || 20; // Lotes más pequeños para evitar timeout
    const offset = body.offset || 0;

    const adminSupabase = createAdminClient();

    // Construir query según modo
    let query = adminSupabase
      .from('places')
      .select('id, google_place_id, name, rating, review_count, updated_at');

    if (mode === 'critical') {
      // Solo lugares cerca del límite (4.7-4.85)
      query = query
        .gte('rating', 4.7)
        .lte('rating', 4.85);
    } else if (mode === 'old') {
      // Lugares no actualizados en >3 meses
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      query = query.lt('updated_at', threeMonthsAgo.toISOString());
    }
    // mode === 'all' no filtra

    const { data: places, error: fetchError } = await query
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!places || places.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay lugares para actualizar',
        updated: 0,
        deleted: 0,
        failed: 0,
        total: 0
      });
    }

    let updated = 0;
    let deleted = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const place of places) {
      try {
        // Obtener info básica de Google (solo $0.005)
        const googleData = await getPlaceBasicInfo(place.google_place_id);

        const newRating = googleData.rating;
        const newReviewCount = googleData.user_ratings_total;

        // Verificar si bajó del mínimo
        if (newRating < 4.7) {
          // Marcar como no publicado en lugar de borrar (por seguridad)
          const { error: updateError } = await adminSupabase
            .from('places')
            .update({ 
              published: false,
              rating: newRating,
              review_count: newReviewCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', place.id);

          if (updateError) {
            errors.push({ place: place.name, error: updateError.message });
            failed++;
          } else {
            deleted++;
            console.log(`❌ ${place.name}: Rating bajó a ${newRating} (despublicado)`);
          }
        } else {
          // Actualizar rating
          const { error: updateError } = await adminSupabase
            .from('places')
            .update({ 
              rating: newRating,
              review_count: newReviewCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', place.id);

          if (updateError) {
            errors.push({ place: place.name, error: updateError.message });
            failed++;
          } else {
            updated++;
            const change = newRating - place.rating;
            const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
            console.log(`✅ ${place.name}: ${place.rating} ${arrow} ${newRating}`);
          }
        }

        // Pausa reducida para no saturar API (50ms en vez de 100ms)
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error: any) {
        console.error(`Error procesando ${place.name}:`, error);
        failed++;
        errors.push({ place: place.name, error: error.message });
      }
    }

    // Calcular coste
    const cost = places.length * 0.005;

    return NextResponse.json({
      success: true,
      updated,
      deleted, // Despublicados por rating bajo
      failed,
      total: places.length,
      cost: `$${cost.toFixed(2)}`,
      offset,
      nextOffset: offset + batchSize,
      hasMore: places.length === batchSize,
      errors: errors.slice(0, 5)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - Estadísticas de actualización
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Contar lugares
    const { count: total } = await adminSupabase
      .from('places')
      .select('*', { count: 'exact', head: true });

    const { count: critical } = await adminSupabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .gte('rating', 4.7)
      .lte('rating', 4.85);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { count: old } = await adminSupabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', threeMonthsAgo.toISOString());

    return NextResponse.json({
      success: true,
      stats: {
        total: total || 0,
        critical: critical || 0, // Cerca del límite
        old: old || 0, // >3 meses sin actualizar
        estimatedCost: {
          all: ((total || 0) * 0.005).toFixed(2),
          critical: ((critical || 0) * 0.005).toFixed(2),
          old: ((old || 0) * 0.005).toFixed(2),
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

