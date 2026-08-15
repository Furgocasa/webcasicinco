import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  generateBlogIntro,
  generateBlogArticle,
  generateBlogArticleWithReview,
  generateBlogMetadata,
  reviewExistingBlogArticle,
  regenerateBlogArticleUntilApproved,
  type BlogVerifiedPlace,
} from '@/lib/ai/openai';
import { BLOG_FULL_HTML_MARKER, extractBlogHtml, isBlogFullHtml } from '@/types/blog';
import { comparePlacesByTier } from '@/lib/utils/tier-calculator';
import { applyBlogLocationFilter } from '@/lib/utils/blog-places';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type GenerateMode = 'intro' | 'article' | 'metadata' | 'review' | 'regenerate';

/**
 * POST /api/admin/blog/generate-intro
 * Genera contenido de blog con IA
 * - mode: 'intro' → intro corta en texto plano (legacy)
 * - mode: 'article' → artículo HTML completo SEO (borrador + refine + agente revisor)
 * - mode: 'review' → revisar HTML existente (SEO/UX) sin regenerar
 * - mode: 'regenerate' → revisar y corregir/regenerar hasta aprobación del revisor
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
      withReview = true,
    } = body as {
      mode?: GenerateMode;
      title?: string;
      category?: 'restaurante' | 'bar' | 'hotel';
      location?: string;
      locationType?: 'city' | 'province' | 'community';
      extraContext?: string;
      htmlContent?: string;
      withReview?: boolean;
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

    // Helper: top 10 verificados con filtro unificado (comunidades, alias, Costa del Sol…)
    async function fetchVerifiedPlacesForPost(
      adminSupabase: SupabaseClient<any, any, any>,
      postCategory: typeof category,
      postLocation: typeof location,
      postLocationType: typeof locationType
    ): Promise<BlogVerifiedPlace[]> {
      let placesQuery = adminSupabase
        .from('places')
        .select('name, rating, review_count, city, province, slug, category, address, ai_description')
        .eq('category', postCategory!)
        .eq('published', true)
        .gte('rating', 4.7);

      placesQuery = applyBlogLocationFilter(placesQuery, {
        location: postLocation!,
        location_type: postLocationType || 'city',
        category: postCategory!,
      });

      const { data: places } = await placesQuery;
      return (places || [])
        .sort(comparePlacesByTier)
        .slice(0, 10)
        .map((p) => ({
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
    }

    function buildArticleInput(
      postTitle: string,
      verifiedPlaces: BlogVerifiedPlace[]
    ) {
      const yearMatch = postTitle.match(/\((20\d{2})\)/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
      return {
        title: postTitle,
        category: category!,
        location: location!,
        locationType: locationType || 'city',
        year,
        verifiedPlaces,
        extraContext,
      };
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Revisar HTML existente (sin regenerar)
    if (mode === 'review') {
      if (!title || !htmlContent) {
        return NextResponse.json(
          { error: 'Se requiere title y htmlContent para revisar' },
          { status: 400 }
        );
      }

      const verifiedPlaces = await fetchVerifiedPlacesForPost(
        adminSupabase,
        category,
        location,
        locationType
      );
      const articleInput = buildArticleInput(title, verifiedPlaces);
      const html = extractBlogHtml(htmlContent.startsWith(BLOG_FULL_HTML_MARKER) ? htmlContent : htmlContent);
      const { review, audit } = await reviewExistingBlogArticle(html, articleInput);

      return NextResponse.json({
        success: true,
        review,
        audit,
        approved: review.approved && audit.passed,
      });
    }

    // Regenerar/corregir hasta aprobación del revisor
    if (mode === 'regenerate') {
      if (!title) {
        return NextResponse.json({ error: 'Se requiere title' }, { status: 400 });
      }

      const verifiedPlaces = await fetchVerifiedPlacesForPost(
        adminSupabase,
        category,
        location,
        locationType
      );
      const articleInput = buildArticleInput(title, verifiedPlaces);
      const existingHtml = htmlContent
        ? extractBlogHtml(
            htmlContent.startsWith(BLOG_FULL_HTML_MARKER) ? htmlContent : htmlContent
          )
        : undefined;

      const result = await regenerateBlogArticleUntilApproved(articleInput, existingHtml);
      const markedHtml = `${BLOG_FULL_HTML_MARKER}\n${result.html}`;

      return NextResponse.json({
        success: true,
        html: markedHtml,
        review: result.review,
        auditPassed: result.auditPassed,
        iterations: result.iterations,
        wordCount: result.wordCount,
        approved: result.review.approved && result.auditPassed,
        placesCount: verifiedPlaces.length,
      });
    }

    // Artículo HTML completo
    if (mode === 'article') {
      if (!title) {
        return NextResponse.json({ error: 'Se requiere title para generar artículo' }, { status: 400 });
      }

      const verifiedPlaces = await fetchVerifiedPlacesForPost(
        adminSupabase,
        category,
        location,
        locationType
      );

      const articleInput = buildArticleInput(title, verifiedPlaces);

      if (withReview) {
        const result = await generateBlogArticleWithReview(articleInput);
        const markedHtml = `${BLOG_FULL_HTML_MARKER}\n${result.html}`;

        return NextResponse.json({
          success: true,
          html: markedHtml,
          review: result.review,
          auditPassed: result.auditPassed,
          iterations: result.iterations,
          wordCount: result.wordCount,
          approved: result.review.approved && result.auditPassed,
          placesCount: verifiedPlaces.length,
        });
      }

      const html = await generateBlogArticle(articleInput);
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
