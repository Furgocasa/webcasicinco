/**
 * Enriquecimiento de lugares con IA y contenido adicional
 */

import { createClient } from '@/lib/supabase/server';
import { getPlaceDetails } from '../google/places';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Enriquece un lugar con IA y contenido adicional
 */
export async function enrichPlace(placeId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // 1. Obtener el lugar de la BD
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      console.error('Error obteniendo lugar:', placeError);
      return false;
    }

    console.log(`🎨 Enriqueciendo: ${place.name}...`);

    // 2. Obtener detalles completos de Google (para las reseñas)
    const googleDetails = await getPlaceDetails(place.google_place_id);

    // 3. Generar descripción con IA
    const aiDescription = await generateDescription(
      place.name,
      place.category,
      place.city,
      place.province,
      googleDetails.reviews?.slice(0, 10) || []
    );

    // 4. Generar resumen de reseñas con IA
    const reviewSummary = await summarizeReviews(
      googleDetails.reviews?.slice(0, 20) || []
    );

    // 5. Extraer highlights con IA
    const highlights = await extractHighlights(
      place.name,
      googleDetails.reviews?.slice(0, 15) || []
    );

    // 6. Actualizar el lugar en la BD
    const { error: updateError } = await supabase
      .from('places')
      .update({
        ai_description: aiDescription,
        ai_review_summary: reviewSummary,
        ai_highlights: highlights,
        updated_at: new Date().toISOString(),
      })
      .eq('id', placeId);

    if (updateError) {
      console.error('Error actualizando lugar:', updateError);
      return false;
    }

    console.log(`✅ Lugar enriquecido: ${place.name}`);
    return true;

  } catch (error) {
    console.error('Error en enriquecimiento:', error);
    return false;
  }
}

/**
 * Genera descripción del lugar con IA
 */
async function generateDescription(
  name: string,
  category: string,
  city: string,
  province: string,
  reviews: any[]
): Promise<string> {
  try {
    const reviewTexts = reviews
      .map(r => r.text)
      .filter(Boolean)
      .slice(0, 5)
      .join('\n');

    const categoryNames: Record<string, string> = {
      restaurante: 'restaurante',
      hotel: 'hotel',
      spa: 'spa y centro de bienestar',
      bar: 'bar',
      experiencia: 'lugar de interés',
      monumento: 'monumento',
    };

    const prompt = `Escribe una descripción atractiva y profesional para SEO de este ${categoryNames[category] || 'lugar'}:

Nombre EXACTO: ${name}
Ubicación EXACTA: ${city}, ${province}
Tipo: ${categoryNames[category]}

Algunas reseñas de clientes:
${reviewTexts || 'No hay reseñas disponibles'}

REQUISITOS ESTRICTOS:
- 2-3 párrafos máximo (150-200 palabras)
- USA EL NOMBRE EXACTO del lugar: "${name}"
- USA LA UBICACIÓN EXACTA: "${city}, ${province}"
- NO confundas la ubicación con otras ciudades
- NO inventes datos, SOLO usa la información proporcionada
- NO menciones el rating o número de reseñas (ya se muestra aparte)
- Enfócate en lo que mencionan las reseñas
- Tono profesional pero cercano
- Escribe en español de España

IMPORTANTE: Verifica que el nombre y ubicación coincidan exactamente con los datos proporcionados.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un experto en redacción de contenido turístico y SEO. 

REGLA CRÍTICA: Debes mencionar el nombre y ubicación EXACTOS que se te proporcionan. NO inventes ni cambies ubicaciones.

Si el lugar está en "Totana, Murcia", NO digas "centro de Murcia" ni "corazón de Murcia".
Si el lugar está en "Cartagena, Murcia", NO digas "Murcia ciudad".

USA SOLO LA INFORMACIÓN PROPORCIONADA. Si no tienes suficiente información, sé general pero NO inventes ubicaciones específicas.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || '';

  } catch (error) {
    console.error('Error generando descripción:', error);
    return '';
  }
}

/**
 * Genera resumen de reseñas con IA
 */
async function summarizeReviews(reviews: any[]): Promise<string> {
  try {
    if (!reviews || reviews.length === 0) {
      return '';
    }

    const reviewTexts = reviews
      .map(r => r.text)
      .filter(Boolean)
      .join('\n---\n');

    const prompt = `Resume estas reseñas de clientes en 2-3 frases concisas:

${reviewTexts}

Requisitos:
- Máximo 3 frases
- Destaca los aspectos más mencionados (positivos y negativos si los hay)
- Sé objetivo y equilibrado
- Usa lenguaje natural`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un analista de opiniones de clientes. Resumes reseñas de forma objetiva y concisa.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content || '';

  } catch (error) {
    console.error('Error resumiendo reseñas:', error);
    return '';
  }
}

/**
 * Extrae highlights del lugar con IA
 */
async function extractHighlights(name: string, reviews: any[]): Promise<any> {
  try {
    if (!reviews || reviews.length === 0) {
      return null;
    }

    const reviewTexts = reviews
      .map(r => r.text)
      .filter(Boolean)
      .join('\n');

    const prompt = `Analiza estas reseñas y extrae 3-5 highlights clave del lugar:

${reviewTexts}

Responde en formato JSON con esta estructura:
{
  "highlights": [
    "Aspecto destacado 1",
    "Aspecto destacado 2",
    "Aspecto destacado 3"
  ]
}

Los highlights deben ser frases cortas (5-8 palabras) que destaquen lo mejor del lugar.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un analista experto en extraer insights de reseñas de clientes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    return content ? JSON.parse(content) : null;

  } catch (error) {
    console.error('Error extrayendo highlights:', error);
    return null;
  }
}

/**
 * Enriquece múltiples lugares
 */
export async function enrichMultiplePlaces(placeIds: string[]): Promise<{
  successful: number;
  failed: number;
}> {
  let successful = 0;
  let failed = 0;

  for (const placeId of placeIds) {
    const result = await enrichPlace(placeId);
    
    if (result) {
      successful++;
    } else {
      failed++;
    }

    // Pausa para no saturar la API de OpenAI
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return { successful, failed };
}

