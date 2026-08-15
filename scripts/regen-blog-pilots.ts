/**
 * Regenera todos los posts FULL_HTML con modelo intro + cards + cierre SEO.
 * Uso:
 *   npx tsx scripts/regen-blog-pilots.ts --all
 *   npx tsx scripts/regen-blog-pilots.ts --all --from=4
 *   npx tsx scripts/regen-blog-pilots.ts --slug=mejores-bares-madrid
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { createClient } from '@supabase/supabase-js'
import {
  generateBlogArticleWithReview,
  generateBlogMetadata,
  type BlogVerifiedPlace,
} from '../lib/ai/openai'
import {
  BLOG_FULL_HTML_MARKER,
  auditBlogArticleHtml,
  isBlogFullHtml,
  splitBlogArticleHtml,
} from '../types/blog'
import { applyBlogLocationFilter } from '../lib/utils/blog-places'
import { comparePlacesByTier } from '../lib/utils/tier-calculator'

const PILOTS = [
  'mejores-bares-malaga',
  'mejores-restaurantes-costa-del-sol',
  'mejores-hoteles-valencia',
]

const args = process.argv.slice(2)
const ALL = args.includes('--all')
const slugArg = args.find((a) => a.startsWith('--slug='))
const fromArg = args.find((a) => a.startsWith('--from='))
const limitArg = args.find((a) => a.startsWith('--limit='))
const slugFilter = slugArg ? slugArg.split('=')[1] : null
const fromIndex = fromArg ? parseInt(fromArg.split('=')[1], 10) : 1
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity
const SKIP_OK = args.includes('--skip-ok')

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
    .gte('rating', 4.7)

  q = applyBlogLocationFilter(q, {
    location,
    location_type: locationType as 'city' | 'province' | 'community',
    category: category as 'restaurante' | 'bar' | 'hotel',
  })

  const { data } = await q
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
    }))
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let slugs: string[] = PILOTS

  if (slugFilter) {
    slugs = [slugFilter]
  } else if (ALL) {
    const { data: posts } = await sb
      .from('blog_posts')
      .select('slug, intro_text')
      .eq('published', true)
      .order('created_at', { ascending: true })

    slugs = (posts || [])
      .filter((p) => isBlogFullHtml(p.intro_text))
      .map((p) => p.slug)
  }

  slugs = slugs.slice(fromIndex - 1).slice(0, limit)

  console.log(`\n🚀 Regenerando ${slugs.length} posts — intro + cards + cierre SEO\n`)

  let ok = 0
  let fail = 0
  let skipped = 0

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    console.log(`\n======== [${i + 1}/${slugs.length}] ${slug} ========`)

    try {
      const { data: post, error } = await sb
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !post) {
        console.error('No encontrado')
        fail++
        continue
      }

      const verifiedPlaces = await fetchVerifiedPlaces(
        sb,
        post.category,
        post.location,
        post.location_type
      )

      if (verifiedPlaces.length < 3) {
        console.warn(`⏭️  Solo ${verifiedPlaces.length} lugares — saltando`)
        skipped++
        continue
      }

      console.log(`📍 ${verifiedPlaces.length} lugares verificados`)

      if (SKIP_OK && isBlogFullHtml(post.intro_text)) {
        const html = post.intro_text.replace(BLOG_FULL_HTML_MARKER, '').trim()
        const audit = auditBlogArticleHtml(html, {
          title: post.title,
          placeNames: verifiedPlaces.map((p) => p.name),
        })
        if (
          audit.passed &&
          audit.placeHeadingCount === 0 &&
          audit.wordCount >= 550 &&
          audit.wordCount <= 1100 &&
          audit.introWordCount >= 100
        ) {
          console.log(`⏭️  Ya OK (${audit.wordCount} palabras) — saltando`)
          skipped++
          ok++
          continue
        }
      }

      const yearMatch = post.title.match(/\((20\d{2})\)/)
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()

      const result = await generateBlogArticleWithReview(
        {
          title: post.title,
          category: post.category,
          location: post.location,
          locationType: post.location_type,
          year,
          verifiedPlaces,
          extraContext:
            'Modelo: INTRO + cards BD + CIERRE SEO. No listes el Top 10 en h2. Mínimo 700 palabras.',
        },
        {
          maxIterations: 3,
          onIteration: ({ iteration, review, wordCount }) => {
            console.log(
              `   pasada ${iteration}: score ${review.score} · ${wordCount} palabras · ${review.approved ? 'OK' : 'mejorar'}`
            )
          },
        }
      )

      const audit = auditBlogArticleHtml(result.html, {
        title: post.title,
        placeNames: verifiedPlaces.map((p) => p.name),
      })
      const { introHtml } = splitBlogArticleHtml(
        result.html,
        verifiedPlaces.map((p) => p.name)
      )

      console.log(
        `📊 Final: ${result.review.score}/100 · ${result.wordCount} palabras · intro ${audit.introWordCount} · placeH ${audit.placeHeadingCount} · audit ${audit.passed ? 'PASS' : 'FAIL'}`
      )
      console.log(`   Intro: ${introHtml.replace(/<[^>]+>/g, ' ').slice(0, 120).trim()}…`)

      const metadata = await generateBlogMetadata(post.title, result.html)
      const markedHtml = `${BLOG_FULL_HTML_MARKER}\n${result.html}`

      const { error: upErr } = await sb
        .from('blog_posts')
        .update({
          intro_text: markedHtml,
          meta_description: metadata.meta_description || post.meta_description,
          keywords: metadata.meta_keywords?.length
            ? metadata.meta_keywords
            : post.keywords,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id)

      if (upErr) {
        console.error('❌ Error guardando:', upErr.message)
        fail++
      } else {
        console.log('✅ Guardado')
        ok++
      }

      // Pausa entre posts
      await new Promise((r) => setTimeout(r, 2000))
    } catch (err: unknown) {
      fail++
      console.error(`❌ ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log('\n════════════════════════════════════════')
  console.log(`✅ OK: ${ok} | ⏭️ Skip: ${skipped} | ❌ Fail: ${fail}`)
  console.log('════════════════════════════════════════\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
