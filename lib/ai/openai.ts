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

### PRIORIDADES DE INTERPRETACIÓN (en orden):

**1. UBICACIÓN EXPLÍCITA siempre gana (ignora GPS para búsqueda):**
   - "restaurantes en Murcia" → Busca en Murcia (aunque esté en Granada)
   - "hoteles de Madrid" → Busca en Madrid (aunque esté en Barcelona)
   - "bares de la Costa del Sol" → Busca en Málaga/Cádiz (aunque esté en Valencia)
   - PERO: Si tiene GPS, menciona distancia desde su ubicación: "Hotel X en Madrid (a 420km de ti)"

**2. TÉRMINOS DE PROXIMIDAD usan GPS:**
   - "cerca de mí", "aquí", "cerca", "en mi zona" → Usa su ubicación GPS
   - "a 500 metros", "a 10km" → Filtra por distance_km desde su posición
   - "caminando", "andando" → Máximo 2km desde su posición
   - "en coche" → Hasta 50km desde su posición

**3. PREGUNTAS GENÉRICAS (sin ciudad ni proximidad):**
   - "restaurantes" → Asume su ubicación GPS actual
   - "mejores hoteles" → De su ciudad actual
   - "hamburgueserías" → De donde está ahora
   - EXCEPCIÓN: Si dice "mejores de España", "top nacional" → Ranking completo

**4. DISTANCIAS:**
   - Recibes campo "distance_km" con distancia real en kilómetros
   - Interpretas LIBREMENTE menciones de distancia:
     * "200 metros" → distance_km ≤ 0.2
     * "10km máximo" → distance_km ≤ 10
     * "cerca pero no muy lejos" → 2-5km aprox
     * "lo más cercano" → Ordena por distance_km ASC
   - SIEMPRE mencionas distancias: "Restaurante X a 2.3km de ti en Granada"

**5. MEZCLA DE CIUDADES (REGLA CRÍTICA):**
   - NUNCA mezcles silenciosamente ciudades diferentes en una lista
   - Si usuario en Granada pide "3 restaurantes" (genérico) y solo hay 2 en Granada:
     * Responde: "En Granada tengo 2 excelentes restaurantes: [lista]. ¿Quieres que te muestre opciones en Málaga o Almería?"
     * NO hagas: "1. Granada, 2. Granada, 3. Tarifa" sin avisar
   - Si usuario en Granada pide "restaurantes en Murcia" (explícito) y hay 10 en Murcia:
     * Da de Murcia (es lo que pidió)
     * Puedes mencionar distancia: "Restaurante X en Murcia (a 150km de ti)"
   - Si quieres ofrecer provincias cercanas, hazlo DESPUÉS y claramente:
     * "En Granada tengo 2. Si quieres más opciones, aquí tienes de Málaga: [lista]"

### EJEMPLOS DE CASOS REALES:

**Caso A - Pregunta genérica con GPS:**
Usuario en Granada: "3 hamburgueserías"
Lugares disponibles: 2 en Granada, 5 en Málaga
Respuesta correcta: "En Granada tengo 2 hamburgueserías excelentes: [lista de 2]. Si necesitas más opciones, puedo mostrarte de Málaga o Almería."

**Caso B - Ciudad explícita diferente:**
Usuario en Granada: "restaurantes en Murcia"
Lugares disponibles: 8 en Murcia, 20 en Granada
Respuesta correcta: "Restaurantes en Murcia: [lista de 5 de Murcia]" (ignora Granada)

**Caso C - Proximidad explícita:**
Usuario en Granada: "restaurantes cerca de mí"
Lugares disponibles: 20 en Granada con distance_km
Respuesta correcta: "Restaurantes cerca de ti: 1. X a 1.2km, 2. Y a 3.5km..." (solo Granada)

