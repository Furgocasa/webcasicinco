/**
 * Integración con OpenAI GPT-4
 * Funciones:
 * 1. Generar descripciones únicas de lugares
 * 2. Resumir reseñas de Google
 * 3. Generar highlights de lugares
 * 4. Chatbot de asistencia para usuarios
 */

import OpenAI from 'openai';

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build',
});

// Modelos a usar
const MODEL = 'gpt-4-turbo-preview';
const MODEL_FAST = 'gpt-3.5-turbo'; // Para chatbot más rápido

/**
 * FUNCIÓN 1: Generar descripción única de un lugar
 * Convierte datos de Google Maps en una descripción atractiva y SEO
 */
export async function generatePlaceDescription(place: {
  name: string;
  category: string;
  city: string;
  province: string;
  rating: number;
  review_count: number;
  price_level?: number;
  reviews?: string[];
}): Promise<string> {
  const prompt = `Eres un experto escritor de guías de viaje para "Casi Cinco", una plataforma que recomienda lugares con mínimo 4.7 estrellas en España.

Crea una descripción única y atractiva para este lugar:

DATOS:
- Nombre: ${place.name}
- Categoría: ${place.category}
- Ubicación: ${place.city}, ${place.province}
- Rating: ${place.rating}★ (${place.review_count} reseñas)
${place.price_level ? `- Nivel de precio: ${place.price_level}/5` : ''}

${place.reviews && place.reviews.length > 0 ? `FRAGMENTOS DE RESEÑAS:
${place.reviews.slice(0, 3).join('\n')}` : ''}

REQUISITOS:
1. Longitud: 150-200 palabras
2. Estilo: Cálido, cercano, profesional pero no formal
3. Incluir: Por qué es especial, qué lo hace único
4. Mencionar el rating de forma natural
5. SEO-friendly pero sin parecer forzado
6. En español de España
7. NO uses emojis
8. NO repitas información obvia

Genera SOLO la descripción, sin títulos ni introducciones.`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Eres un experto escritor de contenido para guías de viaje premium.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generando descripción:', error);
    throw new Error('No se pudo generar la descripción con IA');
  }
}

/**
 * FUNCIÓN 2: Resumir reseñas de Google Maps
 * Analiza múltiples reseñas y crea un resumen conciso
 */
export async function summarizeReviews(reviews: string[]): Promise<string> {
  if (reviews.length === 0) return '';

  const prompt = `Analiza estas reseñas de Google Maps y crea un resumen conciso.

RESEÑAS (${reviews.length} total):
${reviews.slice(0, 10).join('\n\n---\n\n')}

Crea un resumen que:
1. Destaque los puntos más mencionados (positivos y negativos)
2. Sea objetivo y equilibrado
3. Longitud: 80-120 palabras
4. Formato: Párrafo único, sin listas
5. En español de España
6. NO uses emojis

Genera SOLO el resumen, sin títulos.`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Eres un analista experto en resumir opiniones de clientes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error resumiendo reseñas:', error);
    throw new Error('No se pudo resumir las reseñas con IA');
  }
}

/**
 * FUNCIÓN 3: Generar highlights del lugar
 * Extrae 3-5 puntos clave que hacen especial al lugar
 */
export async function generateHighlights(place: {
  name: string;
  category: string;
  rating: number;
  reviews?: string[];
  description?: string;
}): Promise<string[]> {
  const prompt = `Basándote en esta información, genera 3-5 highlights (puntos destacados) del lugar:

LUGAR: ${place.name}
CATEGORÍA: ${place.category}
RATING: ${place.rating}★

${place.description ? `DESCRIPCIÓN: ${place.description}` : ''}

${place.reviews && place.reviews.length > 0 ? `RESEÑAS:
${place.reviews.slice(0, 5).join('\n')}` : ''}

Genera 3-5 highlights que:
1. Sean específicos y únicos del lugar
2. Cada uno de 3-8 palabras máximo
3. Destaquen lo mejor del lugar
4. Sean atractivos para visitantes
5. En español de España

Formato: Una línea por highlight, sin números, sin guiones, sin emojis.

Ejemplo de formato correcto:
Cocina mediterránea con productos locales
Terraza con vistas al mar
Ambiente familiar y acogedor`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en marketing turístico.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content || '';
    
    const highlights = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 100);

    return highlights.slice(0, 5);
  } catch (error) {
    console.error('Error generando highlights:', error);
    throw new Error('No se pudo generar los highlights con IA');
  }
}

