/**
 * Helper para scraping de emails desde websites
 * Usado durante la indexación de lugares
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

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
  '@instagram.com'
];

/**
 * Extrae emails de un texto HTML
 */
function extractEmails(html: string): string[] {
  const emails: string[] = [];
  const matches = html.match(EMAIL_REGEX);
  
  if (matches) {
    for (const email of matches) {
      const lowerEmail = email.toLowerCase();
      
      // Filtrar emails genéricos
      const isGeneric = GENERIC_EMAILS.some(generic => lowerEmail.includes(generic));
      if (isGeneric) continue;
      
      // Filtrar emails que parecen inválidos
      if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) continue;
      
      emails.push(email.toLowerCase());
    }
  }
  
  return [...new Set(emails)]; // Eliminar duplicados
}

/**
 * Normaliza una URL
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
 * Busca email en una URL (versión rápida para indexación)
 * Timeout reducido: 5 segundos
 */
export async function scrapeEmailFromWebsite(
  website: string
): Promise<{ email: string | null; source: string }> {
  if (!website) {
    return { email: null, source: 'no_website' };
  }
  
  const baseUrl = normalizeUrl(website);
  
  try {
    const response = await axios.get(baseUrl, {
      timeout: 5000, // 5 segundos máximo
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CasiCinco/1.0; +https://casicinco.com)'
      },
      maxRedirects: 2
    });
    
    const $ = cheerio.load(response.data);
    
    // 1. Buscar en enlaces mailto: (más confiable)
    const mailtoLinks = $('a[href^="mailto:"]');
    if (mailtoLinks.length > 0) {
      const href = mailtoLinks.first().attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
        if (email && !GENERIC_EMAILS.some(g => email.includes(g))) {
          return { email, source: 'mailto' };
        }
      }
    }
    
    // 2. Buscar en el texto de la página (footer, contacto, etc.)
    const pageText = $('body').text();
    const emails = extractEmails(pageText);
    if (emails.length > 0) {
      return { email: emails[0], source: 'webpage' };
    }
    
  } catch (error: any) {
    // Silenciar errores (timeout, conexión, etc.)
    return { email: null, source: 'error' };
  }
  
  return { email: null, source: 'not_found' };
}

/**
 * Versión con retry para casos donde el email es crítico
 */
export async function scrapeEmailWithRetry(
  website: string,
  maxRetries: number = 2
): Promise<{ email: string | null; source: string }> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await scrapeEmailFromWebsite(website);
    
    if (result.email || result.source !== 'error') {
      return result;
    }
    
    // Si fue error de red, esperar antes de reintentar
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return { email: null, source: 'error_after_retries' };
}

