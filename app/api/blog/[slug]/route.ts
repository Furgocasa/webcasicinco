import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/blog/[slug]
 * 
 * Obtiene un post específico por slug + lugares filtrados
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Obtener el post (solo si está publicado Y la fecha ya pasó)
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .lte('created_at', new Date().toISOString())
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Incrementar vistas (sin esperar respuesta)
    supabase.rpc('increment_blog_post_views', { post_slug: slug }).then();

    // Obtener lugares filtrados según category + location
    let placesQuery = supabase
      .from('places')
      .select('*')
      .eq('category', post.category)
      .eq('published', true)
      .gte('rating', 4.7)
      .order('rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(10);

    // Filtrar por ubicación
    if (post.location_type === 'city') {
      placesQuery = placesQuery.eq('city', post.location);
    } else if (post.location_type === 'province') {
      placesQuery = placesQuery.eq('province', post.location);
    } else if (post.location_type === 'community') {
      placesQuery = placesQuery.eq('community', post.location);
    }

    const { data: places, error: placesError } = await placesQuery;

    if (placesError) {
      console.error('Error fetching places:', placesError);
    }

    // Obtener foto del primer lugar para la imagen destacada
    let photoReference = null;
    let photoIsUrl = false;
    
    if (places && places.length > 0) {
      const firstPlace = places[0];
      // SOLO usar photo_urls de Supabase Storage (GRATIS)
      if (firstPlace.photo_urls && firstPlace.photo_urls.length > 0) {
        photoReference = firstPlace.photo_urls[0]; // URL completa de Supabase
        photoIsUrl = true;
      }
      // ❌ NO hacer fallback a photos (photo_reference de Google)
      // Si no tiene photo_urls, mejor mostrar placeholder que gastar €€€ en Google API
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        places: places || [],
        first_place_photo: photoReference,
        first_place_photo_is_url: photoIsUrl
      }
    });

  } catch (error: any) {
    console.error('Error in blog slug API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

