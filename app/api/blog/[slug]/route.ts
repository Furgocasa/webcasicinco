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

    // Obtener el post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
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

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        places: places || []
      }
    });

  } catch (error: any) {
    console.error('Error in blog slug API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

