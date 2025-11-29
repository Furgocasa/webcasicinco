import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BlogListContent } from '@/components/blog/BlogListContent';
import { comparePlacesByTier } from '@/lib/utils/tier-calculator';

// ✅ 1. Metadata estática para el listado del blog
export const metadata: Metadata = {
  title: 'Blog - Guías de los Mejores Lugares | Casi Cinco',
  description: 'Descubre guías completas de los mejores restaurantes, hoteles, bares y cafeterías de España. Solo establecimientos con 4.7+ estrellas verificadas.',
  keywords: [
    'mejores restaurantes',
    'mejores hoteles',
    'guías de viaje',
    'españa turismo',
    'lugares recomendados',
    'top 10 lugares',
    '4.7 estrellas',
  ],
  openGraph: {
    title: 'Blog - Guías de Viaje | Casi Cinco',
    description: 'Guías completas de los mejores lugares de España con +4.7 estrellas',
    type: 'website',
  },
};

// ✅ 2. Componente principal (Server Component)
export default async function BlogPage() {
  const supabase = await createClient();
  
  // Obtener todos los posts publicados
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .lte('created_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  // Enriquecer cada post con la foto del primer lugar de su Top 10
  const enrichedPosts = await Promise.all(
    (posts || []).map(async (post) => {
      // Obtener lugares para este post
      let placesQuery = supabase
        .from('places')
        .select('photo_urls, photos, rating, review_count')
        .eq('category', post.category)
        .eq('published', true)
        .gte('rating', 4.7);

      // Filtrar por ubicación
      if (post.location_type === 'city') {
        placesQuery = placesQuery.eq('city', post.location);
      } else if (post.location_type === 'province') {
        placesQuery = placesQuery.eq('province', post.location);
      } else if (post.location_type === 'community') {
        placesQuery = placesQuery.eq('community', post.location);
      }

      const { data: places } = await placesQuery;
      
      // 🎯 Ordenar por tier (diamante primero) y obtener el primero
      const sortedPlaces = (places || []).sort(comparePlacesByTier);
      const firstPlace = sortedPlaces.length > 0 ? sortedPlaces[0] : null;

      // Obtener URL de foto del primer lugar (SOLO Supabase Storage)
      let photoUrl = null;
      if (firstPlace) {
        // SOLO usar photo_urls de Supabase Storage (GRATIS)
        if (firstPlace.photo_urls && firstPlace.photo_urls.length > 0) {
          photoUrl = firstPlace.photo_urls[0]; // URL completa de Supabase
        }
        // ❌ NO hacer fallback a photos (photo_reference de Google)
        // Si no tiene photo_urls, mejor mostrar placeholder que gastar €€€ en Google API
      }

      return {
        ...post,
        first_place_photo: photoUrl,
        first_place_photo_is_url: !!photoUrl // Si tiene foto, siempre es URL de Supabase
      };
    })
  );

  // ✅ 3. Schema.org para el listado del blog
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog de Casi Cinco",
    "description": "Guías de los mejores lugares de España con 4.7+ estrellas",
    "url": "https://casicinco.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Casi Cinco",
      "logo": {
        "@type": "ImageObject",
        "url": "https://casicinco.com/images/logo.png"
      }
    }
  };

  // ItemList de todos los posts
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Artículos del Blog",
    "numberOfItems": enrichedPosts?.length || 0,
    "itemListElement": enrichedPosts?.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Article",
        "headline": post.title,
        "url": `https://casicinco.com/blog/${post.slug}`,
        "datePublished": post.created_at,
        "image": post.first_place_photo || post.featured_image_url
      }
    })) || []
  };

  return (
    <>
      {/* ✅ Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      
      {/* ✅ Client Component con UI interactiva */}
      <BlogListContent initialPosts={enrichedPosts || []} />
    </>
  );
}

// ✅ ISR: Revalidar cada 1 hora (para nuevos posts programados)
export const revalidate = 3600; // 1 hora
