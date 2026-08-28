import { NextRequest, NextResponse } from 'next/server';
import { chatbotResponse } from '@/lib/ai/openai';
import { createClient } from '@/lib/supabase/server';
import { geocodeAddress, getCityAndProvinceFromCoords } from '@/lib/google/geocoding';
import { CITIES_BY_PROVINCE } from '@/lib/indexation/cities-database';
import { calculateQualityTier, type QualityTier } from '@/lib/utils/tier-calculator';

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
  useProximity?: boolean; // Solo entonces PostGIS; si no, city/provincia y opcionalmente distancia
  minRating?: number; // 🆕 Filtro por tier (diamante 4.8/1000, platino 4.8/500…)
  minReviews?: number;
  tierName?: string; // Filtrar tier exacto (oro = 200-499 reseñas, no diamante)
  textSearchTerm?: string; // Palabra concreta del usuario («asador», «ramen»)
};

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  restaurante: ['restaurante', 'restaurantes', 'comer', 'cocina', 'tapas', 'asador', 'parrilla', 'gastronomía', 'gastronómico', 'donde como', 'sitio para comer', 'hambre', 'cena', 'cenar', 'comida', 'almorzar', 'almuerzo', 'merienda'],
  hotel: ['hotel', 'hoteles', 'alojamiento', 'alojamientos', 'hostal', 'albergue', 'resort', 'parador', 'dormir', 'donde duermo', 'pernoctar', 'hospedaje', 'apartamento', 'apartamentos', 'apartamentos turísticos', 'apartamentos turisticos', 'donde alojarme', 'donde quedarse'],
  spa: ['spa', 'spas', 'balneario', 'wellness', 'termas', 'relax', 'relajarse'],
  bar: ['bar', 'bares', 'pub', 'coctelería', 'cocteleria', 'cocktail', 'copa', 'copas', 'cerveza'],
};

