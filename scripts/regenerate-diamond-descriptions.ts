/**
 * REGENERACIÓN DE DESCRIPCIONES EDITORIALES — TIER DIAMANTE
 * =========================================================
 *
 * Reescribe la ai_description de los lugares diamante (4.8+ y 1000+ reseñas)
 * con el modelo definido en OPENAI_ENRICHMENT_MODEL y el prompt editorial
 * de generatePlaceDescription (sin clichés, sin markdown, sin recitar rating).
 *
 * Como fuente de hechos usa ai_review_summary y ai_highlights ya guardados
 * en la BD (no llama a Google Places, coste solo OpenAI).
 *
 * Uso:
 *   npx tsx scripts/regenerate-diamond-descriptions.ts [--limit N] [--dry-run] [--min-rating 4.8] [--min-reviews 1000] [--max-reviews N]
 *
 * Ejemplos:
 *   npx tsx scripts/regenerate-diamond-descriptions.ts --limit 3 --dry-run                  → prueba sin guardar
 *   npx tsx scripts/regenerate-diamond-descriptions.ts                                      → todos los diamantes
 *   npx tsx scripts/regenerate-diamond-descriptions.ts --min-reviews 500 --max-reviews 1000 → solo platino
 *   npx tsx scripts/regenerate-diamond-descriptions.ts --min-reviews 200 --max-reviews 500  → solo oro
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// Proxy SSL corporativo / antivirus (scripts locales, igual que migrate-photos)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';
import { generatePlaceDescription } from '@/lib/ai/openai';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !process.env.OPENAI_API_KEY) {
  console.error('❌ Faltan variables en .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Argumentos de línea de comandos
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const getNumArg = (flag: string, fallback: number): number => {
  const i = args.indexOf(flag);
  return i !== -1 ? Number(args[i + 1]) : fallback;
};
const limit = getNumArg('--limit', 0);
const minRating = getNumArg('--min-rating', 4.8);
const minReviews = getNumArg('--min-reviews', 1000);
// Tope superior exclusivo de reseñas (0 = sin tope). Permite procesar una franja/tier concreta.
const maxReviews = getNumArg('--max-reviews', 0);

// Nº de descripciones generadas en paralelo (rate limit holgado)
const CONCURRENCY = 4;

interface PlaceRow {
  id: string;
  name: string;
  category: string;
  city: string;
  province: string;
  rating: number;
  review_count: number;
  price_level: number | null;
  ai_description: string | null;
  ai_review_summary: string | null;
  ai_highlights: unknown;
}

/** Patrones prohibidos: si aparecen, se reintenta una vez */
function hasBannedPatterns(text: string): string | null {
  const banned: [string, RegExp][] = [
    ['markdown', /\*\*/],
    ['empieza por Descubre', /^Descubre\b/i],
    ['exclamación', /!/],
    ['menciona rating', /\d[.,]\d\s*(★|estrellas)/i],
  ];
  for (const [label, re] of banned) {
    if (re.test(text)) return label;
  }
  return null;
}

/** Convierte ai_highlights (Json) en líneas de texto */
function highlightLines(highlights: unknown): string[] {
  if (Array.isArray(highlights)) {
    return highlights.filter((h): h is string => typeof h === 'string');
  }
  return [];
}

async function regeneratePlace(place: PlaceRow): Promise<{ ok: boolean; error?: string }> {
  // Fuente de hechos: resumen de reseñas + highlights guardados en BD
  const sourceFacts = [
    ...(place.ai_review_summary ? [place.ai_review_summary] : []),
    ...highlightLines(place.ai_highlights),
  ];

  try {
    let description = await generatePlaceDescription({
      name: place.name,
      category: place.category,
      city: place.city,
      province: place.province,
      rating: place.rating,
      review_count: place.review_count,
      price_level: place.price_level ?? undefined,
      reviews: sourceFacts,
    });

    // Control de calidad: un reintento si cuela algún patrón prohibido
    const banned = hasBannedPatterns(description);
    if (banned) {
      console.log(`   ⚠️ "${place.name}": patrón prohibido (${banned}), reintentando...`);
      description = await generatePlaceDescription({
        name: place.name,
        category: place.category,
        city: place.city,
        province: place.province,
        rating: place.rating,
        review_count: place.review_count,
        price_level: place.price_level ?? undefined,
        reviews: sourceFacts,
      });
    }

    if (!description || description.split(/\s+/).length < 60) {
      return { ok: false, error: 'descripción vacía o demasiado corta' };
    }

    if (dryRun) {
      console.log(`\n📝 [DRY-RUN] ${place.category.toUpperCase()} | ${place.name} (${place.city})\n${description}\n`);
      return { ok: true };
    }

    const { error } = await supabase
      .from('places')
      .update({ ai_description: description, updated_at: new Date().toISOString() })
      .eq('id', place.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  console.log(`\n💎 Regeneración de descripciones (rating ≥ ${minRating}, reseñas ≥ ${minReviews}${maxReviews > 0 ? ` y < ${maxReviews}` : ''})`);
  console.log(`   Modelo: ${process.env.OPENAI_ENRICHMENT_MODEL || 'gpt-4o-mini (por defecto)'}`);
  if (dryRun) console.log('   Modo: DRY-RUN (no se guarda nada)');

  let query = supabase
    .from('places')
    .select('id,name,category,city,province,rating,review_count,price_level,ai_description,ai_review_summary,ai_highlights')
    .eq('published', true)
    .gte('rating', minRating)
    .gte('review_count', minReviews);

  if (maxReviews > 0) query = query.lt('review_count', maxReviews);

  const { data, error } = await query
    .order('review_count', { ascending: false })
    .limit(2000);

  if (error) {
    console.error('❌ Error consultando lugares:', error.message);
    process.exit(1);
  }

  let places = (data || []) as PlaceRow[];
  if (limit > 0) places = places.slice(0, limit);
  console.log(`   Lugares a procesar: ${places.length}\n`);

  let done = 0;
  let failed = 0;
  const failures: string[] = [];

  // Procesar en tandas de CONCURRENCY
  for (let i = 0; i < places.length; i += CONCURRENCY) {
    const batch = places.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(p => regeneratePlace(p)));

    results.forEach((r, j) => {
      const p = batch[j];
      if (r.ok) {
        done++;
        if (!dryRun) console.log(`✅ ${done + failed}/${places.length} ${p.name} (${p.city})`);
      } else {
        failed++;
        failures.push(`${p.name}: ${r.error}`);
        console.log(`❌ ${done + failed}/${places.length} ${p.name}: ${r.error}`);
      }
    });
  }

  console.log(`\n🏁 Terminado: ${done} regeneradas, ${failed} fallos`);
  if (failures.length > 0) {
    console.log('\nFallos:');
    failures.forEach(f => console.log('  - ' + f));
  }
}

main().catch(e => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});
