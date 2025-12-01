/**
 * Utilidades para extraer emails de websites
 * Se usa durante la indexación para capturar emails automáticamente
 * ⚠️ SERVER ONLY - No se puede usar desde componentes cliente
 */

import 'server-only';

// Regex para extraer emails
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

// Emails genéricos a ignorar
const GENERIC_EMAILS = [
  'example@',
  'noreply@',
  'no-reply@',
  'info@example',
  'contact@example',
  'admin@example',
  'webmaster@',
  'privacy@',
  '@sentry.io',
  '@google.com',
  '@facebook.com',
  '@twitter.com',
  '@instagram.com',
  '@wix.com',
  '@wordpress.com',
  '@shopify.com'
];

/**
 * Extrae emails de un HTML
 */
function extractEmails(html: string): string[] {
  const emails: string[] = [];
  const matches = html.match(EMAIL_REGEX);
  
  if (matches) {
    for (const email of matches) {
      const lowerEmail = email.toLowerCase();
      const isGeneric = GENERIC_EMAILS.some(generic => lowerEmail.includes(generic));
      if (isGeneric) continue;
      if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) continue;
      emails.push(email.toLowerCase());
    }
  }
  
  return [...new Set(emails)];
}

/**
 * Normaliza una URL para scraping
 */
function normalizeUrl(url: string): string {
  try {
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
}

/**
 * Intenta extraer un email de una URL
 * @param url URL del sitio web
 * @returns Email encontrado o null
 */
export async function scrapeEmailFromWebsite(url: string): Promise<string | null> {
  if (!url) return null;
  
  const baseUrl = normalizeUrl(url);
  
  try {
    // Dynamic imports to avoid webpack issues
    const axios = (await import('axios')).default;
    const cheerio = await import('cheerio');
    
    const response = await axios.get(baseUrl, {
      timeout: 5000, // 5 segundos timeout (rápido para no ralentizar indexación)
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CasiCinco/1.0; +https://casicinco.com)'
      },
      maxRedirects: 2
    });
    
    const $ = cheerio.load(response.data);
    
    // 1. Buscar mailto: (más confiable)
    const mailtoLinks = $('a[href^="mailto:"]');
    if (mailtoLinks.length > 0) {
      const href = mailtoLinks.first().attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
        if (email && !GENERIC_EMAILS.some(g => email.includes(g))) {
          return email;
        }
      }
    }
    
    // 2. Buscar en el texto de la página
    const pageText = $('body').text();
    const emails = extractEmails(pageText);
    if (emails.length > 0) {
      return emails[0];
    }
    
    return null;
    
  } catch (error) {
    // No logueamos errores para no saturar logs durante indexación masiva
    return null;
  }
}

/**
 * Versión batch para procesar múltiples URLs en paralelo
 * @param urls Array de URLs a scrapear
 * @param maxConcurrent Máximo de requests concurrentes (default: 5)
 * @returns Map de URL → email o null
 */
export async function scrapeEmailsBatch(
  urls: string[], 
  maxConcurrent: number = 5
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  
  // Procesar en batches para no saturar
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const promises = batch.map(async url => {
      const email = await scrapeEmailFromWebsite(url);
      return { url, email };
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ url, email }) => {
      results.set(url, email);
    });
    
    // Pequeño delay entre batches
    if (i + maxConcurrent < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

