import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createClientBrowser } from '@supabase/supabase-js';
import { BlogPostContent } from '@/components/blog/BlogPostContent';
import type { BlogPostWithPlaces } from '@/types/blog';
import { comparePlacesByTier } from '@/lib/utils/tier-calculator';

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

  // 🎯 Obtener el PRIMER LUGAR (mejor tier) para la imagen OpenGraph
  const { data: allPlaces } = await supabase
    .from('places')
    .select('photo_urls, rating, review_count, name')
    .eq('category', post.category)
    .eq('published', true)
    .or(`city.eq.${post.location},province.eq.${post.location}`)
    .gte('rating', 4.7);
  
  // Ordenar por tier (diamante primero) y obtener el primero
  const sortedPlaces = (allPlaces || []).sort(comparePlacesByTier);
  const firstPlace = sortedPlaces.length > 0 ? sortedPlaces[0] : null;
  
  // Imagen OpenGraph: siempre del primer lugar (mejor tier)
  let ogImage = firstPlace?.photo_urls?.[0] || post.first_place_photo || post.featured_image_url;
  
  // Fallback a imagen por defecto de Casi Cinco si no hay foto
  if (!ogImage) {
    ogImage = `${process.env.NEXT_PUBLIC_APP_URL}/images/opengraph_casicinco_wide.png`;
  }
  
  // 📝 Meta description optimizada para redes sociales (max 155 caracteres)
  const categoryEmoji = post.category === 'restaurante' ? '🍽️' : 
                        post.category === 'bar' ? '🍺' : 
                        post.category === 'hotel' ? '🏨' : '⭐';
  
  let metaDescription = post.meta_description;
  
  // Si no hay meta_description o es muy corta, generar una perfecta
  if (!metaDescription || metaDescription.length < 100) {
    const placeName = firstPlace ? firstPlace.name : '';
    const placeRating = firstPlace ? `${firstPlace.rating}★` : '';
    
    if (placeName && post.location) {
      // Ejemplo: "🍽️ Top 10 restaurantes en Murcia (2025). Encabeza La Pequeña Taberna con 4.9★. Solo lugares +4.7★ verificados en Google Maps."
      metaDescription = `${categoryEmoji} ${post.title}. Encabeza ${placeName} con ${placeRating}. Solo lugares +4.7★ verificados en Google Maps.`;
    } else {
      // Fallback genérico
      metaDescription = `${categoryEmoji} Descubre los mejores ${post.category}s en ${post.location}. Solo lugares excepcionales con +4.7★ en Google Maps. Verificado y actualizado.`;
    }
    
    // Asegurar que no exceda 155 caracteres
    if (metaDescription.length > 155) {
      metaDescription = metaDescription.substring(0, 152) + '...';
    }
  }
  
  // URL completa del artículo
  const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${params.slug}`;
  const siteName = 'Casi Cinco';
  
  return {
    title: `${post.title} | Casi Cinco`,
    description: metaDescription,
    keywords: post.keywords || [],
    authors: [{ name: 'Casi Cinco' }],
    openGraph: {
      title: post.title,
      description: metaDescription,
      url: articleUrl,
      siteName: siteName,
      locale: 'es_ES',
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${post.title} - ${firstPlace?.name || 'Casi Cinco'}`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@CasiCinco',
      creator: '@CasiCinco',
      title: post.title,
      description: metaDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: articleUrl,
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
    .gte('rating', 4.7); // Traer todos los lugares +4.7★

  // 🎯 Ordenar por tier (diamante primero) en memoria
  const sortedPlaces = (places || [])
    .sort(comparePlacesByTier)
    .slice(0, 10); // Top 10

  // Obtener URL de foto del primer lugar (priorizar Supabase)
  let firstPlacePhotoUrl = post.first_place_photo;
  if (!firstPlacePhotoUrl && sortedPlaces && sortedPlaces.length > 0) {
    const firstPlace = sortedPlaces[0];
    if (firstPlace.photo_urls && firstPlace.photo_urls.length > 0) {
      firstPlacePhotoUrl = firstPlace.photo_urls[0]; // URL completa de Supabase
    }
  }

  // Fallback a imagen por defecto
  if (!firstPlacePhotoUrl) {
    firstPlacePhotoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/images/opengraph_casicinco_wide.png`;
  }

  const postWithPlaces: BlogPostWithPlaces = {
    ...post,
    first_place_photo: firstPlacePhotoUrl,
    places: sortedPlaces,
  };

  // Incrementar contador de vistas (fire and forget)
  supabase
    .from('blog_posts')
    .update({ views_count: post.views_count + 1 })
    .eq('id', post.id)
    .then();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.casicinco.com';

  // ✅ 4. Schema.org mejorado para SEO (Article + ItemList + BreadcrumbList)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description || post.intro_text?.substring(0, 200),
    "image": {
      "@type": "ImageObject",
      "url": firstPlacePhotoUrl,
      "width": 1200,
      "height": 630
    },
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Organization",
      "name": "Casi Cinco",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "Casi Cinco",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/images/casi_cinco_blue.png`,
        "width": 600,
        "height": 60
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${params.slug}`
    }
  };

  // ItemList Schema para el Top 10 (mejorado con tier info)
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": post.title,
    "description": `Top 10 ${post.category} en ${post.location} ordenados por calidad (rating + reseñas)`,
    "numberOfItems": sortedPlaces?.length || 0,
    "itemListElement": sortedPlaces?.map((place, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": place.category === 'restaurante' ? 'Restaurant' : 
                place.category === 'hotel' ? 'Hotel' :
                place.category === 'bar' ? 'BarOrPub' : 'LocalBusiness',
        "name": place.name,
        "url": `${baseUrl}/${place.category}/${place.province}/${place.slug}`,
        "image": place.photo_urls?.[0],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": place.rating,
          "reviewCount": place.review_count,
          "bestRating": 5,
          "worstRating": 1
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": place.city,
          "addressRegion": place.province,
          "addressCountry": "ES"
        },
        "geo": place.latitude && place.longitude ? {
          "@type": "GeoCoordinates",
          "latitude": place.latitude,
          "longitude": place.longitude
        } : undefined
      }
    })) || []
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${baseUrl}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `${baseUrl}/blog/${params.slug}`
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