/**
 * FUNCIÓN 4: Chatbot de asistencia
 * Responde preguntas sobre lugares, funcionalidades, etc.
 */
export async function chatbotResponse(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  context?: {
    placesCount?: number;
    places?: any[];
    categoryStats?: Record<string, number>;
    cities?: string[];
    provinces?: string[];
    isAdmin?: boolean;
    chatbotConfig?: any;
    userLocation?: { city: string; province: string; region: string };
  }
): Promise<string> {
  // Preparar contexto de lugares relevantes (filtrado por intención + ubicación)
  let placesContext = '';
  let bestIntroInstruction = '';

  if (context?.places && context.places.length > 0) {
    const msg = userMessage.toLowerCase();

    // 1) Detectar categoría solicitada
    const categorySynonyms: Record<string, string[]> = {
      restaurante: ['restaurante', 'restaurantes', 'comer', 'cocina', 'tapas', 'asador', 'parrilla'],
      hotel: ['hotel', 'hoteles', 'alojamiento', 'alojamientos', 'hostal', 'albergue', 'resort', 'parador', 'apartamento', 'apartamentos', 'apartamentos turísticos', 'apartamentos turisticos', 'donde alojarme', 'donde quedarse'],
      spa: ['spa', 'spas', 'balneario', 'wellness', 'termas'],
      bar: ['bar', 'bares', 'pub', 'coctelería', 'cocteleria', 'cocktail']
    };
    const detectCategory = (): string | undefined => {
      for (const [cat, words] of Object.entries(categorySynonyms)) {
        if (words.some(w => msg.includes(w))) return cat;
      }
      return undefined;
    };
    const requestedCategory = detectCategory();

    // 2) Detectar ubicación (ciudad/provincia/comunidad)
    const regionProvinces: Record<string, string[]> = {
      'andalucía': ['Sevilla','Málaga','Cádiz','Córdoba','Granada','Huelva','Jaén','Almería'],
      'andalucia': ['Sevilla','Málaga','Cádiz','Córdoba','Granada','Huelva','Jaén','Almería'],
      'valencia': ['Valencia','Castellón','Alicante'],
      'cataluña': ['Barcelona','Tarragona','Girona','Lleida'],
      'cataluna': ['Barcelona','Tarragona','Girona','Lleida'],
      'madrid': ['Madrid'],
      'murcia': ['Murcia']
    };

    const provincesSet = new Set((context.provinces || []).filter(Boolean));
    const citiesSet = new Set((context.cities || []).filter(Boolean));

    const mentionedRegion = Object.keys(regionProvinces).find(r => msg.includes(r));
    const mentionedProvince = [...provincesSet].find(p => msg.includes((p as string).toLowerCase()));
    const mentionedCity = [...citiesSet].find(c => msg.includes((c as string).toLowerCase()));

    // 3) Construir base filtrada
    let filtered = [...context.places];

    if (requestedCategory) {
      filtered = filtered.filter(p => (p.category || '').toLowerCase() === requestedCategory);
    }

    // 3.1 Filtro por comunidad/provincia/ciudad
    if (mentionedRegion) {
      const wantedProvinces = regionProvinces[mentionedRegion].map(p => p.toLowerCase());
      filtered = filtered.filter(p => p.province && wantedProvinces.includes((p.province as string).toLowerCase()));
    } else if (mentionedProvince) {
      filtered = filtered.filter(p => (p.province || '').toLowerCase() === (mentionedProvince as string).toLowerCase());
    } else if (mentionedCity) {
      filtered = filtered.filter(p => (p.city || '').toLowerCase() === (mentionedCity as string).toLowerCase());
    }

    // 4) Si no hay nada y pidieron provincia, ampliar a provincias cercanas
    const nearbyByProvince: Record<string, string[]> = {
      'madrid': ['Toledo','Segovia','Guadalajara','Ávila'],
      'murcia': ['Alicante','Valencia','Almería','Albacete'],
      'valencia': ['Castellón','Alicante','Murcia'],
      'sevilla': ['Cádiz','Huelva','Córdoba','Málaga']
    };
    if (filtered.length === 0 && mentionedProvince) {
      const near = nearbyByProvince[(mentionedProvince as string).toLowerCase()] || [];
      filtered = context.places.filter(p =>
        near.includes(p.province) &&
        (!requestedCategory || (p.category || '').toLowerCase() === requestedCategory)
      );
    }

    // 5) Determinar N solicitado y tamaño del contexto (N×3 hasta 100)
    const topNMatch = msg.match(/(?:top|mejores?)\s*(\d+)/);
    const requestedTop = topNMatch ? Math.max(1, Math.min(50, parseInt(topNMatch[1], 10))) : undefined;
    
    // Si preguntan en plural sin número específico → 5 lugares; si singular → 3
    const pluralWords = ['restaurantes', 'hoteles', 'spas', 'bares', 'lugares', 'sitios', 'alojamientos', 'apartamentos'];
    const hasPlural = pluralWords.some(w => msg.includes(w));
    const defaultN = hasPlural ? 5 : 3;
    
    const targetN = requestedTop || defaultN;
    const contextLimit = Math.min(targetN * 3, 100);

    // Instrucción para encabezado cuando pidan "los mejores"
    if (/(?:\bmejor(?:es)?\b|\btop\b)/i.test(msg)) {
      bestIntroInstruction = `Inicia tu respuesta con esta frase exacta: "Según los datos de los que disponemos y los cálculos de nuestro algoritmo, los ${targetN} mejores lugares son:"`;
    }

    // 6) Enviar lugares con mínimo 50 reseñas (tier Bronce) y ordenar por rating desc, luego reseñas desc
    filtered = filtered
      .filter(p => (p.review_count || 0) >= 50)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.review_count || 0) - (a.review_count || 0))
      .slice(0, contextLimit);

    // 7) Fallback a mejores de España en esa categoría
    if (filtered.length === 0) {
      let fallback = [...context.places];
      if (requestedCategory) fallback = fallback.filter(p => (p.category || '').toLowerCase() === requestedCategory);
      filtered = fallback
        .filter(p => (p.review_count || 0) >= 500)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.review_count || 0) - (a.review_count || 0))
        .slice(0, contextLimit);
    }

    if (filtered.length > 0) {
      placesContext = `\n\nLUGARES DISPONIBLES (filtrados por intención y ubicación, ordenados por calidad; elige ${targetN}):\n` +
        filtered.map((p, i) => {
          const slug = p.slug || '';
          const placeId = p.id || '';
          const internalLink = slug ? `/${p.category}/${p.province?.toLowerCase().replace(/\s+/g, '-')}/${slug}` : '';
          const mapLink = placeId ? `/mapa?place=${placeId}` : '';
          const address = p.address ? ` | Dirección: ${p.address}` : '';
          const phone = p.phone ? ` | Tel: ${p.phone}` : '';
          // NO incluir website - queremos que vayan a nuestra página de detalles
          return `${i + 1}. ${p.name} — ⭐${p.rating} (${p.review_count} reseñas) — ${p.city || ''}${p.city ? ', ' : ''}${p.province || ''} — ${p.category}${address}${phone} | Ver detalles: ${internalLink} | Ver en mapa: ${mapLink}`;
        }).join('\n');
    }
  }

  // SYSTEM PROMPT - Instrucciones estáticas (puede venir de BD)
  const chatbotConfig = context?.chatbotConfig || {};
  
  const systemPrompt = chatbotConfig.systemPrompt || `Eres Tío Viajero, guía de viajes de Casi Cinco (España). Respondes SIEMPRE usando los datos de la plataforma.

POLÍTICA DE DATOS
- Puedes usar tu conocimiento general para entender geografía, carreteras (M-30, M-40, A-3), distancias, barrios y contexto turístico.
- Los NOMBRES de lugares (restaurantes, hoteles, spas, bares, etc.) SOLO pueden salir de la lista LUGARES DISPONIBLES que recibes en cada pregunta.
- Tu misión es dar respuesta a preguntas del tipo: "¿Estoy en Murcia, dónde puedo ir a comer?", "dime los mejores hoteles de la Costa Brava", etc.
- Si la lista está vacía para la zona/categoría, dilo y sugiere cambiar filtros o buscar en provincias cercanas (p.ej., Madrid→Toledo/Segovia/Guadalajara/Ávila; Murcia→Alicante/Valencia/Almería/Albacete). Nunca inventes nombres.

GEOLOCALIZACIÓN Y PROXIMIDAD
- Si el usuario ha compartido su ubicación GPS, recibirás su ciudad/provincia/región actual en el contexto. Si la ciudad/provincia vienen vacías, significa que solo disponemos de coordenadas GPS.
- Cuando pregunten con palabras como "cerca", "aquí", "cerca de mí", "en mi zona", "por aquí", "alrededor", "donde estoy", "dónde estoy":
  * Si tienes su ubicación GPS → Los lugares YA vienen ordenados por distancia real (km) desde su posición (campo `distance_km`).
  * SIEMPRE menciona las distancias en tu respuesta: "Restaurante X a 8.5km de ti".
  * Si NO tienes su ubicación → Pide que especifiquen la ciudad o que compartan su ubicación.
- Si preguntan "¿dónde estoy?" o "mi ubicación" y tienes su GPS:
  * Si conoces la ciudad exacta: "Estás en [CIUDAD], [PROVINCIA] ([REGIÓN])".
  * Si solo hay coordenadas GPS (sin ciudad/provincia): di explícitamente que tienes las coordenadas y que puedes recomendar lugares cercanos: "Tengo tus coordenadas GPS activadas. Voy a recomendarte lugares cercanos a ti (a X km)."
  * Si además piden lugares, ofrécelos siempre con distancias reales.
- Si NO tienes su ubicación: "No tengo tu ubicación. ¿Puedes compartir tu ubicación o decirme en qué ciudad estás para darte recomendaciones personalizadas?"

CÓMO ELEGIR (ranking)
1) Si piden "top N", devuelve N (o menos si no hay). Si no piden N, devuelve 3–5. Si te piden "los 5 mejores restaurantes de Valencia", da la respuesta con lugares de la lista.
2) Filtra por intención (restaurante/hotel/spa/bar). Si no dicen categoría, infiere por palabras clave.
3) Filtra por localización: 
   - Proximidad GPS: "cerca de mí", "restaurantes aquí" → Usa distancia real (distance_km), ya ordenados por proximidad
   - Ciudad específica: "hoteles en Barcelona" → solo Barcelona
   - Provincia: "restaurantes de Murcia" (sin especificar ciudad) → TODA la provincia
   - CASOS AMBIGUOS (ciudad = provincia): "hoteles de Murcia", "restaurantes de Madrid" → Por defecto asume PROVINCIA completa (no solo capital)
   - Afueras/alrededores: "restaurantes en las afueras de Madrid", "alrededores de Barcelona", "cerca de Valencia pero no en la ciudad" → busca en OTROS municipios de la misma provincia (Toledo, Pozuelo, Getafe para Madrid; Hospitalet, Badalona, Sabadell para Barcelona)
   - Si no hay en la zona pedida, sugiere provincias cercanas razonables
4) Los lugares de la lista YA están filtrados por calidad (mínimo 50 reseñas para búsquedas locales, mínimo 500 para rankings nacionales). Ordena por rating (desc) y, en empate, por nº de reseñas (desc).
5) Mantén coherencia con el historial (si dijeron "cercanos" tras "Murcia", entiende "cercanos a Murcia").

FORMATO DE RESPUESTA
- Si piden "mejores/top", comienza EXACTAMENTE con: "Según los datos de los que disponemos y los cálculos de nuestro algoritmo, los {N} mejores lugares son:"
- Si es búsqueda por proximidad GPS, menciona las distancias: "Restaurante X (⭐4.8) a 8.5km de ti en Almería"
- Después, bullets: Nombre — ⭐rating · nº reseñas — Ciudad, Provincia — (valor breve y concreto) — [Ver detalles](/categoria/provincia/slug) | [Ver en mapa](/mapa?place=id)
- SIEMPRE incluye AMBOS enlaces al final de cada lugar: "Ver detalles" Y "Ver en mapa" usando los campos de la lista.
- Si el usuario pregunta por dirección o teléfono, úsalos de los campos disponibles (Dirección, Tel).
- Si preguntan por la web/sitio web/página, di que pueden encontrarla en la página de detalles: "Puedes ver toda la información, incluyendo su sitio web, en [Ver detalles]".
- Si hay 1 solo lugar: párrafo breve + ambos links.
- Si no hay lugares en la zona pedida pero sí en cercanas: explícalo y recomienda de provincias cercanas (solo de la lista).
- Estilo cercano y experto, 80–160 palabras, sin emojis.

PROHIBIDO
- Decir "no tengo acceso a información", "no puedo", "no sé" cuando SÍ tienes los datos (dirección y teléfono están disponibles).
- Dar la URL de la página web externa del lugar (solo di que está en "Ver detalles").
- Dar nombres fuera de la lista.
- Dar datos personales de usuarios.
- Omitir los enlaces [Ver detalles] y [Ver en mapa] en las recomendaciones (SIEMPRE incluye ambos para facilitar la navegación).

IMPORTANTE
- La localización es tan importante como la categoría: si preguntan por hoteles de "Murcia", SOLO devuelve hoteles de Murcia. NO devuelvas hoteles de otra localidad ni otros tipos de establecimientos.
- Si NO hay lugares en la ubicación pedida, di CLARAMENTE: "Actualmente no tengo restaurantes indexados en Almería. ¿Te gustaría ver opciones en provincias cercanas como Granada, Málaga o Murcia?"
- Si la lista contiene lugares de provincias cercanas (NO la pedida), explica CLARAMENTE: "No tengo lugares en [ciudad pedida], pero aquí tienes opciones en [provincia cercana]:"
- NUNCA digas "opciones en Almería" si los lugares son de Alicante. Sé HONESTO con la ubicación.
- Si hay pocos resultados (1-2 lugares), es mejor sugerir ampliar la búsqueda a provincias cercanas que dar una respuesta confusa.
- AFUERAS/ALREDEDORES: Si piden "afueras de Madrid", "alrededores de Barcelona", "cerca de X pero no en X", recomienda lugares en otros municipios de la provincia (NO en la capital). Explica claramente: "En las afueras de Madrid (provincia) encontramos..." o "En los alrededores de Barcelona...".`;

  const roleContext = context?.isAdmin 
    ? '\n\nMODO ADMIN: Puedes ayudar con gestión e indexación.' 
    : '\n\nMODO USUARIO: Solo lugares y recomendaciones.';

  // USER MESSAGE - Contexto dinámico + pregunta
  const userContext = `${bestIntroInstruction ? bestIntroInstruction + '\n\n' : ''}Contexto disponible:\n- Lugares totales: ${context?.placesCount || 0}\n- Provincias: ${(context?.provinces || []).filter(Boolean).join(', ') || 'N/A'}\n- Categorías: ${Object.entries(context?.categoryStats || {}).map(([cat, count]) => `${cat}(${count})`).join(', ')}\n\nInstrucciones: Responde usando únicamente los lugares de arriba.\nAplica los criterios de elección indicados en el sistema.\nRespeta el formato de salida según haya 1 o varios lugares.\n${context?.userLocation ? `\n📍 UBICACIÓN DEL USUARIO (GPS compartida):\n- Ciudad: ${context.userLocation.city}\n- Provincia: ${context.userLocation.province}\n- Región: ${context.userLocation.region}\n- Nota: Si pregunta "cerca de mí", los lugares YA están ordenados por distancia real (field: distance_km)\n` : '\n⚠️ Usuario NO ha compartido ubicación GPS. Si pregunta "cerca", pídele que especifique ciudad o que comparta ubicación.\n'}
${placesContext || '⚠️ No hay lugares disponibles en este momento.'}

---
PREGUNTA DEL USUARIO: ${userMessage}`;

  console.log(`🎯 System prompt: ${systemPrompt.length} chars`);
  console.log(`📍 User context incluye lugares: ${placesContext.length > 0}`);
  console.log(`📊 Lugares en contexto: ${(placesContext.match(/\d+\./g) || []).length}`);
  if (context?.userLocation) {
    console.log(`📍 Ubicación incluida en contexto: ${context.userLocation.city}, ${context.userLocation.province}`);
  }

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt + roleContext },
      ...conversationHistory,
      { role: 'user', content: userContext },
    ];

    const completion = await openai.chat.completions.create({
      model: chatbotConfig.model || MODEL_FAST,
      messages,
      temperature: chatbotConfig.temperature !== undefined ? chatbotConfig.temperature : 0.7,
      max_tokens: chatbotConfig.maxTokens || 400,
    });

    return completion.choices[0].message.content || 'Lo siento, no pude procesar tu mensaje.';
  } catch (error) {
    console.error('Error en chatbot:', error);
    throw new Error('No se pudo procesar tu mensaje. Por favor, intenta de nuevo.');
  }
}

