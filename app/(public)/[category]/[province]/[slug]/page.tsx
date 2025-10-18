import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createClientBrowser } from '@supabase/supabase-js';
import { PlaceContent } from '@/components/places/PlaceContent';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';

type Props = {
  params: { category: string; province: string; slug: string }
}

// 1. ✅ Metadata dinámica para SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  
  const { data: place } = await supabase
    .from('places')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();
  
  if (!place) {
    return {
      title: 'Lugar no encontrado | Casi Cinco',
      description: 'El lugar que buscas no está disponible o ha sido eliminado.',
    };
  }
  
            const categoryNames: Record<string, string> = {
              restaurante: 'Restaurante',
              hotel: 'Hotel',
              bar: 'Bar',
              cafe: 'Cafetería',
  };
  
  const categoryName = categoryNames[place.category] || place.category;
  
  return {
    title: `${place.name} - ${categoryName} ${place.rating}★ en ${place.city}, ${place.province} | Casi Cinco`,
    description: `${place.name}: ${place.rating}★ con ${place.user_ratings_total} reseñas en ${place.city}. ${place.ai_description?.substring(0, 150) || ''}...`,
    openGraph: {
      title: place.name,
      description: place.ai_description || `${place.name} - ${place.rating}★ en ${place.city}`,
      images: place.photos && Array.isArray(place.photos) && place.photos.length > 0 
        ? [place.photos[0]] 
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: place.name,
      description: place.ai_description?.substring(0, 200) || `${place.name} - ${place.rating}★`,
    },
  };
}

// 2. ✅ Pre-generar rutas estáticas (SSG) - Top 100 para empezar
export async function generateStaticParams() {
  // Usar cliente directo sin cookies para build time
  const supabase = createClientBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: places } = await supabase
    .from('places')
    .select('category, province, slug')
    .eq('published', true)
    .order('rating', { ascending: false })
    .order('user_ratings_total', { ascending: false })
    .limit(100); // Top 100 lugares para SSG, resto ISR
  
  return (places || []).map((place) => ({
    category: place.category,
    province: place.province,
    slug: place.slug,
  }));
}

// 3. ✅ Componente principal (Server Component)
export default async function PlaceDetailPage({ params }: Props) {
  const supabase = await createClient();
  
  const { data: place, error } = await supabase
    .from('places')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();
  
  if (error || !place) {
    notFound();
  }
  
  // Calcular tier
  const tier = calculateQualityTier(place.rating, place.user_ratings_total);
  const tierInfo = getTierInfo(tier);
  
  // 4. ✅ Schema.org para SEO (LocalBusiness + Rating)
  const schemaTypeMap: Record<string, string> = {
    restaurante: 'Restaurant',
    hotel: 'Hotel',
    bar: 'BarOrPub',
    cafe: 'CafeOrCoffeeShop',
  };
  const schemaType = schemaTypeMap[place.category] || 'LocalBusiness';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": place.name,
    "image": place.photos || [],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": place.address,
      "addressLocality": place.city,
      "addressRegion": place.province,
      "postalCode": place.postal_code,
      "addressCountry": "ES"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": place.latitude,
      "longitude": place.longitude
    },
    "url": place.website,
    "telephone": place.phone,
    "priceRange": place.price_level ? "€".repeat(place.price_level) : undefined,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": place.rating,
      "reviewCount": place.user_ratings_total,
      "bestRating": 5,
      "worstRating": 1
    }
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
        "name": place.category === 'restaurante' ? 'Restaurantes' : 
               place.category === 'hotel' ? 'Hoteles' :
               place.category === 'bar' ? 'Bares' :
               place.category === 'cafe' ? 'Cafeterías' : place.category,
        "item": `https://casicinco.com/${place.category}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": place.province,
        "item": `https://casicinco.com/${place.category}/${place.province}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": place.name
      }
    ]
  };

  return (
    <>
      {/* ✅ Schema.org JSON-LD para rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* ✅ Client Component con UI interactiva */}
      <PlaceContent place={place} tier={tier} tierInfo={tierInfo} />
    </>
  );
}

// ✅ ISR: Revalidar cada 24 horas
export const revalidate = 86400; // 24 horas
