import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://casicinco.com';

  // Obtener todos los posts del blog publicados
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, created_at')
    .eq('published', true)
    .lte('created_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (!posts || posts.length === 0) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts.map(post => {
    const lastmod = post.updated_at ? new Date(post.updated_at).toISOString() : new Date(post.created_at).toISOString();
    
    return `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
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

