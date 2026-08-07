/**
 * Script para generar posts de blog con IA (SEO HTML completo)
 *
 * Uso:
 *   npx tsx scripts/generate-blog-posts.ts --calendar     → 31 posts ene–ago 2026
 *   npx tsx scripts/generate-blog-posts.ts --next5        → 22 posts ago 2026–ene 2027
 *   npx tsx scripts/generate-blog-posts.ts --next5 --from=8
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// Proxy SSL corporativo / antivirus: Node no confía en el certificado intermedio
// y falla con UNABLE_TO_VERIFY_LEAF_SIGNATURE. Necesario para scripts locales.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';
import {
  generateBlogArticle,
  generateBlogMetadata,
} from '../lib/ai/openai';
import { BLOG_FULL_HTML_MARKER, buildBlogPostTitle } from '../types/blog';
import { comparePlacesByTier } from '../lib/utils/tier-calculator';
import { applyBlogLocationFilter } from '../lib/utils/blog-places';
import type { BlogVerifiedPlace } from '../lib/ai/openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YEAR = 2026;

type Category = 'restaurante' | 'bar' | 'hotel';

interface CalendarPost {
  category: Category;
  location: string;
  locationType: 'city' | 'province' | 'community';
  publishAt: string; // YYYY-MM-DD (lunes)
  title?: string;
  slug?: string;
  phase: 1 | 2 | 3 | 4;
}

function yearFromDate(date: string): number {
  return parseInt(date.slice(0, 4), 10);
}

// ================================================================
// CALENDARIO EDITORIAL 2026 — 31 semanas (reconstrucción ene–ago)
// ================================================================

const CALENDAR_2026: CalendarPost[] = [
  // FASE 1 — Completar ciudades ya iniciadas
  { phase: 1, category: 'hotel', location: 'Valencia', locationType: 'city', publishAt: '2026-01-06' },
  { phase: 1, category: 'hotel', location: 'Sevilla', locationType: 'city', publishAt: '2026-01-13' },
  { phase: 1, category: 'bar', location: 'Málaga', locationType: 'city', publishAt: '2026-01-20' },
  { phase: 1, category: 'hotel', location: 'Murcia', locationType: 'city', publishAt: '2026-01-27' },
  { phase: 1, category: 'bar', location: 'Alicante', locationType: 'city', publishAt: '2026-02-03' },
  { phase: 1, category: 'hotel', location: 'Alicante', locationType: 'city', publishAt: '2026-02-10' },
  { phase: 1, category: 'bar', location: 'Zaragoza', locationType: 'city', publishAt: '2026-02-17' },

  // FASE 2 — Expansión Tier 2
  { phase: 2, category: 'restaurante', location: 'Córdoba', locationType: 'city', publishAt: '2026-02-24' },
  { phase: 2, category: 'restaurante', location: 'San Sebastián', locationType: 'city', publishAt: '2026-03-03' },
  { phase: 2, category: 'restaurante', location: 'Palma', locationType: 'city', publishAt: '2026-03-10' },
  { phase: 2, category: 'restaurante', location: 'Marbella', locationType: 'city', publishAt: '2026-03-17' },
  { phase: 2, category: 'restaurante', location: 'Las Palmas', locationType: 'city', publishAt: '2026-03-24' },
  { phase: 2, category: 'restaurante', location: 'Salamanca', locationType: 'city', publishAt: '2026-03-31' },
  { phase: 2, category: 'restaurante', location: 'Santander', locationType: 'city', publishAt: '2026-04-07' },
  { phase: 2, category: 'restaurante', location: 'A Coruña', locationType: 'city', publishAt: '2026-04-14' },
  { phase: 2, category: 'restaurante', location: 'Pamplona', locationType: 'city', publishAt: '2026-04-21' },
  { phase: 2, category: 'restaurante', location: 'Valladolid', locationType: 'city', publishAt: '2026-04-28' },
  { phase: 2, category: 'restaurante', location: 'Toledo', locationType: 'city', publishAt: '2026-05-05' },
  { phase: 2, category: 'restaurante', location: 'Gijón', locationType: 'city', publishAt: '2026-05-12' },
  { phase: 2, category: 'restaurante', location: 'Oviedo', locationType: 'city', publishAt: '2026-05-19' },
  {
    phase: 2,
    category: 'restaurante',
    location: 'Santa Cruz de Tenerife',
    locationType: 'city',
    publishAt: '2026-05-26',
    title: buildBlogPostTitle('restaurante', 'Tenerife', 2026),
    slug: 'mejores-restaurantes-tenerife',
  },
  { phase: 2, category: 'restaurante', location: 'Benidorm', locationType: 'city', publishAt: '2026-06-02' },
  { phase: 2, category: 'bar', location: 'Córdoba', locationType: 'city', publishAt: '2026-06-09' },
  { phase: 2, category: 'hotel', location: 'Córdoba', locationType: 'city', publishAt: '2026-06-16' },

  // FASE 3 — Mix premium + provincias
  { phase: 3, category: 'bar', location: 'San Sebastián', locationType: 'city', publishAt: '2026-06-23' },
  { phase: 3, category: 'hotel', location: 'San Sebastián', locationType: 'city', publishAt: '2026-06-30' },
  { phase: 3, category: 'bar', location: 'Palma', locationType: 'city', publishAt: '2026-07-07' },
  { phase: 3, category: 'hotel', location: 'Palma', locationType: 'city', publishAt: '2026-07-14' },
  { phase: 3, category: 'restaurante', location: 'Galicia', locationType: 'community', publishAt: '2026-07-21' },
  { phase: 3, category: 'restaurante', location: 'País Vasco', locationType: 'community', publishAt: '2026-07-28' },
  {
    phase: 3,
    category: 'restaurante',
    location: 'Costa del Sol',
    locationType: 'province',
    publishAt: '2026-08-04',
    title: buildBlogPostTitle('restaurante', 'Costa del Sol', 2026),
    slug: 'mejores-restaurantes-costa-del-sol',
  },
];

// ================================================================
// FASE 4 — Próximos 5 meses (ago 2026 → ene 2027) — 22 semanas
// Completa Tier 2 (bar/hotel) + ciudades/provincias nuevas
// ================================================================

const CALENDAR_NEXT_5_MONTHS: CalendarPost[] = [
  { phase: 4, category: 'hotel', location: 'Marbella', locationType: 'city', publishAt: '2026-08-11' },
  { phase: 4, category: 'bar', location: 'Marbella', locationType: 'city', publishAt: '2026-08-18' },
  { phase: 4, category: 'hotel', location: 'Salamanca', locationType: 'city', publishAt: '2026-08-25' },
  { phase: 4, category: 'bar', location: 'Salamanca', locationType: 'city', publishAt: '2026-09-01' },
  { phase: 4, category: 'hotel', location: 'Santander', locationType: 'city', publishAt: '2026-09-08' },
  { phase: 4, category: 'bar', location: 'Santander', locationType: 'city', publishAt: '2026-09-15' },
  { phase: 4, category: 'hotel', location: 'A Coruña', locationType: 'city', publishAt: '2026-09-22' },
  { phase: 4, category: 'bar', location: 'A Coruña', locationType: 'city', publishAt: '2026-09-29' },
  { phase: 4, category: 'hotel', location: 'Pamplona', locationType: 'city', publishAt: '2026-10-06' },
  { phase: 4, category: 'bar', location: 'Pamplona', locationType: 'city', publishAt: '2026-10-13' },
  { phase: 4, category: 'hotel', location: 'Valladolid', locationType: 'city', publishAt: '2026-10-20' },
  { phase: 4, category: 'bar', location: 'Valladolid', locationType: 'city', publishAt: '2026-10-27' },
  { phase: 4, category: 'hotel', location: 'Toledo', locationType: 'city', publishAt: '2026-11-03' },
  { phase: 4, category: 'bar', location: 'Toledo', locationType: 'city', publishAt: '2026-11-10' },
  { phase: 4, category: 'restaurante', location: 'Almería', locationType: 'city', publishAt: '2026-11-17' },
  { phase: 4, category: 'restaurante', location: 'Logroño', locationType: 'city', publishAt: '2026-11-24' },
  { phase: 4, category: 'restaurante', location: 'Santiago de Compostela', locationType: 'city', publishAt: '2026-12-01' },
  { phase: 4, category: 'restaurante', location: 'León', locationType: 'city', publishAt: '2026-12-08' },
  { phase: 4, category: 'restaurante', location: 'Burgos', locationType: 'city', publishAt: '2026-12-15' },
  { phase: 4, category: 'restaurante', location: 'Tarragona', locationType: 'city', publishAt: '2026-12-22' },
  { phase: 4, category: 'hotel', location: 'Benidorm', locationType: 'city', publishAt: '2026-12-29' },
  { phase: 4, category: 'restaurante', location: 'Navarra', locationType: 'province', publishAt: '2027-01-05' },
];

const CATEGORY_SLUG: Record<Category, string> = {
  restaurante: 'restaurantes',
  bar: 'bares',
  hotel: 'hoteles',
};

function buildTitle(post: CalendarPost): string {
  if (post.title) return post.title;
  return buildBlogPostTitle(post.category, post.location, yearFromDate(post.publishAt));
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return JSON.stringify(err);
}

function buildSlug(post: CalendarPost): string {
  if (post.slug) return post.slug;
  return `mejores-${CATEGORY_SLUG[post.category]}-${toSlug(post.location)}`;
}

function publishAtIso(date: string): string {
  // Lunes 09:00 hora España (UTC+1 invierno / +2 verano) → 08:00 UTC en ene–mar
  return `${date}T08:00:00.000Z`;
}

function featuredImageUrl(_category: Category, _location: string): string | null {
  // Unsplash Source API está muerto; la portada se resuelve en runtime
  // desde photo_urls del Top 1. No guardar URLs rotas.
  return null;
}

async function fetchVerifiedPlaces(post: CalendarPost): Promise<BlogVerifiedPlace[]> {
  let query = supabase
    .from('places')
    .select('name, rating, review_count, city, province, slug, category, address, ai_description, photo_urls')
    .eq('category', post.category)
    .eq('published', true)
    .gte('rating', 4.7);

  query = applyBlogLocationFilter(query, {
    location: post.location,
    location_type: post.locationType,
    category: post.category,
  });

  const { data: places, error } = await query;
  if (error) throw error;

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

async function generateCalendarPosts(calendar: CalendarPost[], fromIndex = 1) {
  console.log('🚀 Generación de artículos HTML SEO\n');
  console.log(`📅 ${calendar.length} posts | Cadencia semanal\n`);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.OPENAI_API_KEY) {
    throw new Error('Faltan variables en .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < calendar.length; i++) {
    const post = calendar[i];
    const num = i + 1;
    const year = yearFromDate(post.publishAt);

    if (num < fromIndex) continue;

    const slug = buildSlug(post);
    const title = buildTitle(post);

    try {
      console.log(`\n[${num}/${calendar.length}] Fase ${post.phase} | ${slug}`);
      console.log(`   📆 Publicación: ${post.publishAt} | ${title}`);

      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id, slug')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        console.log('   ⏭️  Ya existe — saltando');
        skipped++;
        continue;
      }

      const verifiedPlaces = await fetchVerifiedPlaces(post);
      console.log(`   📍 Lugares verificados: ${verifiedPlaces.length}`);

      if (verifiedPlaces.length < 3) {
        console.warn(`   ⚠️  Pocos lugares (${verifiedPlaces.length}) — se genera igual, revisar manualmente`);
      }

      console.log('   🤖 Generando artículo SEO (2 pasadas)...');
      const html = await generateBlogArticle({
        title,
        category: post.category,
        location: post.location,
        locationType: post.locationType,
        year,
        verifiedPlaces,
        extraContext: `Artículo programado fase ${post.phase}. Enlaza al mapa de Casi Cinco y a fichas verificadas.`,
      });

      const markedHtml = `${BLOG_FULL_HTML_MARKER}\n${html}`;

      console.log('   🏷️  Generando metadatos SEO...');
      const metadata = await generateBlogMetadata(title, html);

      // Nota: first_place_photo se calcula en runtime desde places; no forzar insert
      const { error: insertError } = await supabase.from('blog_posts').insert({
        slug,
        title,
        meta_description: metadata.meta_description || `Guía ${year}: ${title}. Solo lugares +4.7★ verificados.`,
        category: post.category,
        location: post.location,
        location_type: post.locationType,
        intro_text: markedHtml,
        keywords: metadata.meta_keywords?.length ? metadata.meta_keywords : [
          `${CATEGORY_SLUG[post.category]} mejor valorados ${toSlug(post.location)}`,
          `mejores ${CATEGORY_SLUG[post.category]} ${toSlug(post.location)}`,
        ],
        featured_image_url: featuredImageUrl(post.category, post.location),
        published: true,
        created_at: publishAtIso(post.publishAt),
      });

      if (insertError) throw insertError;

      console.log('   ✅ Creado y programado');
      created++;

      // Pausa entre artículos (evitar rate limits OpenAI)
      if (i < calendar.length - 1) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    } catch (err: unknown) {
      console.error(`   ❌ Error: ${formatError(err)}`);
      errors++;
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('════════════════════════════════════════');
  console.log(`✅ Creados: ${created}`);
  console.log(`⏭️  Saltados (ya existían): ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log('════════════════════════════════════════\n');
}

// --- Punto de entrada ---
const args = process.argv.slice(2);
const fromArg = args.find((a) => a.startsWith('--from='));
const fromIndex = fromArg ? parseInt(fromArg.split('=')[1], 10) : 1;

if (args.includes('--next5')) {
  generateCalendarPosts(CALENDAR_NEXT_5_MONTHS, fromIndex).catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (args.includes('--calendar')) {
  generateCalendarPosts(CALENDAR_2026, fromIndex).catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.log('Usa:');
  console.log('  npx tsx scripts/generate-blog-posts.ts --calendar   → ene–ago 2026 (31 posts)');
  console.log('  npx tsx scripts/generate-blog-posts.ts --next5      → ago 2026–ene 2027 (22 posts)');
  console.log('  ... --from=8  → reanudar desde el nº N');
}
