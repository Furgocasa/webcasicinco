import { NextRequest, NextResponse } from 'next/server';
import { chatbotResponse } from '@/lib/ai/openai';
import { createClient } from '@/lib/supabase/server';
import { getCityAndProvinceFromCoords } from '@/lib/google/geocoding';

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
  murcia: ['Alicante','Valencia','Almería','Albacete'],
  valencia: ['Castellón','Alicante','Murcia'],
  sevilla: ['Cádiz','Huelva','Córdoba','Málaga'],
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

function parseIntent(
  message: string,
  detectedLocation?: { city: string; province: string; region: string }
): {
  category?: string; city?: string; province?: string; region?: string;
  topN?: number; excludeCapital?: boolean; explicitProvince?: boolean;
  textSearch?: string; // 🆕 Para búsqueda de subcategorías
  usesLocation?: boolean; // 📍 Indica si se usó ubicación del usuario
  priceLevel?: number; // 🆕 Nivel de precio detectado
} {
  const msg = message.toLowerCase();
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

  // "provincia de X" captura
  const provDe = msg.match(/provincia\s+de\s+([a-záéíóúñ]+)\b/);
  let explicitProvince: boolean | undefined;
  let province: string | undefined;
  if (provDe?.[1]) {
    const p = provDe[1];
    province = p.charAt(0).toUpperCase() + p.slice(1);
    explicitProvince = true;
  }

  // Heurística básica para provincia/ciudad: coincidencia literal con capitalizadas comunes
  const PROVINCES = ['Madrid','Barcelona','Valencia','Alicante','Castellón','Sevilla','Cádiz','Huelva','Córdoba','Málaga','Granada','Jaén','Almería','Murcia','Toledo','Segovia','Guadalajara','Ávila'];
  const CITIES = ['València','Valencia','Sevilla','Málaga','Cádiz','Córdoba','Granada','Huelva','Jaén','Almería','Madrid','Murcia','Alicante','Castellón','Toledo','Segovia','Guadalajara','Ávila'];
  if (!province) province = PROVINCES.find(p => msg.includes(p.toLowerCase()));
  const city = CITIES.find(c => msg.includes(c.toLowerCase()));

  // Detectar "afueras", "alrededores", "cerca de pero no en"
  const excludeCapital = /fuera de la capital|resto de la provincia|sin capital|pueblos|municipios|afueras de|alrededores de|cercan[ií]as de|cerca de (?!.*\ben\b)|extrarradio|fuera de la ciudad|provincia de \w+ pero no en|cerca pero no en/.test(msg);
  const finalCity = explicitProvince ? undefined : city;

  // 📍 Detectar palabras clave de proximidad para usar ubicación
  const proximityKeywords = [
    'cerca', 'aquí', 'aqui', 'por aquí', 'por aqui', 'en mi zona', 
    'cerca de mí', 'cerca de mi', 'alrededor', 'cercano', 'cercanos',
    'por donde estoy', 'en esta zona', 'en la zona', 'por la zona'
  ];
  
  const hasProximityKeyword = proximityKeywords.some(keyword => msg.includes(keyword));
  let usesLocation = false;
  
  // Si tiene palabra de proximidad y NO tiene ciudad/provincia especificada manualmente,
  // usar la ubicación detectada
  if (hasProximityKeyword && !city && !province && detectedLocation) {
    usesLocation = true;
    return {
      category,
      city: detectedLocation.city,
      province: detectedLocation.province,
      region: detectedLocation.region,
      topN,
      excludeCapital,
      explicitProvince,
      textSearch,
      usesLocation,
      priceLevel
    };
  }

  return { category, city: finalCity, province, region, topN, excludeCapital, explicitProvince, textSearch, usesLocation, priceLevel };
}

async function searchPlacesTool(supabase: any, params: SearchParams) {
  let query = supabase
    .from('places')
    .select('id, name, slug, category, rating, review_count, city, province, region, address, phone, website, ai_description, subcategory, price_level')
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
  model: 'gpt-4o-mini',
  temperature: 0.25,
  maxTokens: 320,
  maxHistoryMessages: 12,
};

