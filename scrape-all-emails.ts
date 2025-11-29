/**
 * Script para extraer emails de las webs de los lugares
 * Versión con credenciales hardcoded para ejecución inmediata
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Credenciales de AWS Amplify (las que funcionan)
const SUPABASE_URL = 'https://zzycxijexoxrjpijslsb.supabase.co';
const SUPABASE_KEY = 'your_supabase_anon_key_here';

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
  '@instagram.com'
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
    
    // 2. Buscar en texto
    const pageText = $('body').text();
    const emails = extractEmails(pageText);
    if (emails.length > 0) {
      return { email: emails[0], source: 'webpage' };
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
  console.log('\n🔍 CASI CINCO - Email Scraper');
  console.log('================================\n');
  
  // Obtener estadísticas
  const { data: allPlaces } = await supabase
    .from('places')
    .select('id, website, email', { count: 'exact' });
  
  const total = allPlaces?.length || 0;
  const withWebsite = allPlaces?.filter(p => p.website).length || 0;
  const withEmail = allPlaces?.filter(p => p.email).length || 0;
  const pending = withWebsite - withEmail;
  
  console.log('📊 Estadísticas:');
  console.log(`   Total lugares: ${total}`);
  console.log(`   Con website: ${withWebsite} (${((withWebsite/total)*100).toFixed(1)}%)`);
  console.log(`   Con email: ${withEmail} (${((withEmail/total)*100).toFixed(1)}%)`);
  console.log(`   Sin email: ${pending}\n`);
  
  if (pending === 0) {
    console.log('✅ ¡Todos los lugares ya tienen email!\n');
    return;
  }
  
  console.log(`🚀 Procesando ${pending} lugares...\n`);
  console.log('─'.repeat(60));
  
  let processed = 0;
  let found = 0;
  let offset = 0;
  const batchSize = 20;
  
  while (true) {
    // Obtener batch
    const { data: places } = await supabase
      .from('places')
      .select('id, name, website, city, province')
      .not('website', 'is', null)
      .is('email', null)
      .range(offset, offset + batchSize - 1);
    
    if (!places || places.length === 0) {
      break;
    }
    
    for (const place of places) {
      processed++;
      console.log(`\n[${processed}/${pending}] ${place.name}`);
      console.log(`    📍 ${place.city}, ${place.province}`);
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
      
      // Delay entre requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    offset += batchSize;
    
    console.log('\n⏳ Esperando 3 segundos antes del siguiente batch...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 RESUMEN FINAL:');
  console.log(`   Procesados: ${processed}`);
  console.log(`   Emails encontrados: ${found} (${processed > 0 ? ((found/processed)*100).toFixed(1) : 0}%)`);
  console.log(`   Sin email: ${processed - found}\n`);
  console.log('✅ Proceso completado\n');
}

main().catch(console.error);

