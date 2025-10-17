import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    return NextResponse.json({ success: true, posts });

  } catch (error: any) {
    console.error('Error in blog API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

