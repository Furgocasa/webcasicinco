/**
 * Agente revisor del blog — audita todos los posts FULL_HTML y corrige los que fallen.
 *
 * Uso:
 *   npx tsx scripts/review-blog-posts.ts              # solo auditar (dry-run)
 *   npx tsx scripts/review-blog-posts.ts --fix        # corregir posts no aprobados
 *   npx tsx scripts/review-blog-posts.ts --fix --slug=mejores-bares-madrid
 *   npx tsx scripts/review-blog-posts.ts --fix --limit=5
 */
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';
import {
  regenerateBlogArticleUntilApproved,
  reviewExistingBlogArticle,
  generateBlogMetadata,
  type BlogVerifiedPlace,
} from '../lib/ai/openai';
import {
  BLOG_FULL_HTML_MARKER,
  extractBlogHtml,
  isBlogFullHtml,
} from '../types/blog';
import { applyBlogLocationFilter } from '../lib/utils/blog-places';
import { comparePlacesByTier } from '../lib/utils/tier-calculator';

const FIX = process.argv.includes('--fix');
const slugArg = process.argv.find((a) => a.startsWith('--slug='));
const slugFilter = slugArg ? slugArg.split('=')[1] : null;
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

async function fetchVerifiedPlaces(
  sb: ReturnType<typeof createClient>,
  category: string,
  location: string,
  locationType: string
): Promise<BlogVerifiedPlace[]> {
  let q = sb
    .from('places')
    .select('name, rating, review_count, city, province, slug, category, address, ai_description')
    .eq('category', category)
    .eq('published', true)
    .gte('rating', 4.7);

  q = applyBlogLocationFilter(q, {
    location,
    location_type: locationType as 'city' | 'province' | 'community',
    category: category as 'restaurante' | 'bar' | 'hotel',
  });

  const { data } = await q;
  return (data || [])
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

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = sb.from('blog_posts').select('*').order('created_at', { ascending: true });
  if (slugFilter) query = query.eq('slug', slugFilter);

  const { data: posts, error } = await query;
  if (error) throw error;

  const fullHtmlPosts = (posts || []).filter((p) => isBlogFullHtml(p.intro_text));
  const toProcess = fullHtmlPosts.slice(0, limit);

  console.log(`\n🔍 Agente revisor blog — ${toProcess.length} posts FULL_HTML`);
  console.log(`Modo: ${FIX ? 'CORREGIR (--fix)' : 'SOLO AUDITAR (dry-run)'}\n`);

  let approved = 0;
  let needsFix = 0;
  let fixed = 0;
  let errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const post = toProcess[i];
    console.log(`\n[${i + 1}/${toProcess.length}] ${post.slug}`);

    try {
      const verifiedPlaces = await fetchVerifiedPlaces(
        sb,
        post.category,
        post.location,
        post.location_type
      );

      const yearMatch = post.title.match(/\((20\d{2})\)/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

      const articleInput = {
        title: post.title,
        category: post.category as 'restaurante' | 'bar' | 'hotel',
        location: post.location,
        locationType: post.location_type as 'city' | 'province' | 'community',
        year,
        verifiedPlaces,
        extraContext: `Revisión editorial Casi Cinco. Evitar duplicar cards Top 10 con h2/h3 por lugar.`,
      };

      const html = extractBlogHtml(post.intro_text);
      const { review, audit } = await reviewExistingBlogArticle(html, articleInput);
      const isApproved = review.approved && audit.passed && review.score >= 88;

      console.log(
        `   📊 ${review.score}/100 (SEO ${review.seoScore}, UX ${review.uxScore}) · ${audit.wordCount} palabras · place headings: ${audit.placeHeadingCount}`
      );
      console.log(`   ${isApproved ? '✅ Aprobado' : '⚠️  Requiere mejoras'}: ${review.summary.slice(0, 120)}`);

      if (isApproved) {
        approved++;
        continue;
      }

      needsFix++;

      if (!FIX) {
        review.issues.slice(0, 3).forEach((iss) => {
          console.log(`      - [${iss.severity}] ${iss.message}`);
        });
        continue;
      }

      console.log('   🔧 Corrigiendo con agente revisor...');
      const result = await regenerateBlogArticleUntilApproved(articleInput, html);
      const markedHtml = `${BLOG_FULL_HTML_MARKER}\n${result.html}`;
      const metadata = await generateBlogMetadata(post.title, result.html);

      const { error: updateError } = await sb
        .from('blog_posts')
        .update({
          intro_text: markedHtml,
          meta_description: metadata.meta_description || post.meta_description,
          keywords: metadata.meta_keywords?.length ? metadata.meta_keywords : post.keywords,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateError) throw updateError;

      const nowApproved = result.review.approved && result.auditPassed;
      console.log(
        `   ${nowApproved ? '✅' : '⚠️'} Corregido (${result.iterations} pasadas) → ${result.review.score}/100`
      );
      fixed++;

      // Pausa entre posts (rate limits OpenAI)
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err: unknown) {
      errors++;
      console.error(`   ❌ Error: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log('📊 RESUMEN REVISOR');
  console.log('════════════════════════════════════════');
  console.log(`✅ Aprobados: ${approved}`);
  console.log(`⚠️  Necesitan mejoras: ${needsFix}`);
  if (FIX) console.log(`🔧 Corregidos: ${fixed}`);
  console.log(`❌ Errores: ${errors}`);
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err);
  process.exit(1);
});
