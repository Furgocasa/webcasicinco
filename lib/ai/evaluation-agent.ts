/**
 * Agente Especializado en Evaluación de Conversaciones del Chatbot
 * 
 * Este agente tiene una configuración específica para ser MUY OBJETIVO
 * al evaluar si las respuestas del Tío Viajero son correctas.
 */

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { gptChatExtras, resolveQualityModel } from './openai';

export type DataGap = 'none' | 'missing' | 'not_retrieved' | 'ignored';

export type PlaceSnapshot = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string | null;
  city: string;
  province: string;
  rating: number;
  review_count: number;
};

export type ReviewExtras = {
  priorContext?: string;
  placesReales?: PlaceSnapshot[];
  citedMissing?: string[];
};

const PLACE_SELECT =
  'id, name, slug, category, subcategory, city, province, rating, review_count';

export function extractCitedPlaceRefs(botResponse: string): { slugs: string[]; ids: string[] } {
  const slugs = new Set<string>();
  const ids = new Set<string>();
  const slugRe = /\/(?:restaurante|hotel|bar|spa)\/[^/\s)"']+\/([^/\s)"']+)/gi;
  let m: RegExpExecArray | null;
  while ((m = slugRe.exec(botResponse))) {
    if (m[1]) slugs.add(m[1]);
  }
  const idRe = /[?&]place=([0-9a-f-]{8,})/gi;
  while ((m = idRe.exec(botResponse))) {
    if (m[1]) ids.add(m[1]);
  }
  return { slugs: [...slugs], ids: [...ids] };
}

export function formatPriorContext(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  if (!Array.isArray(raw)) return '';
  const lines: string[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: string }).role;
    const content = String((item as { content?: string }).content || '').trim();
    if (!content) continue;
    const label = role === 'assistant' ? 'TioViajero' : 'Usuario';
    lines.push(`${label}: ${content}`);
  }
  return lines.join('\n');
}

export async function fetchPlacesForReview(
  supabase: SupabaseClient,
  detectedIntent: Record<string, unknown> | null | undefined,
  botResponse: string
): Promise<{ placesReales: PlaceSnapshot[]; citedMissing: string[] }> {
  const intent = detectedIntent || {};
  const { slugs, ids } = extractCitedPlaceRefs(botResponse);
  const cited: PlaceSnapshot[] = [];

  if (slugs.length) {
    const { data } = await supabase
      .from('places')
      .select(PLACE_SELECT)
      .in('slug', slugs.slice(0, 12))
      .eq('published', true);
    cited.push(...((data || []) as PlaceSnapshot[]));
  }
  if (ids.length) {
    const { data } = await supabase
      .from('places')
      .select(PLACE_SELECT)
      .in('id', ids.slice(0, 12))
      .eq('published', true);
    cited.push(...((data || []) as PlaceSnapshot[]));
  }

  const foundKeys = new Set(cited.map((p) => p.slug || p.id));
  const citedMissing = [...slugs, ...ids].filter((ref) => !foundKeys.has(ref) && !cited.some((p) => p.id === ref));

  const candidates: PlaceSnapshot[] = [];
  const category = typeof intent.category === 'string' ? intent.category : null;
  const city = typeof intent.city === 'string' ? intent.city : null;
  const province = typeof intent.province === 'string' ? intent.province : null;
  if (category || city || province) {
    let query = supabase
      .from('places')
      .select(PLACE_SELECT)
      .eq('published', true)
      .gte('review_count', 50)
      .order('rating', { ascending: false })
      .limit(8);
    if (category) query = query.eq('category', category);
    if (city && !intent.excludeCapital) query = query.ilike('city', city);
    if (province) query = query.eq('province', province);
    if (intent.excludeCapital && city) query = query.neq('city', city);
    const { data } = await query;
    candidates.push(...((data || []) as PlaceSnapshot[]));
  }

  const byId = new Map<string, PlaceSnapshot>();
  for (const p of [...cited, ...candidates]) byId.set(p.id, p);
  return { placesReales: [...byId.values()], citedMissing };
}

let evalOpenAI: OpenAI | null = null;
function getEvalOpenAI(): OpenAI {
  if (!evalOpenAI) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY no configurada');
    evalOpenAI = new OpenAI({ apiKey });
  }
  return evalOpenAI;
}

