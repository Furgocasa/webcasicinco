import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://casicinco.com';

  const categories = ['restaurante', 'hotel', 'bar', 'cafe'];

  // Obtener todas las provincias únicas con lugares publicados
  const { data: provinces } = await supabase
    .from('places')
    .select('province, category')
    .eq('published', true);

  if (!provinces || provinces.length === 0) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      }
    );
  }

  // Crear un Set de combinaciones únicas de categoría + provincia
  const categoryProvinceSet = new Set<string>();
  
  provinces.forEach(place => {
    if (place.province && place.category) {
      categoryProvinceSet.add(`${place.category}|${place.province}`);
    }
  });

  // Convertir a array de URLs
  const categoryProvinceUrls = Array.from(categoryProvinceSet).map(key => {
    const [category, province] = key.split('|');
    return {
      url: `${baseUrl}/${category}/${province}`,
      category,
      province
    };
  });

  const lastmod = new Date().toISOString();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryProvinceUrls.map(item => `  <url>
    <loc>${item.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

// Revalidar cada hora
export const revalidate = 3600;

