import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hora

// Función para convertir provincias a slug URL-friendly
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^a-z0-9-]/g, ''); // Solo letras, números y guiones
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.casicinco.com';

  // ✅ Obtener TODOS los lugares PUBLICADOS con imágenes en lotes
  let allPlaces: any[] = [];
  let currentOffset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('places')
      .select('slug, category, province, city, name, photo_urls, ai_description')
      .eq('published', true)
      .not('photo_urls', 'is', null) // Solo lugares con imágenes
      .order('rating', { ascending: false })
      .order('review_count', { ascending: false })
      .range(currentOffset, currentOffset + batchSize - 1);

    if (error) {
      console.error('Error cargando lugares para images sitemap:', error);
      break;
    }

    if (data && data.length > 0) {
      // Filtrar lugares que realmente tienen photo_urls (array no vacío)
      const placesWithImages = data.filter(
        (place) => place.photo_urls && Array.isArray(place.photo_urls) && place.photo_urls.length > 0
      );
      allPlaces = [...allPlaces, ...placesWithImages];
      currentOffset += batchSize;
      
      if (data.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Images Sitemap - Total lugares con imágenes: ${allPlaces.length}`);

  // Generar XML del sitemap de imágenes
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPlaces
  .map((place) => {
    const placeUrl = `${baseUrl}/${place.category}/${toSlug(place.province)}/${place.slug}`;
    const geoLocation = `${place.city}, ${place.province}, España`;
    
    // Generar entradas para cada imagen (máximo 10 imágenes por lugar según recomendación de Google)
    const images = (place.photo_urls || [])
      .slice(0, 10) // Máximo 10 imágenes por lugar
      .map((imageUrl: string) => {
        // Limpiar parámetros de transformación de Supabase para la URL canónica
        const cleanImageUrl = imageUrl.split('?')[0];
        const title = place.name || 'Imagen del lugar';
        const caption = place.ai_description 
          ? place.ai_description.substring(0, 200) // Máximo 200 caracteres
          : `${place.name} en ${place.city}, ${place.province}`;
        
        return `    <image:image>
      <image:loc>${cleanImageUrl}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
      <image:caption>${escapeXml(caption)}</image:caption>
      <image:geo_location>${escapeXml(geoLocation)}</image:geo_location>
    </image:image>`;
      })
      .join('\n');
    
    return `  <url>
    <loc>${placeUrl}</loc>
${images}
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

// Función para escapar caracteres XML especiales
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