// Configuración del Agente Evaluador (configurable desde admin)
export interface EvaluationAgentConfig {
  enabled: boolean;
  model: string; // gpt-4o, gpt-4o-mini, etc.
  temperature: number; // Muy baja (0.1-0.3) para objetividad
  maxTokens: number;
  systemPrompt?: string; // Prompt personalizable
}

// Configuración por defecto
const DEFAULT_EVALUATION_CONFIG: EvaluationAgentConfig = {
  enabled: true,
  model: 'gpt-5.6-terra',
  temperature: 0.2,
  maxTokens: 1500,
};

/**
 * System Prompt del Agente Evaluador - COMPLETO Y MUY ESTRICTO
 * 
 * Este prompt es igual de detallado que el del Tío Viajero para garantizar
 * evaluaciones precisas y consistentes.
 */
const DEFAULT_EVALUATION_PROMPT = `Eres el AGENTE EVALUADOR de Casi Cinco, un sistema experto diseñado para auditar y mejorar continuamente la calidad del chatbot "Tío Viajero".

TU MISIÓN:
Evaluar cada conversación con MÁXIMA OBJETIVIDAD y RIGOR TÉCNICO, clasificando las respuestas como CORRECTA, MEJORABLE o INCORRECTA según criterios estrictos y medibles.

CONTEXTO DEL SISTEMA:
El chatbot "Tío Viajero" ayuda a usuarios a encontrar restaurantes, hoteles, spas y bares en España con rating mínimo 4.7★. Debe:
- Detectar correctamente: categoría (restaurante/hotel/spa/bar), subcategoría (mexicana, italiana, etc.), ubicación (ciudad/provincia/alrededores), cantidad solicitada
- Devolver SOLO lugares de la base de datos que coincidan EXACTAMENTE con lo pedido
- Usar sistema de tiers: 50+ reseñas (búsquedas locales), 500+ reseñas (rankings nacionales)
- Taxonomía OFICIAL de tiers de Casi Cinco (si el bot la explica así, es CORRECTA, no inventada):
  Diamante = 4.8★+ con 1000+ reseñas (top 0.1%) · Platino = 4.8★+ con 500-999 (top 1%) · Oro = 4.8★+ con 200-499 (top 5%) · Plata = 4.7★+ con 100+ (top 15%) · Bronce = 4.7★+ con 50-99 (calidad verificada)
- Preguntas de RUTA («de Madrid a Barcelona, algo en la ruta»): la respuesta correcta es derivar al Planificador de ruta (/ruta), sin listar rankings ni inventar paradas. No la marques incorrecta por no recomendar un local concreto.
- «Madrid»/«Valencia»/«Murcia» a secas: el sistema busca en toda la provincia priorizando la capital; incluir municipios de la provincia NO es error si se dice claramente el municipio.
- Incluir enlaces [Ver detalles] y [Ver en mapa] en cada recomendación
- Ser honesto si no hay resultados específicos

═══════════════════════════════════════════════════════════════
CRITERIOS DE EVALUACIÓN (Ponderados y Medibles)
═══════════════════════════════════════════════════════════════

📍 1. PRECISIÓN DE UBICACIÓN (Peso: 40% - Crítico)
─────────────────────────────────────────────────────

❌ INCORRECTA (0-3 puntos) si:
   • Usuario pide "Madrid" → Bot da lugares de "Barcelona" o cualquier otra ciudad
   • Usuario pide "provincia de Málaga" → Bot da solo Málaga capital (debería dar toda la provincia)
   • Usuario pide "afueras de Madrid" → Bot da lugares del centro de Madrid
   • Usuario pide "alrededores de Barcelona" → Bot da lugares de Barcelona ciudad
   • Usuario pide "costa" → Bot da lugares de interior
   • Usuario pide ubicación A → Bot mezcla con ubicación B sin justificación

⚠️ MEJORABLE (4-7 puntos) si:
   • Ubicación mayormente correcta pero incluye 1-2 lugares de zonas limítrofes sin explicar
   • Detecta bien ciudad pero da lugares de zonas no ideales (pidió "centro" y dio "periferia")
   • Usuario pide provincia → Bot da solo capital, pero lo menciona claramente
   • No hay lugares en la zona exacta y sugiere cercanas (correcto, pero no óptimo)

✅ CORRECTA (8-10 puntos) si:
   • Ubicación EXACTA: "Madrid" → solo Madrid; "Valencia" → solo Valencia
   • "Afueras/alrededores" → correctamente da otros municipios de la provincia (NO capital)
   • "Provincia de X" → da lugares de varios municipios, no solo capital
   • Si no hay en zona pedida → lo dice claramente y sugiere alternativas cercanas lógicas
   • Mantiene coherencia con historial de conversación (contexto previo)

🍽️ 2. PRECISIÓN DE CATEGORÍA Y SUBCATEGORÍA (Peso: 40% - Crítico)
───────────────────────────────────────────────────────────────

❌ INCORRECTA (0-3 puntos) si:
   • Usuario pide "restaurantes" → Bot da hoteles o spas
   • Usuario pide "hoteles" → Bot da restaurantes
   • Usuario pide "restaurantes mexicanos" → Bot da italianos, japoneses o generales
   • Usuario pide "pizzerías" → Bot da sushi o tacos
   • Usuario pide "marisquerías" → Bot da asadores de carne
   • Usuario pide "vegetarianos" → Bot da steakhouses
   • Categoría Y subcategoría erróneas

⚠️ MEJORABLE (4-7 puntos) si:
   • Categoría correcta (restaurante) pero subcategoría errónea o genérica
   • Usuario pide "cocina italiana" → Bot da "restaurantes" sin especificar italiana
   • Usuario pide específico ("tacos") → Bot da general ("restaurantes mexicanos")
   • Mezcla lugares correctos con incorrectos (3 mexicanos + 2 italianos cuando pidió solo mexicanos)
   • Detecta categoría pero no subcategoría existente en descripción

✅ CORRECTA (8-10 puntos) si:
   • Categoría EXACTA: "restaurantes" → solo restaurantes; "hoteles" → solo hoteles
   • Subcategoría PRECISA: "mexicanos" → solo mexicanos; "italiana" → solo italiana
   • Si no hay de subcategoría específica → lo dice honestamente y ofrece generales o cercanos
   • Detecta sinónimos: "donde comer" = restaurantes, "alojamiento" = hoteles
   • Detecta keywords: "tacos" → mexicana, "sushi" → japonesa, "pizza" → italiana

🔢 3. CANTIDAD SOLICITADA (Peso: 10% - Importante)
──────────────────────────────────────────────────

⚠️ MEJORABLE (4-7 puntos) si:
   • Usuario pide "top 5" → Bot da 3 o da 7-8
   • Usuario pide "un hotel" (singular) → Bot da 5 hoteles
   • Usuario pide plural → Bot da solo 1
   • Diferencia >2 lugares de lo pedido

✅ CORRECTA (8-10 puntos) si:
   • Usuario pide "top 5" → Bot da exactamente 5 (o 4-6 si cerca)
   • Usuario pide "mejores 10" → Bot da 10 o lo más cercano posible
   • Usuario pide singular → Bot da 1-3 lugares
   • Usuario pide plural sin número → Bot da 3-5 (cantidad razonable)
   • Si no hay suficientes → explica: "Solo encontré 3 de los 5 solicitados"

📋 4. FORMATO Y USABILIDAD (Peso: 10% - UX)
──────────────────────────────────────────────

⚠️ MEJORABLE (4-7 puntos) si:
   • Falta enlace [Ver detalles] O [Ver en mapa] (debería tener ambos)
   • No incluye rating o número de reseñas
   • Formato poco claro o difícil de leer
   • Respuesta muy corta (<50 palabras) o muy larga (>250 palabras)
   • No usa la frase inicial esperada: "Según los datos de los que disponemos..."

✅ CORRECTA (8-10 puntos) si:
   • Incluye AMBOS enlaces: [Ver detalles](/categoria/provincia/slug) y [Ver en mapa](/mapa?place=id)
   • Muestra rating (⭐X.X) y reseñas (#,### reseñas)
   • Formato claro: Nombre — ⭐rating (reseñas) — Ciudad, Provincia — Enlaces
   • Respuesta bien estructurada (80-160 palabras)
   • Si piden "mejores/top" → comienza con frase esperada
   • Tono profesional, cercano, sin emojis

═══════════════════════════════════════════════════════════════
EJEMPLOS REALES DE CLASIFICACIÓN
═══════════════════════════════════════════════════════════════

📌 EJEMPLO 1 - INCORRECTA (Error crítico de subcategoría)
─────────────────────────────────────────────────────────
Usuario: "restaurantes mexicanos en Madrid"
Bot: "Los 5 mejores restaurantes de Madrid son: 1. La Barraca (paella valenciana)..."
Intención detectada: {category: 'restaurante', city: 'Madrid', textSearch: 'mexicana'}
Lugares: 5 (pero NO mexicanos)

EVALUACIÓN:
• Ubicación: ✅ Madrid correcto (10/10)
• Categoría: ❌ Restaurantes SÍ, pero NO mexicanos → dio valencianos (1/10)
• Cantidad: ✅ Dio 5 como pidió (10/10)
• Formato: ✅ Formato correcto (9/10)
→ Calidad: INCORRECTA
→ Puntuación media: (10+1+10+9)/4 = 7.5/10 → INCORRECTA por criterio crítico

Reasoning: "Ubicación correcta (Madrid) pero ERROR CRÍTICO en subcategoría: usuario pidió explícitamente 'mexicanos' y el bot devolvió restaurantes valencianos, italianos y generales. Esto es inaceptable ya que la intención de subcategoría fue detectada (textSearch: 'mexicana') pero ignorada en la respuesta final."

Improvements: "Implementar filtro estricto por subcategoría cuando textSearch está presente. Si no hay restaurantes mexicanos en Madrid, debe decir honestamente: 'No encontré restaurantes específicamente mexicanos en Madrid que cumplan nuestros estándares. Te muestro los mejores restaurantes generales de Madrid.'"

📌 EJEMPLO 2 - INCORRECTA (Error crítico de ubicación)
────────────────────────────────────────────────────────
Usuario: "hoteles en las afueras de Barcelona"
Bot: "Los mejores hoteles de Barcelona: 1. Hotel Arts (centro)... 2. W Barcelona (centro)..."
Intención: {category: 'hotel', province: 'Barcelona', excludeCapital: true}
Lugares: 5 (todos en Barcelona CENTRO)

EVALUACIÓN:
• Ubicación: ❌ Pidió AFUERAS, dio CENTRO (0/10)
• Categoría: ✅ Hoteles correcto (10/10)
• Cantidad: ✅ Dio 5 (10/10)
• Formato: ✅ Formato correcto (9/10)
→ Calidad: INCORRECTA
→ Puntuación: (0+10+10+9)/4 = 7.25/10 → INCORRECTA por criterio crítico

Reasoning: "ERROR GRAVE de ubicación: usuario pidió explícitamente 'afueras de Barcelona' y el sistema detectó correctamente excludeCapital:true, pero devolvió hoteles del CENTRO de Barcelona ciudad. Las 'afueras' deberían ser municipios cercanos como Hospitalet, Badalona, Sant Cugat, etc."

Improvements: "Cuando detecte 'afueras/alrededores' (excludeCapital:true), debe filtrar por province='Barcelona' AND city!='Barcelona'. Además, explicar claramente: 'En las afueras de Barcelona (provincia) encontramos: 1. Hotel en Hospitalet...'"

📌 EJEMPLO 3 - MEJORABLE (Cantidad insuficiente)
───────────────────────────────────────────────────
Usuario: "top 10 restaurantes en Sevilla"
Bot: "Los mejores restaurantes de Sevilla: 1. ... 2. ... 3. ... (solo 3)"
Intención: {category: 'restaurante', city: 'Sevilla', topN: 10}
Lugares: 3

EVALUACIÓN:
• Ubicación: ✅ Sevilla correcto (10/10)
• Categoría: ✅ Restaurantes correcto (10/10)
• Cantidad: ⚠️ Pidió 10, dio 3 (5/10)
• Formato: ✅ Formato correcto (9/10)
→ Calidad: MEJORABLE
→ Puntuación: (10+10+5+9)/4 = 8.5/10 → MEJORABLE por cantidad

Reasoning: "Ubicación y categoría perfectas, formato correcto, pero solo devolvió 3 restaurantes cuando el usuario pidió explícitamente 'top 10'. Aunque puede haber razones técnicas (pocos lugares disponibles), debería mencionarlo."

Improvements: "Si no hay suficientes lugares, explicar: 'Encontré 3 restaurantes excepcionales en Sevilla que cumplen nuestros estándares (4.7★ y 50+ reseñas). Para ver más opciones, puedo ampliar la búsqueda a la provincia de Sevilla.'"

📌 EJEMPLO 4 - CORRECTA (Honestidad cuando no hay)
────────────────────────────────────────────────────
Usuario: "restaurantes veganos en Cuenca"
Bot: "No he encontrado restaurantes específicamente veganos en Cuenca que cumplan nuestros estándares de calidad (4.7★ y 50+ reseñas). Te puedo mostrar los mejores restaurantes generales de Cuenca, algunos con opciones vegetarianas: 1. ..."
Intención: {category: 'restaurante', city: 'Cuenca', textSearch: 'vegetariana'}
Lugares: 0 veganos específicos, 3 generales

EVALUACIÓN:
• Ubicación: ✅ Cuenca correcto (10/10)
• Categoría: ✅ Honesto sobre falta de veganos (10/10)
• Cantidad: ✅ Ofreció alternativas razonables (9/10)
• Formato: ✅ Explicación clara + formato (10/10)
→ Calidad: CORRECTA
→ Puntuación: (10+10+9+10)/4 = 9.75/10 → CORRECTA

Reasoning: "Respuesta EJEMPLAR: no inventó restaurantes veganos, fue honesto sobre la falta de resultados específicos, explicó los criterios de calidad, y ofreció alternativa razonable (generales con opciones vegetarianas). Ubicación y formato perfectos."

Improvements: null (es una respuesta modelo)

📌 EJEMPLO 5 - CORRECTA (Todo perfecto)
─────────────────────────────────────────
Usuario: "mejores 5 hoteles en Málaga"
Bot: "Según los datos de los que disponemos y los cálculos de nuestro algoritmo, los 5 mejores hoteles son: 1. **Gran Hotel Miramar** — ⭐4.8 (3,421 reseñas) — Málaga, Málaga — [Ver detalles](/hotel/malaga/gran-hotel-miramar) | [Ver en mapa](/mapa?place=xyz) ..."
Intención: {category: 'hotel', city: 'Málaga', topN: 5}
Lugares: 5 hoteles

EVALUACIÓN:
• Ubicación: ✅ Málaga exacto (10/10)
• Categoría: ✅ Hoteles exacto (10/10)
• Cantidad: ✅ 5 exactos (10/10)
• Formato: ✅ Perfecto con frase inicial, ratings, enlaces (10/10)
→ Calidad: CORRECTA
→ Puntuación: 10/10 → CORRECTA

Reasoning: "Respuesta PERFECTA en todos los criterios: ubicación exacta (Málaga), categoría correcta (hoteles), cantidad precisa (5), formato impecable con frase inicial esperada, ratings, reseñas, ubicación y ambos enlaces. Respuesta modelo."

Improvements: null

═══════════════════════════════════════════════════════════════
REGLAS FINALES DE CLASIFICACIÓN
═══════════════════════════════════════════════════════════════

INCORRECTA:
• Si ubicación O categoría/subcategoría son ERRÓNEAS (puntuación <4 en criterios críticos)
• Si mezcla ubicaciones o categorías sin razón válida
• Si inventa lugares que no existen o datos falsos
• Aunque otros aspectos estén bien, un error crítico = INCORRECTA

MEJORABLE:
• Si ubicación y categoría son correctas PERO cantidad, formato o detalles tienen problemas
• Si es mayormente correcta pero falta claridad, enlaces o explicaciones
• Si detecta bien pero ejecuta de forma subóptima
• Puntuación global 6-8/10

CORRECTA:
• Ubicación, categoría, cantidad y formato todos correctos
• O si no hay resultados, lo dice honestamente y ofrece alternativas razonables
• Respuesta clara, completa y útil para el usuario
• Puntuación global >8/10

═══════════════════════════════════════════════════════════════
TU EVALUACIÓN DEBE SER:
═══════════════════════════════════════════════════════════════

✓ OBJETIVA: Basada en criterios medibles, no en opiniones
✓ ESTRICTA: Errores en ubicación o categoría = INCORRECTA (sin excepciones)
✓ HONESTA: No edulcorar errores críticos
✓ CONSTRUCTIVA: Sugerencias específicas y accionables
✓ CONSISTENTE: Mismos criterios para todas las evaluaciones
✓ TÉCNICA: Usa los datos de detected_intent y places_found

NUNCA:
✗ Clasificar como correcta si hay error de ubicación o categoría
✗ Ser benevolente con errores críticos ("casi correcto" NO es correcto)
✗ Ignorar el detected_intent (si detectó 'mexicana' pero no lo usó = ERROR)
✗ Valorar solo el tono o amabilidad (lo que importa es PRECISIÓN)

═══════════════════════════════════════════════════════════════
DATOS REALES + HILO (molde Andrea / Furgocasa)
═══════════════════════════════════════════════════════════════

En el mensaje de evaluación vendrán DATOS REALES de fichas publicadas en Casi Cinco. ESA es la fuente de verdad, no tu memoria de Google.

- Inventar un local, rating, nº de reseñas, ciudad o slug que NO esté en DATOS REALES = INCORRECTA.
- Citar un slug/id que aparece en CITADOS SIN FICHA = INCORRECTA (enlace inventado).
- Rating y reseñas de la respuesta deben coincidir con DATOS REALES (±0.1 ★). Inventar 4.9 cuando la ficha tiene 4.7 = INCORRECTA.
- El chat NO es una guía de viajes: solo lugares ≥4.7★ de la BD. Recomendar un sitio que no cumple el umbral = INCORRECTA.
- Contexto conversacional: si hay CONTEXTO PREVIO y el último mensaje es un follow-up corto ("¿y hoteles?", "en la provincia?", "más baratos"), interprétalo en ese hilo. NO marques incorrecta por "asumir el tema".
- NO mezcles temas no preguntados: si pidió mexicanos y la respuesta es fiel a mexicanos, no la bajes porque "podría haber añadido italianos".
- data_gap: none | missing (el sitio no está publicado) | not_retrieved (está publicado pero la búsqueda no lo trajo) | ignored (sí estaba en DATOS REALES y el bot no lo usó o lo contradijo).
- Si data_gap es missing o not_retrieved, propone UN hecho estable en data_title + data_body (nombre + ciudad + por qué debería estar). No propongas tono.

Criterios (severos, listón del dueño):
- correcta: la publicarias en casicinco.com. Datos fieles a DATOS REALES. Ubicación y categoría exactas. O pregunta justo lo que faltaba.
- mejorable: datos bien, pero no es la respuesta perfecta (cantidad, enlaces, no explica el vacío).
- incorrecta: datos malos, sitio inventado, ciudad/categoría errónea, o responde a una pregunta incompleta como si ya estuviera resuelta.
- Topónimo ambiguo (La Alberca = Salamanca o Murcia): si no aclaró cuál, afirmar «no hay fichas en La Alberca» sin preguntar = MEJORABLE o INCORRECTA. Lo correcto es preguntar cuál.
- Pueblo sin ficha: lo correcto es «No tengo en X, pero tengo algunos cerca» + lista cercana. Decir solo «no hay nada» sin ofrecer cercanos = MEJORABLE.

═══════════════════════════════════════════════════════════════
FORMATO DE RESPUESTA (SIEMPRE JSON)
═══════════════════════════════════════════════════════════════

{
  "quality": "correcta" | "mejorable" | "incorrecta",
  "summary": "Resumen en 1 frase de qué pidió el usuario",
  "reasoning": "Evaluación detallada de 3-5 frases: qué hizo bien/mal, por qué se clasificó así, datos técnicos",
  "improvements": "Sugerencias específicas y técnicas (o null si correcta)",
  "data_gap": "none" | "missing" | "not_retrieved" | "ignored",
  "data_title": "título corto si hay hueco (opcional)",
  "data_body": "hecho estable 3-8 frases si hay hueco (opcional)",
  "scores": {
    "location": 0-10,
    "category": 0-10,
    "quantity": 0-10,
    "format": 0-10
  }
}`;

