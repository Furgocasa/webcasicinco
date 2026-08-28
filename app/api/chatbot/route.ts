import { NextRequest, NextResponse } from 'next/server';
import { chatbotResponse } from '@/lib/ai/openai';
import { createClient } from '@/lib/supabase/server';
import { getCityAndProvinceFromCoords } from '@/lib/google/geocoding';
import { CITIES_BY_PROVINCE } from '@/lib/indexation/cities-database';

// ---------------------------------------------
// Tools del agente (búsqueda en BD)
// ---------------------------------------------
type SearchParams = {
  category?: string;
  city?: string;
  province?: string;
  provinces?: string[];
  limit: number;
  excludeCity?: string;
  isNationalRanking?: boolean;
  textSearch?: string; // 🆕 Búsqueda textual en ai_description para subcategorías (cocina mexicana, italiana, etc.)
  priceLevel?: number; // 🆕 Filtro por nivel de precio (1=barato, 2=medio, 3=caro)
  userCoords?: { lat: number; lng: number }; // 🆕 Coordenadas GPS para búsqueda por proximidad
  radiusKm?: number; // 🆕 Radio de búsqueda en km
};

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  restaurante: ['restaurante', 'restaurantes', 'comer', 'cocina', 'tapas', 'asador', 'parrilla', 'gastronomía', 'gastronómico', 'donde como', 'sitio para comer', 'hambre'],
  hotel: ['hotel', 'hoteles', 'alojamiento', 'alojamientos', 'hostal', 'albergue', 'resort', 'parador', 'dormir', 'donde duermo', 'pernoctar', 'hospedaje', 'apartamento', 'apartamentos', 'apartamentos turísticos', 'apartamentos turisticos', 'donde alojarme', 'donde quedarse'],
  spa: ['spa', 'spas', 'balneario', 'wellness', 'termas', 'relax', 'relajarse'],
  bar: ['bar', 'bares', 'pub', 'coctelería', 'cocteleria', 'cocktail', 'copa', 'copas', 'cerveza'],
};

const REGION_TO_PROVINCES: Record<string, string[]> = {
  andalucía: ['Sevilla','Málaga','Cádiz','Córdoba','Granada','Huelva','Jaén','Almería'],
  andalucia: ['Sevilla','Málaga','Cádiz','Córdoba','Granada','Huelva','Jaén','Almería'],
  comunidad_valenciana: ['Valencia','Castellón','Alicante'],
  valencia: ['Valencia','Castellón','Alicante'],
  cataluña: ['Barcelona','Tarragona','Girona','Lleida'],
  cataluna: ['Barcelona','Tarragona','Girona','Lleida'],
  madrid: ['Madrid'],
  murcia: ['Murcia'],
};

const NEARBY_BY_PROVINCE: Record<string, string[]> = {
  madrid: ['Toledo','Segovia','Guadalajara','Ávila'],
  murcia: ['Alicante','Almería','Albacete'],
  valencia: ['Castellón','Alicante','Murcia'],
  sevilla: ['Cádiz','Huelva','Córdoba','Málaga'],
  almería: ['Granada','Murcia','Málaga'],
  alicante: ['Valencia','Murcia','Castellón'],
  barcelona: ['Tarragona','Girona','Lleida'],
  málaga: ['Cádiz','Granada','Sevilla','Córdoba'],
};

// Capital por provincia para poder excluir la capital cuando el usuario pida "fuera de la capital"
const CAPITAL_BY_PROVINCE: Record<string, string> = {
  'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Valencia': 'Valencia', 'Alicante': 'Alicante', 'Castellón': 'Castellón',
  'Sevilla': 'Sevilla', 'Málaga': 'Málaga', 'Cádiz': 'Cádiz', 'Córdoba': 'Córdoba', 'Granada': 'Granada', 'Huelva': 'Huelva',
  'Jaén': 'Jaén', 'Almería': 'Almería', 'Murcia': 'Murcia', 'Tarragona': 'Tarragona', 'Girona': 'Girona', 'Lleida': 'Lleida',
  'Toledo': 'Toledo', 'Segovia': 'Segovia', 'Guadalajara': 'Guadalajara', 'Ávila': 'Ávila'
};

function detectCategory(message: string): string | undefined {
  const msg = message.toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some(w => msg.includes(w))) return cat;
  }
  return undefined;
}

