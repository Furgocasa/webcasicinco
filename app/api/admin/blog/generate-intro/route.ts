import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

/**
 * POST /api/admin/blog/generate-intro
 * Genera intro con IA
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { category, location, locationType } = await request.json();

    const categoryLabels: Record<string, string> = {
      restaurante: 'restaurantes',
      bar: 'bares',
      cafe: 'cafeterías',
      hotel: 'hoteles'
    };

    const locationLabel = locationType === 'province' 
      ? `la provincia de ${location}`
      : location;

    const prompt = `Escribe una introducción atractiva y SEO-friendly de aproximadamente 300-350 palabras para un artículo titulado:

"Los 10 Mejores ${categoryLabels[category].charAt(0).toUpperCase() + categoryLabels[category].slice(1)} de ${location}"

Requisitos:
- Menciona que son establecimientos con valoración superior a 4.7 estrellas en Google Maps
- Habla de la escena gastronómica/hostelera de ${locationLabel}
- Menciona características únicas de la zona (gastronomía local, ambiente, turismo, etc.)
- Tono profesional pero cercano, en segunda persona ("encontrarás", "descubrirás")
- NO uses listas con viñetas, escribe párrafos fluidos
- NO menciones nombres específicos de lugares (eso va en el Top 10)
- Termina con una frase que invite a leer el Top 10
- Escribe SOLO el texto, sin títulos ni encabezados

Ejemplo de estructura:
Párrafo 1: Intro sobre ${location} y su escena de ${categoryLabels[category]}
Párrafo 2: Criterios de selección (4.7+ estrellas, calidad verificada)
Párrafo 3: Qué hace especial a estos lugares
Párrafo 4: Cierre invitando a descubrir el Top 10`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 600
    });

    const intro = response.choices[0].message.content?.trim() || '';

    return NextResponse.json({ success: true, intro });

  } catch (error: any) {
    console.error('Error generating intro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