function validateChatbotConfig(config: any): any {
  return {
    enabled: typeof config?.enabled === 'boolean' ? config.enabled : true,
    model: config?.model || 'gpt-4o-mini',
    temperature: Math.max(0, Math.min(2, config?.temperature || 0.25)),
    maxTokens: Math.max(50, Math.min(1000, config?.maxTokens || 320)),
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
      try {
        const geoResult = await getCityAndProvinceFromCoords(location.lat, location.lng);
        if (geoResult) {
          detectedLocation = geoResult;
          console.log(`📍 Ubicación detectada: ${geoResult.city}, ${geoResult.province}`);
        }
      } catch (error) {
        console.error('Error geocodificando ubicación:', error);
        // Continuar sin ubicación si falla
      }
    }

    // ---------------------------------------------
    // Agente: detectar intención y ejecutar tool
    // ---------------------------------------------
    const intent = parseIntent(message, detectedLocation);
    const requestedCategory = intent.category;
    const targetN = intent.topN || 5;
    const contextLimit = Math.min(targetN * 3, 100);

    let provincesFromRegion: string[] | undefined;
    if (intent.region) provincesFromRegion = REGION_TO_PROVINCES[intent.region];

    // Buscar por prioridad: provincia explícita/“fuera de la capital” -> ciudad -> provincia -> región -> cercano -> ranking nacional
    let candidates: any[] = [];
    const capitalToExclude = intent.excludeCapital && intent.province
      ? (CAPITAL_BY_PROVINCE[intent.province] || intent.province)
      : undefined;

    if (intent.explicitProvince || (intent.province && intent.excludeCapital)) {
      candidates = await searchPlacesTool(supabase, {
        category: requestedCategory,
        province: intent.province,
        excludeCity: capitalToExclude,
        textSearch: intent.textSearch,
        priceLevel: intent.priceLevel,
        limit: contextLimit,
      });
    }
    if (candidates.length === 0 && intent.city && !intent.explicitProvince) {
      candidates = await searchPlacesTool(supabase, {
        category: requestedCategory,
        city: intent.city,
        textSearch: intent.textSearch,
        priceLevel: intent.priceLevel,
        limit: contextLimit,
      });
    }
    if (candidates.length === 0 && intent.province) {
      candidates = await searchPlacesTool(supabase, {
        category: requestedCategory,
        province: intent.province,
        textSearch: intent.textSearch,
        priceLevel: intent.priceLevel,
        limit: contextLimit,
      });
    }
    if (candidates.length === 0 && provincesFromRegion) {
      candidates = await searchPlacesTool(supabase, {
        category: requestedCategory,
        provinces: provincesFromRegion,
        textSearch: intent.textSearch,
        priceLevel: intent.priceLevel,
        limit: contextLimit,
      });
    }
    if (candidates.length === 0 && intent.province) {
      const near = NEARBY_BY_PROVINCE[intent.province.toLowerCase()];
      if (near?.length) {
        candidates = await searchPlacesTool(supabase, {
          category: requestedCategory,
          provinces: near,
          textSearch: intent.textSearch,
          priceLevel: intent.priceLevel,
          limit: contextLimit,
        });
      }
    }
    if (candidates.length === 0 && requestedCategory) {
      candidates = await searchPlacesTool(supabase, {
        category: requestedCategory,
        textSearch: intent.textSearch,
        priceLevel: intent.priceLevel,
        limit: contextLimit,
        isNationalRanking: true,  // Fallback nacional: mínimo 500 reseñas
      });
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

    // Usar candidates como contexto específico para esta pregunta
    const startTime = Date.now();
    const response = await chatbotResponse(
      message,
      conversation_history || [],
      {
        ...context,
        places: candidates.length ? candidates : context.places,
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

    // 📊 Guardar en analytics para análisis posterior
    try {
      await supabase.from('chatbot_analytics').insert({
        user_id: user?.id || null,
        user_email: user?.email || null,
        session_id: !user ? session_id : null,
        user_message: message,
        bot_response: response,
        conversation_context: conversation_history.slice(-6), // Últimos 3 pares (6 mensajes)
        detected_intent: intent,
        places_found: candidates.length,
        query_time_ms: queryTimeMs,
      });
    } catch (analyticsError) {
      // No fallar si hay error en analytics
      console.error('Error guardando analytics:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      message: response,
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
