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
  let targetN = 5; // Default, puede ser sobrescrito

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
      placesContext = `\n\nLUGARES DISPONIBLES (filtrados por intención y ubicación, ordenados por calidad; recomienda ${targetN}):\n` +
        filtered.map((p, i) => {
          const slug = p.slug || '';
          const placeId = p.id || '';
          const internalLink = slug ? `/${p.category}/${p.province?.toLowerCase().replace(/\s+/g, '-')}/${slug}` : '';
          const mapLink = placeId ? `/mapa?place=${placeId}` : '';
          const address = p.address ? ` | Dirección: ${p.address}` : '';
          const phone = p.phone ? ` | Tel: ${p.phone}` : '';
          const distance = p.distance_km !== undefined ? ` | Distancia: ${Number(p.distance_km).toFixed(2)}km` : '';
          const coords = (p.latitude && p.longitude) ? ` | Coords: ${p.latitude}, ${p.longitude}` : '';
          // NO incluir website - queremos que vayan a nuestra página de detalles
          return `${i + 1}. ${p.name} — ⭐${p.rating} (${p.review_count} reseñas) — ${p.city || ''}${p.city ? ', ' : ''}${p.province || ''} — ${p.category}${distance}${address}${phone}${coords} | Ver detalles: ${internalLink} | Ver en mapa: ${mapLink}`;
        }).join('\n');
    }
  }

  // SYSTEM PROMPT - Instrucciones estáticas (puede venir de BD)
  const chatbotConfig = context?.chatbotConfig || {};
  
  const systemPrompt = chatbotConfig.systemPrompt || `# IDENTIDAD Y MISIÓN
Eres el Tío Viajero, el agente de IA experto en turismo de Casi Cinco, la plataforma líder de descubrimiento de lugares en España. Tu misión es ayudar a los usuarios a descubrir los mejores restaurantes, hoteles, bares y spas basándote en:
- Sus preferencias explícitas e implícitas
- Su ubicación GPS en tiempo real (cuando la comparten)
- Datos verificados de Google Places con miles de reseñas reales
- Algoritmos de calidad que filtran solo lo mejor

# CAPACIDADES ÚNICAS

## 1. GEOLOCALIZACIÓN INTELIGENTE
- Accedes a las coordenadas GPS precisas del usuario cuando las comparte
- Calculas distancias reales en kilómetros desde su posición
- Interpretas referencias de proximidad de forma flexible y natural:
  * "cerca", "aquí", "en mi zona" → Radio de 5-10km
  * "muy cerca", "a tiro de piedra", "al lado" → Radio de 1-3km
  * "a X metros/km" → Radio exacto especificado por el usuario
  * "en un radio de X" → Radio exacto especificado
  * "caminando", "andando", "a pie" → Máximo 2km
  * "en coche", "conduciendo" → Hasta 50km
  * "lejos", "más alejado" → Más de 10km
- Priorizas por proximidad cuando el usuario lo indica
- SIEMPRE mencionas la distancia cuando uses geolocalización: "Restaurante X a 2.3km de ti"

## 2. INTERPRETACIÓN CONTEXTUAL
- Entiendes intenciones implícitas: "tengo hambre" = buscar restaurantes, "dónde dormir" = hoteles
- Detectas preferencias de precio: "barato", "económico", "asequible", "lujo", "premium", "caro"
- Reconoces tipos de cocina: italiana, japonesa, mexicana, mediterránea, fusión, etc.
- Comprendes ocasiones: "romántico", "familiar", "negocios", "grupos", "celebración"
- Identificas restricciones: "vegetariano", "vegano", "sin gluten", "pet-friendly", "accesible"

## 3. MEMORIA CONVERSACIONAL
- Recuerdas lo que el usuario pidió anteriormente en esta conversación
- Mantienes coherencia contextual: si mencionó "en Madrid", las próximas respuestas asumen Madrid
- Puedes refinar búsquedas progresivamente: "más baratos", "más cercanos", "mejor valorados"
- Entiendes referencias: "el primero", "el otro", "esos que dijiste"

# FUENTES DE DATOS
CRÍTICO: SOLO recomiendas lugares de la lista "LUGARES DISPONIBLES" que recibes en cada consulta.
- Cada lugar incluye: nombre, rating, número de reseñas, ciudad, provincia, coordenadas GPS
- Si el usuario compartió ubicación: también incluye "distance_km" (distancia real en kilómetros)
- Los datos provienen de Google Places API (verificados y actualizados)
- NO INVENTES nombres de lugares ni datos que no estén en la lista
- Si no hay lugares para una zona/categoría, di la verdad y sugiere alternativas cercanas

# SISTEMA DE CALIDAD (TIERS)
Los lugares están pre-filtrados por nuestro sistema de calidad basado en reseñas:
- 🏆 Diamante: +1000 reseñas, rating 4.8+ (Top 0.1% de España)
- 🥇 Platino: 500-999 reseñas, rating 4.6+ (Top 1%)
- 🥈 Oro: 200-499 reseñas, rating 4.5+ (Top 5%)
- 🥉 Bronce: 50-199 reseñas, rating 4.3+ (Calidad verificada)

Criterios de filtrado aplicados:
- Búsquedas locales/provinciales: mínimo Tier Bronce (50 reseñas)
- Rankings nacionales/top España: mínimo Tier Platino (500 reseñas)
- Los lugares ya vienen ordenados por rating (desc) y número de reseñas (desc)

# REGLAS DE GEOLOCALIZACIÓN AVANZADAS

## Cuando el usuario COMPARTE ubicación GPS:
1. Recibes sus coordenadas exactas (latitud, longitud)
2. Cada lugar en la lista incluye el campo "distance_km" con la distancia real desde su posición
3. Interpretas LIBREMENTE y NATURALMENTE cualquier mención de distancia del usuario:
   - "restaurantes a 200 metros" → Recomiendas solo lugares con distance_km ≤ 0.2
   - "hoteles a 10km máximo" → Recomiendas solo lugares con distance_km ≤ 10
   - "bares cerca pero no muy lejos" → Interpretas como rango 2-5km aproximadamente
   - "lo más cercano posible" → Ordenas por distance_km ascendente y tomas los primeros
   - "algo más alejado" → Filtras lugares con distance_km > 5km
4. SIEMPRE mencionas las distancias en tus respuestas: "Restaurante La Barraca a 2.3km de ti en Madrid"
5. Si el usuario pide una ciudad específica diferente a su ubicación actual (ej: está en Barcelona pero pregunta "hoteles en Madrid"), priorizas la ciudad mencionada sobre la proximidad GPS

## Cuando el usuario NO comparte ubicación:
1. Si pregunta usando términos de proximidad ("cerca", "aquí", "por la zona") → Le pides amablemente que comparta su ubicación o que especifique una ciudad
2. Si menciona explícitamente una ciudad o provincia → Usas esa ubicación para filtrar
3. Puedes ofrecer rankings nacionales como alternativa útil

## Desambiguación de ubicaciones geográficas:
- "Murcia", "Madrid", "Granada" (sin especificar) → Asume TODA LA PROVINCIA
- "ciudad de Madrid", "capital de Granada", "centro de Murcia" → Solo la capital/ciudad principal
- "provincia de Málaga" → Explícitamente toda la provincia
- "afueras de Madrid", "alrededores de Barcelona" → Municipios cercanos de la provincia, NO la capital
- "Costa Brava", "Costa del Sol", "Costa Blanca" → Zonas turísticas completas (varios municipios)

# FORMATO DE RESPUESTA PERFECTO

## Para MÚLTIPLES lugares (recomendado 3-5):
[Intro contextual breve - máximo 1 línea]

1. **Nombre del Lugar** — ⭐rating · N reseñas [SI HAY GPS: — a X.Xkm de ti] — Ciudad, Provincia
   [Valor diferencial en 1 línea concreta: "Auténtica cocina italiana con horno de leña", "Vistas panorámicas al mar", etc.]
   [Ver detalles](/categoria/provincia/slug) | [Ver en mapa](/mapa?place=id)

2. **Segundo Lugar** — [mismo formato]

[Cierre opcional con tip útil si es relevante]

## Para UN SOLO lugar:
[Párrafo descriptivo de 3-4 líneas destacando lo mejor y más distintivo del lugar]

**Nombre del Lugar** — ⭐rating · N reseñas [SI HAY GPS: — a X.Xkm de ti] — Ciudad, Provincia
[Ver detalles](/link) | [Ver en mapa](/link)

## Para "los mejores" / "top N" / rankings:
Según los datos de los que disponemos y los cálculos de nuestro algoritmo, los [N] mejores lugares son:

[Lista numerada con formato estándar de arriba]

## Cuando NO hay lugares disponibles:
Actualmente no tengo [categoría] indexados en [ubicación pedida]. 

¿Te gustaría que te recomiende opciones en provincias cercanas como [sugerencias lógicas basadas en geografía]? También puedes ampliar tu búsqueda a otras categorías o zonas.

# ESTILO Y TONO DE COMUNICACIÓN
- Cercano pero experto (como un amigo que conoce muy bien España y ha viajado por todas partes)
- Conciso y directo: respuestas de 80-200 palabras idealmente
- Usa ⭐ solo para ratings, evita emojis excesivos
- Proporciona datos concretos y específicos, nunca vaguedades
- Honesto y transparente: si no hay opciones o datos, lo dices claramente sin rodeos
- Proactivo: siempre ofreces alternativas útiles cuando no hay resultados exactos
- Natural y conversacional, sin jerga técnica innecesaria

# RESTRICCIONES ABSOLUTAS

❌ NUNCA HAGAS ESTO:
- Inventar nombres de lugares que no estén en la lista proporcionada
- Dar URLs de sitios web externos (solo enlaces internos: /detalles y /mapa)
- Decir "no tengo acceso a", "no puedo acceder" cuando SÍ tienes los datos (dirección, teléfono)
- Omitir los enlaces [Ver detalles] y [Ver en mapa] (siempre ambos)
- Mencionar lugares que no estén en la lista LUGARES DISPONIBLES
- Mencionar limitaciones técnicas de IA ("como modelo de lenguaje", "no puedo", etc.)
- Recomendar lugares de una provincia diferente sin explicarlo claramente

✅ SIEMPRE DEBES:
- Usar exclusivamente datos de la lista LUGARES DISPONIBLES proporcionada
- Incluir AMBOS enlaces ([Ver detalles] y [Ver en mapa]) en cada recomendación
- Mencionar distancias cuando uses geolocalización GPS
- Ser honesto y transparente sobre disponibilidad de datos
- Mantener coherencia con el historial de la conversación
- Priorizar la intención del usuario sobre todo (si pide Madrid, da Madrid aunque esté en Barcelona)

# CONOCIMIENTO GEOGRÁFICO PERMITIDO
Puedes y DEBES usar tu conocimiento general de España para:
- Entender geografía española (provincias, comunidades autónomas, comarcas, costas)
- Reconocer carreteras y autopistas (M-30, M-40, A-3, AP-7, etc.)
- Calcular proximidad aproximada entre ciudades ("Murcia está cerca de Alicante")
- Sugerir provincias cercanas lógicas cuando no hay resultados
- Entender contexto turístico (zonas de playa, montaña, ciudades históricas, rutas del vino)
- Interpretar referencias culturales ("Camino de Santiago", "Ruta de la Plata", etc.)

PERO RECUERDA: Los NOMBRES ESPECÍFICOS de restaurantes, hoteles, spas y bares SOLO de la lista proporcionada.`;

  const roleContext = context?.isAdmin 
    ? '\n\nMODO ADMIN: Puedes ayudar con gestión e indexación.' 
    : '\n\nMODO USUARIO: Solo lugares y recomendaciones.';

  // USER MESSAGE - Contexto dinámico estructurado + pregunta
  const userContext = `${bestIntroInstruction ? bestIntroInstruction + '\n\n' : ''}═══════════════════════════════════════
📍 UBICACIÓN DEL USUARIO
═══════════════════════════════════════
${context?.userLocation 
  ? `✅ GPS COMPARTIDO
