import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    
    // 3. Página de contacto
    const contactLink = $('a[href*="contact"], a[href*="contacto"]').first();
    if (contactLink.length > 0) {
      const contactHref = contactLink.attr('href');
      if (contactHref) {
        const contactUrl = new URL(contactHref, baseUrl).href;
        const contactPage = await axios.get(contactUrl, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CasiCinco/1.0; +https://casicinco.com)'
          }
        });
        
        const $contact = cheerio.load(contactPage.data);
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
        
        const contactText = $contact('body').text();
        const contactEmails = extractEmails(contactText);
        if (contactEmails.length > 0) {
          return { email: contactEmails[0], source: 'contact_page' };
        }
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

/**
 * GET /api/admin/scrape-emails-stream
 * Scraping masivo con Server-Sent Events para logs en tiempo real
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('No autenticado', { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  
  // Crear stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      
      // Helper para enviar logs
      const sendLog = (type: string, message: string, data?: any) => {
        const log = {
          type,
          message,
          timestamp: new Date().toISOString(),
          ...data
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`));
      };
      
      try {
        // 1. Obtener lugares
        sendLog('info', '🔍 Buscando lugares con website pero sin email...');
        
        const { data: places, error } = await supabase
          .from('places')
          .select('id, name, website, city, province')
          .not('website', 'is', null)
          .is('email', null)
          .limit(limit);
        
        if (error) {
          sendLog('error', `❌ Error: ${error.message}`);
          controller.close();
          return;
        }
        
        if (!places || places.length === 0) {
          sendLog('info', '✅ No hay lugares pendientes de procesar');
          controller.close();
          return;
        }
        
        const total = places.length;
        sendLog('info', `📋 Encontrados ${total} lugares para procesar`);
        sendLog('info', `⏱️  Tiempo estimado: ${Math.ceil(total * 2 / 60)} minutos`);
        sendLog('info', '─'.repeat(60));
        
        let found = 0;
        let processed = 0;
        
        // 2. Procesar cada lugar
        for (const place of places) {
          processed++;
          
          sendLog('processing', `[${processed}/${total}] ${place.name}`, {
            progress: Math.round((processed / total) * 100),
            processed,
            total,
            found
          });
          
          sendLog('info', `    📍 ${place.city}, ${place.province}`);
          sendLog('info', `    🌐 ${place.website}`);
          
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
              sendLog('success', `    ✅ Email encontrado: ${email} (${source})`, {
                email,
                source,
                placeId: place.id,
                placeName: place.name
              });
            } else {
              sendLog('warning', `    ❌ No se encontró email (${source})`);
            }
            
          } catch (error: any) {
            sendLog('error', `    ⚠️ Error: ${error.message}`);
          }
          
          // Delay entre requests
          if (processed < total) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        // 3. Resumen final
        sendLog('info', '\n' + '─'.repeat(60));
        sendLog('summary', '📊 RESUMEN FINAL', {
          total: processed,
          found,
          notFound: processed - found,
          percentage: ((found / processed) * 100).toFixed(1)
        });
        sendLog('info', `   Procesados: ${processed}`);
        sendLog('info', `   Emails encontrados: ${found} (${((found/processed)*100).toFixed(1)}%)`);
        sendLog('info', `   Sin email: ${processed - found}`);
        
        sendLog('complete', '✅ Proceso completado');
        
      } catch (error: any) {
        sendLog('error', `❌ Error general: ${error.message}`);
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

