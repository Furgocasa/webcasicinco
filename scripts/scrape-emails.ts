/**
 * Script para extraer emails de las webs de los lugares
 * Sin coste de APIs - scraping directo de websites públicos
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Regex para extraer emails
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

// URLs comunes de contacto
const CONTACT_PATHS = [
  '',  // Homepage
  '/contacto',
  '/contact',
  '/contacta',
  '/sobre-nosotros',
  '/about',
  '/reservas',
  '/reservations'
];

// Emails genéricos a ignorar (no son del negocio)
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

interface EmailResult {
  placeId: string;
  name: string;
  website: string;
  email: string | null;
  source: string;
  error?: string;
}

/**
 * Limpia y normaliza una URL
 */
function normalizeUrl(url: string): string {
  try {
    // Agregar https:// si no tiene protocolo
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
 * Busca emails en una página web
 */
async function scrapeEmailFromUrl(url: string): Promise<{ email: string | null; source: string }> {
  const baseUrl = normalizeUrl(url);
  
  // Intentar homepage primero
  try {
    const response = await axios.get(baseUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CasiCinco/1.0; +https://casicinco.com)'
      },
      maxRedirects: 3
    });
    
    const $ = cheerio.load(response.data);
    
    // 1. Buscar en enlaces mailto:
    const mailtoLinks = $('a[href^="mailto:"]');
    if (mailtoLinks.length > 0) {
      const href = mailtoLinks.first().attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
        if (email && !GENERIC_EMAILS.some(g => email.includes(g))) {
          return { email, source: 'homepage_mailto' };
        }
      }
    }
    
    // 2. Buscar en el texto de la página
    const pageText = $('body').text();
    const emails = extractEmails(pageText);
    if (emails.length > 0) {
      return { email: emails[0], source: 'homepage_text' };
    }
    
    // 3. Buscar enlace a página de contacto
    const contactLink = $('a[href*="contact"], a[href*="contacto"], a[href*="contacta"]').first();
    if (contactLink.length > 0) {
      const contactHref = contactLink.attr('href');
      if (contactHref) {
        const contactUrl = new URL(contactHref, baseUrl).href;
        const contactPage = await axios.get(contactUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CasiCinco/1.0; +https://casicinco.com)'
          }
        });
        
        const $contact = cheerio.load(contactPage.data);
        
        // Buscar mailto en página de contacto
        const contactMailto = $contact('a[href^="mailto:"]');
        if (contactMailto.length > 0) {
          const href = contactMailto.first().attr('href');
          if (href) {
            const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
            if (email && !GENERIC_EMAILS.some(g => email.includes(g))) {
              return { email, source: 'contact_page' };
            }
          }
        }
        
        // Buscar en texto de contacto
        const contactText = $contact('body').text();
        const contactEmails = extractEmails(contactText);
        if (contactEmails.length > 0) {
          return { email: contactEmails[0], source: 'contact_page' };
        }
      }
    }
    
  } catch (error: any) {
    // Silenciar errores de red
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return { email: null, source: 'error_network' };
    }
  }
  
  return { email: null, source: 'not_found' };
}

/**
 * Procesa un lote de lugares
 */
async function processBatch(places: any[], startIndex: number): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const currentIndex = startIndex + i + 1;
    
    console.log(`\n[${currentIndex}] Procesando: ${place.name}`);
    console.log(`    Website: ${place.website}`);
    
    try {
      const { email, source } = await scrapeEmailFromUrl(place.website);
      
      if (email) {
        console.log(`    ✅ Email encontrado: ${email} (fuente: ${source})`);
        
        // Guardar en BD
        await supabase
          .from('places')
          .update({
            email,
            email_source: source,
            email_verified: false
          })
          .eq('id', place.id);
        
        results.push({
          placeId: place.id,
          name: place.name,
          website: place.website,
          email,
          source
        });
      } else {
        console.log(`    ❌ No se encontró email (${source})`);
        results.push({
          placeId: place.id,
          name: place.name,
          website: place.website,
          email: null,
          source
        });
      }
      
    } catch (error: any) {
      console.log(`    ⚠️ Error: ${error.message}`);
      results.push({
        placeId: place.id,
        name: place.name,
        website: place.website,
        email: null,
        source: 'error',
        error: error.message
      });
    }
    
    // Delay respetuoso entre requests (2 segundos)
    if (i < places.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

/**
 * Genera reporte CSV
 */
function generateCSV(results: EmailResult[]): string {
  const header = 'ID,Nombre,Website,Email,Fuente,Error\n';
  const rows = results.map(r => {
    return `"${r.placeId}","${r.name}","${r.website}","${r.email || ''}","${r.source}","${r.error || ''}"`;
  }).join('\n');
  
  return header + rows;
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const limitArg = parseInt(args[1]) || 50;
  
  console.log('\n🔍 CASI CINCO - Email Scraper');
  console.log('================================\n');
  
  if (command === 'stats') {
    // Estadísticas
    const { data: stats } = await supabase
      .from('places')
      .select('id, website, email', { count: 'exact' });
    
    const total = stats?.length || 0;
    const withWebsite = stats?.filter(p => p.website).length || 0;
    const withEmail = stats?.filter(p => p.email).length || 0;
    
    console.log(`📊 Estadísticas:`);
    console.log(`   Total lugares publicados: ${total}`);
    console.log(`   Con website: ${withWebsite} (${((withWebsite/total)*100).toFixed(1)}%)`);
    console.log(`   Con email: ${withEmail} (${((withEmail/total)*100).toFixed(1)}%)`);
    console.log(`   Sin email: ${withWebsite - withEmail}`);
    console.log(`\n💡 Potencial de scraping: ${withWebsite - withEmail} lugares\n`);
    
    return;
  }
  
  if (command === 'process') {
    console.log(`🚀 Procesando hasta ${limitArg} lugares con website pero sin email...\n`);
    
    // Obtener lugares sin email pero con website
    const { data: places, error } = await supabase
      .from('places')
      .select('id, name, website')
      .eq('published', true)
      .not('website', 'is', null)
      .is('email', null)
      .limit(limitArg);
    
    if (error) {
      console.error('❌ Error obteniendo lugares:', error);
      return;
    }
    
    if (!places || places.length === 0) {
      console.log('✅ No hay lugares pendientes de procesar\n');
      return;
    }
    
    console.log(`📋 Encontrados ${places.length} lugares para procesar\n`);
    console.log(`⏱️  Tiempo estimado: ${Math.ceil(places.length * 2 / 60)} minutos\n`);
    console.log('─'.repeat(60));
    
    const results = await processBatch(places, 0);
    
    // Generar reporte
    const csv = generateCSV(results);
    const fs = await import('fs');
    const filename = `email-scraping-report-${Date.now()}.csv`;
    fs.writeFileSync(filename, csv);
    
    // Resumen
    const found = results.filter(r => r.email).length;
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 RESUMEN:');
    console.log(`   Procesados: ${results.length}`);
    console.log(`   Emails encontrados: ${found} (${((found/results.length)*100).toFixed(1)}%)`);
    console.log(`   Sin email: ${results.length - found}`);
    console.log(`\n📄 Reporte generado: ${filename}\n`);
    
    return;
  }
  
  // Ayuda
  console.log('Uso:');
  console.log('  npm run scrape-emails stats              # Ver estadísticas');
  console.log('  npm run scrape-emails process [limit]    # Procesar lugares (default: 50)');
  console.log('\nEjemplos:');
  console.log('  npm run scrape-emails stats');
  console.log('  npm run scrape-emails process 100');
  console.log('  npm run scrape-emails process 10\n');
}

main().catch(console.error);

