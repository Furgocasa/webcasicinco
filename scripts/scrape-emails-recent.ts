/**
 * Extrae emails de lugares agregados en las últimas 48 horas.
 * Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function scrapeEmailFromUrl(url: string): Promise<{ email: string | null; source: string }> {
  const baseUrl = normalizeUrl(url);
  
  try {
    const response = await axios.get(baseUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CasiCinco/1.0; +https://casicinco.com)'
      },
      maxRedirects: 3
    });
    
    const $ = cheerio.load(response.data);
    
    // 1. Buscar mailto:
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
    
    // 2. Buscar en texto visible
    const pageText = $('body').text();
    const emails = extractEmails(pageText);
    if (emails.length > 0) {
      return { email: emails[0], source: 'webpage' };
    }
    
    // 3. Intentar página de contacto
    const contactLink = $('a[href*="contact"]').first().attr('href');
    if (contactLink) {
      const contactUrl = contactLink.startsWith('http') ? contactLink : `${baseUrl}${contactLink}`;
      try {
        const contactResponse = await axios.get(contactUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CasiCinco/1.0; +https://casicinco.com)'
          }
        });
        const $contact = cheerio.load(contactResponse.data);
        const contactEmails = extractEmails($contact('body').text());
        if (contactEmails.length > 0) {
          return { email: contactEmails[0], source: 'contact_page' };
        }
      } catch {
        // Ignorar error de página de contacto
      }
    }
    
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return { email: null, source: 'error_network' };
    }
    return { email: null, source: 'error' };
  }
  
  return { email: null, source: 'not_found' };
}

async function main() {
  console.log('\n🔍 CASI CINCO - Email Scraper (Lugares Recientes)');
  console.log('===================================================\n');
  
  // Calcular fecha de hace 48 horas
  const twoDaysAgo = new Date();
  twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
  const cutoffDate = twoDaysAgo.toISOString();
  
  console.log(`📅 Buscando lugares creados después de: ${new Date(cutoffDate).toLocaleString('es-ES')}\n`);
  
  // Obtener lugares recientes sin email
  const { data: recentPlaces, error } = await supabase
    .from('places')
    .select('id, name, website, email, city, province, created_at')
    .not('website', 'is', null)
    .gte('created_at', cutoffDate)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error obteniendo lugares:', error);
    return;
  }
  
  if (!recentPlaces || recentPlaces.length === 0) {
    console.log('ℹ️  No hay lugares recientes con website\n');
    return;
  }
  
  const total = recentPlaces.length;
  const withEmail = recentPlaces.filter(p => p.email).length;
  const pending = total - withEmail;
  
  console.log('📊 Estadísticas:');
  console.log(`   Lugares recientes (48h): ${total}`);
  console.log(`   Ya tienen email: ${withEmail}`);
  console.log(`   Sin email: ${pending}\n`);
  
  if (pending === 0) {
    console.log('✅ ¡Todos los lugares recientes ya tienen email!\n');
    return;
  }
  
  console.log(`🚀 Procesando ${pending} lugares...\n`);
  console.log('─'.repeat(70));
  
  let processed = 0;
  let found = 0;
  let skipped = 0;
  
  for (const place of recentPlaces) {
    // Saltar si ya tiene email
    if (place.email) {
      skipped++;
      continue;
    }
    
    processed++;
    const createdDate = new Date(place.created_at).toLocaleString('es-ES');
    
    console.log(`\n[${processed}/${pending}] ${place.name}`);
    console.log(`    📍 ${place.city}, ${place.province}`);
    console.log(`    📅 Creado: ${createdDate}`);
    console.log(`    🌐 ${place.website}`);
    
    try {
      const { email, source } = await scrapeEmailFromUrl(place.website);
      
      if (email) {
        // Guardar en BD
        await supabase
          .from('places')
          .update({
            email,
            email_source: source,
            email_verified: false
          })
          .eq('id', place.id);
        
        found++;
        console.log(`    ✅ Email encontrado: ${email} (${source})`);
      } else {
        console.log(`    ❌ No se encontró email (${source})`);
      }
      
    } catch (error: any) {
      console.log(`    ⚠️ Error: ${error.message}`);
    }
    
    // Delay entre requests para no saturar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '─'.repeat(70));
  console.log('\n📊 RESUMEN FINAL:');
  console.log(`   Total lugares recientes: ${total}`);
  console.log(`   Procesados: ${processed}`);
  console.log(`   Saltados (ya tenían email): ${skipped}`);
  console.log(`   Emails encontrados: ${found} (${processed > 0 ? ((found/processed)*100).toFixed(1) : 0}%)`);
  console.log(`   Sin email: ${processed - found}\n`);
  console.log('✅ Proceso completado\n');
}

main().catch(console.error);

