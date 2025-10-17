/**
 * Script para generar posts de blog con IA
 * 
 * Uso: ts-node scripts/generate-blog-posts.ts
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

interface PostConfig {
  category: 'restaurante' | 'bar' | 'cafe' | 'hotel';
  location: string;
  locationType: 'city' | 'province' | 'community';
}

// ================================================================
// CONFIGURACIÓN: 30 POSTS INICIALES
// ================================================================

const POSTS_TO_GENERATE: PostConfig[] = [
  // TIER 1: Ciudades grandes - Restaurantes
  { category: 'restaurante', location: 'Madrid', locationType: 'city' },
  { category: 'restaurante', location: 'Barcelona', locationType: 'city' },
  { category: 'restaurante', location: 'Valencia', locationType: 'city' },
  { category: 'restaurante', location: 'Sevilla', locationType: 'city' },
  { category: 'restaurante', location: 'Málaga', locationType: 'city' },
  
  // TIER 1: Ciudades grandes - Bares
  { category: 'bar', location: 'Madrid', locationType: 'city' },
  { category: 'bar', location: 'Barcelona', locationType: 'city' },
  { category: 'bar', location: 'Sevilla', locationType: 'city' },
  { category: 'bar', location: 'Valencia', locationType: 'city' },
  
  // TIER 1: Ciudades grandes - Hoteles
  { category: 'hotel', location: 'Madrid', locationType: 'city' },
  { category: 'hotel', location: 'Barcelona', locationType: 'city' },
  { category: 'hotel', location: 'Málaga', locationType: 'city' },
  
  // TIER 1: Ciudades grandes - Cafés
  { category: 'cafe', location: 'Madrid', locationType: 'city' },
  { category: 'cafe', location: 'Barcelona', locationType: 'city' },
  
  // TIER 2: Ciudades medianas
  { category: 'restaurante', location: 'Murcia', locationType: 'city' },
  { category: 'restaurante', location: 'Granada', locationType: 'city' },
  { category: 'restaurante', location: 'Bilbao', locationType: 'city' },
  { category: 'restaurante', location: 'Zaragoza', locationType: 'city' },
  { category: 'restaurante', location: 'Alicante', locationType: 'city' },
  
  { category: 'bar', location: 'Murcia', locationType: 'city' },
  { category: 'bar', location: 'Granada', locationType: 'city' },
  { category: 'bar', location: 'Bilbao', locationType: 'city' },
  
  { category: 'hotel', location: 'Granada', locationType: 'city' },
  { category: 'hotel', location: 'Bilbao', locationType: 'city' },
  { category: 'hotel', location: 'Zaragoza', locationType: 'city' },
  
  // TIER 3: Provincias
  { category: 'hotel', location: 'Cuenca', locationType: 'province' },
  { category: 'restaurante', location: 'Asturias', locationType: 'province' },
  { category: 'hotel', location: 'Cantabria', locationType: 'province' },
  { category: 'restaurante', location: 'Cádiz', locationType: 'province' },
];

// ================================================================
// GENERACIÓN DE IMÁGENES
// ================================================================

function generateFeaturedImageUrl(config: PostConfig): string {
  // Usar Unsplash Source API para imágenes relevantes y gratuitas
  const searchTerms: Record<string, string> = {
    restaurante: 'restaurant,food,dining',
    bar: 'bar,cocktail,drinks',
    cafe: 'cafe,coffee,espresso',
    hotel: 'hotel,luxury,accommodation'
  };
  
  const terms = searchTerms[config.category];
  const location = config.location.toLowerCase();
  
  // Unsplash Source API - Imágenes aleatorias de alta calidad
  // https://source.unsplash.com/featured/?{query}
  return `https://source.unsplash.com/1200x600/?${terms},${location},spain`;
}

// ================================================================
// GENERACIÓN DE CONTENIDO CON IA
// ================================================================

async function generateIntro(config: PostConfig): Promise<string> {
  const categoryLabels = {
    restaurante: 'restaurantes',
    bar: 'bares',
    cafe: 'cafeterías',
    hotel: 'hoteles'
  };

  const locationLabel = config.locationType === 'province' 
    ? `la provincia de ${config.location}`
    : config.location;

  const prompt = `Escribe una introducción atractiva y SEO-friendly de aproximadamente 300-350 palabras para un artículo titulado:

"Los 10 Mejores ${categoryLabels[config.category].charAt(0).toUpperCase() + categoryLabels[config.category].slice(1)} de ${config.location}"

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
Párrafo 1: Intro sobre ${config.location} y su escena de ${categoryLabels[config.category]}
Párrafo 2: Criterios de selección (4.7+ estrellas, calidad verificada)
Párrafo 3: Qué hace especial a estos lugares
Párrafo 4: Cierre invitando a descubrir el Top 10`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 600
  });

  return response.choices[0].message.content?.trim() || '';
}

function generateSlug(config: PostConfig): string {
  const categoryLabels = {
    restaurante: 'restaurantes',
    bar: 'bares',
    cafe: 'cafeterias',
    hotel: 'hoteles'
  };

  const locationSlug = config.location
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');

  return `mejores-${categoryLabels[config.category]}-${locationSlug}`;
}

function generateTitle(config: PostConfig): string {
  const categoryLabels = {
    restaurante: 'Restaurantes',
    bar: 'Bares',
    cafe: 'Cafeterías',
    hotel: 'Hoteles'
  };

  const year = new Date().getFullYear();
  return `Los 10 Mejores ${categoryLabels[config.category]} de ${config.location} (${year})`;
}

function generateMetaDescription(config: PostConfig): string {
  const categoryLabels = {
    restaurante: 'restaurantes',
    bar: 'bares',
    cafe: 'cafeterías',
    hotel: 'hoteles'
  };

  const locationLabel = config.locationType === 'province'
    ? `la provincia de ${config.location}`
    : config.location;

  return `Descubre los mejores ${categoryLabels[config.category]} de ${locationLabel} con más de 4.7 estrellas en Google. Guía actualizada ${new Date().getFullYear()} con los lugares top.`;
}

function generateKeywords(config: PostConfig): string[] {
  const categoryLabels = {
    restaurante: 'restaurantes',
    bar: 'bares',
    cafe: 'cafeterías',
    hotel: 'hoteles'
  };

  const location = config.location.toLowerCase();
  const category = categoryLabels[config.category];

  return [
    `mejores ${category} ${location}`,
    `${category} ${location}`,
    `donde ${config.category === 'restaurante' ? 'comer' : config.category === 'hotel' ? 'dormir' : 'ir'} ${location}`,
    `${category} 5 estrellas ${location}`,
    `${category} bien valorados ${location}`,
    `top ${category} ${location}`,
    `guia ${category} ${location}`
  ];
}

// ================================================================
// FUNCIÓN PRINCIPAL
// ================================================================

async function generatePosts() {
  console.log('🚀 Iniciando generación de posts de blog...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < POSTS_TO_GENERATE.length; i++) {
    const config = POSTS_TO_GENERATE[i];
    const slug = generateSlug(config);

    try {
      console.log(`[${i + 1}/${POSTS_TO_GENERATE.length}] Generando: ${slug}`);

      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        console.log(`⏭️  Ya existe, saltando...\n`);
        continue;
      }

      // Generar contenido con IA
      console.log('   🤖 Generando intro con OpenAI...');
      const introText = await generateIntro(config);

      // Generar URL de imagen
      const featuredImageUrl = generateFeaturedImageUrl(config);
      console.log('   🖼️  Imagen destacada: Unsplash');

      // Insertar en base de datos
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          slug,
          title: generateTitle(config),
          meta_description: generateMetaDescription(config),
          category: config.category,
          location: config.location,
          location_type: config.locationType,
          intro_text: introText,
          keywords: generateKeywords(config),
          featured_image_url: featuredImageUrl,
          published: true
        });

      if (error) {
        throw error;
      }

      console.log('   ✅ Post creado exitosamente!\n');
      successCount++;

      // Esperar 2 segundos entre requests para no saturar API
      if (i < POSTS_TO_GENERATE.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('════════════════════════════════════════');
  console.log(`✅ Posts creados: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📝 Total procesados: ${POSTS_TO_GENERATE.length}`);
  console.log('════════════════════════════════════════\n');
}

// Ejecutar
generatePosts().catch(console.error);

