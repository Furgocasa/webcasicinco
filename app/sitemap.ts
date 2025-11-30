import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Función para convertir provincias a slug URL-friendly
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^a-z0-9-]/g, ''); // Solo letras, números y guiones
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.casicinco.com';

  // ✅ Obtener TODOS los lugares PUBLICADOS en lotes (sin límite)
  let allPlaces: any[] = [];
  let currentOffset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('places')
      .select('slug, category, province, updated_at, rating')
      .eq('published', true)
      .order('rating', { ascending: false })
      .order('review_count', { ascending: false })
      .range(currentOffset, currentOffset + batchSize - 1);

    if (error) {
      console.error('Error cargando lugares para sitemap:', error);
      break;
    }

    if (data && data.length > 0) {
      allPlaces = [...allPlaces, ...data];
      currentOffset += batchSize;
      
      if (data.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Sitemap - Total lugares encontrados: ${allPlaces.length}`);

  // Generar URLs para cada lugar (con slug correcto de provincia)
  const placeUrls: MetadataRoute.Sitemap = allPlaces.map((place) => ({
    url: `${baseUrl}/${place.category}/${toSlug(place.province)}/${place.slug}`,
    lastModified: place.updated_at ? new Date(place.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: place.rating >= 4.8 ? 0.9 : place.rating >= 4.7 ? 0.8 : 0.7,
  }));

  // Obtener artículos del blog PUBLICADOS (solo published = true)
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, created_at')
    .eq('published', true)
    .lte('created_at', new Date().toISOString()) // Solo posts cuya fecha ya pasó
    .order('created_at', { ascending: false });

  // Generar URLs para cada artículo del blog
  const blogUrls: MetadataRoute.Sitemap = (blogPosts || []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(post.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/mapa`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ruta`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/metodologia`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sobre-nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Páginas de categorías
    {
      url: `${baseUrl}/restaurante`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hotel`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Páginas legales
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Página principal del blog
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Combinar todo en un único sitemap
  return [...staticPages, ...placeUrls, ...blogUrls];
}
