import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Keywords para detección local (gratis)
const CUISINE_KEYWORDS: Record<string, string[]> = {
  'mexicana': ['taco', 'burrito', 'enchilada', 'mexican', 'mejican', 'azteca', 'maya', 'guadalajara'],
  'italiana': ['pizza', 'pasta', 'trattoria', 'ristorante', 'osteria', 'italiana', 'italiano', 'napoli', 'roma'],
  'japonesa': ['sushi', 'ramen', 'yakitori', 'japonesa', 'japones', 'izakaya', 'nikkei', 'tokyo', 'osaka'],
  'china': ['china', 'chino', 'wok', 'dim sum', 'canton', 'pekin', 'shanghai'],
  'india': ['india', 'indio', 'curry', 'tandoori', 'masala', 'bombay'],
  'mariscos': ['mariscos', 'marisco', 'pescado', 'marisquería', 'pescadería', 'pescador'],
  'tapas': ['tapas', 'pinchos', 'pintxos', 'taberna', 'tasca'],
  'asador': ['asador', 'parrilla', 'brasa', 'churrasco', 'churrascaria', 'carne'],
  'mediterránea': ['mediterránea', 'mediterranea'],
  'francesa': ['francesa', 'frances', 'bistro', 'brasserie', 'paris'],
  'peruana': ['peruana', 'peruano', 'ceviche', 'pisco', 'lima'],
  'argentina': ['argentina', 'argentino', 'pampa', 'buenos aires'],
  'árabe': ['árabe', 'arabe', 'libanesa', 'libanes', 'kebab', 'falafel'],
  'fusión': ['fusión', 'fusion', 'contemporánea', 'contemporanea', 'creativa', 'gastronómica'],
  'vegetariana': ['vegetariana', 'vegetariano', 'vegano', 'vegana', 'vegan'],
};

function detectSubcategoryByKeywords(name: string, description: string): string | null {
  const text = `${name} ${description}`.toLowerCase();
  
  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return cuisine;
    }
  }
  
  return null;
}

async function detectSubcategoryWithAI(name: string, description: string): Promise<string | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Analiza este restaurante y determina su tipo de cocina. Responde SOLO con una de estas palabras: mexicana, italiana, japonesa, china, india, mariscos, tapas, asador, mediterránea, francesa, peruana, argentina, árabe, fusión, vegetariana, o "desconocida" si no estás seguro.

Nombre: ${name}
Descripción: ${description.slice(0, 300)}

Tipo de cocina:`
      }],
      temperature: 0.3,
      max_tokens: 20,
    });

    const result = response.choices[0].message.content?.trim().toLowerCase();
    const validSubcategories = Object.keys(CUISINE_KEYWORDS);
    
    if (result && validSubcategories.includes(result)) {
      return result;
    }
    
    return null;
  } catch (error) {
    console.error(`Error con OpenAI para ${name}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Usar cliente admin para updates masivos
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { limit = 50 } = await request.json().catch(() => ({ limit: 50 }));

    // Obtener lugares sin subcategory
    const { data: places, error } = await adminSupabase
      .from('places')
      .select('id, name, ai_description, category, subcategory')
      .eq('category', 'restaurante')
      .is('subcategory', null)
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!places || places.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay lugares sin subcategoría',
        stats: { total: 0, withKeywords: 0, withAI: 0, skipped: 0 }
      });
    }

    let updatedWithKeywords = 0;
    let updatedWithAI = 0;
    let skipped = 0;
    const logs: string[] = [];

    // Procesar cada lugar
    for (const place of places) {
      const name = place.name || '';
      const description = place.ai_description || '';

      // Intentar con keywords primero
      let subcategory = detectSubcategoryByKeywords(name, description);

      if (subcategory) {
        logs.push(`[Keywords] ${name} → ${subcategory}`);
        updatedWithKeywords++;
      } else {
        // Si no es obvio, usar OpenAI
        subcategory = await detectSubcategoryWithAI(name, description);
        
        if (subcategory) {
          logs.push(`[OpenAI] ${name} → ${subcategory}`);
          updatedWithAI++;
        } else {
          logs.push(`[Skip] ${name} → No determinado`);
          skipped++;
          continue;
        }
      }

      // Actualizar en BD
      const { error: updateError } = await adminSupabase
        .from('places')
        .update({ subcategory })
        .eq('id', place.id);

      if (updateError) {
        logs.push(`[Error] ${name}: ${updateError.message}`);
        skipped++;
      }

      // Delay para no saturar OpenAI
      if (!detectSubcategoryByKeywords(name, description)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const costEstimate = updatedWithAI * 0.0001;

    return NextResponse.json({
      success: true,
      stats: {
        total: places.length,
        withKeywords: updatedWithKeywords,
        withAI: updatedWithAI,
        skipped,
        cost: `$${costEstimate.toFixed(4)}`
      },
      logs: logs.slice(0, 50) // Solo primeros 50 logs para no saturar
    });

  } catch (error: any) {
    console.error('Error en populate-subcategories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET para ver estadísticas
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Contar lugares sin subcategory
    const { count: withoutSubcategory } = await adminSupabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'restaurante')
      .is('subcategory', null);

    // Contar lugares con subcategory
    const { count: withSubcategory } = await adminSupabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'restaurante')
      .not('subcategory', 'is', null);

    // Distribución por subcategoría
    const { data: distribution } = await adminSupabase
      .from('places')
      .select('subcategory')
      .eq('category', 'restaurante')
      .not('subcategory', 'is', null);

    const subcategoryCount: Record<string, number> = {};
    distribution?.forEach(p => {
      if (p.subcategory) {
        subcategoryCount[p.subcategory] = (subcategoryCount[p.subcategory] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        withSubcategory: withSubcategory || 0,
        withoutSubcategory: withoutSubcategory || 0,
        total: (withSubcategory || 0) + (withoutSubcategory || 0),
        distribution: subcategoryCount
      }
    });

  } catch (error: any) {
    console.error('Error en GET populate-subcategories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

