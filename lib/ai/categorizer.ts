/**
 * Categorizador inteligente usando OpenAI
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Categorías válidas de la aplicación
const VALID_CATEGORIES = [
  'restaurante',
  'hotel', 
  'spa',
  'bar',
  'experiencia',
  'monumento'
] as const;

type ValidCategory = typeof VALID_CATEGORIES[number];

/**
 * Categoriza un lugar usando IA
 */
export async function categorizePlace(
  placeName: string,
  placeTypes: string[],
  address?: string
): Promise<ValidCategory> {
  try {
    const prompt = `Categoriza este lugar en UNA de estas categorías EXACTAS:
- restaurante: Restaurantes, comedores, lugares de comida
- hotel: Hoteles, alojamientos, hostales, apartamentos turísticos
- spa: Spas, centros de bienestar, salones de belleza, balnearios
- bar: Bares, cafeterías, pubs, discotecas
- monumento: Museos, galerías de arte, monumentos históricos
- experiencia: Atracciones turísticas, parques, actividades

Lugar: "${placeName}"
Tipos de Google: ${placeTypes.join(', ')}
${address ? `Dirección: ${address}` : ''}

Responde SOLO con una de estas palabras exactas: restaurante, hotel, spa, bar, monumento, experiencia`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en categorización de lugares. Responde SOLO con la categoría exacta, sin explicaciones.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const category = response.choices[0]?.message?.content?.trim().toLowerCase();

    // Validar que sea una categoría válida
    if (category && VALID_CATEGORIES.includes(category as ValidCategory)) {
      return category as ValidCategory;
    }

    // Si la IA falla, usar lógica de fallback
    return fallbackCategorize(placeName, placeTypes);

  } catch (error) {
    console.error('Error en categorización IA:', error);
    // Si falla la IA, usar lógica de fallback
    return fallbackCategorize(placeName, placeTypes);
  }
}

/**
 * Lógica de fallback si la IA falla
 */
function fallbackCategorize(placeName: string, placeTypes: string[]): ValidCategory {
  const nameLower = placeName.toLowerCase();
  const typesStr = placeTypes.join(' ').toLowerCase();

  // Restaurante
  if (
    typesStr.includes('restaurant') ||
    typesStr.includes('food') ||
    nameLower.includes('restaurante') ||
    nameLower.includes('restaurant') ||
    nameLower.includes('asador') ||
    nameLower.includes('tasca') ||
    nameLower.includes('taberna')
  ) {
    return 'restaurante';
  }

  // Hotel
  if (
    typesStr.includes('lodging') ||
    typesStr.includes('hotel') ||
    nameLower.includes('hotel') ||
    nameLower.includes('hostal') ||
    nameLower.includes('apart')
  ) {
    return 'hotel';
  }

  // Spa
  if (
    typesStr.includes('spa') ||
    typesStr.includes('beauty') ||
    nameLower.includes('spa') ||
    nameLower.includes('wellness') ||
    nameLower.includes('balneario')
  ) {
    return 'spa';
  }

  // Bar
  if (
    typesStr.includes('bar') ||
    typesStr.includes('cafe') ||
    typesStr.includes('night_club') ||
    nameLower.includes('bar') ||
    nameLower.includes('café') ||
    nameLower.includes('pub') ||
    nameLower.includes('cervecería')
  ) {
    return 'bar';
  }

  // Monumento
  if (
    typesStr.includes('museum') ||
    typesStr.includes('art_gallery') ||
    nameLower.includes('museo') ||
    nameLower.includes('galería')
  ) {
    return 'monumento';
  }

  // Default: experiencia
  return 'experiencia';
}

/**
 * Categoriza de forma síncrona sin IA (para casos donde no queremos esperar)
 */
export function categorizePlaceSync(placeName: string, placeTypes: string[]): ValidCategory {
  return fallbackCategorize(placeName, placeTypes);
}

