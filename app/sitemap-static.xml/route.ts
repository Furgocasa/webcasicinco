import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://casicinco.com';
  
  const staticPages = [
    { url: baseUrl, priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/mapa`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/blog`, priority: '0.9', changefreq: 'daily' },
    { url: `${baseUrl}/ruta`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/restaurante`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/hotel`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/bar`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/cafeteria`, priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/metodologia`, priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/pricing`, priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/contacto`, priority: '0.5', changefreq: 'monthly' },
    { url: `${baseUrl}/privacidad`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/terminos`, priority: '0.3', changefreq: 'yearly' },
    { url: `${baseUrl}/cookies`, priority: '0.3', changefreq: 'yearly' },
  ];

  const lastmod = new Date().toISOString();
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

