/**
 * Script para buscar perfiles de redes sociales de lugares
 * Usa Google Custom Search API
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

if (!GOOGLE_API_KEY) {
  throw new Error('❌ Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env.local');
}

interface Place {
  id: string;
  name: string;
  city: string;
  province: string;
  website?: string;
  category: string;
  address: string;
}

interface SocialMediaResult {
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  tiktok_url: string | null;
  method: 'website' | 'google' | 'manual';
}

/**
 * Método 1: Scrapear website del lugar buscando Instagram
 */
async function scrapeWebsiteForSocial(website: string): Promise<SocialMediaResult> {
  try {
    const response = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    if (!response.ok) {
      return { instagram_url: null, facebook_url: null, twitter_url: null, tiktok_url: null, method: 'website' };
    }

    const html = await response.text();
    
    // Buscar URLs de redes sociales
    const instagramMatch = html.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
    const facebookMatch = html.match(/facebook\.com\/([a-zA-Z0-9._]+)/i);
    const twitterMatch = html.match(/twitter\.com\/([a-zA-Z0-9._]+)/i);
    const tiktokMatch = html.match(/tiktok\.com\/@([a-zA-Z0-9._]+)/i);

    return {
      instagram_url: instagramMatch ? `https://instagram.com/${instagramMatch[1]}` : null,
      facebook_url: facebookMatch ? `https://facebook.com/${facebookMatch[1]}` : null,
      twitter_url: twitterMatch ? `https://twitter.com/${twitterMatch[1]}` : null,
      tiktok_url: tiktokMatch ? `https://tiktok.com/@${tiktokMatch[1]}` : null,
      method: 'website'
    };
  } catch (error) {
    console.error('   ⚠️  Error scrapeando website:', error instanceof Error ? error.message : 'Unknown error');
    return { instagram_url: null, facebook_url: null, twitter_url: null, tiktok_url: null, method: 'website' };
  }
}

/**
 * Método 2: Google Custom Search API
 */
