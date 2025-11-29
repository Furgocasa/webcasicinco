import { NextRequest, NextResponse } from 'next/server';
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
 * Busca email en una URL
 */
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
    
    // 1. Buscar en enlaces mailto:
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
    
    // 2. Buscar en el texto de la página
    const pageText = $('body').text();
    const emails = extractEmails(pageText);
    if (emails.length > 0) {
      return { email: emails[0], source: 'webpage' };
    }
    
    // 3. Buscar enlace a página de contacto
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
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return { email: null, source: 'error_network' };
    }
    return { email: null, source: 'error' };
  }
  
  return { email: null, source: 'not_found' };
}

/**
 * POST /api/admin/scrape-email
 * Scraping de email para un lugar específico
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { placeId } = body;
    
    if (!placeId) {
      return NextResponse.json({ error: 'placeId requerido' }, { status: 400 });
    }
    
    // Obtener el lugar
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('id, name, website')
      .eq('id', placeId)
      .single();
    
    if (placeError || !place) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    }
    
    if (!place.website) {
      return NextResponse.json({ 
        success: false, 
        message: 'Este lugar no tiene website' 
      }, { status: 200 });
    }
    
    // Scraping del email
    console.log(`🔍 Buscando email para: ${place.name}`);
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
        .eq('id', placeId);
      
      console.log(`✅ Email encontrado: ${email}`);
      
      return NextResponse.json({
        success: true,
        email,
        source,
        message: `Email encontrado: ${email}`
      });
    } else {
      console.log(`❌ No se encontró email (${source})`);
      
      return NextResponse.json({
        success: false,
        source,
        message: source === 'error_network' 
          ? 'Error de conexión con el website' 
          : 'No se encontró email en el website'
      });
    }
    
  } catch (error: any) {
    console.error('Error en scrape-email:', error);
    return NextResponse.json({ 
      error: 'Error al buscar email',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/scrape-email/batch
 * Scraping masivo de emails
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Obtener lugares sin email pero con website
    const { data: places, error } = await supabase
      .from('places')
      .select('id, name, website')
      .not('website', 'is', null)
      .is('email', null)
      .limit(limit);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const total = places?.length || 0;
    const results = [];
    let found = 0;
    
    for (const place of places || []) {
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
        results.push({ 
          id: place.id, 
          name: place.name, 
          email, 
          source,
          success: true 
        });
      } else {
        results.push({ 
          id: place.id, 
          name: place.name, 
          source,
          success: false 
        });
      }
      
      // Delay entre requests
      if (places && places.indexOf(place) < places.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return NextResponse.json({
      success: true,
      total,
      found,
      percentage: total > 0 ? ((found / total) * 100).toFixed(1) : 0,
      results
    });
    
  } catch (error: any) {
    console.error('Error en scrape-email batch:', error);
    return NextResponse.json({ 
      error: 'Error al buscar emails',
      details: error.message 
    }, { status: 500 });
  }
}

