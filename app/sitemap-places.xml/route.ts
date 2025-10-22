import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutos

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

  // Obtener lugares desde la API pública que ya funciona en producción
  const response = await fetch(`${baseUrl}/api/places?limit=5000`, {
    cache: 'no-store',
    headers: { 'x-sitemap': '1' },
  });

  if (!response.ok) {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- api/places ${response.status} -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    return new NextResponse(emptyXml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }

  const json: any = await response.json().catch(() => null);
  const places = Array.isArray(json?.places) ? json.places : [];

  if (!places || places.length === 0) {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- no-places-from-api -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    return new NextResponse(emptyXml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${places.map((place: any) => {
    const lastmod = place.updated_at ? new Date(place.updated_at).toISOString() : new Date().toISOString();
    const priority = place.rating >= 4.8 ? '0.9' : place.rating >= 4.7 ? '0.8' : '0.7';
    return `  <url>
    <loc>${baseUrl}/${place.category}/${toSlug(place.province)}/${place.slug}</loc>
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