function foldText(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function applyLocationTypos(msg: string): string {
  const pairs: Array<[RegExp, string]> = [
    [/\blameria\b/gi, 'almería'],
    [/\balmeria\b/gi, 'almería'],
    [/\bgranda\b/gi, 'granada'],
    [/\bnijar\b/gi, 'níjar'],
    [/\brestautrates\b/gi, 'restaurantes'],
    [/\bport\s+valis\b/gi, 'port balís'],
    [/\bport\s+balis\b/gi, 'port balís'],
    [/\bllavaneras\b/gi, 'llavaneres'],
  ];
  return pairs.reduce((out, [re, to]) => out.replace(re, to), msg);
}

type TownIndexItem = {
  needle: string;
  city?: string;
  province: string;
  sameName: boolean;
  narrowTown?: boolean;
};

const EXTRA_TOWNS: Array<{ aliases: string[]; city: string; province: string }> = [
  {
    aliases: ['port balís', 'sant andreu de llavaneres', 'llavaneres'],
    city: 'Sant Andreu de Llavaneres',
    province: 'Barcelona',
  },
];

function buildTownIndex(): TownIndexItem[] {
  const items: TownIndexItem[] = [];
  for (const data of Object.values(CITIES_BY_PROVINCE)) {
    items.push({ needle: foldText(data.name), province: data.name, sameName: true });
    for (const c of data.cities) {
      const sameName = foldText(c.name) === foldText(data.name);
      if (sameName) continue;
      items.push({ needle: foldText(c.name), city: c.name, province: data.name, sameName: false });
    }
  }
  for (const town of EXTRA_TOWNS) {
    for (const alias of town.aliases) {
      items.push({
        needle: foldText(alias),
        city: town.city,
        province: town.province,
        sameName: false,
        narrowTown: true,
      });
    }
  }
  return items.sort((a, b) => b.needle.length - a.needle.length);
}

const TOWN_INDEX = buildTownIndex();

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMentionedLocation(msg: string): { city?: string; province?: string; narrowTown?: boolean } {
  const folded = foldText(msg);
  for (const item of TOWN_INDEX) {
    if (item.needle.length < 4) continue;
    const re = new RegExp(`(?:^|[^a-zñ])${escapeRegExp(item.needle)}(?:$|[^a-zñ])`);
    if (!re.test(folded)) continue;
    if (item.sameName) return { province: item.province };
    return { city: item.city, province: item.province, narrowTown: item.narrowTown };
  }
  return {};
}

function isGreetingOnly(message: string): boolean {
  return /^(¡?hola!?|buenas|hey|hi|hello|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches)[\s!¡.?]*$/i.test(
    message.trim()
  );
}

function isWhereAmI(message: string): boolean {
  return /\b(d[oó]nde estoy|cu[aá]l es mi ubicaci[oó]n|sabes (en )?qu[eé] localidad estoy|caul es mi ubicacion)\b/i.test(
    message
  );
}

function isIncompleteLocationAsk(message: string): boolean {
  return /\bmejores?\s+\w+\s+de\s*$/i.test(message.trim());
}

type ChatIntent = {
  category?: string;
  city?: string;
  province?: string;
  region?: string;
  topN?: number;
  excludeCapital?: boolean;
  explicitProvince?: boolean;
  textSearch?: string;
  usesLocation?: boolean;
  priceLevel?: number;
  userCoords?: { lat: number; lng: number };
  radiusKm?: number;
  skipSearch?: boolean;
  searchKind?: 'greeting' | 'whereami' | 'incomplete' | 'needslocation';
  narrowTown?: boolean;
};

function parseIntent(
  message: string,
  detectedLocation?: { city: string; province: string; region: string },
  userCoords?: { lat: number; lng: number } // 🆕 Coordenadas GPS directas
): ChatIntent {
  const msg = applyLocationTypos(message.toLowerCase());
  const category = detectCategory(msg);
  
  // 🆕 Detectar términos de búsqueda textual para subcategorías de cocina
  let textSearch: string | undefined;
  
  const cuisineKeywords: Record<string, string[]> = {
    // Cocinas por país/región
    'mexicana': ['mexicana', 'mexicano', 'mejicana', 'mejicano', 'tacos', 'burritos', 'tex-mex', 'azteca', 'quesadilla', 'enchilada'],
    'italiana': ['italiana', 'italiano', 'pizza', 'pasta', 'pizzería', 'pizzeria', 'trattoria', 'osteria', 'ristorante', 'lasaña', 'carbonara', 'risotto'],
    'japonesa': ['japonesa', 'japones', 'japonés', 'sushi', 'ramen', 'yakitori', 'izakaya', 'nikkei', 'tempura', 'udon', 'sashimi', 'maki'],
    'china': ['china', 'chino', 'wok', 'dim sum', 'cantones', 'cantonés', 'pato pekinés', 'arroz tres delicias'],
    'india': ['india', 'indio', 'hindu', 'hindú', 'curry', 'tandoori', 'masala', 'tikka'],
    'francesa': ['francesa', 'frances', 'francés', 'bistro', 'brasserie', 'foie', 'ratatouille'],
    'peruana': ['peruana', 'peruano', 'ceviche', 'pisco', 'causa', 'anticucho'],
    'argentina': ['argentina', 'argentino', 'pampa', 'choripán', 'empanada argentina'],
    'árabe': ['árabe', 'arabe', 'libanesa', 'libanes', 'kebab', 'falafel', 'shawarma', 'hummus'],
    'tailandesa': ['tailandesa', 'tailandes', 'tailandés', 'pad thai', 'tom yum', 'curry tailandés'],
    'coreana': ['coreana', 'coreano', 'kimchi', 'bibimbap', 'bulgogi', 'barbacoa coreana'],
    'mediterránea': ['mediterránea', 'mediterranea', 'levantina'],
    'fusión': ['fusión', 'fusion', 'contemporánea', 'contemporanea', 'creativa', 'autor', 'vanguardia', 'gastronómica'],
    
    // Tipo de comida/establecimiento
    'mariscos': ['mariscos', 'marisco', 'pescado', 'marisquería', 'marisqueria', 'pescadería', 'pescaderia', 'pulpo', 'gambas', 'langosta', 'bogavante', 'centollo', 'mejillones', 'almejas', 'navajas', 'percebes', 'cigalas'],
    'carne': ['asador', 'parrilla', 'carne', 'brasa', 'churrasco', 'churrascaria', 'chuleta', 'chuletón', 'entrecot', 'solomillo', 'costilla', 'cordero', 'cochinillo'],
    'tapas': ['tapas', 'pinchos', 'pintxos', 'taberna', 'mesón', 'tasca', 'bar de tapas'],
    'vegetariana': ['vegetariana', 'vegetariano', 'vegano', 'vegana', 'vegan', 'plant-based', 'healthy'],
    'hamburguesa': ['hamburguesa', 'hamburguesería', 'hamburgueseria', 'burger', 'smash burger', 'hamburguesas'],
    'sushi': ['sushi', 'sashimi', 'maki', 'nigiri', 'japonés', 'japonesa'],
    'rice': ['arroz', 'paella', 'arroz negro', 'arroz caldoso', 'arrocería', 'arroceria'],
    'cocido': ['cocido', 'puchero', 'olla', 'cuchara', 'legumbres'],
    'setas': ['setas', 'hongos', 'boletus', 'níscalos', 'seta de cardo', 'trufa', 'micología'],
    'postres': ['postres', 'pastelería', 'pasteleria', 'repostería', 'reposteria', 'dulces', 'tartas', 'chocolate'],
    'bocadillos': ['bocadillo', 'bocadillos', 'bocatería', 'bocateria', 'sandwich', 'sándwich'],
    'brunch': ['brunch', 'desayuno', 'breakfast', 'tostadas'],
    'cerveza': ['cerveza', 'cervezas', 'cervecería', 'cerveceria', 'beer'],
    'vino': ['vino', 'vinoteca', 'enoteca', 'bodega', 'maridaje'],
  };

  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    if (keywords.some(k => msg.includes(k))) {
      textSearch = cuisine;
      break;
    }
  }
  
  // 💰 Detectar nivel de precio
  let priceLevel: number | undefined;
  const priceKeywords = {
    barato: ['barato', 'baratos', 'económico', 'económicos', 'economico', 'economicos', 'low cost', 'asequible', 'asequibles', 'precio bajo'],
    medio: ['medio', 'medios', 'moderado', 'moderados', 'razonable', 'razonables', 'precio medio'],
    caro: ['caro', 'caros', 'premium', 'lujo', 'exclusivo', 'exclusivos', 'gourmet', 'alto standing', 'precio alto']
  };
  
  if (priceKeywords.barato.some(k => msg.includes(k))) priceLevel = 1; // € o €€
  if (priceKeywords.medio.some(k => msg.includes(k))) priceLevel = 2; // €€
  if (priceKeywords.caro.some(k => msg.includes(k))) priceLevel = 3; // €€€ o €€€€
  
  // Detectar número específico: "top 5", "mejores 10", etc.
  const topMatch = msg.match(/(?:top|mejores?)\s*(\d+)/);
  let topN = topMatch ? Math.max(1, Math.min(50, parseInt(topMatch[1], 10))) : undefined;
  
  // Si no hay número pero está en plural → mínimo 3-5
  if (!topN) {
    const pluralWords = ['restaurantes', 'hoteles', 'spas', 'bares', 'lugares', 'sitios', 'alojamientos', 'apartamentos'];
    const hasPlural = pluralWords.some(w => msg.includes(w));
    if (hasPlural) {
      topN = 5; // Default para plural
    }
  }

  // Extraer región/provincia por palabra literal
  let region: string | undefined;
  for (const r of Object.keys(REGION_TO_PROVINCES)) {
    if (msg.includes(r)) { region = r; break; }
  }

  const provDe = msg.match(/provincia\s+de\s+([a-záéíóúñ]+)\b/);
  let explicitProvince: boolean | undefined;
  let province: string | undefined;
  let city: string | undefined;
  if (provDe?.[1]) {
    const mentioned = findMentionedLocation(provDe[1]);
    province = mentioned.province || (provDe[1].charAt(0).toUpperCase() + provDe[1].slice(1));
    explicitProvince = true;
  }

  const mentioned = findMentionedLocation(msg);
  if (!province) province = mentioned.province;
  city = mentioned.city;
  const narrowTown = mentioned.narrowTown;

  const cityKeywords = /\b(ciudad de|capital de|centro de|downtown|casco|barrio)\b/i;
  const provinceKeywords = /\b(provincia de|toda|resto de|fuera de la capital|alrededores de)\b/i;

  // Mismo nombre ciudad/provincia (Girona, Murcia…): por defecto toda la provincia
  if (province && !city && CITIES_BY_PROVINCE[province]) {
    if (cityKeywords.test(msg)) {
      city = province;
      province = undefined;
    } else if (provinceKeywords.test(msg) || explicitProvince) {
      city = undefined;
    }
  }

  // "cerca de" es proximidad a un sitio, no "fuera de la capital"
  const excludeCapital = /fuera de la capital|resto de la provincia|sin capital|pueblos|municipios|afueras de|alrededores de|extrarradio|fuera de la ciudad|provincia de \w+ pero no en|cerca pero no en/.test(msg);
  const finalCity = explicitProvince ? undefined : city;

  const proximityKeywords = [
    'cerca de mí', 'cerca de mi', 'cerca de mi ubicación', 'cerca de mi ubicacion',
    'aquí', 'aqui', 'por aquí', 'por aqui', 'en mi zona',
    'alrededor', 'cercano', 'cercanos',
    'por donde estoy', 'en esta zona', 'en la zona', 'por la zona',
    'mi ubicación', 'mi ubicacion', 'ubicación actual', 'ubicacion actual',
  ];
  const hasNearMe = proximityKeywords.some((keyword) => msg.includes(keyword));
  const hasExplicitLocation = Boolean(finalCity || province || region);

  // Ciudad/provincia dicha en el mensaje gana siempre al GPS
  if (hasExplicitLocation) {
    return {
      category,
      city: finalCity,
      province,
      region,
      topN,
      excludeCapital,
      explicitProvince,
      textSearch,
      usesLocation: false,
      priceLevel,
      narrowTown,
    };
  }

  // "cerca de mí" o pregunta genérica con GPS → radio real
  if (userCoords && (hasNearMe || Boolean(detectedLocation))) {
    const radiusKm = hasNearMe ? 10 : 50;
    return {
      category,
      city: detectedLocation?.city || undefined,
      province: detectedLocation?.province || undefined,
      region: detectedLocation?.region || undefined,
      topN,
      excludeCapital,
      explicitProvince,
      textSearch,
      usesLocation: true,
      priceLevel,
      userCoords,
      radiusKm,
    };
  }

  return { category, city: finalCity, province, region, topN, excludeCapital, explicitProvince, textSearch, usesLocation: false, priceLevel };
}

