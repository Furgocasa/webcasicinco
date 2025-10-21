require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para hacer petición HTTP/HTTPS
function fetchWebsite(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: timeout
    };

    const req = protocol.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Seguir redirecciones
        return fetchWebsite(res.headers.location, timeout)
          .then(resolve)
          .catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Lista de palabras/patrones a excluir de Instagram
const INSTAGRAM_BLACKLIST = [
  'share', 'explore', 'rsrc.php', 'reel', 'tv', 'stories', 
  'accounts', 'direct', 'p/', 'embed', 'api', 'static',
  'oauth', 'login', 'signup', 'developer'
];

// Validar si un username de Instagram es válido
function isValidInstagramUsername(username) {
  if (!username || username.length < 2) return false;
  
  // Verificar contra blacklist
  const lowerUsername = username.toLowerCase();
  if (INSTAGRAM_BLACKLIST.some(blocked => lowerUsername.includes(blocked))) {
    return false;
  }
  
  // Solo debe contener letras, números, puntos y guiones bajos
  if (!/^[a-zA-Z0-9._]+$/.test(username)) return false;
  
  // No debe ser solo números o un solo carácter
  if (/^\d+$/.test(username) || username.length === 1) return false;
  
  return true;
}

// Extraer URLs de redes sociales del HTML
function extractSocialMedia(html, placeName) {
  const social = {
    instagram: null,
    facebook: null,
    twitter: null,
    tiktok: null
  };

  if (!html) return social;

  // Instagram
  const instagramPatterns = [
    /instagram\.com\/([a-zA-Z0-9._]+)/gi,
    /instagr\.am\/([a-zA-Z0-9._]+)/gi
  ];
  
  for (const pattern of instagramPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const username = match[1];
      if (isValidInstagramUsername(username)) {
        social.instagram = `https://instagram.com/${username}`;
        break;
      }
    }
    if (social.instagram) break;
  }

  // Facebook
  const facebookPatterns = [
    /facebook\.com\/([a-zA-Z0-9._-]+)/gi,
    /fb\.com\/([a-zA-Z0-9._-]+)/gi
  ];
  
  for (const pattern of facebookPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const page = match[1];
      if (page && !page.includes('sharer') && !page.includes('dialog')) {
        social.facebook = `https://facebook.com/${page}`;
        break;
      }
    }
    if (social.facebook) break;
  }

  // Twitter
  const twitterPattern = /twitter\.com\/([a-zA-Z0-9._]+)/gi;
  const twitterMatches = html.matchAll(twitterPattern);
  for (const match of twitterMatches) {
    const username = match[1];
    if (username && !username.includes('share') && !username.includes('intent')) {
      social.twitter = `https://twitter.com/${username}`;
      break;
    }
  }

  // TikTok
  const tiktokPattern = /tiktok\.com\/@?([a-zA-Z0-9._]+)/gi;
  const tiktokMatches = html.matchAll(tiktokPattern);
  for (const match of tiktokMatches) {
    social.tiktok = `https://tiktok.com/@${match[1]}`;
    break;
  }

  return social;
}

async function scrapeSocialMedia() {
  console.log('🔍 Iniciando scraping de redes sociales...\n');

  // 1. Obtener todos los lugares con website
  console.log('📥 Cargando lugares con website...');
  
  let allPlaces = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, website, instagram_url, facebook_url, twitter_url, tiktok_url')
      .not('website', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('❌ Error:', error);
      break;
    }

    if (data && data.length > 0) {
      allPlaces = [...allPlaces, ...data];
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ ${allPlaces.length} lugares con website encontrados\n`);

  // Filtrar solo los que no tienen redes sociales ya
  const placesToScrape = allPlaces.filter(p => 
    !p.instagram_url && !p.facebook_url && !p.twitter_url && !p.tiktok_url
  );

  console.log(`🎯 ${placesToScrape.length} lugares sin redes sociales (a scrapear)`);
  console.log(`✅ ${allPlaces.length - placesToScrape.length} lugares ya tienen redes sociales\n`);

  if (placesToScrape.length === 0) {
    console.log('✨ Todos los lugares con website ya tienen sus redes sociales');
    return;
  }

  // 2. Scrapear cada website
  let processed = 0;
  let updated = 0;
  let errors = 0;
  const stats = {
    instagram: 0,
    facebook: 0,
    twitter: 0,
    tiktok: 0
  };

  console.log(`🚀 Comenzando scraping de ${placesToScrape.length} websites...\n`);
  console.log('⏱️  Esto puede tardar varios minutos...\n');

  for (const place of placesToScrape) {
    processed++;
    
    try {
      // Mostrar progreso cada 50 lugares
      if (processed % 50 === 0 || processed === 1) {
        console.log(`📊 Progreso: ${processed}/${placesToScrape.length} (${Math.round(processed/placesToScrape.length*100)}%)`);
        console.log(`   ✅ Actualizados: ${updated} | ❌ Errores: ${errors}`);
        console.log(`   📸 Instagram: ${stats.instagram} | 👍 Facebook: ${stats.facebook} | 🐦 Twitter: ${stats.twitter} | 🎵 TikTok: ${stats.tiktok}\n`);
      }

      // Normalizar URL
      let websiteUrl = place.website.trim();
      if (!websiteUrl.startsWith('http')) {
        websiteUrl = 'https://' + websiteUrl;
      }

      // Fetch website
      const html = await fetchWebsite(websiteUrl, 8000);
      
      // Extraer redes sociales
      const social = extractSocialMedia(html, place.name);

      // Si encontramos algo, actualizar BD
      if (social.instagram || social.facebook || social.twitter || social.tiktok) {
        const updateData = {};
        if (social.instagram) {
          updateData.instagram_url = social.instagram;
          stats.instagram++;
        }
        if (social.facebook) {
          updateData.facebook_url = social.facebook;
          stats.facebook++;
        }
        if (social.twitter) {
          updateData.twitter_url = social.twitter;
          stats.twitter++;
        }
        if (social.tiktok) {
          updateData.tiktok_url = social.tiktok;
          stats.tiktok++;
        }

        // Actualizar Supabase
        const { error: updateError } = await supabase
          .from('places')
          .update(updateData)
          .eq('id', place.id);

        if (updateError) {
          console.error(`❌ Error actualizando ${place.name}:`, updateError.message);
          errors++;
        } else {
          updated++;
        }
      }

      // Delay para no saturar
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      errors++;
      // No mostrar todos los errores, solo cada 100
      if (errors % 100 === 0) {
        console.log(`⚠️  ${errors} errores acumulados (timeouts, websites caídos, etc.)`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ SCRAPING COMPLETADO');
  console.log('='.repeat(80));
  console.log(`\n📊 RESULTADOS FINALES:\n`);
  console.log(`   Total procesado: ${processed} lugares`);
  console.log(`   ✅ Actualizados: ${updated} lugares`);
  console.log(`   ❌ Errores/Sin redes: ${errors}\n`);
  console.log(`📱 REDES SOCIALES ENCONTRADAS:\n`);
  console.log(`   📸 Instagram: ${stats.instagram} perfiles`);
  console.log(`   👍 Facebook: ${stats.facebook} páginas`);
  console.log(`   🐦 Twitter: ${stats.twitter} cuentas`);
  console.log(`   🎵 TikTok: ${stats.tiktok} perfiles\n`);
  console.log(`💡 Porcentaje de éxito: ${Math.round(updated/processed*100)}%\n`);
}

scrapeSocialMedia().catch(console.error);


