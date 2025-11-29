/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // ⚠️ TEMPORAL: Exponer variables de entorno server-side explícitamente
  // TODO: Investigar por qué Next.js no las lee automáticamente en AWS Amplify
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  // Excluir cheerio y axios del bundle del cliente (solo servidor)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'undici': false,
        'cheerio': false,
        'axios': false,
      };
    }
    
    // Marcar como externos para el cliente
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push('cheerio', 'axios', 'undici');
    }
    
    return config;
  },
};

module.exports = nextConfig;
