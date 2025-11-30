import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hora

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.casicinco.com';
  const PLACES_PER_PAGE = 500;

  // Contar total de lugares con imágenes
  const { count, error } = await supabase
    .from('places')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)
    .not('photo_urls', 'is', null);

  if (error) {
    console.error('Error contando lugares con imágenes:', error);
    // Retornar index con solo la página 1 como fallback
    const fallbackIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-images.xml?page=1</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
    return new NextResponse(fallbackIndex, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  const totalPlacesWithImages = count || 0;
  const totalPages = Math.ceil(totalPlacesWithImages / PLACES_PER_PAGE);

  console.log(`✅ Images Sitemap Index - Total lugares con imágenes: ${totalPlacesWithImages}, Páginas: ${totalPages}`);

  // Generar sitemap index con todas las páginas
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: totalPages }, (_, i) => i + 1)
  .map(
    (pageNum) => `  <sitemap>
    <loc>${baseUrl}/sitemap-images.xml?page=${pageNum}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return new NextResponse(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