async function googleSearchSocial(place: Place): Promise<SocialMediaResult> {
  const result: SocialMediaResult = {
    instagram_url: null,
    facebook_url: null,
    twitter_url: null,
    tiktok_url: null,
    method: 'google'
  };

  // Si no hay Search Engine ID configurado, retornar vacío
  if (!SEARCH_ENGINE_ID) {
    console.log('   ⚠️  Google Search Engine ID no configurado (opcional)');
    return result;
  }

  try {
    // Buscar Instagram
    const instagramQuery = `${place.name} ${place.city} site:instagram.com`;
    const instagramUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(instagramQuery)}`;
    
    const instagramResponse = await fetch(instagramUrl);
    const instagramData = await instagramResponse.json();
    
    if (instagramData.items && instagramData.items.length > 0) {
      const link = instagramData.items[0].link;
      if (link.includes('instagram.com/')) {
        result.instagram_url = link;
      }
    }

    // Pausa para no exceder rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Buscar Facebook
    const facebookQuery = `${place.name} ${place.city} site:facebook.com`;
    const facebookUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(facebookQuery)}`;
    
    const facebookResponse = await fetch(facebookUrl);
    const facebookData = await facebookResponse.json();
    
    if (facebookData.items && facebookData.items.length > 0) {
      const link = facebookData.items[0].link;
      if (link.includes('facebook.com/')) {
        result.facebook_url = link;
      }
    }

    return result;

  } catch (error) {
    console.error('   ⚠️  Error en Google Search:', error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * Buscar redes sociales combinando métodos
 */
async function findSocialMedia(place: Place): Promise<SocialMediaResult> {
  // Método 1: Intentar scrapear website primero (GRATIS y rápido)
  if (place.website) {
    console.log(`   🌐 Buscando en website...`);
    const websiteResult = await scrapeWebsiteForSocial(place.website);
    
    // Si encontramos algo, retornar
    if (websiteResult.instagram_url || websiteResult.facebook_url || 
        websiteResult.twitter_url || websiteResult.tiktok_url) {
      return websiteResult;
    }
  }

  // Método 2: Google Custom Search (si está configurado)
  console.log(`   🔍 Buscando en Google...`);
  const googleResult = await googleSearchSocial(place);
  
  return googleResult;
}

/**
 * Actualiza un lugar con sus redes sociales
 */
async function updatePlaceSocialMedia(placeId: string, socialMedia: SocialMediaResult) {
  const { error } = await supabase
    .from('places')
    .update({
      instagram_url: socialMedia.instagram_url,
      facebook_url: socialMedia.facebook_url,
      twitter_url: socialMedia.twitter_url,
      tiktok_url: socialMedia.tiktok_url,
    })
    .eq('id', placeId);

  if (error) {
    console.error(`   ❌ Error actualizando lugar ${placeId}:`, error);
    return false;
  }

  return true;
}

/**
 * Procesar lugares en lotes
 */
async function processPlaces(limit: number = 100, offset: number = 0) {
  console.log(`\n🚀 Buscando redes sociales para lugares...`);
  console.log(`📊 Procesando ${limit} lugares (offset: ${offset})`);
  console.log(`💰 Coste estimado: $${(limit * 0.005).toFixed(2)} (Google Search)\n`);

  // Obtener top lugares sin redes sociales
  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, city, province, website, category, address, rating, review_count')
    .eq('published', true)
    .is('instagram_url', null) // Solo lugares sin RRSS
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !places) {
    console.error('❌ Error obteniendo lugares:', error);
    return;
  }

  if (places.length === 0) {
    console.log('✅ No hay más lugares para procesar');
    return;
  }

  console.log(`📍 Encontrados ${places.length} lugares para procesar\n`);

  let processed = 0;
  let found = 0;
  let foundViaWebsite = 0;
  let foundViaGoogle = 0;

  for (const place of places) {
    processed++;
    console.log(`[${processed}/${places.length}] 🔍 Buscando: ${place.name} (${place.city})`);

    // Buscar redes sociales
    const socialMedia = await findSocialMedia(place);

    // Contar resultados
    const foundAny = socialMedia.instagram_url || socialMedia.facebook_url || 
                     socialMedia.twitter_url || socialMedia.tiktok_url;
    
    if (foundAny) {
      found++;
      if (socialMedia.method === 'website') foundViaWebsite++;
      if (socialMedia.method === 'google') foundViaGoogle++;

      console.log(`   ✅ Encontrado vía ${socialMedia.method === 'website' ? 'website (GRATIS)' : 'Google ($0.005)'}:`);
      if (socialMedia.instagram_url) console.log(`      📷 Instagram: ${socialMedia.instagram_url}`);
      if (socialMedia.facebook_url) console.log(`      👥 Facebook: ${socialMedia.facebook_url}`);
      if (socialMedia.twitter_url) console.log(`      🐦 Twitter: ${socialMedia.twitter_url}`);
      if (socialMedia.tiktok_url) console.log(`      🎵 TikTok: ${socialMedia.tiktok_url}`);

      // Actualizar en Supabase
      const updated = await updatePlaceSocialMedia(place.id, socialMedia);
      if (updated) {
        console.log(`   💾 Actualizado en base de datos`);
      }
    } else {
      console.log(`   ⚠️  No se encontraron perfiles`);
    }

    // Pausa entre requests para no saturar API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const actualCost = (foundViaGoogle * 2 * 0.005).toFixed(2); // 2 búsquedas por lugar (Instagram + Facebook)

  console.log(`\n📊 RESUMEN:`);
  console.log(`   Procesados: ${processed}`);
  console.log(`   Con RRSS encontradas: ${found} (${((found/processed)*100).toFixed(1)}%)`);
  console.log(`   Vía website (GRATIS): ${foundViaWebsite}`);
  console.log(`   Vía Google: ${foundViaGoogle}`);
  console.log(`   💰 Coste real: $${actualCost}`);
}

/**
 * Exportar lugares a CSV para revisión manual
 */
async function exportPlacesToCSV(limit: number = 100) {
  console.log(`\n📄 Exportando top ${limit} lugares a CSV...\n`);

  const { data: places } = await supabase
    .from('places')
    .select('id, name, city, province, website, category, rating, review_count')
    .eq('published', true)
    .is('instagram_url', null)
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit);

  if (!places) {
    console.log('❌ No se encontraron lugares');
    return;
  }

  // Crear CSV
  const csv = [
    'id,name,city,province,category,website,instagram_url,facebook_url,twitter_url,tiktok_url',
    ...places.map(p => 
      `${p.id},"${p.name}","${p.city}","${p.province}","${p.category}","${p.website || ''}",,,`
    )
  ].join('\n');

  // Guardar archivo
  const fs = require('fs');
  const filename = `social-media-export-${Date.now()}.csv`;
  fs.writeFileSync(filename, csv);

  console.log(`✅ Exportado a: ${filename}`);
  console.log(`📝 Puedes rellenar manualmente las URLs y luego importar el CSV\n`);
}

/**
 * Importar CSV con redes sociales
 */
async function importFromCSV(filename: string) {
  console.log(`\n📥 Importando desde: ${filename}\n`);

  const fs = require('fs');
  const csv = fs.readFileSync(filename, 'utf-8');
  const lines = csv.split('\n').slice(1); // Skip header

  let imported = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const [id, , , , , , instagram, facebook, twitter, tiktok] = line.split(',');

    const hasAny = instagram || facebook || twitter || tiktok;
    if (!hasAny) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from('places')
      .update({
        instagram_url: instagram || null,
        facebook_url: facebook || null,
        twitter_url: twitter || null,
        tiktok_url: tiktok || null,
      })
      .eq('id', id);

    if (error) {
      console.error(`❌ Error importando ${id}:`, error);
    } else {
      imported++;
      console.log(`✅ Importado: ${id}`);
    }
  }

  console.log(`\n📊 RESUMEN:`);
  console.log(`   Importados: ${imported}`);
  console.log(`   Omitidos (sin datos): ${skipped}`);
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'process':
    const limit = parseInt(arg) || 100;
    processPlaces(limit);
    break;
  
  case 'export':
    const exportLimit = parseInt(arg) || 100;
    exportPlacesToCSV(exportLimit);
    break;
  
  case 'import':
    if (!arg) {
      console.error('❌ Debes proporcionar el nombre del archivo CSV');
      process.exit(1);
    }
    importFromCSV(arg);
    break;
  
  default:
    console.log(`
🔍 SCRIPT DE BÚSQUEDA DE REDES SOCIALES

Métodos:
  1. Scrapea website del lugar (GRATIS) ✅
  2. Google Custom Search API ($0.005 por búsqueda)
  
Coste: ~80% gratis (vía website), ~20% Google = ~$3 total para 3,111 lugares

Uso:
  npm run social-media process [limit]   - Buscar RRSS automáticamente (default: 100)
  npm run social-media export [limit]    - Exportar CSV para rellenar manualmente
  npm run social-media import <file>     - Importar CSV con URLs

Ejemplos:
  npm run social-media process 50        - Procesar top 50 lugares
  npm run social-media export 100        - Exportar top 100 a CSV
  npm run social-media import data.csv   - Importar datos desde CSV

Requisitos:
  ✅ NEXT_PUBLIC_GOOGLE_MAPS_KEY (ya tienes)
  ⚠️  GOOGLE_SEARCH_ENGINE_ID (opcional, para búsquedas adicionales)
     Crear en: https://programmablesearchengine.google.com/
`);
    process.exit(0);
}