/**
 * FUNCIÓN 5: Generar contenido completo de un lugar (batch)
 * Genera descripción, resumen de reseñas y highlights en una sola llamada
 */
export async function generateCompleteContent(place: {
  name: string;
  category: string;
  city: string;
  province: string;
  rating: number;
  review_count: number;
  price_level?: number;
  reviews?: string[];
}): Promise<{
  description: string;
  review_summary: string;
  highlights: string[];
}> {
  try {
    const [description, reviewSummary, highlights] = await Promise.all([
      generatePlaceDescription(place),
      place.reviews && place.reviews.length > 0 
        ? summarizeReviews(place.reviews) 
        : Promise.resolve(''),
      generateHighlights({
        name: place.name,
        category: place.category,
        rating: place.rating,
        reviews: place.reviews,
      }),
    ]);

    return {
      description,
      review_summary: reviewSummary,
      highlights,
    };
  } catch (error) {
    console.error('Error generando contenido completo:', error);
    throw error;
  }
}

/**
 * FUNCIÓN 6: Validar que la API key funciona
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    await openai.chat.completions.create({
      model: MODEL_FAST,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    });
    return true;
  } catch (error) {
    console.error('Error conectando con OpenAI:', error);
    return false;
  }
}

/**
 * FUNCIÓN 7: Estimar costo de generar contenido para N lugares
 */
export function estimateContentGenerationCost(placeCount: number): {
  estimatedTokens: number;
  estimatedCostUSD: number;
} {
  const tokensPerPlace = 2050;
  const totalTokens = placeCount * tokensPerPlace;

  const inputTokens = totalTokens * 0.7;
  const outputTokens = totalTokens * 0.3;

  const costUSD = (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03;

  return {
    estimatedTokens: totalTokens,
    estimatedCostUSD: Math.round(costUSD * 100) / 100,
  };
}
