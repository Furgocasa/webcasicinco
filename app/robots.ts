import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.casicinco.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',      // Panel de administración
        '/api/',        // Endpoints API
        '/perfil',      // Perfiles de usuario
        '/login',       // Página de login
        '/registro',    // Página de registro
        '/_next/',      // Archivos internos de Next.js
        '/private/',    // Rutas privadas
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
