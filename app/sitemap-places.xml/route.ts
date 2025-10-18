import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://casicinco.com';

  // Obtener todos los lugares publicados
  const { data: places } = await supabase
    .from('places')
    .select('slug, category, province, updated_at, rating, user_ratings_total')
    .eq('published', true)
    .order('rating', { ascending: false })
    .order('user_ratings_total', { ascending: false });

  if (!places || places.length === 0) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${places.map(place => {
    const lastmod = place.updated_at ? new Date(place.updated_at).toISOString() : new Date().toISOString();
    // Prioridad más alta para lugares con mejor rating
    const priority = place.rating >= 4.8 ? '0.9' : place.rating >= 4.7 ? '0.8' : '0.7';
    
    return `  <url>
    <loc>${baseUrl}/${place.category}/${place.province}/${place.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n')}
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

