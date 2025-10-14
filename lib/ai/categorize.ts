/**
 * Categorización inteligente con IA
 * Analiza nombre, descripción y reseñas para asignar la categoría correcta
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ValidCategory = 'restaurante' | 'bar' | 'cafe' | 'hotel' | 'descartado';

interface CategorizationInput {
  name: string;
  googleTypes: string[];
  description?: string;
  reviews?: string[];
}

/**
 * Categoriza un lugar usando IA
 * Retorna una de las 4 categorías válidas o 'descartado'
 */
export async function categorizePlaceWithAI(input: CategorizationInput): Promise<{
  category: ValidCategory;
  confidence: number;
  reason: string;
}> {
  try {
    const prompt = `Analiza este lugar y clasifícalo en UNA de estas 4 categorías EXACTAS:
- restaurante: Lugares donde se sirven comidas (restaurantes, asadores, pizzerías, etc.)
- bar: Lugares principalmente para bebidas alcohólicas y tapas (bares, pubs, tabernas, cervecerías)
- cafe: Cafeterías, coffee shops, pastelerías donde se sirven cafés y dulces
- hotel: Alojamientos (hoteles, apartahoteles, hostales, B&B, alojamientos rurales)
- descartado: NO encaja en ninguna de las 4 anteriores

INFORMACIÓN DEL LUGAR:
Nombre: ${input.name}
Tipos de Google: ${input.googleTypes.join(', ')}
${input.description ? `Descripción: ${input.description}` : ''}
${input.reviews && input.reviews.length > 0 ? `Reseñas: ${input.reviews.slice(0, 3).join(' | ')}` : ''}

REGLAS ESTRICTAS:
- Áreas de autocaravanas, campings, parkings → descartado
- Supermercados, tiendas de comida → descartado
- Peluquerías ("barbería") → descartado
- Cyber cafés → descartado
- Si tiene "bar" y "cafe" en types, decide por el NOMBRE (ej: "Cafetería Central" → cafe, "Bar Manolo" → bar)

Responde SOLO con un JSON:
{
  "category": "restaurante|bar|cafe|hotel|descartado",
  "confidence": 0.95,
  "reason": "Razón breve"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en clasificar negocios. Responde SOLO con JSON válido, sin explicaciones adicionales.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const content = response.choices[0].message.content?.trim() || '';
    
    // Extraer JSON (puede venir con ```json ... ```)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('IA no retornó JSON válido');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Validar que la categoría sea válida
    const validCategories: ValidCategory[] = ['restaurante', 'bar', 'cafe', 'hotel', 'descartado'];
    if (!validCategories.includes(result.category)) {
      throw new Error(`Categoría inválida: ${result.category}`);
    }

    return {
      category: result.category,
      confidence: result.confidence || 0.8,
      reason: result.reason || 'Categorización automática'
    };

  } catch (error: any) {
    console.error('[AI-CATEGORIZE] Error:', error.message);
    // Fallback: usar categorización básica de Google
    return {
      category: 'descartado',
      confidence: 0,
      reason: `Error de IA: ${error.message}`
    };
  }
}
