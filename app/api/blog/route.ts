import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { comparePlacesByTier } from '@/lib/utils/tier-calculator';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/blog
 * 
 * Obtiene lista de posts de blog publicados
 * Query params:
 * - category: filtrar por categoría
 * - limit: número de posts (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .lte('created_at', new Date().toISOString()) // Solo mostrar si la fecha ya pasó
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enriquecer cada post con la foto del primer lugar de su Top 10
    const enrichedPosts = await Promise.all(
      (posts || []).map(async (post) => {
        // Obtener lugares para este post
        let placesQuery = supabase
          .from('places')
          .select('photos, photo_urls, rating, review_count')
          .eq('category', post.category)
          .eq('published', true)
          .gte('rating', 4.7);

        // Filtrar por ubicación
        if (post.location_type === 'city') {
          placesQuery = placesQuery.eq('city', post.location);
        } else if (post.location_type === 'province') {
          placesQuery = placesQuery.eq('province', post.location);
        } else if (post.location_type === 'community') {
          placesQuery = placesQuery.eq('community', post.location);
        }

        const { data: places } = await placesQuery;
        
        // 🎯 Ordenar por tier (diamante primero) y obtener el primero
        const sortedPlaces = (places || []).sort(comparePlacesByTier);
        const firstPlace = sortedPlaces.length > 0 ? sortedPlaces[0] : null;

        // Obtener foto del primer lugar (SOLO Supabase Storage)
        let photoReference = null;
        if (firstPlace) {
          // SOLO usar photo_urls de Supabase Storage (GRATIS)
          if (firstPlace.photo_urls && firstPlace.photo_urls.length > 0) {
            photoReference = firstPlace.photo_urls[0]; // URL completa de Supabase
          }
          // ❌ NO hacer fallback a photos (photo_reference de Google)
          // Si no tiene photo_urls, mejor mostrar placeholder que gastar €€€ en Google API
        }

        return {
          ...post,
          first_place_photo: photoReference,
          first_place_photo_is_url: !!photoReference // Si tiene foto, siempre es URL de Supabase
        };
      })
    );

    return NextResponse.json({ success: true, posts: enrichedPosts });

  } catch (error: any) {
    console.error('Error in blog API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

