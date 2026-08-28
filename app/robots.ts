import { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/utils/constants';

/** Crawlers de asistentes de IA (GEO): molde Furgocasa / ACTTAX. */
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot-Extended',
  'meta-externalagent',
];

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    '/admin/',
    '/api/',
    '/perfil',
    '/login',
    '/registro',
    '/_next/',
    '/private/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow,
      })),
    ],
    sitemap: `${getPublicSiteUrl()}/sitemap.xml`,
  };
}