function refineIntent(
  intent: ChatIntent,
  message: string,
  history: { role: string; content: string }[],
  hasGps: boolean
): ChatIntent {
  if (isGreetingOnly(message)) {
    return { skipSearch: true, searchKind: 'greeting' };
  }
  if (isWhereAmI(message) && !intent.category) {
    return { ...intent, skipSearch: true, searchKind: 'whereami' };
  }
  if (isIncompleteLocationAsk(message) && !intent.city && !intent.province) {
    return { skipSearch: true, searchKind: 'incomplete', category: intent.category };
  }

  let next = { ...intent };
  const userMsgs = history.filter((h) => h.role === 'user').map((h) => h.content);
  for (let i = userMsgs.length - 1; i >= 0; i--) {
    const prev = parseIntent(userMsgs[i]);
    if (!next.category && prev.category) next.category = prev.category;
    if (!next.city && !next.province && !next.usesLocation && (prev.city || prev.province)) {
      next.city = prev.city;
      next.province = prev.province;
      next.narrowTown = prev.narrowTown;
    }
    if (next.category && (next.city || next.province || next.usesLocation || hasGps)) break;
  }

  // "cerca de mí" sin GPS: usar la última ciudad del hilo
  if (!next.usesLocation && !next.city && !next.province && !hasGps) {
    const nearMe = /cerca de m[ií]|mi ubicaci[oó]n|por donde estoy|\bcerca\b/i.test(message);
    if (nearMe) {
      for (let i = userMsgs.length - 1; i >= 0; i--) {
        const prev = parseIntent(userMsgs[i]);
        if (prev.city || prev.province) {
          next.city = prev.city;
          next.province = prev.province;
          next.narrowTown = prev.narrowTown;
          break;
        }
      }
    }
    if (!next.city && !next.province && nearMe) {
      next.skipSearch = true;
      next.searchKind = 'needslocation';
    }
  }

  return next;
}

