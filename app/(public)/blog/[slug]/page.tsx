import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createClientBrowser } from '@supabase/supabase-js';
import { BlogPostContent } from '@/components/blog/BlogPostContent';
import type { BlogPostWithPlaces } from '@/types/blog';

type Props = {
  params: { slug: string }
}

// ✅ 1. Metadata dinámica para SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .lte('created_at', new Date().toISOString())
    .single();
  
  if (!post) {
    return {
      title: 'Post no encontrado | Casi Cinco',
      description: 'El artículo que buscas no está disponible.',
    };
  }

  // Construir URL de imagen destacada desde el primer lugar
  let ogImage = post.first_place_photo || post.featured_image_url;
  
  // Si no tiene, intentar obtener del primer lugar de la ubicación
  if (!ogImage) {
    const { data: places } = await supabase
      .from('places')
      .select('photo_urls')
      .eq('category', post.category)
      .eq('published', true)
      .or(`city.eq.${post.location},province.eq.${post.location}`)
      .order('rating', { ascending: false })
      .limit(1);
    
    if (places && places.length > 0 && places[0].photo_urls && places[0].photo_urls.length > 0) {
      ogImage = places[0].photo_urls[0];
    }
  }
  
  return {
    title: post.title,
    description: post.meta_description || post.intro_text?.substring(0, 155),
    keywords: post.keywords || [],
    openGraph: {
      title: post.title,
      description: post.meta_description || post.intro_text?.substring(0, 155),
      images: ogImage ? [ogImage] : [],
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description || post.intro_text?.substring(0, 155),
      images: ogImage ? [ogImage] : [],
    },
  };
}

// ✅ 2. Pre-generar rutas estáticas (SSG) - Top 20 posts
export async function generateStaticParams() {
  // Usar cliente directo sin cookies para build time
  const supabase = createClientBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('published', true)
    .lte('created_at', new Date().toISOString())
    .order('views_count', { ascending: false })
    .limit(20); // Top 20 posts más visitados para SSG
  
  return (posts || []).map((post) => ({
    slug: post.slug,
  }));
}

// ✅ 3. Componente principal (Server Component)
export default async function BlogPostPage({ params }: Props) {
  const supabase = await createClient();
  
  // Obtener el post con sus lugares
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .lte('created_at', new Date().toISOString())
    .single();
  
  if (error || !post) {
    notFound();
  }

  // Obtener los lugares top 10 para este post
  const { data: places } = await supabase
    .from('places')
    .select('*')
    .eq('category', post.category)
    .eq('published', true)
    .or(`city.eq.${post.location},province.eq.${post.location}`)
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(10);

  // Obtener URL de foto del primer lugar (priorizar Supabase)
  let firstPlacePhotoUrl = post.first_place_photo;
  if (!firstPlacePhotoUrl && places && places.length > 0) {
    const firstPlace = places[0];
    if (firstPlace.photo_urls && firstPlace.photo_urls.length > 0) {
      firstPlacePhotoUrl = firstPlace.photo_urls[0]; // URL completa de Supabase
    }
  }

  const postWithPlaces: BlogPostWithPlaces = {
    ...post,
    first_place_photo: firstPlacePhotoUrl,
    places: places || [],
  };

  // Incrementar contador de vistas (fire and forget)
  supabase
    .from('blog_posts')
    .update({ views_count: post.views_count + 1 })
    .eq('id', post.id)
    .then();

  // ✅ 4. Schema.org para SEO (Article + ItemList)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description || post.intro_text?.substring(0, 200),
    "image": post.featured_image_url || post.first_place_photo,
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Organization",
      "name": "Casi Cinco"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Casi Cinco",
      "logo": {
        "@type": "ImageObject",
        "url": "https://casicinco.com/images/logo.png"
      }
    }
  };

  // ItemList Schema para el Top 10
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": post.title,
    "numberOfItems": places?.length || 0,
    "itemListElement": places?.map((place, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": place.category === 'restaurante' ? 'Restaurant' : 
                place.category === 'hotel' ? 'Hotel' :
                place.category === 'bar' ? 'BarOrPub' :
                place.category === 'cafe' ? 'CafeOrCoffeeShop' : 'LocalBusiness',
        "name": place.name,
        "url": `https://casicinco.com/${place.category}/${place.province}/${place.slug}`,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": place.rating,
          "reviewCount": place.review_count
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": place.city,
          "addressRegion": place.province,
          "addressCountry": "ES"
        }
      }
    })) || []
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://casicinco.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://casicinco.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title
      }
    ]
  };

  return (
    <>
      {/* ✅ Schema.org JSON-LD para rich snippets - canónicas con www se gestionan via metadataBase */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* ✅ Client Component con UI interactiva */}
      <BlogPostContent post={postWithPlaces} />
    </>
  );
}

// ✅ ISR: Revalidar cada 6 horas (blog cambia menos que fichas)
export const revalidate = 21600; // 6 horas
