import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Forzar runtime de Node.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos

/**
 * GET /api/admin/scrape-emails-batch
 * Scraping masivo - devuelve JSON con resultados
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
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Obtener lugares sin email pero con website
    const { data: places, error } = await supabase
      .from('places')
      .select('id, name, website, city, province')
      .not('website', 'is', null)
      .is('email', null)
      .range(offset, offset + limit - 1);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!places || places.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay más lugares para procesar',
        processed: 0,
        found: 0,
        results: []
      });
    }
    
    // Importar dinámicamente (solo se ejecuta en servidor, no en build)
    const axios = (await import('axios')).default;
    const cheerio = (await import('cheerio'));
    
    const results = [];
    let found = 0;
    
    for (const place of places) {
      try {
        const email = await scrapeEmail(place.website, axios, cheerio);
        
        if (email) {
          // Guardar en BD
          await supabase
            .from('places')
            .update({
              email: email.address,
              email_source: email.source,
              email_verified: false
            })
            .eq('id', place.id);
          
          found++;
          results.push({
            id: place.id,
            name: place.name,
            email: email.address,
            source: email.source,
            success: true
          });
        } else {
          results.push({
            id: place.id,
            name: place.name,
            success: false,
            reason: 'not_found'
          });
        }
        
      } catch (error: any) {
        results.push({
          id: place.id,
          name: place.name,
          success: false,
          reason: 'error',
          error: error.message
        });
      }
      
      // Delay entre requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return NextResponse.json({
      success: true,
      processed: places.length,
      found,
      offset,
      hasMore: places.length === limit,
      results
    });
    
  } catch (error: any) {
    console.error('Error en scrape-emails-batch:', error);
    return NextResponse.json({ 
      error: 'Error al buscar emails',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Helper de scraping (se ejecuta solo en runtime, no en build)
 */
async function scrapeEmail(
  website: string, 
  axios: any, 
  cheerio: any
): Promise<{ address: string; source: string } | null> {
  
  const normalizeUrl = (url: string) => {
    try {
      if (!url.startsWith('http')) url = 'https://' + url;
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url;
    }
  };
  
  const extractEmails = (html: string): string[] => {
    const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const GENERIC = ['example@', 'noreply@', 'no-reply@', 'info@example', 'webmaster@', '@google.com', '@facebook.com'];
    
    const matches = html.match(EMAIL_REGEX);
    if (!matches) return [];
    
    return matches
      .map(e => e.toLowerCase())
      .filter(e => !GENERIC.some(g => e.includes(g)))
      .filter(e => !e.includes('..') && !e.startsWith('.'));
  };
  
  const baseUrl = normalizeUrl(website);
  
  try {
    const response = await axios.get(baseUrl, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CasiCinco/1.0)' },
      maxRedirects: 3
    });
    
    const $ = cheerio.load(response.data);
    
    // 1. Buscar mailto:
    const mailto = $('a[href^="mailto:"]').first().attr('href');
    if (mailto) {
      const email = mailto.replace('mailto:', '').split('?')[0].trim();
      if (email) return { address: email, source: 'mailto' };
    }
    
    // 2. Buscar en texto
    const emails = extractEmails($('body').text());
    if (emails.length > 0) {
      return { address: emails[0], source: 'webpage' };
    }
    
  } catch (error) {
    // Silenciar errores
  }
  
  return null;
}