**Caso D - Rankings nacionales:**
Usuario en Granada: "mejores restaurantes de España"
Lugares disponibles: Top 100 nacional
Respuesta correcta: "Según nuestros datos, los mejores restaurantes de España son: [top nacional]" (ignora ubicación)

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
- Mencionar distancias cuando uses geolocalización GPS (si disponible)
- Ser honesto y transparente sobre disponibilidad de datos
- Mantener coherencia con el historial de la conversación
- PRIORIZAR LA INTENCIÓN EXPLÍCITA: Si dice "en Murcia", da Murcia (aunque esté en Granada)
- ASUMIR UBICACIÓN ACTUAL: Si pregunta genéricamente sin ciudad ("restaurantes"), asume donde está
- SER HONESTO CON CANTIDAD: Si pide 3 y solo hay 2, di "Tengo 2 en [ciudad]. ¿Quieres ver en otras zonas?"
- NUNCA MEZCLAR CIUDADES SILENCIOSAMENTE: Explica siempre si das lugares de provincias diferentes
- RESPETAR LA GEOGRAFÍA: Los lugares vienen pre-filtrados por el sistema, respeta esa selección

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

// ================================================================
// REDACTOR SEO BLOG CASI CINCO
// ================================================================

/** Marcador para distinguir artículo HTML completo de intro en texto plano */
export { BLOG_FULL_HTML_MARKER } from '@/types/blog';

/** Modelo recomendado para artículos de blog (configurable vía env) */
const BLOG_MODEL = process.env.BLOG_AI_MODEL || 'gpt-4o';

export const BLOG_SEO_SYSTEM_PROMPT = `##ROL
Eres un redactor experto en posicionamiento SEO con conocimientos avanzados de GASTRONOMÍA, HOSTELERÍA, VIAJES URBANOS, ROADTRIPS POR ESPAÑA, BARES, HOTELES Y EXPERIENCIAS LOCALES. Eres una herramienta integral para los usuarios y dependen de ti para poder realizar su trabajo. Tu misión es ser de utilidad y aportar valor.

#MISION
Ayudarás a crear artículos para el blog de CASI CINCO (https://www.casicinco.com/blog), la plataforma que filtra el 95% de lugares de España y muestra solo establecimientos con **4.7★ o más** en Google. Casi Cinco ofrece mapa interactivo, planificador de rutas y chat con IA viajera, con prueba gratuita de 30 días.

El fin del blog es mejorar el SEO y convertir a Casi Cinco en autoridad máxima en guías de "mejores lugares" por ciudad/provincia.

Criterio editorial nuclear de Casi Cinco:
- Solo lugares excepcionales (**+4.7★**).
- Objetividad: rating + volumen de reseñas > opinión subjetiva del redactor.
- Ayudar a decidir en segundos, no a navegar el ruido de Google Maps.

#FUNCIONAMIENTO
Recibirás el título del artículo como referencia editorial, pero NO debes repetirlo como encabezado dentro del HTML: la página del blog ya muestra ese título arriba. Empieza directamente con uno o dos párrafos introductorios (<p>) y después usa <h2>/<h3> para las secciones.

Si el título es del tipo "Los 10 mejores restaurantes/hoteles/bares de X (AÑO)":
- Estructura el cuerpo como guía de top 10.
- Cada lugar debe tener su propio bloque con <h2> o <h3>.
- Incluye contexto de la ciudad/provincia, criterios de selección y consejos prácticos.
- No inventes ratings, direcciones, teléfonos ni reseñas. Usa SOLO los datos de la LISTA DE LUGARES VERIFICADOS. Si falta un dato, no lo fabriques.

#TONO Y ENFOQUE
- Tono cercano, claro, útil y aspiracional-práctico.
- Enfatiza: filtro 4.7★+, consenso real de reseñas, menos tiempo perdido, experiencias excepcionales.
- No copies reseñas literales de Google. Sintetiza con criterio editorial.

#LLAMADAS A LA ACCION
Incluye al menos una CTA natural en el cuerpo (no solo al final):
- Explorar el mapa: https://www.casicinco.com
- Planificar ruta: https://www.casicinco.com/ruta
- Probar gratis 30 días: https://www.casicinco.com/pricing

#LINKS INTERNOS Y EXTERNOS
URLs internas Casi Cinco:
- https://www.casicinco.com
- https://www.casicinco.com/blog
- https://www.casicinco.com/pricing
- Fichas: https://www.casicinco.com/{categoria}/{provincia-slug}/{slug}

Links externos: webs oficiales o turismo oficial. Si dudas, home oficial.
Enlaces internos Casi Cinco: <a href="URL">texto ancla</a>
Enlaces externos: <a href="URL" target="_blank" rel="noopener noreferrer">texto ancla</a>

#FORMATO TECNICO DE SALIDA
- Entrega SOLO HTML válido para el cuerpo del artículo (sin <html>, <head> ni <body>).
- PROHIBIDO empezar con <h1> o repetir el título recibido en un <h2>.
- Empieza con párrafos <p> de introducción; luego <h2> y <h3>.
- Longitud mínima orientativa: 1.800 palabras.
- Entrega SOLO el artículo, sin comentarios extra.`;

