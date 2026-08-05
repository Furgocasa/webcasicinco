import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
  generateBlogIntro,
  generateBlogArticle,
  generateBlogMetadata,
  type BlogVerifiedPlace,
} from '@/lib/ai/openai';
import { BLOG_FULL_HTML_MARKER } from '@/types/blog';
import { comparePlacesByTier } from '@/lib/utils/tier-calculator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type GenerateMode = 'intro' | 'article' | 'metadata';

/**
 * POST /api/admin/blog/generate-intro
 * Genera contenido de blog con IA
 * - mode: 'intro' → intro corta en texto plano (legacy)
 * - mode: 'article' → artículo HTML completo SEO (2 pasadas)
 * - mode: 'metadata' → metadatos SEO a partir del HTML existente
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      mode = 'intro',
      title,
      category,
      location,
      locationType,
      extraContext,
      htmlContent,
    } = body as {
      mode?: GenerateMode;
      title?: string;
      category?: 'restaurante' | 'bar' | 'hotel';
      location?: string;
      locationType?: 'city' | 'province' | 'community';
      extraContext?: string;
      htmlContent?: string;
    };

    // Metadatos SEO: solo requiere título + HTML
    if (mode === 'metadata') {
      if (!title || !htmlContent) {
        return NextResponse.json(
          { error: 'Se requiere title y htmlContent para generar metadatos' },
          { status: 400 }
        );
      }

      const metadata = await generateBlogMetadata(title, htmlContent);
      return NextResponse.json({ success: true, metadata });
    }

    if (!category || !location) {
      return NextResponse.json(
        { error: 'Se requiere category y location' },
        { status: 400 }
      );
    }

    // Intro legacy (texto plano)
    if (mode === 'intro') {
      const intro = await generateBlogIntro({ category, location, locationType: locationType || 'city' });
      return NextResponse.json({ success: true, intro });
    }

    // Artículo HTML completo
    if (mode === 'article') {
      if (!title) {
        return NextResponse.json({ error: 'Se requiere title para generar artículo' }, { status: 400 });
      }

      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Obtener top 10 lugares verificados de la BD
      const { data: places } = await adminSupabase
        .from('places')
        .select('name, rating, review_count, city, province, slug, category, address, ai_description')
        .eq('category', category)
        .eq('published', true)
        .or(`city.eq.${location},province.eq.${location}`)
        .gte('rating', 4.7);

      const sortedPlaces = (places || [])
        .sort(comparePlacesByTier)
        .slice(0, 10);

      const verifiedPlaces: BlogVerifiedPlace[] = sortedPlaces.map((p) => ({
        name: p.name,
        rating: p.rating,
        review_count: p.review_count,
        city: p.city,
        province: p.province,
        slug: p.slug,
        category: p.category,
        address: p.address,
        ai_description: p.ai_description,
      }));

      const yearMatch = title.match(/\((20\d{2})\)/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

      const html = await generateBlogArticle({
        title,
        category,
        location,
        locationType: locationType || 'city',
        year,
        verifiedPlaces,
        extraContext,
      });

      // Marcador para distinguir artículo HTML completo de intro legacy
      const markedHtml = `${BLOG_FULL_HTML_MARKER}\n${html}`;

      return NextResponse.json({
        success: true,
        html: markedHtml,
        placesCount: verifiedPlaces.length,
      });
    }

    return NextResponse.json({ error: 'Modo no válido' }, { status: 400 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error generating blog content:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