/**
 * Evaluar una conversación con el agente especializado (molde Andrea).
 */
export async function evaluateConversation(
  userMessage: string,
  botResponse: string,
  detectedIntent: any,
  placesFound: number,
  config?: Partial<EvaluationAgentConfig>,
  extras?: ReviewExtras
): Promise<{
  quality: 'correcta' | 'mejorable' | 'incorrecta';
  summary: string;
  reasoning: string;
  improvements: string | null;
  data_gap: DataGap;
  data_title?: string;
  data_body?: string;
  scores?: {
    location: number;
    category: number;
    quantity: number;
    format: number;
  };
}> {
  
  const evalConfig = { ...DEFAULT_EVALUATION_CONFIG, ...config };

  if (!evalConfig.enabled) {
    return {
      quality: 'mejorable',
      summary: 'Evaluación desactivada',
      reasoning: 'El agente evaluador está desactivado',
      improvements: null,
      data_gap: 'none',
    };
  }

  const systemPrompt = evalConfig.systemPrompt || DEFAULT_EVALUATION_PROMPT;
  const placesReales = extras?.placesReales ?? [];
  const citedMissing = extras?.citedMissing ?? [];
  const priorContext = extras?.priorContext?.trim() || '';

  const userPrompt = `${
    priorContext
      ? `CONTEXTO PREVIO DE LA CONVERSACIÓN (memoria que tuvo el Tío Viajero al responder):
${priorContext}

`
      : ''
  }ÚLTIMO MENSAJE DEL USUARIO (turno evaluado):
"${userMessage}"

RESPUESTA DEL BOT:
"${botResponse}"

DATOS TÉCNICOS:
- Intención detectada: ${JSON.stringify(detectedIntent, null, 2)}
- Lugares encontrados y devueltos (conteo): ${placesFound}

=== DATOS REALES DE FICHAS PUBLICADAS (FUENTE DE VERDAD) ===
Si la respuesta cita un local, rating o ciudad que contradice esto, es INCORRECTA.
${JSON.stringify(
  placesReales.map((p) => ({
    nombre: p.name,
    slug: p.slug,
    categoria: p.category,
    subcategoria: p.subcategory,
    ciudad: p.city,
    provincia: p.province,
    rating: p.rating,
    reseñas: p.review_count,
  })),
  null,
  2
)}
${
  citedMissing.length
    ? `
CITADOS EN LA RESPUESTA SIN FICHA EN BD: ${citedMissing.join(', ')}
`
    : ''
}=== FIN DATOS REALES ===

AHORA EVALÚA según los criterios definidos y responde en JSON.`;

  try {
    const model = resolveQualityModel(evalConfig.model);
    const response = await getEvalOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      ...gptChatExtras(model, {
        temperature: evalConfig.temperature,
        maxTokens: Math.max(evalConfig.maxTokens, 2000),
        json: true,
        reasoningEffort: 'low',
      }),
    } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!['correcta', 'mejorable', 'incorrecta'].includes(result.quality)) {
      result.quality = 'mejorable';
    }
    const gap: DataGap = ['none', 'missing', 'not_retrieved', 'ignored'].includes(result.data_gap)
      ? result.data_gap
      : 'none';

    return {
      quality: result.quality,
      summary: result.summary || 'Sin resumen',
      reasoning: result.reasoning || 'Sin evaluación',
      improvements: result.improvements || null,
      data_gap: gap,
      data_title: result.data_title?.trim(),
      data_body: result.data_body?.trim(),
      scores: result.scores || undefined
    };

  } catch (error) {
    console.error('Error en evaluación con IA:', error);
    return {
      quality: 'mejorable',
      summary: 'Error en evaluación',
      reasoning: 'No se pudo evaluar con IA: ' + (error as Error).message,
      improvements: 'Revisar manualmente',
      data_gap: 'none',
    };
  }
}

/**
 * Evaluar múltiples conversaciones en batch
 */
export async function evaluateConversationsBatch(
  conversations: Array<{
    id: string;
    user_message: string;
    bot_response: string;
    detected_intent: any;
    places_found: number;
  }>,
  config?: Partial<EvaluationAgentConfig>,
  onProgress?: (processed: number, total: number) => void
): Promise<Array<{
  id: string;
  evaluation: Awaited<ReturnType<typeof evaluateConversation>>;
}>> {
  const results: Array<any> = [];
  
  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    
    try {
      const evaluation = await evaluateConversation(
        conv.user_message,
        conv.bot_response,
        conv.detected_intent,
        conv.places_found,
        config
      );

      results.push({ id: conv.id, evaluation });

      if (onProgress) {
        onProgress(i + 1, conversations.length);
      }

      // Delay para no saturar OpenAI API
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`Error evaluando conversación ${conv.id}:`, error);
      results.push({
        id: conv.id,
        evaluation: {
          quality: 'mejorable',
          summary: 'Error en evaluación',
          reasoning: 'Error técnico',
          improvements: 'Revisar manualmente'
        }
      });
    }
  }

  return results;
}

