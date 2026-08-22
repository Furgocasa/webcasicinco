import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlogListContent } from '@/components/blog/BlogListContent';
import { comparePlacesByTier } from '@/lib/utils/tier-calculator';
import {
  applyBlogLocationFilter,
  getBlogCoverPhotoFromPlaces,
  isBrokenFeaturedImage,
} from '@/lib/utils/blog-places';

const POSTS_PER_PAGE = 15;
const VALID_CATEGORIES = ['restaurante', 'bar', 'hotel'] as const;
const BASE_URL = 'https://www.casicinco.com';

type BlogSearchParams = {
  page?: string;
  categoria?: string;
};

function parseCategory(value?: string): string {
  if (value && VALID_CATEGORIES.includes(value as (typeof VALID_CATEGORIES)[number])) {
    return value;
  }
  return 'all';
}

function buildBlogPath(page: number, category: string): string {
  const params = new URLSearchParams();
  if (category !== 'all') params.set('categoria', category);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/blog?${qs}` : '/blog';
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: BlogSearchParams;
}): Promise<Metadata> {
  const category = parseCategory(searchParams.categoria);
  const requestedPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);

  const categoryTitles: Record<string, string> = {
    restaurante: 'Restaurantes',
    hotel: 'Hoteles',
    bar: 'Bares',
  };

  const categoryLabel = categoryTitles[category];
  const pageSuffix = requestedPage > 1 ? ` - Página ${requestedPage}` : '';
  const topic = categoryLabel ? ` de ${categoryLabel}` : '';

  const title = `Blog${topic}${pageSuffix} - Guías de los Mejores Lugares | Casi Cinco`;
  const description = categoryLabel
    ? `Guías de los mejores ${categoryLabel.toLowerCase()} de España. Solo establecimientos con 4.7+ estrellas verificadas.`
    : 'Descubre guías completas de los mejores restaurantes, hoteles y bares de España. Solo establecimientos con 4.7+ estrellas verificadas.';

  return {
    title,
    description,
    keywords: [
      'mejores restaurantes',
      'mejores hoteles',
      'guías de viaje',
      'españa turismo',
      'lugares recomendados',
      'top 10 lugares',
      '4.7 estrellas',
    ],
    alternates: {
      canonical: `${BASE_URL}${buildBlogPath(requestedPage, category)}`,
    },
    openGraph: {
      title: `Blog${topic}${pageSuffix} | Casi Cinco`,
      description,
      type: 'website',
      url: `${BASE_URL}${buildBlogPath(requestedPage, category)}`,
    },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: BlogSearchParams;
}) {
  const supabase = await createClient();
  const category = parseCategory(searchParams.categoria);
  const requestedPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const now = new Date().toISOString();

  // Conteo total para calcular páginas (con el mismo filtro)
  let countQuery = supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('published', true)
    .lte('created_at', now);

  if (category !== 'all') {
    countQuery = countQuery.eq('category', category);
  }

  const { count } = await countQuery;
  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  // Si la página pedida no existe, ir a la última válida
  if (requestedPage !== currentPage) {
    redirect(buildBlogPath(currentPage, category));
  }

  const from = (currentPage - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  let postsQuery = supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .lte('created_at', now)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (category !== 'all') {
    postsQuery = postsQuery.eq('category', category);
  }

  const { data: posts } = await postsQuery;

  // Enriquecer cada post de esta página con la foto del primer lugar de su Top 10
  const enrichedPosts = await Promise.all(
    (posts || []).map(async (post) => {
      let placesQuery = supabase
        .from('places')
        .select('photo_urls, photos, rating, review_count')
        .eq('category', post.category)
        .eq('published', true)
        .gte('rating', 4.7);

      placesQuery = applyBlogLocationFilter(placesQuery, post);

      const { data: places } = await placesQuery;

      const sortedPlaces = (places || []).sort(comparePlacesByTier);
      const photoUrl = getBlogCoverPhotoFromPlaces(sortedPlaces);

      const featured = isBrokenFeaturedImage(post.featured_image_url)
        ? null
        : post.featured_image_url;

      return {
        ...post,
        featured_image_url: featured || undefined,
        first_place_photo: photoUrl,
        first_place_photo_is_url: !!photoUrl,
      };
    })
  );

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog de Casi Cinco",
    "description": "Guías de los mejores lugares de España con 4.7+ estrellas",
    "url": `${BASE_URL}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": "Casi Cinco",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/images/logo.png`
      }
    }
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Artículos del Blog",
    "numberOfItems": totalCount,
    "itemListElement": enrichedPosts.map((post, index) => ({
      "@type": "ListItem",
      "position": from + index + 1,
      "item": {
        "@type": "Article",
        "headline": post.title,
        "url": `${BASE_URL}/blog/${post.slug}`,
        "datePublished": post.created_at,
        "image": post.first_place_photo || post.featured_image_url
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {currentPage > 1 && (
        <link rel="prev" href={`${BASE_URL}${buildBlogPath(currentPage - 1, category)}`} />
      )}
      {currentPage < totalPages && (
        <link rel="next" href={`${BASE_URL}${buildBlogPath(currentPage + 1, category)}`} />
      )}

      <BlogListContent
        initialPosts={enrichedPosts}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        postsPerPage={POSTS_PER_PAGE}
        currentCategory={category}
      />
    </>
  );
}

export const revalidate = 3600;