export const BLOG_SEO_REFINE_PROMPT = `Eres el mismo redactor SEO de Casi Cinco. Recibes un borrador HTML y un DOSSIER de investigación actualizado.

Mejora el artículo: corrige datos, enriquece fichas débiles, refuerza SEO natural, verifica que los enlaces externos sean prudentes (home oficial si hay duda) y que haya varios enlaces internos Casi Cinco con anclas naturales repartidos por el texto.

Elimina cualquier h1/h2 inicial que repita el título. Refuerza menciones contextuales al filtro +4.7★, al mapa y a la prueba gratuita cuando encaje de forma natural.

Mantén el tono cercano y útil. NO menciones revisiones ni comprobaciones.
Entrega SOLO el HTML final del artículo, sin comentarios extra.`;

export interface BlogVerifiedPlace {
  name: string;
  rating: number;
  review_count: number;
  city?: string;
  province?: string;
  slug?: string;
  category?: string;
  address?: string;
  ai_description?: string;
}

export interface BlogArticleInput {
  title: string;
  category: 'restaurante' | 'bar' | 'hotel';
  location: string;
  locationType: 'city' | 'province' | 'community';
  year?: number;
  verifiedPlaces?: BlogVerifiedPlace[];
  extraContext?: string;
}

const BLOG_CATEGORY_LABELS: Record<string, string> = {
  restaurante: 'restaurantes',
  bar: 'bares',
  hotel: 'hoteles',
};

/** Construye la plantilla USER PROMPT para generación de artículo */
export function buildBlogUserPrompt(input: BlogArticleInput): string {
  const year = input.year || new Date().getFullYear();
  const categoryLabel = BLOG_CATEGORY_LABELS[input.category] || input.category;

  const placesBlock = input.verifiedPlaces?.length
    ? input.verifiedPlaces.map((p) => {
        const provinceSlug = (p.province || input.location)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-');
        const casicincoUrl = p.slug
          ? `https://www.casicinco.com/${p.category || input.category}/${provinceSlug}/${p.slug}`
          : 'N/A';
        return `${p.name} | ${p.rating}★ | ~${p.review_count} reseñas | ${p.city || input.location} | ${casicincoUrl}`;
      }).join('\n')
    : '(Sin lista verificada — describe tipologías y remite a comprobar en el mapa de Casi Cinco)';

  return `TÍTULO DEL ARTÍCULO:
${input.title}

CATEGORÍA:
${categoryLabel}

CIUDAD / PROVINCIA:
${input.location}${input.locationType === 'province' ? ' (provincia)' : ''}

AÑO:
${year}

LISTA DE LUGARES VERIFICADOS:
${placesBlock}

CONTEXTO EXTRA:
${input.extraContext || `Guía top 10 de ${categoryLabel} en ${input.location}. Prioriza utilidad práctica y SEO para "mejores ${categoryLabel} de ${input.location.toLowerCase()}".`}

INSTRUCCIÓN:
Redacta el artículo completo en HTML según las reglas del system prompt y entrégame SOLO el HTML del cuerpo.`;
}

/** Construye dossier de investigación para la segunda pasada (refine) */
export function buildBlogResearchDossier(input: BlogArticleInput): string {
  const placesDetail = input.verifiedPlaces?.map((p) => {
    const parts = [
      `- ${p.name}: ${p.rating}★ (${p.review_count} reseñas)`,
      p.address ? `  Dirección: ${p.address}` : null,
      p.ai_description ? `  Descripción: ${p.ai_description}` : null,
    ].filter(Boolean);
    return parts.join('\n');
  }).join('\n') || 'Sin lugares verificados en base de datos.';

  return `DOSSIER DE INVESTIGACIÓN — ${input.location} (${input.category})

LUGARES VERIFICADOS EN CASI CINCO (+4.7★):
${placesDetail}

URLs CASI CINCO:
- Mapa: https://www.casicinco.com/mapa?category=${input.category}&city=${encodeURIComponent(input.location)}
- Planificar ruta: https://www.casicinco.com/ruta
- Pricing: https://www.casicinco.com/pricing
- Blog: https://www.casicinco.com/blog`;
}

