import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { toSlug } from '@/lib/utils/url-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hora

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.casicinco.com';
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  
  // ✅ PAGINACIÓN: Máximo 500 lugares por sitemap para evitar HTTP 413
  const PLACES_PER_PAGE = 500;
  const IMAGES_PER_PLACE = 3; // Reducido a 3 imágenes por lugar para mantener tamaño razonable
  const offset = (page - 1) * PLACES_PER_PAGE;

  // Obtener lugares con imágenes para esta página
  const { data: places, error } = await supabase
    .from('places')
    .select('slug, category, province, city, name, photo_urls, ai_description')
    .eq('published', true)
    .not('photo_urls', 'is', null) // Solo lugares con imágenes
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .range(offset, offset + PLACES_PER_PAGE - 1);

  if (error) {
    console.error('Error cargando lugares para images sitemap:', error);
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`;
    return new NextResponse(emptyXml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }

  // Filtrar lugares que realmente tienen photo_urls (array no vacío)
  const placesWithImages = (places || []).filter(
    (place) => place.photo_urls && Array.isArray(place.photo_urls) && place.photo_urls.length > 0
  );

  console.log(`✅ Images Sitemap (page ${page}) - Lugares con imágenes: ${placesWithImages.length}`);

  // Si no hay lugares, retornar sitemap vacío
  if (placesWithImages.length === 0) {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`;
    return new NextResponse(emptyXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  // Generar XML del sitemap de imágenes
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${placesWithImages
  .map((place) => {
    const placeUrl = `${baseUrl}/${place.category}/${toSlug(place.province)}/${place.slug}`;
    const geoLocation = `${place.city}, ${place.province}, España`;
    
    // Generar entradas para cada imagen (máximo 3 imágenes por lugar para mantener tamaño razonable)
    const images = (place.photo_urls || [])
      .slice(0, IMAGES_PER_PLACE)
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

