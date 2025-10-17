/**
 * Script para rellenar subcategorías de lugares usando OpenAI
 * 
 * Este script analiza los lugares que NO tienen subcategory y:
 * 1. Usa lógica local (keywords) para casos obvios (GRATIS)
 * 2. Usa OpenAI para casos ambiguos (~$0.0001 por lugar)
 * 
 * Uso:
 * - tsx scripts/populate-subcategories.ts
 * - O ejecutar desde panel admin (crear endpoint)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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

// Detectar subcategoría por keywords (lógica local)
function detectSubcategoryByKeywords(name: string, description: string): string | null {
  const text = `${name} ${description}`.toLowerCase();
  
  for (const [cuisine, keywords] of Object.entries(CUISINE_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return cuisine;
    }
  }
  
  return null;
}

// Usar OpenAI para inferir subcategoría (casos ambiguos)
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
    
    // Validar que sea una subcategoría válida
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

// Script principal
async function main() {
  console.log('🚀 Iniciando proceso de población de subcategorías...\n');

  // 1. Obtener lugares sin subcategory
  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, ai_description, category, subcategory')
    .eq('category', 'restaurante')
    .is('subcategory', null)
    .limit(100); // Procesar de 100 en 100

  if (error) {
    console.error('❌ Error obteniendo lugares:', error);
    return;
  }

  if (!places || places.length === 0) {
    console.log('✅ No hay lugares sin subcategoría. ¡Todo listo!');
    return;
  }

  console.log(`📊 Encontrados ${places.length} lugares sin subcategoría\n`);

  let updatedWithKeywords = 0;
  let updatedWithAI = 0;
  let skipped = 0;

  // 2. Procesar cada lugar
  for (const place of places) {
    const name = place.name || '';
    const description = place.ai_description || '';

    // Paso 1: Intentar con keywords (gratis)
    let subcategory = detectSubcategoryByKeywords(name, description);

    if (subcategory) {
      console.log(`🔍 [Keywords] ${name} → ${subcategory}`);
      updatedWithKeywords++;
    } else {
      // Paso 2: Si no es obvio, usar OpenAI
      console.log(`🤖 [OpenAI] Analizando ${name}...`);
      subcategory = await detectSubcategoryWithAI(name, description);
      
      if (subcategory) {
        console.log(`   ✅ ${name} → ${subcategory}`);
        updatedWithAI++;
      } else {
        console.log(`   ⚠️ ${name} → No se pudo determinar`);
        skipped++;
        continue;
      }
    }

    // 3. Actualizar en BD
    const { error: updateError } = await supabase
      .from('places')
      .update({ subcategory })
      .eq('id', place.id);

    if (updateError) {
      console.error(`   ❌ Error actualizando ${name}:`, updateError);
      skipped++;
    }

    // Delay para no saturar OpenAI (si se usó)
    if (!detectSubcategoryByKeywords(name, description)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 4. Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(50));
  console.log(`✅ Actualizados con keywords: ${updatedWithKeywords} (GRATIS)`);
  console.log(`🤖 Actualizados con OpenAI: ${updatedWithAI} ($${(updatedWithAI * 0.0001).toFixed(4)})`);
  console.log(`⚠️  Omitidos: ${skipped}`);
  console.log(`📈 Total procesados: ${places.length}`);
  console.log('='.repeat(50));

  const costEstimate = updatedWithAI * 0.0001;
  console.log(`\n💰 Coste estimado: $${costEstimate.toFixed(4)} (${costEstimate < 0.01 ? 'menos de 1 centavo' : `${(costEstimate * 100).toFixed(2)} centavos`})`);
}

// Ejecutar
main()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