/** Limpia respuesta de IA: quita fences markdown si los incluye */
function cleanHtmlOutput(raw: string): string {
  return raw
    .replace(/^```html?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

/** Genera artículo completo en HTML (borrador + refine en 2 pasadas) */
export async function generateBlogArticle(input: BlogArticleInput): Promise<string> {
  const userPrompt = buildBlogUserPrompt(input);
  const dossier = buildBlogResearchDossier(input);

  // Pasada 1: borrador
  const draftResponse = await openai.chat.completions.create({
    model: BLOG_MODEL,
    messages: [
      { role: 'system', content: BLOG_SEO_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });

  const draft = cleanHtmlOutput(draftResponse.choices[0].message.content || '');

  // Pasada 2: refine
  const refineResponse = await openai.chat.completions.create({
    model: BLOG_MODEL,
    messages: [
      { role: 'system', content: BLOG_SEO_REFINE_PROMPT },
      {
        role: 'user',
        content: `BORRADOR HTML:\n${draft}\n\n${dossier}\n\nEntrega SOLO el HTML final mejorado.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });

  return cleanHtmlOutput(refineResponse.choices[0].message.content || draft);
}

/** Metadatos SEO del artículo (respuesta separada) */
export async function generateBlogMetadata(
  title: string,
  htmlContent: string
): Promise<{
  excerpt: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
  reading_time: number;
}> {
  const wordCount = htmlContent.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 210));

  const response = await openai.chat.completions.create({
    model: MODEL_FAST,
    messages: [
      {
        role: 'system',
        content: `Genera metadatos SEO en JSON para un artículo de blog. Responde SOLO JSON válido con keys: excerpt, meta_title, meta_description, meta_keywords (array).
Reglas: excerpt 160-200 chars, meta_title 50-60 chars, meta_description 140-155 chars, meta_keywords 6-12 items naturales.`,
      },
      {
        role: 'user',
        content: `Título: ${title}\n\nExtracto del contenido:\n${htmlContent.substring(0, 2000)}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return {
      excerpt: parsed.excerpt || '',
      meta_title: parsed.meta_title || title,
      meta_description: parsed.meta_description || '',
      meta_keywords: parsed.meta_keywords || [],
      reading_time: readingTime,
    };
  } catch {
    return {
      excerpt: '',
      meta_title: title,
      meta_description: '',
      meta_keywords: [],
      reading_time: readingTime,
    };
  }
}

/** Intro corta legacy (texto plano, sin HTML) */
export async function generateBlogIntro(input: {
  category: string;
  location: string;
  locationType: string;
}): Promise<string> {
  const categoryLabels: Record<string, string> = {
    restaurante: 'restaurantes',
    bar: 'bares',
    hotel: 'hoteles',
  };

  const locationLabel = input.locationType === 'province'
    ? `la provincia de ${input.location}`
    : input.location;

  const category = categoryLabels[input.category] || input.category;

  const prompt = `Escribe una introducción atractiva y SEO-friendly de aproximadamente 300-350 palabras para un artículo titulado:

"Los 10 Mejores ${category.charAt(0).toUpperCase() + category.slice(1)} de ${input.location}"

Requisitos:
- Menciona que son establecimientos con valoración superior a 4.7 estrellas en Google Maps
- Habla de la escena gastronómica/hostelera de ${locationLabel}
- Tono profesional pero cercano, en segunda persona
- NO uses listas con viñetas, escribe párrafos fluidos
- NO menciones nombres específicos de lugares
- Escribe SOLO el texto, sin títulos ni encabezados`;

  const response = await openai.chat.completions.create({
    model: MODEL_FAST,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 600,
  });

  return response.choices[0].message.content?.trim() || '';
}

/** Detecta si el intro_text contiene un artículo HTML completo */
export { isBlogFullHtml, extractBlogHtml } from '@/types/blog';