async function searchPlacesTool(supabase: any, params: SearchParams) {
  // 🆕 Si hay coordenadas GPS, usar búsqueda por proximidad real con PostGIS
  if (params.userCoords) {
    console.log(`📍 Búsqueda por proximidad: lat=${params.userCoords.lat}, lng=${params.userCoords.lng}, radio=${params.radiusKm || 50}km`);
    
    const { data, error } = await supabase.rpc('search_places_by_proximity', {
      user_lat: params.userCoords.lat,
      user_lng: params.userCoords.lng,
      radius_meters: (params.radiusKm || 50) * 1000, // Convertir km a metros
      place_category: params.category || null,
      price_level_filter: params.priceLevel || null,
      text_search_term: params.textSearch || null,
      result_limit: params.limit
    });
    
    if (error) {
      console.error('❌ Error en búsqueda por proximidad:', error);
      // Fallback a búsqueda normal si falla
    } else {
      console.log(`✅ Encontrados ${data?.length || 0} lugares por proximidad`);
      return data || [];
    }
  }
  
  // Búsqueda normal por ciudad/provincia (texto)
  // 🆕 SIEMPRE incluir coordenadas para poder calcular distancias si hay GPS del usuario
  let query = supabase
    .from('places')
    .select('id, name, slug, category, rating, review_count, city, province, region, address, phone, website, ai_description, subcategory, price_level, latitude, longitude')
    .eq('published', true);

  if (params.category) query = query.eq('category', params.category);
  if (params.city) query = query.ilike('city', params.city);
  if (params.province) query = query.eq('province', params.province);
  if (params.provinces && params.provinces.length > 0) query = query.in('province', params.provinces);
  if (params.excludeCity) query = query.neq('city', params.excludeCity);

  // 🆕 BÚSQUEDA TEXTUAL POR SUBCATEGORÍA (cocina mexicana, italiana, japonesa, etc.)
  if (params.textSearch) {
    // Primero intentar buscar en subcategory (exacto, más rápido)
    // Si no hay, buscar en ai_description, name, ai_review_summary (texto)
    query = query.or(`subcategory.eq.${params.textSearch},ai_description.ilike.%${params.textSearch}%,name.ilike.%${params.textSearch}%,ai_review_summary.ilike.%${params.textSearch}%`);
  }

  // 💰 FILTRO POR NIVEL DE PRECIO
  if (params.priceLevel) {
    if (params.priceLevel === 1) {
      // Económico: price_level 1 o 2
      query = query.in('price_level', [1, 2]);
    } else if (params.priceLevel === 2) {
      // Medio: price_level 2
      query = query.eq('price_level', 2);
    } else if (params.priceLevel === 3) {
      // Caro: price_level 3 o 4
      query = query.in('price_level', [3, 4]);
    }
  }

  // Sistema de tiers flexible:
  // - Búsquedas específicas (ciudad/provincia): mínimo 50 reseñas (Tier Bronce)
  // - Ranking nacional/fallback: mínimo 500 reseñas (Tier Platino)
  const minReviews = params.isNationalRanking ? 500 : 50;
  query = query.gte('review_count', minReviews);

  const { data } = await query
    // Orden: primero rating desc, después nº reseñas desc
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(params.limit);

  // 🆕 CALCULAR distance_km para TODOS los lugares si tenemos GPS del usuario
  // Esto permite a la IA interpretar cualquier mención de distancia libremente
  if (data && params.userCoords) {
    return data.map((place: any) => {
      if (place.latitude && place.longitude) {
        // Fórmula de Haversine para calcular distancia entre dos puntos GPS
        const R = 6371; // Radio de la Tierra en km
        const dLat = (place.latitude - params.userCoords!.lat) * Math.PI / 180;
        const dLon = (place.longitude - params.userCoords!.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(params.userCoords!.lat * Math.PI / 180) * Math.cos(place.latitude * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance_km = R * c;
        
        return {
          ...place,
          distance_km: Math.round(distance_km * 100) / 100 // Redondear a 2 decimales
        };
      }
      return place;
    });
  }

  return data || [];
}


// Caché de configuración en memoria
let cachedConfig: any = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minuto

// Rate limiting simple en memoria (para producción, usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = { maxRequests: 20, windowMs: 60000 }; // 20 mensajes por minuto

// Configuración por defecto
const DEFAULT_CHATBOT_CONFIG = {
  enabled: true,
  model: 'gpt-5.6-terra',
  temperature: 0.25,
  maxTokens: 1500,
  maxHistoryMessages: 12,
};

function resolveChatbotModel(saved?: string | null): string {
  const m = saved?.trim();
  if (m && /^gpt-5\.6/i.test(m)) return m;
  return 'gpt-5.6-terra';
}

function validateChatbotConfig(config: any): any {
  return {
    enabled: typeof config?.enabled === 'boolean' ? config.enabled : true,
    model: resolveChatbotModel(config?.model),
    temperature: Math.max(0, Math.min(2, config?.temperature || 0.25)),
    maxTokens: Math.max(1500, Math.min(4000, config?.maxTokens || 1500)),
    maxHistoryMessages: Math.max(2, Math.min(50, config?.maxHistoryMessages || 12)),
    systemPrompt: config?.systemPrompt,
  };
}

async function getChatbotConfig(supabase: any): Promise<any> {
  const now = Date.now();
  if (cachedConfig && now - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }

  const { data: configData } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'chatbot_config')
    .single();

  const rawConfig = configData?.value || DEFAULT_CHATBOT_CONFIG;
  cachedConfig = validateChatbotConfig(rawConfig);
  configCacheTime = now;
  return cachedConfig;
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, session_id, location } = body; // 📍 Añadir location

    // Validación mejorada de entrada
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ 
        error: 'Mensaje demasiado largo (máx. 500 caracteres)' 
      }, { status: 400 });
    }

    if (message.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Mensaje demasiado corto (mín. 3 caracteres)' 
      }, { status: 400 });
    }

    // Detectar spam obvio
    const spamPatterns = [
      /(.)\1{10,}/,  // Caracteres repetidos
    ];

    if (spamPatterns.some(pattern => pattern.test(message))) {
      return NextResponse.json({ 
        error: 'Mensaje no válido' 
      }, { status: 400 });
    }

    // Obtener contexto del usuario si está autenticado
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Rate limiting
    const identifier = user?.id || session_id;
    if (!checkRateLimit(identifier)) {
      return NextResponse.json({
        error: 'Demasiadas preguntas. Espera un momento y vuelve a intentarlo.',
      }, { status: 429 });
    }

    // Cargar configuración del chatbot (con caché)
    const chatbotConfig = await getChatbotConfig(supabase);

    // Verificar si el chatbot está habilitado
    if (!chatbotConfig.enabled) {
      return NextResponse.json({
        success: true,
        message: 'El chatbot está temporalmente desactivado. Por favor, intenta más tarde.',
      });
    }

    // Cargar historial de conversación desde la base de datos
    const historyLimit = chatbotConfig.maxHistoryMessages || 12;
    const { data: chatHistory, error: historyError } = await supabase
      .from('chat_history')
      .select('role, message, created_at')
      .or(user ? `user_id.eq.${user.id}` : `session_id.eq.${session_id}`)
      .eq('is_active', true) // ✅ SOLO mensajes activos (no obsoletos por reset)
      .order('created_at', { ascending: false })
      .limit(historyLimit * 2); // x2 porque incluye user + assistant

    if (historyError) {
      console.error('Error cargando historial:', historyError);
    }

    // Ordenar de más antiguo a más reciente y mapear
    const conversation_history = (chatHistory || [])
      .reverse()
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.message
      }));

    console.log(`📜 Historial cargado: ${conversation_history.length} mensajes para ${user ? 'usuario' : 'sesión'} ${user?.email || session_id}`);

    let context: any = {};

    // Detectar si es admin
    const isAdmin = user?.user_metadata?.role === 'admin';
    context.isAdmin = isAdmin;

    // Obtener conteo total de lugares (optimizado)
    const { count } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('published', true);

    context.placesCount = count || 0;
    context.places = []; // Se llenará con los candidatos después de la búsqueda
    
    console.log(`📊 Total de lugares publicados: ${count || 0}`);

    // Las estadísticas se generarán después de buscar los candidatos
    context.categoryStats = {};
    context.cities = [];
    context.provinces = [];

    // Añadir configuración al contexto
    context.chatbotConfig = chatbotConfig;

    // 📍 Procesar ubicación si está disponible
    let detectedLocation: { city: string; province: string; region: string } | undefined;
    
    if (location && location.lat && location.lng) {
      console.log(`📍 Ubicación recibida: ${location.lat}, ${location.lng}`);
      
      // Intentar geocoding para obtener ciudad/provincia real
      try {
        const geoResult = await getCityAndProvinceFromCoords(location.lat, location.lng);
        if (geoResult) {
          detectedLocation = geoResult;
          console.log(`✅ Ubicación geocodificada: ${geoResult.city}, ${geoResult.province}`);
          
          context.userLocation = {
            city: geoResult.city,
            province: geoResult.province,
            region: geoResult.region
          };
        }
      } catch (error) {
        console.warn('⚠️ Geocoding falló, usando coordenadas GPS directamente:', error);
      }
      
      // 🆕 FALLBACK CRÍTICO: Si geocoding falló, usar coordenadas GPS igualmente
      // Esto permite búsqueda por proximidad real incluso sin nombre de ciudad
      if (!detectedLocation) {
        const latFixed = Number(location.lat).toFixed(4);
        const lngFixed = Number(location.lng).toFixed(4);
        console.log('🌍 Usando coordenadas GPS sin geocoding (fallback activado)', { latFixed, lngFixed });

        detectedLocation = {
          city: '',
          province: '',
          region: ''
        };
        
        context.userLocation = {
          city: `Coordenadas GPS (${latFixed}, ${lngFixed})`,
          province: 'GPS',
          region: 'España'
        };
      }
      
      console.log(`📍 Ubicación final enviada a IA: ${context.userLocation?.city}, ${context.userLocation?.province}`);
    }

    // ---------------------------------------------
    // Agente: detectar intención y ejecutar tool
    // ---------------------------------------------
    const intent = refineIntent(
      parseIntent(message, detectedLocation, location),
      message,
      conversation_history,
      Boolean(location?.lat && location?.lng)
    );
    console.log('🎯 Intent parseado:', JSON.stringify(intent, null, 2));
    const requestedCategory = intent.category;
    const targetN = intent.topN || 5;
    const contextLimit = Math.min(targetN * 3, 100);
    const askedNational = /\bespa[nñ]a\b|\bnacional\b|todo el pa[ií]s/.test(foldText(message));
    const askedNear = /\bcerca\b|mi ubicaci[oó]n|por donde estoy|en mi zona|aqu[ií]\b/i.test(message);
    const askedLocal = Boolean(intent.city || intent.province || intent.region || intent.usesLocation || askedNear);

    let provincesFromRegion: string[] | undefined;
    if (intent.region) provincesFromRegion = REGION_TO_PROVINCES[intent.region];

    // Buscar por prioridad: 
    // 1. Proximidad GPS (si hay coordenadas y palabras clave)
    // 2. Provincia explícita/"fuera de la capital" 
    // 3. Ciudad 
    // 4. Provincia 
    // 5. Región 
    // 6. Cercano 
    // 7. Ranking nacional
    let candidates: any[] = [];
    let searchNote: string | undefined;
    const capitalToExclude = intent.excludeCapital && intent.province
      ? (CAPITAL_BY_PROVINCE[intent.province] || intent.province)
      : undefined;

    const userCoordsForSearch = location && location.lat && location.lng
      ? { lat: location.lat, lng: location.lng }
      : undefined;

    if (intent.skipSearch) {
      console.log(`⏭️ Sin búsqueda de fichas (${intent.searchKind})`);
    } else if (intent.userCoords && intent.usesLocation) {
      console.log(`🌍 Búsqueda por proximidad GPS activada`);
      candidates = await searchPlacesTool(supabase, {
        category: requestedCategory,
        textSearch: intent.textSearch,
        priceLevel: intent.priceLevel,
        userCoords: intent.userCoords,
        radiusKm: intent.radiusKm,
        limit: contextLimit,
      });
      console.log(`📍 Encontrados ${candidates.length} lugares por proximidad GPS`);
      if (candidates.length === 0) {
        searchNote = `No hay fichas publicadas en un radio de ${intent.radiusKm || 50} km. No ofrezcas locales a cientos de kilómetros. Di que no hay resultados cercanos y pregunta si quiere ampliar.`;
      }
    } else {
      if (intent.explicitProvince || (intent.province && intent.excludeCapital)) {
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          province: intent.province,
          excludeCity: capitalToExclude,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
        });
      }
      let cityTried = false;
      if (candidates.length === 0 && intent.city && !intent.explicitProvince) {
        cityTried = true;
        console.log(`🔍 Buscando por ciudad: ${intent.city}`);
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          city: intent.city,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
        });
        console.log(`📊 Encontrados por ciudad: ${candidates.length}`);
      }
      if (candidates.length === 0 && intent.province && !intent.narrowTown) {
        console.log(`🔍 Buscando por provincia: ${intent.province}`);
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          province: intent.province,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
        });
        console.log(`📊 Encontrados por provincia: ${candidates.length}`);
        if (cityTried && intent.city) {
          searchNote = `No hay fichas publicadas en ${intent.city}. Lo que sigue es de la provincia de ${intent.province}, no de ${intent.city}. Dilo claramente y pregunta si quiere ampliar.`;
        } else if (candidates.length && !intent.city) {
          searchNote = `La consulta es de TODA la provincia de ${intent.province}, no solo la capital. Incluye municipios distintos si hay fichas. Si piden N y hay N o más en la lista, da exactamente N. No digas que no hay más.`;
        }
      } else if (candidates.length === 0 && intent.narrowTown && intent.city) {
        searchNote = `No hay fichas publicadas en ${intent.city}. Ofrece ampliar al Maresme (p. ej. Mataró) o a la provincia de ${intent.province}; no listes la capital como si fuera ${intent.city}.`;
      }
      if (candidates.length === 0 && provincesFromRegion) {
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          provinces: provincesFromRegion,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
        });
      }
      // Ranking nacional solo si lo pidió o no hay zona. Nunca tapar un vacío local.
      if (candidates.length === 0 && requestedCategory && (askedNational || !askedLocal)) {
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
          isNationalRanking: true,
        });
      } else if (candidates.length === 0 && askedLocal) {
        const near = intent.province
          ? NEARBY_BY_PROVINCE[intent.province.toLowerCase()]
          : undefined;
        const nearTxt = near?.length
          ? ` Si el usuario acepta ampliar, puedes proponer ${near.join(', ')}.`
          : '';
        searchNote = searchNote || `No hay fichas publicadas que cumplan 4,7★ y 50+ reseñas en la zona pedida. Dilo y ofrece ampliar a municipios cercanos o a la provincia.${nearTxt} No inventes locales ni traigas otra comunidad.`;
      }
    }

    // Log de resultados de búsqueda
    console.log(`🔍 Lugares encontrados para la consulta: ${candidates.length}`);
    if (candidates.length > 0) {
      const categoryCounts = candidates.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`📊 Por categoría:`, categoryCounts);
    }

    // 🆕 Extraer provincias y ciudades de los candidatos para el contexto de OpenAI
    const provincesFromCandidates = [...new Set(candidates.map(p => p.province).filter(Boolean))];
    const citiesFromCandidates = [...new Set(candidates.map(p => p.city).filter(Boolean))];
    
    // 🆕 Construir categoryStats de los candidatos
    const categoryStatsFromCandidates = candidates.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Usar candidates como contexto específico para esta pregunta
    const startTime = Date.now();
    const turnHint =
      intent.searchKind === 'greeting'
        ? 'TURNO: saludo aislado. Saluda en una línea y pregunta si busca restaurante, hotel o bar. NO listes lugares ni retomes la búsqueda anterior.'
        : intent.searchKind === 'whereami'
          ? 'TURNO: pregunta de ubicación. Di la ciudad/provincia del GPS o la última que el usuario mencionó. NO listes restaurantes.'
          : intent.searchKind === 'incomplete'
            ? 'TURNO: la petición está incompleta (p. ej. «mejores hoteles de»). Pregunta la ciudad o provincia. NO inventes un ranking.'
            : intent.searchKind === 'needslocation'
              ? 'TURNO: pide «cerca» pero no hay GPS ni ciudad. Pide la ciudad o que comparta ubicación. NO listes un ranking nacional.'
              : undefined;

    const response = await chatbotResponse(
      message,
      conversation_history || [],
      {
        ...context,
        places: candidates.length ? candidates : context.places,
        provinces: provincesFromCandidates,  // 🆕 Provincias de los candidatos
        cities: citiesFromCandidates,        // 🆕 Ciudades de los candidatos
        categoryStats: categoryStatsFromCandidates, // 🆕 Stats de los candidatos
        searchNote,
        turnHint,
      }
    );
    const queryTimeMs = Date.now() - startTime;

    // Guardar mensaje del usuario en la base de datos
    await supabase.from('chat_history').insert({
      user_id: user?.id || null,
      session_id: !user ? session_id : null,
      role: 'user',
      message: message,
      is_active: true, // ✅ Nueva conversación = activa
    });

    // Guardar respuesta del asistente
    await supabase.from('chat_history').insert({
      user_id: user?.id || null,
      session_id: !user ? session_id : null,
      role: 'assistant',
      message: response,
      is_active: true, // ✅ Nueva conversación = activa
    });

    let logId: string | null = null;
    try {
      const { data: saved, error: analyticsError } = await supabase
        .from('chatbot_analytics')
        .insert({
          user_id: user?.id || null,
          user_email: user?.email || null,
          session_id: !user ? session_id : null,
          user_message: message,
          bot_response: response,
          conversation_context: conversation_history.slice(-6),
          detected_intent: intent,
          places_found: candidates.length,
          query_time_ms: queryTimeMs,
        })
        .select('id')
        .single();
      if (analyticsError) console.error('Error guardando analytics:', analyticsError);
      else logId = saved?.id || null;
    } catch (analyticsError) {
      console.error('Error guardando analytics:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      message: response,
      logId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en chatbot:', error);
    return NextResponse.json(
      { error: error.message || 'Error procesando mensaje' },
      { status: 500 }
    );
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Voto del usuario sobre una respuesta ya entregada. */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const logId = typeof body.logId === 'string' ? body.logId.trim() : '';
    const voto = body.voto === 'up' || body.voto === 'down' ? body.voto : body.voto === null ? null : undefined;

    if (!UUID_RE.test(logId) || voto === undefined) {
      return NextResponse.json({ error: 'logId y voto (up|down|null) son requeridos' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('chatbot_analytics')
      .update({
        voto_usuario: voto,
        votado_at: voto ? new Date().toISOString() : null,
      })
      .eq('id', logId)
      .select('id, voto_usuario')
      .maybeSingle();

    if (error) {
      console.error('No se pudo guardar voto del chatbot', error.message);
      return NextResponse.json({ error: 'No se pudo guardar el voto' }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Respuesta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, voto: data.voto_usuario });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'No se pudo guardar el voto' }, { status: 500 });
  }
}
