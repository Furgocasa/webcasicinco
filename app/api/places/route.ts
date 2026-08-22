import { NextRequest, NextResponse } from 'next/server';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { getNumbersFromReviewsRange } from '@/types/filters';
import type { ReviewsRange, QualityTier } from '@/types/filters';

export const dynamic = 'force-dynamic';

// Campos mínimos para el mapa: solo lo que necesitan pines y cards de la lista.
// Prohibido añadir descripciones largas o galerías completas.
const MAP_SELECT =
  'id,slug,name,category,rating,review_count,latitude,longitude,city,province,region,google_maps_url,photo_urls';

/**
 * Modo mapa: devuelve TODOS los lugares publicados en una sola respuesta ligera.
 * - Cliente anónimo sin cookies → respuesta cacheable en CDN (s-maxage=30).
 * - photo_urls recortado a 1 foto (la card solo muestra una).
 */
async function getMapPayload() {
  const supabase = createPublicClient();
  const batchSize = 1000;
  let allData: any[] = [];
  let currentOffset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('places')
      .select(MAP_SELECT)
      .eq('published', true)
      .order('review_count', { ascending: false })
      .order('rating', { ascending: false })
      .range(currentOffset, currentOffset + batchSize - 1);

    if (error) {
      console.error('Error cargando lugares (modo mapa):', error);
      return NextResponse.json(
        { error: 'Error al cargar los lugares' },
        { status: 500 }
      );
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      currentOffset += batchSize;
      if (data.length < batchSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  // Recortar galería: solo la primera foto
  const places = allData.map((p) => ({
    ...p,
    photo_urls: Array.isArray(p.photo_urls) && p.photo_urls.length > 0 ? [p.photo_urls[0]] : null,
  }));

  return NextResponse.json(
    { success: true, places, total: places.length },
    {
      headers: {
        // Cache CDN corto + revalidación en background
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 🗺️ Modo mapa: payload ligero completo y cacheado (sin filtros: se filtran en cliente)
    if (searchParams.get('fields') === 'map') {
      return getMapPayload();
    }

    const supabase = await createClient();

    // Parámetros básicos
    const category = searchParams.get('category');
    const province = searchParams.get('province');
    const community = searchParams.get('community');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    
    // Rating
    const minRating = parseFloat(searchParams.get('minRating') || '4.7');
    const maxRating = parseFloat(searchParams.get('maxRating') || '5.0');
    
    // Número de reseñas (FILTRO CRÍTICO)
    const reviewsRange = searchParams.get('reviewsRange') as ReviewsRange | null;
    const minReviews = searchParams.get('minReviews');
    const maxReviews = searchParams.get('maxReviews');
    
    // Precio
    const priceLevel = searchParams.get('priceLevel');
    
    // Quality Tier
    const qualityTier = searchParams.get('qualityTier'); // Puede ser: "diamond,platinum,gold"
    
    // ✅ OPTIMIZACIÓN: Permitir solicitar solo campos ligeros (reduce payload 80%)
    const fields = searchParams.get('fields'); // 'light' = solo campos esenciales
    
    // Paginación - 🚀 NUNCA limitar lugares, siempre cargar todos
    const limit = parseInt(searchParams.get('limit') || '5000');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Determinar qué campos seleccionar
    const selectQuery = fields === 'light' 
      ? 'id,slug,name,category,subcategory,rating,review_count,latitude,longitude,city,province,region,address,google_maps_url,photo_urls'
      : '*';

    // SOLUCIÓN: Cargar TODOS los lugares en lotes si limit >= 5000
    if (limit >= 5000) {
      let allData: any[] = [];
      let totalCount = 0;
      let currentOffset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        // Construir query para este lote
        let query = supabase
          .from('places')
          .select(selectQuery, { count: 'exact' })
          .eq('published', true);

        // Filtros básicos
        if (category) {
          query = query.eq('category', category);
        }

        if (province) {
          query = query.eq('province', province);
        }

        if (community) {
          query = query.eq('community', community);
        }

        if (city) {
          query = query.ilike('city', `%${city}%`);
        }

        // Filtro de rating
        query = query
          .gte('rating', minRating)
          .lte('rating', maxRating);

        // Filtro de número de reseñas
        if (reviewsRange) {
          const { min, max } = getNumbersFromReviewsRange(reviewsRange);
          query = query.gte('review_count', min);
          if (max !== null) {
            query = query.lte('review_count', max);
          }
        } else {
          if (minReviews) {
            query = query.gte('review_count', parseInt(minReviews));
          }
          if (maxReviews) {
            query = query.lte('review_count', parseInt(maxReviews));
          }
        }

        // Filtro de precio
        if (priceLevel) {
          query = query.eq('price_level', parseInt(priceLevel));
        }

        // Búsqueda por texto
        if (search) {
          query = query.or(
            `name.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`
          );
        }

        // Ordenar y paginar este lote
        query = query
          .order('review_count', { ascending: false })
          .order('rating', { ascending: false })
          .range(currentOffset, currentOffset + batchSize - 1);

        const { data, error, count } = await query;

        if (error) {
          console.error('Error cargando lugares:', error);
          return NextResponse.json(
            { error: 'Error al cargar los lugares' },
            { status: 500 }
          );
        }

        if (currentOffset === 0) {
          totalCount = count || 0;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          currentOffset += batchSize;
          
          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ API Pública - Cargados ${allData.length} lugares publicados`);

      return NextResponse.json({
        success: true,
        places: allData,
        total: totalCount,
        limit,
        offset: 0,
        filters: {
          category,
          province,
          community,
          city,
          minRating,
          maxRating,
          reviewsRange,
          minReviews,
          maxReviews,
          priceLevel,
          qualityTier,
          search
        }
      });
    }

    // Para límites menores, usar el método normal
    let query = supabase
      .from('places')
      .select(selectQuery, { count: 'exact' })
      .eq('published', true);

    // Aplicar filtros...
    if (category) query = query.eq('category', category);
    if (province) query = query.eq('province', province);
    if (community) query = query.eq('community', community);
    if (city) query = query.ilike('city', `%${city}%`);
    
    query = query.gte('rating', minRating).lte('rating', maxRating);
    
    if (reviewsRange) {
      const { min, max } = getNumbersFromReviewsRange(reviewsRange);
      query = query.gte('review_count', min);
      if (max !== null) query = query.lte('review_count', max);
    }
    
    if (priceLevel) query = query.eq('price_level', parseInt(priceLevel));
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`);
    
    query = query
      .order('review_count', { ascending: false })
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error cargando lugares:', error);
      return NextResponse.json(
        { error: 'Error al cargar los lugares' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      places: data || [],
      total: count || 0,
      limit,
      offset,
      filters: {
        category,
        province,
        community,
        city,
        minRating,
        maxRating,
        reviewsRange,
        minReviews,
        maxReviews,
        priceLevel,
        qualityTier,
        search
      }
    });

  } catch (error: any) {
    console.error('Error en API de lugares:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