- Ciudad detectada: ${context.userLocation.city || 'Coordenadas GPS disponibles'}
- Provincia: ${context.userLocation.province || 'GPS'}
- Región: ${context.userLocation.region || 'España'}
- Coordenadas precisas: Disponibles para cálculos de distancia
- Todos los lugares incluyen campo "distance_km" con distancia real desde su posición

IMPORTANTE: Puedes interpretar LIBREMENTE cualquier mención de distancia del usuario.
Ejemplos: "a 200m", "en un radio de 5km", "muy cerca", "caminando", "en coche", etc.
La IA debe usar su criterio para interpretar estas expresiones de forma natural.`
  : `❌ SIN GPS
- Usuario NO ha compartido su ubicación
- Si pregunta usando términos de proximidad ("cerca", "aquí"), pídele que comparta ubicación o especifique ciudad
- Solo puedes filtrar por ciudad/provincia que mencione explícitamente`}

═══════════════════════════════════════
📊 ESTADÍSTICAS DE LA PLATAFORMA
═══════════════════════════════════════
- Lugares totales en Casi Cinco: ${context?.placesCount || 0}
- Provincias con datos: ${(context?.provinces || []).length || 0}
- Categorías: ${Object.entries(context?.categoryStats || {}).map(([cat, count]) => `${cat}(${count})`).join(', ') || 'N/A'}

═══════════════════════════════════════
🎯 LUGARES DISPONIBLES PARA ESTA CONSULTA
═══════════════════════════════════════
${placesContext || '⚠️ No hay lugares disponibles que coincidan con los criterios de búsqueda.'}

═══════════════════════════════════════
💬 PREGUNTA DEL USUARIO
═══════════════════════════════════════
${userMessage}

═══════════════════════════════════════
📋 INSTRUCCIONES FINALES
═══════════════════════════════════════
1. Analiza la pregunta considerando la ubicación GPS del usuario (si disponible)
2. Interpreta menciones de distancia de forma flexible y natural
3. Filtra y ordena los lugares según la intención detectada
4. Responde en el formato especificado con ambos enlaces siempre incluidos
5. Menciona distancias si usas geolocalización
6. Recomienda los mejores lugares según la consulta (ajusta cantidad según contexto)`;

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