// Solo regiones de varias provincias. «Valencia»/«Madrid»/«Murcia» son CIUDAD, no región.
const REGION_TO_PROVINCES: Record<string, string[]> = {
  andalucía: ['Sevilla','Málaga','Cádiz','Córdoba','Granada','Huelva','Jaén','Almería'],
  andalucia: ['Sevilla','Málaga','Cádiz','Córdoba','Granada','Huelva','Jaén','Almería'],
  'comunidad valenciana': ['Valencia','Castellón','Alicante'],
  cataluña: ['Barcelona','Tarragona','Girona','Lleida'],
  cataluna: ['Barcelona','Tarragona','Girona','Lleida'],
  galicia: ['A Coruña','Lugo','Ourense','Pontevedra'],
  extremadura: ['Cáceres','Badajoz'],
  'castilla la mancha': ['Toledo','Ciudad Real','Cuenca','Guadalajara','Albacete'],
  'castilla y leon': ['León','Zamora','Salamanca','Ávila','Segovia','Soria','Burgos','Palencia','Valladolid'],
  'pais vasco': ['Vizcaya','Guipúzcoa','Álava'],
  euskadi: ['Vizcaya','Guipúzcoa','Álava'],
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    [/\bgerona\b/gi, 'girona'],
    [/\bcartajena\b/gi, 'cartagena'],
    [/\balcante\b/gi, 'alicante'],
    [/\bseviya\b/gi, 'sevilla'],
    [/\bbaladolid\b/gi, 'valladolid'],
    [/\bsantader\b/gi, 'santander'],
    [/\bmalga\b/gi, 'málaga'],
    [/\bmalaga\b/gi, 'málaga'],
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

const EXTRA_TOWNS: Array<{ aliases: string[]; city: string; province: string; lat?: number; lng?: number }> = [
  {
    aliases: ['port balís', 'sant andreu de llavaneres', 'llavaneres'],
    city: 'Sant Andreu de Llavaneres',
    province: 'Barcelona',
    lat: 41.548,
    lng: 2.483,
  },
  {
    aliases: ['el palmar', 'palmar o lugar de don juan'],
    city: 'El Palmar',
    province: 'Murcia',
    lat: 37.941,
    lng: -1.163,
  },
  { aliases: ['barranda'], city: 'Barranda', province: 'Murcia', lat: 38.0465, lng: -1.9163 },
  { aliases: ['mula'], city: 'Mula', province: 'Murcia', lat: 38.0419, lng: -1.4906 },
  { aliases: ['bullas'], city: 'Bullas', province: 'Murcia', lat: 38.0467, lng: -1.6722 },
  {
    aliases: ['caravaca', 'caravaca de la cruz'],
    city: 'Caravaca de la Cruz',
    province: 'Murcia',
    lat: 38.1056,
    lng: -1.8633,
  },
  {
    aliases: ['palma de mallorca', 'palma mallorca', 'mallorca'],
    city: 'Palma',
    province: 'Baleares',
    lat: 39.5696,
    lng: 2.6502,
  },
  { aliases: ['nerja'], city: 'Nerja', province: 'Málaga', lat: 36.748, lng: -3.874 },
  { aliases: ['mojácar', 'mojacar'], city: 'Mojácar', province: 'Almería', lat: 36.95, lng: -1.851 },
  { aliases: ['chinchón', 'chinchon'], city: 'Chinchón', province: 'Madrid', lat: 40.1406, lng: -3.4222 },
];

/** Topónimos que son dos sitios distintos: hay que preguntar cuál. */
const AMBIGUOUS_PLACES: Array<{
  needles: string[];
  label: string;
  options: Array<{ city: string; province: string; hint: string }>;
}> = [
  {
    needles: ['la alberca', 'alberca'],
    label: 'La Alberca',
    options: [
      { city: 'La Alberca', province: 'Salamanca', hint: 'el pueblo de Salamanca' },
      { city: 'La Alberca', province: 'Murcia', hint: 'la pedanía de Murcia' },
    ],
  },
];

type AmbiguousMatch =
  | { status: 'ask'; label: string; options: Array<{ city: string; province: string; hint: string }> }
  | { status: 'resolved'; city: string; province: string; label: string };

function matchAmbiguousPlace(msg: string): AmbiguousMatch | null {
  const folded = foldText(msg);
  for (const place of AMBIGUOUS_PLACES) {
    const hitNeedle = place.needles.some((n) => {
      const needle = foldText(n);
      const re = new RegExp(`(?:^|[^a-zñ])${escapeRegExp(needle)}(?:$|[^a-zñ])`);
      if (re.test(folded)) return true;
      return folded.split(/[^a-zñ]+/).some((t) => t.length >= 5 && levenshtein(t, needle) <= 1);
    });
    if (!hitNeedle) continue;
    const resolved = place.options.find((o) => folded.includes(foldText(o.province)));
    if (resolved) {
      return { status: 'resolved', city: resolved.city, province: resolved.province, label: place.label };
    }
    return { status: 'ask', label: place.label, options: place.options };
  }
  return null;
}

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

const LOCATION_STOPWORDS = new Set([
  'cerca', 'sitio', 'sitios', 'lugar', 'lugares', 'mejor', 'mejores',
  'donde', 'quiero', 'comer', 'hotel', 'hoteles', 'restaurante', 'restaurantes',
  'bar', 'bares', 'algo', 'nada', 'este', 'esta', 'para', 'como', 'cual',
  'aqui', 'alla', 'poco', 'mucho', 'todo', 'todos', 'santa', 'santo', 'san',
  'los', 'las', 'del', 'una', 'uno', 'por', 'con', 'sin', 'mas', 'muy',
  'zona', 'ciudad', 'pueblo', 'playa', 'costa', 'norte', 'sur', 'oeste',
  'centro', 'capital', 'provincia', 'comunidad', 'espana', 'españa',
]);

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function locationFromItem(item: TownIndexItem): { city?: string; province?: string; narrowTown?: boolean } {
  if (item.sameName) return { province: item.province };
  return { city: item.city, province: item.province, narrowTown: item.narrowTown };
}

function findMentionedLocation(msg: string): { city?: string; province?: string; narrowTown?: boolean } {
  const folded = foldText(msg);
  // Palma (Mallorca) ≠ Las Palmas (Canarias)
  if (/\blas\s+palmas\b/.test(folded)) {
    return { city: 'Las Palmas de Gran Canaria', province: 'Las Palmas' };
  }
  if (/\b(palma\s+de\s+mallorca|mallorca)\b/.test(folded)) {
    return { city: 'Palma', province: 'Baleares' };
  }
  if (/\bpalma\b/.test(folded) && !/\blas\s+palmas\b/.test(folded)) {
    return { city: 'Palma', province: 'Baleares' };
  }
  for (const item of TOWN_INDEX) {
    if (item.needle.length < 4) continue;
    const re = new RegExp(`(?:^|[^a-zñ])${escapeRegExp(item.needle)}(?:$|[^a-zñ])`);
    if (!re.test(folded)) continue;
    return locationFromItem(item);
  }

  // Coincidencia parcial o errata: «palmar», «palma», «murca», «gerona»
  const tokens = folded.split(/[^a-zñ]+/).filter((t) => t.length >= 4 && !LOCATION_STOPWORDS.has(t));
  let best: { item: TownIndexItem; score: number } | null = null;
  for (const token of tokens) {
    for (const item of TOWN_INDEX) {
      if (item.needle.length < 4) continue;
      const words = item.needle.split(/\s+/).filter((w) => w.length >= 4);
      const partial = words.includes(token) || (token.length >= 5 && item.needle.includes(token));
      const maxDist = token.length >= 8 ? 2 : 1;
      const dist = Math.min(
        levenshtein(token, item.needle),
        words.reduce((min, w) => Math.min(min, levenshtein(token, w)), 99)
      );
      const fuzzy = token.length >= 5 && dist <= maxDist;
      if (!partial && !fuzzy) continue;
      const score = item.needle.length * 10 - (partial ? 0 : dist);
      if (!best || score > best.score) best = { item, score };
    }
  }
  return best ? locationFromItem(best.item) : {};
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
  textSearchTerm?: string;
  usesLocation?: boolean;
  priceLevel?: number;
  userCoords?: { lat: number; lng: number };
  radiusKm?: number;
  skipSearch?: boolean;
  searchKind?: 'greeting' | 'whereami' | 'incomplete' | 'needslocation' | 'ambiguous' | 'route';
  minRating?: number;
  minReviews?: number;
  tierName?: string;
  narrowTown?: boolean;
  wantsNearby?: boolean;
  ambiguousLabel?: string;
  ambiguousOptions?: string[];
  sameNameDefault?: boolean; // «Madrid» a secas = la capital, no la provincia
  corridorFrom?: string;
  corridorTo?: string;
  routeFrom?: string;
  routeTo?: string;
};

// Umbrales reales de tier-calculator.ts: si piden «un restaurante diamante», filtrar de verdad
const TIER_FILTERS: Record<string, { minRating: number; minReviews: number }> = {
  diamante: { minRating: 4.8, minReviews: 1000 },
  platino: { minRating: 4.8, minReviews: 500 },
  oro: { minRating: 4.8, minReviews: 200 },
  plata: { minRating: 4.7, minReviews: 100 },
  bronce: { minRating: 4.7, minReviews: 50 },
};

const TIER_NAME_TO_QUALITY: Record<string, QualityTier> = {
  diamante: 'diamond',
  platino: 'platinum',
  oro: 'gold',
  plata: 'silver',
  bronce: 'bronze',
};

const TIER_RANGE_LABEL: Record<string, string> = {
  diamante: '4.8+ y 1000+ reseñas',
  platino: '4.8+ y 500-999 reseñas',
  oro: '4.8+ y 200-499 reseñas',
  plata: '4.7+ y 100-199 reseñas',
  bronce: '4.7+ y 50-99 reseñas',
};

/** Cocina detectada → forzar restaurante salvo cerveza/vino (bar) */
const BAR_CUISINE_SEARCH = new Set(['cerveza', 'vino']);

function filterByTierName(rows: any[], tierName?: string): any[] {
  if (!tierName) return rows;
  const wanted = TIER_NAME_TO_QUALITY[tierName];
  if (!wanted) return rows;
  return rows.filter(
    (r) => calculateQualityTier(r.rating || 0, r.review_count || 0) === wanted
  );
}

function applyDefaultRatingFilter(rows: any[], minRating?: number): any[] {
  const floor = minRating ?? 4.7;
  return rows.filter((r) => (r.rating || 0) >= floor);
}

function ensureCategoryForCuisine(category: string | undefined, textSearch?: string): string | undefined {
  if (!category && textSearch && !BAR_CUISINE_SEARCH.has(textSearch)) return 'restaurante';
  return category;
}

// «Voy de Madrid a Barcelona, dime un restaurante en la ruta» → eso es del planificador /ruta
const FROM_TO_RE =
  /\b(?:de|desde|voy de|vamos de|iremos de|ir de)\s+([a-záéíóúñ][a-záéíóúñ\s]{1,24}?)\s+(?:a|hasta|hacia)\s+([a-záéíóúñ][a-záéíóúñ\s]{1,24}?)(?=\s|$|[.,;?¿!])/;

function parseRouteEndpoints(msg: string): { from?: string; to?: string } {
  const m = msg.match(FROM_TO_RE);
  if (!m) return {};
  return { from: m[1].trim(), to: m[2].trim() };
}

function isRouteAsk(msg: string): boolean {
  const routeWords = /\b(en\s+(?:la\s+|mi\s+)?ruta|de\s+camino|por\s+el\s+camino|a\s+mitad\s+de\s+camino|de\s+paso|en\s+el\s+trayecto|haciendo\s+(?:la\s+)?ruta|durante\s+el\s+viaje)\b/;
  if (routeWords.test(msg)) return true;
  if (!FROM_TO_RE.test(msg)) return false;
  const travelWords = /\b(ruta|viaje|camino|trayecto|par(?:o|ar|ada|amos)|conduciendo|conducimos|coche|furgo(?:neta)?|autocaravana|km|kil[oó]metros)\b/;
  // «de Madrid a Barcelona» + pide un sitio = ruta, aunque no diga la palabra «ruta»
  return travelWords.test(msg) || Boolean(detectCategory(msg));
}

function parseBetweenPlaces(msg: string): { from: string; to: string } | null {
  const m = foldText(msg).match(
    /\bentre\s+([a-zñ][a-zñ\s]{1,28}?)\s+y\s+([a-zñ][a-zñ\s]{1,28}?)(?=\s*[.,;?¿]| \s+por\b|\s+a\b|\s+hay\b|\s+algo\b|\s+puedo\b|\s+donde\b|$)/
  );
  if (!m) return null;
  const from = m[1].trim();
  const to = m[2].trim();
  if (from.length < 3 || to.length < 3) return null;
  return { from, to };
}

function extractStatedTown(msg: string): string | undefined {
  const m = msg.match(
    /\b(?:estoy|estamos|me encuentro)\s+en\s+([a-záéíóúñ][a-záéíóúñ\s]{1,32}?)(?=\s*,|\s+un\s+pueblo|\s+pueblo\b)/i
  );
  const town = m?.[1]?.trim();
  if (!town || LOCATION_STOPWORDS.has(foldText(town))) return undefined;
  return town.replace(/\s+/g, ' ');
}

function titleCasePlace(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function parseIntent(
  message: string,
  detectedLocation?: { city: string; province: string; region: string },
  userCoords?: { lat: number; lng: number } // 🆕 Coordenadas GPS directas
): ChatIntent {
  const msg = applyLocationTypos(message.toLowerCase());
  let category = detectCategory(msg);

  // 🏆 Tier pedido por su nombre (diamante, platino, oro, plata, bronce)
  let tierName: string | undefined;
  let minRating: number | undefined;
  let minReviews: number | undefined;
  const tierMatch = msg.match(/\b(diamante|platino|oro|plata|bronce)\b/);
  if (tierMatch) {
    tierName = tierMatch[1];
    minRating = TIER_FILTERS[tierName].minRating;
    minReviews = TIER_FILTERS[tierName].minReviews;
  }

  // 🛣️ Pregunta de ruta entre dos puntos: derivar al planificador /ruta
  if (isRouteAsk(msg)) {
    const ends = parseRouteEndpoints(msg);
    return {
      category,
      skipSearch: true,
      searchKind: 'route',
      tierName,
      minRating,
      minReviews,
      routeFrom: ends.from,
      routeTo: ends.to,
    };
  }
  
  // 🆕 Detectar términos de búsqueda textual para subcategorías de cocina
  let textSearch: string | undefined;
  let textSearchTerm: string | undefined;
  
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

  // Si el usuario dice la palabra exacta de una cocina («sushi»), gana a la genérica («japonesa»)
  for (const cuisine of Object.keys(cuisineKeywords)) {
    if (msg.includes(cuisine)) {
      textSearch = cuisine;
      textSearchTerm = cuisine;
      break;
    }
  }
  if (!textSearch) {
    for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
      const hit = keywords.find((k) => msg.includes(k));
      if (hit) {
        textSearch = cuisine;
        textSearchTerm = hit;
        break;
      }
    }
  }

  category = ensureCategoryForCuisine(category, textSearch);
  
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

  const ambiguous = matchAmbiguousPlace(msg);
  if (ambiguous?.status === 'ask') {
    return {
      category,
      topN,
      textSearch,
      textSearchTerm,
      priceLevel,
      skipSearch: true,
      searchKind: 'ambiguous',
      ambiguousLabel: ambiguous.label,
      ambiguousOptions: ambiguous.options.map((o) => `${o.hint} (${o.province})`),
      tierName,
      minRating,
      minReviews,
    };
  }
  if (ambiguous?.status === 'resolved') {
    return {
      category,
      city: ambiguous.city,
      province: ambiguous.province,
      topN,
      textSearch,
      textSearchTerm,
      usesLocation: false,
      priceLevel,
      narrowTown: true,
      wantsNearby: /\b(cerca|alrededor|alrededores|inmediaciones|proximidad)\b/.test(msg),
      tierName,
      minRating,
      minReviews,
    };
  }

  // Extraer región por nombre largo (Andalucía, Cataluña…). Nunca «Valencia»/«Madrid».
  let region: string | undefined;
  const regionKeys = Object.keys(REGION_TO_PROVINCES).sort((a, b) => b.length - a.length);
  for (const r of regionKeys) {
    const re = new RegExp(`(?:^|[^a-zñ])${escapeRegExp(foldText(r))}(?:$|[^a-zñ])`);
    if (re.test(foldText(msg))) { region = r; break; }
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
  let narrowTown = mentioned.narrowTown;

  // Triana = barrio de Sevilla
  if (/\btriana\b/.test(msg)) {
    textSearch = textSearch || 'triana';
    textSearchTerm = textSearchTerm || 'triana';
    category = category || 'restaurante';
    city = city || 'Sevilla';
    province = province || 'Sevilla';
  }

  // «Estoy entre Mula y Bullas»: radio desde el punto medio, no volcar la provincia
  const between = parseBetweenPlaces(msg);
  if (between) {
    return {
      category,
      province,
      topN,
      textSearch,
      textSearchTerm,
      priceLevel,
      usesLocation: false,
      wantsNearby: true,
      narrowTown: true,
      corridorFrom: titleCasePlace(between.from),
      corridorTo: titleCasePlace(between.to),
      tierName,
      minRating,
      minReviews,
    };
  }

  // «Estoy en Barranda, un pueblo de Murcia»: el pueblo gana a la provincia
  const statedTown = extractStatedTown(msg);
  if (statedTown && (!city || foldText(statedTown) !== foldText(city))) {
    const known = findMentionedLocation(statedTown);
    city = known.city || titleCasePlace(statedTown);
    province = known.province || province;
    narrowTown = true;
  }

  const cityKeywords = /\b(ciudad de|capital de|centro de|downtown|casco|barrio)\b/i;
  const provinceKeywords = /\b(provincia de|toda la provincia|resto de|fuera de la capital|alrededores de|comunidad de)\b/i;

  // Mismo nombre ciudad/provincia (Madrid, Valencia, Murcia…): por defecto la CAPITAL.
  // Solo se abre a toda la provincia si lo piden («provincia de», «comunidad de»).
  let sameNameDefault = false;
  if (province && !city && CITIES_BY_PROVINCE[province]) {
    if (provinceKeywords.test(msg) || explicitProvince) {
      city = undefined;
    } else {
      city = province;
      sameNameDefault = true;
    }
    if (cityKeywords.test(msg)) {
      city = province;
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
  const wantsNearby = /\b(cerca|alrededor|alrededores|inmediaciones|proximidad)\b/.test(msg);
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
      textSearchTerm,
      usesLocation: false,
      priceLevel,
      narrowTown,
      wantsNearby,
      tierName,
      minRating,
      minReviews,
      sameNameDefault,
      corridorFrom: undefined,
      corridorTo: undefined,
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
      textSearchTerm,
      usesLocation: true,
      priceLevel,
      userCoords,
      radiusKm,
      tierName,
      minRating,
      minReviews,
    };
  }

  return { category, city: finalCity, province, region, topN, excludeCapital, explicitProvince, textSearch, textSearchTerm, usesLocation: false, priceLevel, tierName, minRating, minReviews };
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
  // Una pregunta de ruta no hereda Bilbao/Madrid del hilo anterior
  if (intent.searchKind === 'route' || isRouteAsk(applyLocationTypos(message.toLowerCase()))) {
    return {
      ...intent,
      skipSearch: true,
      searchKind: 'route',
      city: undefined,
      province: undefined,
      region: undefined,
      usesLocation: false,
    };
  }
  if (isWhereAmI(message) && !intent.category) {
    return { ...intent, skipSearch: true, searchKind: 'whereami' };
  }
  if (isIncompleteLocationAsk(message) && !intent.city && !intent.province) {
    return { skipSearch: true, searchKind: 'incomplete', category: intent.category };
  }

  let next = { ...intent };

  // Relajar tier si el usuario lo pide en el hilo
  if (
    /\baunque no sean (diamante|platino|oro|plata|bronce)\b|\bsin (filtro|exigencia) de tier\b|\bde cualquier tier\b|\btiers inferiores\b|\brelaja.*tier\b/i.test(
      message
    )
  ) {
    next.tierName = undefined;
    next.minRating = undefined;
    next.minReviews = undefined;
  }

  // Cambio de categoría en follow-up («¿Y hoteles?»)
  if (/\b(y )?(solo )?hoteles?\b/i.test(message) && !/\brestaurante/i.test(message)) {
    next.category = 'hotel';
  } else if (/\b(y )?(solo )?restaurantes?\b/i.test(message) && !/\bhotel/i.test(message)) {
    next.category = 'restaurante';
  } else if (/\b(y )?(solo )?bares?\b/i.test(message) && !/\brestaurante|\bhotel/i.test(message)) {
    next.category = 'bar';
  }

  if (next.searchKind !== 'ambiguous') {
    const folded = foldText(message);
    const userMsgs = history.filter((h) => h.role === 'user').map((h) => h.content);
    for (let i = userMsgs.length - 1; i >= 0; i--) {
      const prevAmb = matchAmbiguousPlace(userMsgs[i]);
      if (prevAmb?.status !== 'ask') continue;
      const resolved = prevAmb.options.find(
        (o) => folded.includes(foldText(o.province)) || folded.includes(foldText(o.hint))
      );
      if (resolved) {
        next.city = resolved.city;
        next.province = resolved.province;
        next.narrowTown = true;
        next.skipSearch = false;
        next.searchKind = undefined;
        next.ambiguousLabel = undefined;
        next.ambiguousOptions = undefined;
      }
      break;
    }
  }
  const userMsgs = history.filter((h) => h.role === 'user').map((h) => h.content);
  for (let i = userMsgs.length - 1; i >= 0; i--) {
    const prev = parseIntent(userMsgs[i]);
    if (!next.category && prev.category) next.category = prev.category;
    if (
      next.searchKind !== 'ambiguous' &&
      !next.corridorFrom &&
      !next.city &&
      !next.province &&
      !next.usesLocation &&
      (prev.city || prev.province)
    ) {
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
  if (/\b(cerca|alrededor|alrededores)\b/.test(message) && (next.city || next.province) && !next.usesLocation) {
    next.wantsNearby = true;
  }

  return next;
}

// Pueblos con el mismo nombre en dos provincias: el geocoder los confunde
const TOWN_COORDS: Array<{ city: string; province: string; lat: number; lng: number }> = [
  { city: 'La Alberca', province: 'Murcia', lat: 37.9345, lng: -1.1417 },
  { city: 'La Alberca', province: 'Salamanca', lat: 40.4894, lng: -6.1116 },
  { city: 'Caravaca de la Cruz', province: 'Murcia', lat: 38.1056, lng: -1.8633 },
  { city: 'Palma', province: 'Baleares', lat: 39.5696, lng: 2.6502 },
];

async function coordsForNamedPlace(city?: string, province?: string): Promise<{ lat: number; lng: number } | null> {
  if (city) {
    const fixed = TOWN_COORDS.find(
      (t) => foldText(t.city) === foldText(city) && (!province || foldText(t.province) === foldText(province))
    );
    if (fixed) return { lat: fixed.lat, lng: fixed.lng };
    const extra = EXTRA_TOWNS.find(
      (t) => foldText(t.city) === foldText(city) || t.aliases.some((a) => foldText(a) === foldText(city))
    );
    if (extra?.lat != null && extra.lng != null) return { lat: extra.lat, lng: extra.lng };
    for (const data of Object.values(CITIES_BY_PROVINCE)) {
      const hit = data.cities.find((c) => foldText(c.name) === foldText(city));
      if (hit) return hit.coords;
    }
  }
  const query = [city, province, 'España'].filter(Boolean).join(', ');
  if (!query || query === 'España') return null;
  try {
    const geo = await geocodeAddress(query);
    return geo.geometry.location;
  } catch {
    return null;
  }
}

// La BD tiene la misma provincia con dos grafías (castellano/cooficial):
// un .eq() a secas dejaba fuera la mitad de las fichas (p. ej. bares de Bilbao).
const PROVINCE_DB_VARIANTS: Record<string, string[]> = {
  'vizcaya': ['Vizcaya', 'Bizkaia'],
  'bizkaia': ['Vizcaya', 'Bizkaia'],
  'guipuzcoa': ['Guipúzcoa', 'Gipuzkoa'],
  'gipuzkoa': ['Guipúzcoa', 'Gipuzkoa'],
  'alava': ['Álava', 'Araba'],
  'araba': ['Álava', 'Araba'],
  'castellon': ['Castellón', 'Castelló'],
  'castello': ['Castellón', 'Castelló'],
  'lleida': ['Lleida', 'Lérida'],
  'lerida': ['Lleida', 'Lérida'],
  'baleares': ['Baleares', 'Illes Balears'],
  'illes balears': ['Baleares', 'Illes Balears'],
  'girona': ['Girona', 'Gerona'],
  'gerona': ['Girona', 'Gerona'],
  'a coruna': ['A Coruña', 'La Coruña'],
  'la coruna': ['A Coruña', 'La Coruña'],
};

function provinceVariants(province: string): string[] {
  return PROVINCE_DB_VARIANTS[foldText(province)] || [province];
}

const CITY_DB_VARIANTS: Record<string, string[]> = {
  valencia: ['Valencia', 'València'],
  'donostia / san sebastian': ['Donostia / San Sebastián', 'San Sebastián', 'Donostia'],
  palma: ['Palma', 'Palma de Mallorca'],
  caravaca: ['Caravaca de la Cruz', 'Caravaca'],
};

function citySearchNeedles(city: string): string[] {
  const folded = foldText(city);
  return (CITY_DB_VARIANTS[folded] || [city]).map((c) => c.replace(/[%_,()]/g, ' ').trim()).filter(Boolean);
}

async function searchPlacesTool(supabase: any, params: SearchParams): Promise<any[]> {
  // Radio real solo si lo pedimos (cerca de mí / cerca de un pueblo). No si hay ciudad dicha.
  if (params.useProximity && params.userCoords) {
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
      // Sin radio no hay «cerca»: mejor vacío que un ranking nacional disfrazado de proximidad
      console.error('❌ Error en búsqueda por proximidad:', error);
      return [];
    }
    console.log(`✅ Encontrados ${data?.length || 0} lugares por proximidad`);
    let rows: any[] = data || [];
    rows = applyDefaultRatingFilter(rows, params.minRating);
    rows = filterByTierName(rows, params.tierName);
    if (params.category === 'restaurante' && params.textSearch) {
      rows = rows.filter((r: any) => r.category === 'restaurante');
    }
    if (rows.length === 0 && params.priceLevel) {
      // El 80% de las fichas no tiene price_level: relajar el precio antes que devolver vacío
      const relaxed = await searchPlacesTool(supabase, { ...params, priceLevel: undefined });
      return relaxed.map((p: any) => ({ ...p, price_filter_relaxed: true }));
    }
    return rows;
  }
  
  // Búsqueda normal por ciudad/provincia (texto)
  // 🆕 SIEMPRE incluir coordenadas para poder calcular distancias si hay GPS del usuario
  let query = supabase
    .from('places')
    .select('id, name, slug, category, rating, review_count, city, province, region, address, phone, website, ai_description, subcategory, price_level, latitude, longitude')
    .eq('published', true);

  if (params.category) query = query.eq('category', params.category);
  if (params.city) {
    const needles = citySearchNeedles(params.city);
    // «El Palmar» debe pillar «El Palmar O Lugar De Don Juan»; València ≡ Valencia
    query = query.or(needles.flatMap((c) => [`city.ilike.%${c}%`, `address.ilike.%${c}%`]).join(','));
  }
  if (params.province) query = query.in('province', provinceVariants(params.province));
  if (params.provinces && params.provinces.length > 0) {
    query = query.in('province', params.provinces.flatMap(provinceVariants));
  }
  if (params.excludeCity) query = query.neq('city', params.excludeCity);

  // 🆕 BÚSQUEDA TEXTUAL POR SUBCATEGORÍA (cocina mexicana, italiana, japonesa, etc.)
  if (params.textSearch || params.textSearchTerm) {
    const terms = [...new Set([params.textSearch, params.textSearchTerm].filter(Boolean))] as string[];
    const orParts = terms.flatMap((term) => [
      `subcategory.eq.${term}`,
      `ai_description.ilike.%${term}%`,
      `name.ilike.%${term}%`,
      `ai_review_summary.ilike.%${term}%`,
    ]);
    query = query.or(orParts.join(','));
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
  // - Si el usuario pidió un tier concreto (diamante, oro…), manda su umbral
  const minReviews = Math.max(params.minReviews || 0, params.isNationalRanking ? 500 : 50);
  query = query.gte('review_count', minReviews);
  query = query.gte('rating', params.minRating ?? 4.7);

  const { data } = await query
    // Orden: primero rating desc, después nº reseñas desc
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(params.limit);

  let results: any[] = data || [];
  results = filterByTierName(results, params.tierName);
  if (params.category === 'restaurante' && params.textSearch) {
    results = results.filter((p) => p.category === 'restaurante');
  }

  // 🆕 CALCULAR distance_km para TODOS los lugares si tenemos GPS del usuario
  // Esto permite a la IA interpretar cualquier mención de distancia libremente
  if (params.userCoords) {
    results = results.map((place: any) => {
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

  // 💰 El filtro de precio deja la lista a cero muy a menudo (el 80% de las
  // fichas no trae price_level de Google): repetir sin precio y marcar las
  // fichas para que la respuesta avise de que el precio no está confirmado.
  if (results.length === 0 && params.priceLevel) {
    const relaxed = await searchPlacesTool(supabase, { ...params, priceLevel: undefined });
    return relaxed.map((p: any) => ({ ...p, price_filter_relaxed: true }));
  }

  return results;
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
    } else if (intent.corridorFrom && intent.corridorTo) {
      const a = await coordsForNamedPlace(intent.corridorFrom, intent.province);
      const b = await coordsForNamedPlace(intent.corridorTo, intent.province);
      if (a && b) {
        const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
        const radiusKm = Math.min(25, Math.max(12, Math.round(haversineKm(a, b) / 4 + 8)));
        console.log(`📍 Entre ${intent.corridorFrom} y ${intent.corridorTo}: radio ${radiusKm} km desde el punto medio`);
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
          userCoords: mid,
          radiusKm,
          useProximity: true,
          limit: contextLimit,
        });
        searchNote = candidates.length
          ? `El usuario está ENTRE ${intent.corridorFrom} y ${intent.corridorTo}. Lista SOLO los del radio (${radiusKm} km desde el PUNTO MEDIO entre ambos), con distancia desde ese punto medio. PROHIBIDO decir «de tu ubicación» si no hay GPS. No vuelques la provincia ni traigas municipios fuera de ese radio.`
          : `No hay fichas publicadas entre ${intent.corridorFrom} y ${intent.corridorTo} en un radio de ${radiusKm} km desde el punto medio. Dilo y pregunta si quiere ampliar. No ofrezcas el resto de la provincia.`;
      }
    } else if (intent.wantsNearby && (intent.city || intent.province) && !intent.usesLocation) {
      const townCoords = await coordsForNamedPlace(intent.city, intent.province);
      if (townCoords) {
        console.log(`📍 Cerca de ${intent.city || intent.province}: radio 15 km (no toda la provincia)`);
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
          userCoords: townCoords,
          radiusKm: 15,
          useProximity: true,
          limit: contextLimit,
        });
        searchNote = `Estos resultados son por radio de 15 km desde ${intent.city || intent.province}, no de toda la provincia. Di la distancia. No presentes Cartagena o Yecla como «cerca» de El Palmar.`;
      }
    } else if (intent.userCoords && intent.usesLocation) {
      console.log(`🌍 Búsqueda por proximidad GPS activada`);
      candidates = await searchPlacesTool(supabase, {
        category: requestedCategory,
        textSearch: intent.textSearch,
        priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
        userCoords: intent.userCoords,
        radiusKm: intent.radiusKm,
        useProximity: true,
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
          priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
        });
      }
      if (candidates.length === 0 && intent.city && !intent.explicitProvince) {
        console.log(`🔍 Buscando por ciudad: ${intent.city}`);
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          city: intent.city,
          province: intent.province,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
        });
        console.log(`📊 Encontrados por ciudad: ${candidates.length}`);
        if (candidates.length) {
          searchNote = intent.sameNameDefault
            ? `El usuario dijo «${intent.city}» a secas: son fichas de ${intent.city} CAPITAL, no de toda la provincia. Prohibido completar con Torrejón, Leganés, Gandia, Sagunto u otros municipios. Si hay menos de N, di cuántas hay en la ciudad.`
            : `Estas fichas son de ${intent.city} (el nombre en BD puede ser más largo, p. ej. «El Palmar O Lugar De Don Juan»). Lístalas como ${intent.city}.`;
        }
      }
      if (candidates.length === 0 && intent.city) {
        const townCoords = await coordsForNamedPlace(intent.city, intent.province);
        if (townCoords) {
          console.log(`📍 Sin ficha exacta en ${intent.city}; radio 15 km`);
          candidates = await searchPlacesTool(supabase, {
            category: requestedCategory,
            textSearch: intent.textSearch,
            priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
            userCoords: townCoords,
            radiusKm: 15,
            useProximity: true,
            limit: contextLimit,
          });
          const pueblo = intent.city;
          searchNote = candidates.length
            ? `No hay ficha exactamente en ${pueblo} o ya listaste las de ahí. Empieza: «No tengo en ${pueblo}, pero tengo algunos cerca.» Lista SOLO los del radio de 15 km, con distancia. Prohibido volcar toda la provincia.`
            : `No hay fichas en ${pueblo} ni en 15 km. Dilo. No ofrezcas el resto de la provincia.`;
        }
        if (candidates.length === 0 && intent.sameNameDefault && intent.city) {
          searchNote =
            searchNote ||
            `No hay fichas en ${intent.city} capital con esos criterios. Dilo claramente. Pregunta si quiere ampliar a toda la provincia de ${intent.province}; NO amplies tú solo.`;
        }
      } else if (
        candidates.length === 0 &&
        intent.province &&
        !intent.narrowTown &&
        !intent.wantsNearby &&
        !intent.sameNameDefault
      ) {
        console.log(`🔍 Buscando por provincia: ${intent.province}`);
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          province: intent.province,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
        });
        console.log(`📊 Encontrados por provincia: ${candidates.length}`);
        if (candidates.length && !intent.city) {
          searchNote = `La consulta es de TODA la provincia de ${intent.province}, no solo la capital. Incluye municipios distintos si hay fichas. Si piden N y hay N o más en la lista, da exactamente N. No digas que no hay más.`;
        }
      }
      if (candidates.length === 0 && provincesFromRegion) {
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          provinces: provincesFromRegion,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
          userCoords: userCoordsForSearch,
          limit: contextLimit,
        });
      }
      // Ranking nacional solo si lo pidió o no hay zona. Nunca tapar un vacío local.
      if (candidates.length === 0 && requestedCategory && (askedNational || !askedLocal)) {
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel, minRating: intent.minRating, minReviews: intent.minReviews,
          tierName: intent.tierName, textSearchTerm: intent.textSearchTerm,
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

    // 💰 El filtro de precio se relajó porque dejaba la lista a cero
    if (candidates.some((c) => c.price_filter_relaxed)) {
      const priceNote = `El usuario pidió un nivel de precio, pero las fichas de la zona no tienen el precio confirmado por Google. Presenta estas opciones (son las mejor valoradas de la zona) y aclara en una frase que el nivel de precio no está confirmado en las fichas. No digas que no hay resultados.`;
      searchNote = searchNote ? `${searchNote} ${priceNote}` : priceNote;
    }

    // Coherencia: tier exacto (oro ≠ diamante)
    if (intent.tierName && candidates.length) {
      candidates = filterByTierName(candidates, intent.tierName);
    }

    // 🏆 Pidió un tier concreto (diamante, platino, oro, plata, bronce)
    if (intent.tierName && !intent.skipSearch) {
      const range = TIER_RANGE_LABEL[intent.tierName] || '';
      const tierNote = candidates.length
        ? `El usuario pidió tier ${intent.tierName} (${range}): TODAS las fichas listadas cumplen EXACTAMENTE ese tier. No etiquetes un Diamante como Oro ni al revés.`
        : `No hay fichas de tier ${intent.tierName} (${range}) en la zona pedida. Dilo y ofrece enseñar los mejores lugares de la zona (de tiers inferiores) o ampliar la zona. OJO: solo se ha buscado tier ${intent.tierName}; NO afirmes que tampoco hay fichas de otros tiers ni menciones radios de búsqueda que no se han usado.`;
      searchNote = searchNote ? `${searchNote} ${tierNote}` : tierNote;
    }

    // Si hay candidatos, el LLM no puede decir que no hay fichas
    if (candidates.length > 0) {
      const mustUseNote =
        'LUGARES DISPONIBLES tiene fichas en ESTE turno: preséntalas. PROHIBIDO decir que no hay resultados ni que la lista está vacía.';
      searchNote = searchNote ? `${searchNote} ${mustUseNote}` : mustUseNote;
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
              : intent.searchKind === 'ambiguous'
                ? `TURNO: «${intent.ambiguousLabel}» es un topónimo ambiguo. Pregunta cuál: ${(intent.ambiguousOptions || []).join(' o ')}. NO busques ni afirmes que no hay fichas hasta que elija.`
                : intent.searchKind === 'route'
                  ? `TURNO: el usuario busca lugares A LO LARGO de una ruta${intent.routeFrom && intent.routeTo ? ` de ${titleCasePlace(intent.routeFrom)} a ${titleCasePlace(intent.routeTo)}` : ' entre dos puntos'}. Eso lo hace el planificador de Casi Cinco: dile que entre en [Planificar ruta](/ruta), ponga origen y destino y verá todos los lugares${intent.tierName ? ` (incluidos los de tier ${intent.tierName})` : ''} que pillan de paso, con desvío máximo configurable. Ofrécete a recomendar en origen o destino si lo prefiere. PROHIBIDO: listar un ranking, inventar paradas, decir que «no hay fichas» o heredar otra ciudad del hilo. No se ha buscado nada.`
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
