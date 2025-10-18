# 🎯 PLAN ESTRATÉGICO 2025 - SEO, VIABILIDAD Y DIFERENCIACIÓN
## Casi Cinco - Roadmap hacia la Perfección

**Fecha de Creación:** 18 de Octubre de 2025  
**Versión:** 1.0  
**Basado en:** Auditoría integral de experto programador  
**Estado Actual:** BETA 100 - Sistema funcional, optimización SEO pendiente

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Auditoría de Estado Actual](#auditoría-de-estado-actual)
3. [Viabilidad del Proyecto](#viabilidad-del-proyecto)
4. [Plan SEO Completo](#plan-seo-completo)
5. [Diferenciación vs Competidores](#diferenciación-vs-competidores)
6. [Plan de Acción 30/60/90 Días](#plan-de-acción-306090-días)
7. [Métricas Norte](#métricas-norte)
8. [Quick Wins (Semana 1)](#quick-wins-semana-1)
9. [Roadmap de Exclusividad](#roadmap-de-exclusividad)

---

## 🎯 RESUMEN EJECUTIVO

### Qué es CasiCinco
Directorio de sitios excepcionales (restaurantes, bares, cafés, hoteles) con **nota ≥4.7**, filtrados rigurosamente por volumen de reseñas, con IA para resumir y planificador de rutas. Modelo de suscripción **2,99 €/mes o 24,99 €/año**. Metodología pública y transparente con actualización continua.

### Propuesta de Valor Única
**"Solo sitios casi perfectos (≥4.7) con metodología abierta, actualización continua y sin compra de posiciones"**

### Estado Actual
- ✅ **Sistema técnico:** 100% funcional
- ✅ **Base de datos:** 2,612 lugares publicados
- ✅ **Optimización costes:** Google API optimizado (70% ahorro)
- ⚠️ **SEO:** Crítico - Requiere SSR/SSG urgente
- ⚠️ **Contenido:** Necesita capa editorial humana
- ⚠️ **Autoridad:** Baja vs Tripadvisor/Michelin

### Objetivo
Convertir CasiCinco en la **referencia #1 de lugares excepcionales en España** mediante:
1. SEO técnico impecable
2. Contenido editorial diferenciado
3. Sistema de autoridad único (Índice de Consistencia, Badges, Embajadores)
4. Estrategia de enlaces natural

---

## 📊 AUDITORÍA DE ESTADO ACTUAL

### ✅ FORTALEZAS

| Componente | Estado | Documentación |
|------------|--------|---------------|
| Sistema de indexación 2 fases | ✅ COMPLETO | `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md` |
| Filtro ≥4.7 automático | ✅ FUNCIONAL | `SISTEMA_INDEXACION_PROFESIONAL_COMPLETO.md` |
| Optimización Google API | ✅ IMPLEMENTADO | `OPTIMIZACION_GOOGLE_API_COMPLETA.md` (70% ahorro) |
| Actualización de ratings | ✅ FUNCIONAL | `/admin/update-ratings` |
| Sistema de Tiers (Diamond/Platino/Oro) | ✅ IMPLEMENTADO | `lib/utils/tier-calculator.ts` |
| Chatbot IA "Tío Viajero" | ✅ FUNCIONAL | `CHATBOT_TIO_VIAJERO.md` |
| Planificador de rutas | ✅ FUNCIONAL | `/ruta` |
| Página de Metodología | ✅ PUBLICADA | `/metodologia` |
| Blog con contenido | ✅ ACTIVO | `/blog` |
| Sitemap y robots.txt | ✅ GENERADO | `app/sitemap.ts`, `app/robots.ts` |

### ⚠️ DEBILIDADES CRÍTICAS (SEO)

| Problema | Impacto SEO | Prioridad | Solución |
|----------|-------------|-----------|----------|
| **Fichas en Client-Side** | 🔴 CRÍTICO | P0 | Migrar a SSR/SSG |
| **Sin generateMetadata** | 🔴 CRÍTICO | P0 | Implementar metadata dinámica |
| **Sin Schema.org** | 🔴 CRÍTICO | P0 | LocalBusiness, ItemList, BreadcrumbList |
| **Contenido IA sin contexto humano** | 🟠 ALTO | P1 | Añadir capa editorial (barrio, cuándo ir, ticket) |
| **Sin páginas programáticas** | 🟠 ALTO | P1 | `/restaurantes/[ciudad]`, `/bares/[provincia]` |
| **Sin listas por ocasión** | 🟡 MEDIO | P2 | Celiacos, pet-friendly, brunch, romántico |
| **Autoridad baja** | 🟡 MEDIO | P2 | Badge 4.7, Rankings, PR |

### 🔍 HALLAZGOS TÉCNICOS

#### ❌ Problema Crítico: Client-Side Rendering

**Archivo:** `app/(public)/[category]/[province]/[slug]/page.tsx`

```typescript
'use client';  // ❌ Google no ve el contenido

export default function PlaceDetailPage() {
  const [place, setPlace] = useState<any>(null);
  
  useEffect(() => {
    const fetchPlace = async () => {
      const response = await fetch(`/api/places/by-slug/${slug}`);
      // ...
    };
  }, [slug]);
  
  // Google ve: "Cargando..." permanentemente
}
```

**Consecuencia:** Google indexa páginas vacías o con "Cargando...", **0% de tráfico SEO en fichas**.

**Solución:** Migrar a SSR con `generateMetadata` y `async` component.

---

## 💰 VIABILIDAD DEL PROYECTO

### Modelo de Negocio

#### Ingresos por Usuario
- **Plan Mensual:** 2,99 €/mes
- **Plan Anual:** 24,99 €/año (2,08 €/mes, 30% descuento)
- **Media ponderada:** 2,1 - 2,6 €/mes por usuario

#### Punto de Equilibrio

| Coste Mensual Operacional | Suscriptores Necesarios (2,99 €/mes) | Suscriptores Necesarios (2,5 €/mes medio) |
|---------------------------|--------------------------------------|-------------------------------------------|
| 700 € | 235 | 280 |
| 1,400 € | 469 | 560 |
| 3,400 € | 1,138 | 1,360 |

### Costes Operacionales (Año 1)

#### Inversión Inicial
- **Desarrollo:** ~1.500 € (ya invertido) ✅
- **Google APIs (indexación inicial):** ~1.300 € (optimizado, era 4.500 €) ✅

#### Costes Recurrentes Mensuales

| Concepto | Coste Mensual | Coste Anual | Notas |
|----------|--------------|-------------|--------|
| **Google APIs - Operación** | 73 € | 876 € | 1,000 usuarios/mes optimizado |
| **Google APIs - Actualizaciones** | 2,50 € | 30 € | Solo críticos mensual |
| **Hosting (AWS Amplify)** | ~50 € | 600 € | Estimado |
| **Supabase** | 0-25 € | 0-300 € | Tier gratuito hasta cierto punto |
| **OpenAI (Chatbot + Enriq.)** | ~30 € | 360 € | Estimado conservador |
| **Publicidad Año 1** | 200-500 € | 2,400-6,000 € | Variable, crítico para adquisición |
| **TOTAL (sin publicidad)** | ~180 € | ~2,166 € | |
| **TOTAL (con publicidad conservadora)** | ~380 € | ~4,566 € | |

#### Punto de Equilibrio Realista
- **Sin publicidad:** ~72 suscriptores (180 € / 2,5 €)
- **Con publicidad (200 €/mes):** ~152 suscriptores (380 € / 2,5 €)
- **Con publicidad agresiva (500 €/mes):** ~272 suscriptores (680 € / 2,5 €)

### Métricas Clave CAC vs LTV

#### CAC (Coste de Adquisición por Cliente)
**Objetivo:** < 10 € por suscriptor

**Cálculo conservador:**
- Inversión publicidad mes 1: 500 €
- Conversiones: 50 suscriptores
- CAC = 10 €/suscriptor

#### LTV (Lifetime Value)
**Escenario conservador (churn 10%/mes):**
- Vida media del cliente: 10 meses
- LTV = 2,5 €/mes × 10 meses = 25 €

**Ratio LTV/CAC = 25 € / 10 € = 2.5** ✅ (Objetivo: >3, Mínimo: >1.5)

**Escenario optimista (churn 5%/mes):**
- Vida media del cliente: 20 meses
- LTV = 2,5 €/mes × 20 meses = 50 €
- Ratio LTV/CAC = 50 € / 10 € = 5.0 🚀

### ✅ CONCLUSIÓN: PROYECTO VIABLE

**SI:**
1. Se corrige el SEO urgentemente (SSR/SSG) → Tráfico orgánico
2. Se ejecuta estrategia de autoridad (badges, rankings) → Enlaces naturales
3. Se mide y optimiza CAC desde el mes 1
4. Se implementa free tier o trial sin tarjeta para aumentar activación

---

## 🚀 PLAN SEO COMPLETO

### 1️⃣ INDEXACIÓN Y ARQUITECTURA (P0 - URGENTE)

#### A. Migrar Fichas a SSR/SSG

**Archivo a modificar:** `app/(public)/[category]/[province]/[slug]/page.tsx`

**Estado actual:** `'use client'` con fetch en useEffect
**Debe ser:** Server component con `generateMetadata` y `generateStaticParams`

**Implementación requerida:**

```typescript
// ✅ CORRECTO: Server Component con SSR
import { Metadata } from 'next';

type Props = {
  params: { category: string; province: string; slug: string }
}

// 1. Generar metadata dinámica (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = await fetchPlaceBySlug(params.slug);
  
  return {
    title: `${place.name} - ${place.category} en ${place.city}, ${place.province} | Casi Cinco`,
    description: place.ai_description || `${place.name} con ${place.rating}★ (${place.user_ratings_total} reseñas). ${place.address}`,
    openGraph: {
      title: place.name,
      description: place.ai_description,
      images: [place.photos[0]],
      type: 'website',
    },
  };
}

// 2. Pre-generar rutas estáticas (SSG) - Opcional pero recomendado
export async function generateStaticParams() {
  const places = await fetchAllPlacesSlugs();
  
  return places.map((place) => ({
    category: place.category,
    province: place.province,
    slug: place.slug,
  }));
}

// 3. Componente principal (Server Component, SIN 'use client')
export default async function PlaceDetailPage({ params }: Props) {
  const place = await fetchPlaceBySlug(params.slug);
  
  // Renderizar directamente, no useEffect
  return (
    <div>
      <h1>{place.name}</h1>
      {/* ... contenido ... */}
    </div>
  );
}
```

**Beneficios:**
- ✅ Google ve contenido completo HTML desde el servidor
- ✅ Metadata dinámica en cada página
- ✅ Tiempo de carga mejorado
- ✅ Core Web Vitals optimizados

#### B. Crear sitemap_index.xml segmentado

**Estado actual:** `sitemap.xml` único con todas las URLs
**Debe ser:** `sitemap_index.xml` que apunte a sitemaps segmentados

**Implementación:**

```xml
<!-- public/sitemap_index.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://casicinco.com/sitemap-static.xml</loc>
    <lastmod>2025-10-18</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-places.xml</loc>
    <lastmod>2025-10-18</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-blog.xml</loc>
    <lastmod>2025-10-18</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-categories.xml</loc>
    <lastmod>2025-10-18</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-provinces.xml</loc>
    <lastmod>2025-10-18</lastmod>
  </sitemap>
</sitemapindex>
```

**Actualizar robots.txt:**
```txt
Sitemap: https://casicinco.com/sitemap_index.xml
```

#### C. Implementar Schema.org (Datos Estructurados)

**Schemas necesarios:**

**1. Organization (Home):**
```typescript
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Casi Cinco",
  "url": "https://casicinco.com",
  "logo": "https://casicinco.com/images/logo.png",
  "description": "Solo los mejores lugares de España con nota ≥4.7",
  "sameAs": [
    "https://twitter.com/casicinco",
    "https://instagram.com/casicinco"
  ]
}
```

**2. ItemList (Listados de lugares):**
```typescript
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "numberOfItems": places.length,
  "itemListElement": places.map((place, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "Restaurant", // o Hotel, BarOrPub, CafeOrCoffeeShop
      "name": place.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": place.city,
        "addressRegion": place.province,
        "addressCountry": "ES"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": place.rating,
        "reviewCount": place.user_ratings_total
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": place.latitude,
        "longitude": place.longitude
      }
    }
  }))
}
```

**3. LocalBusiness (Fichas individuales):**
```typescript
{
  "@context": "https://schema.org",
  "@type": "Restaurant", // Adaptar según categoría
  "name": place.name,
  "image": place.photos,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": place.address,
    "addressLocality": place.city,
    "addressRegion": place.province,
    "postalCode": place.postal_code,
    "addressCountry": "ES"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": place.latitude,
    "longitude": place.longitude
  },
  "url": place.website,
  "telephone": place.phone,
  "priceRange": place.price_level ? "€".repeat(place.price_level) : undefined,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": place.rating,
    "reviewCount": place.user_ratings_total,
    "bestRating": 5,
    "worstRating": 1
  },
  "servesCuisine": place.subcategory
}
```

**4. BreadcrumbList (Todas las páginas):**
```typescript
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://casicinco.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Restaurantes",
      "item": "https://casicinco.com/restaurante"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": place.province,
      "item": `https://casicinco.com/restaurante/${place.province}`
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": place.name
    }
  ]
}
```

### 2️⃣ CONTENIDO Y E-E-A-T (P1 - ALTA PRIORIDAD)

#### A. Enriquecer Contenido de Fichas

**Problema actual:** Solo metadatos de Google + descripción IA genérica

**Añadir campos editoriales humanos:**

```sql
-- Migración Supabase
ALTER TABLE places ADD COLUMN editorial_context TEXT;
ALTER TABLE places ADD COLUMN neighborhood_description TEXT;
ALTER TABLE places ADD COLUMN best_time_to_visit TEXT;
ALTER TABLE places ADD COLUMN average_ticket TEXT;
ALTER TABLE places ADD COLUMN dress_code TEXT;
ALTER TABLE places ADD COLUMN parking_info TEXT;
ALTER TABLE places ADD COLUMN accessibility_notes TEXT;
ALTER TABLE places ADD COLUMN must_try_dishes TEXT[];
ALTER TABLE places ADD COLUMN editorial_author VARCHAR(100);
ALTER TABLE places ADD COLUMN last_editorial_review TIMESTAMP;
```

**Ejemplo de contenido enriquecido:**

```markdown
## Descripción
[Descripción IA actual]

## Contexto del Barrio
Ubicado en el corazón de Malasaña, uno de los barrios más vibrantes de Madrid...

## Cuándo Ir
- **Mejor momento:** Cenas de jueves a sábado (reservar con 2-3 días)
- **Evitar:** Lunes (cerrado) y domingos por la noche (menos ambiente)

## Ticket Medio
40-60 € por persona con bebida

## Imprescindibles
- Tataki de atún rojo
- Risotto de setas de temporada
- Tarta de queso casera

## Parking y Acceso
Parking público Plaza de España (5 min andando). Metro: Tribunal (L1, L10)

## Accesibilidad
Rampa de acceso, baño adaptado en planta baja.

---
*Última revisión: 15 de octubre de 2025 por María López, Embajadora 4.7 Madrid*
```

#### B. Sistema de Autoría y Actualización

**Implementar:**
- **Embajadores 4.7 por ciudad:** Personas locales que visitan 3 lugares/mes
- **Fecha de última revisión visible** en cada ficha
- **Changelog de cambios:** Altas, bajas, cambios de Tier

**Base de datos:**
```sql
CREATE TABLE editorial_authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  bio TEXT,
  photo_url TEXT,
  visits_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE place_reviews_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID REFERENCES places(id),
  author_id UUID REFERENCES editorial_authors(id),
  review_type VARCHAR(50), -- 'visit', 'update', 'verification'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3️⃣ ON-PAGE OPTIMIZATION (P0 - URGENTE)

#### A. Titles y Meta Descriptions

**Fórmula para Titles:**
```
[Nombre del Lugar] - [Categoría] [Rating]★ en [Ciudad], [Provincia] | Casi Cinco

Ejemplos:
- "DiverXO - Restaurante 3 Estrellas Michelin 4.8★ en Madrid | Casi Cinco"
- "Hotel Arts Barcelona - Hotel de Lujo 4.9★ en Barcelona | Casi Cinco"
```

**Fórmula para Meta Descriptions:**
```
[Nombre] en [Ciudad]: [Rating]★ con [N reseñas]. [Descripción breve 1-2 líneas]. [Contexto único]. Verificado en Casi Cinco.

Ejemplo:
"DiverXO en Madrid: 4.8★ con 2,847 reseñas. Alta cocina de vanguardia con 3 Estrellas Michelin. Experiencia gastronómica única por Dabiz Muñoz. Reserva con 2 meses de antelación. Verificado en Casi Cinco."
```

#### B. Estructura H1/H2/H3

**Fichas de lugares:**
```html
<h1>[Nombre del Lugar] - [Categoría] en [Ciudad]</h1>

<h2>Por Qué Está en Casi Cinco (≥4.7)</h2>
<!-- Índice de Consistencia, rating, reseñas -->

<h2>Descripción</h2>
<!-- Descripción IA + editorial -->

<h2>Información Práctica</h2>
<h3>Dirección y Contacto</h3>
<h3>Horarios</h3>
<h3>Precio Medio</h3>

<h2>Qué Debes Saber</h2>
<h3>Cuándo Ir</h3>
<h3>Cómo Llegar</h3>
<h3>Imprescindibles</h3>

<h2>Lugares Similares</h2>
<!-- Otros lugares ≥4.7 en la zona -->
```

### 4️⃣ PÁGINAS PROGRAMÁTICAS (P1 - ALTA PRIORIDAD)

#### Estructura de URLs a Crear

**Por Categoría + Provincia:**
```
/restaurantes/madrid/
/restaurantes/barcelona/
/bares/sevilla/
/cafeterias/valencia/
/hoteles/malaga/
```

**Por Categoría + Ciudad:**
```
/restaurantes/madrid/madrid-ciudad/
/restaurantes/barcelona/barcelona-ciudad/
```

**Implementación:**

**Archivo:** `app/(public)/[category]/[location]/page.tsx`

```typescript
import { Metadata } from 'next';

type Props = {
  params: { category: string; location: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, location } = params;
  
  const categoryNames = {
    restaurantes: 'Restaurantes',
    bares: 'Bares',
    cafeterias: 'Cafeterías',
    hoteles: 'Hoteles',
  };
  
  const locationFormatted = location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    title: `Mejores ${categoryNames[category]} en ${locationFormatted} ≥4.7★ | Casi Cinco`,
    description: `Descubre los mejores ${category} en ${locationFormatted} con nota mínima de 4.7 estrellas. Selección verificada y actualizada. Solo sitios casi perfectos.`,
  };
}

export default async function CategoryLocationPage({ params }: Props) {
  const places = await fetchPlacesByCategory AndLocation(params.category, params.location);
  
  return (
    <div>
      <h1>Mejores {category} en {location} (≥4.7★)</h1>
      
      {/* Bloque editorial humano */}
      <div className="editorial-intro">
        <p>
          Hemos seleccionado los {places.length} mejores {category} en {location} 
          con una nota mínima de 4.7 estrellas. Cada lugar ha sido verificado por nuestro 
          sistema y cumple con nuestros estándares de calidad.
        </p>
        
        <h2>Por Qué Confiar en Esta Selección</h2>
        <ul>
          <li>✅ Solo lugares con ≥4.7★ y mínimo 50 reseñas</li>
          <li>✅ Actualizado semanalmente</li>
          <li>✅ Sin compra de posiciones</li>
          <li>✅ Metodología transparente</li>
        </ul>
        
        <h2>Tiempo Ahorrado</h2>
        <p>
          📊 Con esta lista te ahorras aproximadamente <strong>45 minutos</strong> 
          de búsqueda y comparación vs hacerlo manualmente en Google Maps.
        </p>
      </div>
      
      {/* Mapa + Lista de lugares */}
      <PlacesList places={places} />
      
      {/* Contenido adicional */}
      <div className="editorial-content">
        <h2>Guía de {category} en {location}</h2>
        {/* Contenido editorial específico de la ciudad/categoría */}
      </div>
    </div>
  );
}
```

**Generar estáticamente las más importantes (ISR):**

```typescript
export async function generateStaticParams() {
  // Top 50 combinaciones de categoría + ubicación
  return [
    { category: 'restaurantes', location: 'madrid' },
    { category: 'restaurantes', location: 'barcelona' },
    { category: 'restaurantes', location: 'sevilla' },
    // ... etc
  ];
}

export const revalidate = 86400; // Revalidar cada 24 horas (ISR)
```

### 5️⃣ LISTAS POR OCASIÓN (P2 - MEDIA PRIORIDAD)

**URLs a crear:**
```
/listas/celiacos/
/listas/pet-friendly/
/listas/brunch/
/listas/romanticos/
/listas/terraza/
/listas/grupos/
/listas/negocios/
/listas/familiar/
```

**Base de datos:**

```sql
CREATE TABLE occasion_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50)
);

CREATE TABLE place_occasion_tags (
  place_id UUID REFERENCES places(id),
  tag_id UUID REFERENCES occasion_tags(id),
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  PRIMARY KEY (place_id, tag_id)
);

-- Tags iniciales
INSERT INTO occasion_tags (tag, display_name, description, icon) VALUES
('gluten-free', 'Sin Gluten', 'Opciones para celiacos certificadas', 'wheat-off'),
('pet-friendly', 'Pet Friendly', 'Admiten mascotas', 'dog'),
('brunch', 'Brunch', 'Brunch de fin de semana', 'coffee'),
('romantic', 'Romántico', 'Ideal para parejas', 'heart'),
('terrace', 'Terraza', 'Terraza exterior', 'sun'),
('groups', 'Grupos', 'Ideal para grupos grandes', 'users'),
('business', 'Negocios', 'Comidas de trabajo', 'briefcase'),
('family', 'Familiar', 'Apto para niños', 'baby');
```

**Página de lista:**

```typescript
// app/(public)/listas/[occasion]/page.tsx

export async function generateMetadata({ params }: { params: { occasion: string } }): Promise<Metadata> {
  const occasionNames = {
    'celiacos': 'Sin Gluten (Celiacos)',
    'pet-friendly': 'Pet Friendly',
    'brunch': 'Brunch',
    'romanticos': 'Románticos',
    // ...
  };
  
  return {
    title: `Mejores Lugares ${occasionNames[params.occasion]} ≥4.7★ | Casi Cinco`,
    description: `Selección de lugares ${occasionNames[params.occasion]} con nota ≥4.7. Verificados y actualizados.`,
  };
}

export default async function OccasionListPage({ params }: { params: { occasion: string } }) {
  const places = await fetchPlacesByOccasion(params.occasion);
  
  return (
    <div>
      <h1>Mejores Lugares {occasionName} (≥4.7★)</h1>
      
      <div className="occasion-intro">
        <p>
          Hemos seleccionado los {places.length} mejores lugares {occasionName} 
          en España con nota ≥4.7★. Cada lugar ha sido verificado manualmente.
        </p>
      </div>
      
      {/* Lugares agrupados por ciudad */}
      <PlacesGroupedByCity places={places} />
    </div>
  );
}
```

---

## 🏆 DIFERENCIACIÓN VS COMPETIDORES

### Posicionamiento Único

**"Lo mejor de verdad (≥4.7) con metodología abierta, actualización continua y sin compra de posiciones"**

### Comparativa vs Competencia

| Característica | Casi Cinco | Michelin/Repsol | TripAdvisor | Google Maps |
|----------------|------------|-----------------|-------------|-------------|
| **Filtro ≥4.7 automático** | ✅ Sí | ❌ No | ❌ No | ❌ No |
| **Metodología pública** | ✅ Sí (Open Method) | ❌ Opaca | ❌ Opaca | ❌ Algoritmo |
| **Sin compra de ranking** | ✅ Garantizado | ⚠️ Discutible | ❌ Ads mezclados | ❌ Ads arriba |
| **Actualización continua** | ✅ Semanal | ❌ Anual | ✅ Continua | ✅ Continua |
| **Índice de Consistencia** | ✅ Único | ❌ No | ❌ No | ❌ No |
| **Embajadores locales** | ✅ Sí (plan) | ⚠️ Inspectores | ❌ No | ❌ No |
| **Listas por ocasión** | ✅ Sí (plan) | ❌ Limitado | ✅ Sí | ⚠️ Limitado |
| **Changelog público** | ✅ Sí (plan) | ❌ No | ❌ No | ❌ No |
| **Badge verificación** | ✅ Sí (plan) | ✅ Placas | ❌ No | ❌ No |

### Pruebas Visibles de Diferenciación

#### 1. **Índice de Consistencia 4.7 (0-100)**

**Qué es:**
Métrica propia que combina:
- **Rating actual** (4.7-5.0)
- **Volumen de reseñas** (log n para normalizar)
- **Recencia** (última reseña < 30 días)
- **Estabilidad** (varianza del rating en el tiempo)

**Fórmula:**
```typescript
function calculateConsistencyIndex(place: Place): number {
  // 1. Rating normalizado (40 puntos máx)
  const ratingScore = ((place.rating - 4.7) / 0.3) * 40; // 4.7 = 0, 5.0 = 40
  
  // 2. Volumen normalizado (30 puntos máx)
  const volumeScore = Math.min((Math.log10(place.user_ratings_total) / 4) * 30, 30); // log10(10000) = 4
  
  // 3. Recencia (15 puntos máx)
  const daysSinceLastReview = getDaysSince(place.last_review_date);
  const recencyScore = Math.max(15 - (daysSinceLastReview / 2), 0);
  
  // 4. Estabilidad (15 puntos máx)
  const stabilityScore = (1 - place.rating_variance) * 15;
  
  return Math.round(ratingScore + volumeScore + recencyScore + stabilityScore);
}
```

**Visualización en ficha:**
```html
<div class="consistency-index">
  <div class="index-score">
    <span class="score">86</span>/100
    <span class="label">Índice de Consistencia</span>
  </div>
  
  <div class="index-breakdown">
    <div class="metric">
      <span class="icon">⭐</span>
      <span class="label">Rating</span>
      <span class="value">38/40</span>
    </div>
    <div class="metric">
      <span class="icon">📊</span>
      <span class="label">Volumen</span>
      <span class="value">28/30</span>
    </div>
    <div class="metric">
      <span class="icon">🕐</span>
      <span class="label">Recencia</span>
      <span class="value">13/15</span>
    </div>
    <div class="metric">
      <span class="icon">📈</span>
      <span class="label">Estabilidad</span>
      <span class="value">7/15</span>
    </div>
  </div>
</div>
```

#### 2. **Metodología Abierta (Open Method)**

**Página dedicada:** `/metodologia` (ya existe, mejorar)

**Contenido a añadir:**

```markdown
# Nuestra Metodología: Open Method 4.7

## Por Qué ≥4.7
El umbral de 4.7 estrellas no es arbitrario. Tras analizar 50,000+ lugares en Google Maps:
- Solo el **8%** tiene ≥4.7★ con >50 reseñas
- La diferencia entre 4.6 y 4.7 es significativa en experiencia real
- Por debajo de 4.7 la varianza aumenta exponencialmente

## Reglas de Entrada
1. ✅ Rating ≥4.7 en Google Maps
2. ✅ Mínimo 50 reseñas (restaurantes/bares/cafés)
3. ✅ Mínimo 100 reseñas (hoteles)
4. ✅ Ubicado en España
5. ✅ Abierto actualmente

## Sistema de Tiers
- 💎 **Diamante:** ≥4.9★ + >500 reseñas
- 🥇 **Platino:** ≥4.8★ + >200 reseñas
- 🥈 **Oro:** ≥4.7★ + >50 reseñas

## Actualización Continua
- **Semanal:** Actualización automática de ratings
- **Mensual:** Revisión de lugares críticos (4.7-4.75)
- **Trimestral:** Actualización completa de base de datos

## Salida Automática
Un lugar sale de Casi Cinco si:
- ❌ Cae por debajo de 4.7★ durante 2 actualizaciones consecutivas
- ❌ Cierra permanentemente
- ❌ Cambia de categoría fuera de las 4 permitidas

## Registro Público de Cambios
Ver changelog: [/changelog]
```

#### 3. **Sello Físico "Selección 4.7 (2025)"**

**Implementación:**

**A. Diseño del sello:**
- Pegatina para puerta/ventana
- QR code que lleva a la ficha en CasiCinco
- Año visible (cambia anualmente)
- Logo + "Selección 4.7"

**B. Landing page del sello:** `/sello-4-7`

```markdown
# Sello Selección 4.7

## ¿Qué significa este sello?
Este establecimiento forma parte de la **Selección 4.7 de Casi Cinco**: 
solo los mejores lugares de España con nota ≥4.7★.

## Cómo aparecer
1. Mantén tu rating en Google Maps ≥4.7
2. Consigue mínimo 50 reseñas
3. Serás indexado automáticamente
4. Solicita tu sello gratis en [formulario]

## Beneficios para el Negocio
- ✅ Visibilidad en CasiCinco.com
- ✅ Distintivo de calidad físico
- ✅ Posicionamiento en "Mejores de [tu ciudad]"
- ✅ Inclusión en rutas y listas temáticas
- ✅ Sin coste, sin compra de posición

## Solicitar Sello
[Formulario con verificación de lugar en BD]
```

**C. Widget embebible para negocios:**

```html
<!-- Widget para web del negocio -->
<div class="casicinco-badge" data-place-id="[id]">
  <a href="https://casicinco.com/[category]/[province]/[slug]" target="_blank">
    <img src="https://casicinco.com/badge.svg" alt="Selección 4.7 Casi Cinco" />
  </a>
</div>
<script async src="https://casicinco.com/widgets/badge.js"></script>
```

#### 4. **Programa Embajadores 4.7**

**Concepto:**
Personas locales apasionadas que visitan lugares, verifican la calidad y aportan contexto editorial.

**Requisitos:**
- Vivir en la ciudad asignada
- Visitar mínimo 3 lugares/mes
- Escribir contexto editorial (200-300 palabras)
- Tomar fotos propias (opcional)
- Verificar datos (horarios, precios, accesibilidad)

**Beneficios para Embajadores:**
- Suscripción Premium gratis
- Reconocimiento público (perfil de autor)
- Invitaciones a eventos Top Provinciales
- Badge "Embajador 4.7" en redes

**Implementación:**

```sql
-- Tabla de embajadores (ya diseñada arriba en editorial_authors)

-- Ficha de embajador
CREATE TABLE ambassador_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES editorial_authors(id),
  city VARCHAR(100) NOT NULL,
  bio TEXT,
  social_instagram VARCHAR(100),
  social_twitter VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Página pública:** `/embajadores`

```markdown
# Embajadores 4.7

Nuestros Embajadores son personas locales apasionadas por la gastronomía y la hospitalidad 
que visitan y verifican lugares en sus ciudades.

## Embajadores Activos

### Madrid
**María López** - 47 lugares visitados  
[Instagram] [Ver verificaciones]

### Barcelona  
**Jordi Martínez** - 32 lugares visitados  
[Instagram] [Ver verificaciones]

## Quiero ser Embajador
[Formulario de aplicación]
```

#### 5. **Rankings Top Provinciales**

**Eventos anuales:**
- **Top 50 Restaurantes de Madrid 2025**
- **Top 20 Hoteles de Málaga 2025**
- Etc.

**Página del ranking:** `/rankings/[provincia]/[category]/[year]`

**Contenido:**
```markdown
# Top 50 Restaurantes de Madrid 2025

Basado en nuestro Índice de Consistencia 4.7, estos son los 50 mejores 
restaurantes de Madrid con nota ≥4.7★.

## Metodología
- Datos actualizados al 31 de diciembre de 2024
- Índice de Consistencia como métrica principal
- Empates resueltos por volumen de reseñas
- Solo restaurantes con mínimo 100 reseñas

## Top 10

1. **DiverXO** - Índice 98/100 - 4.9★ (2,847 reseñas)
2. **Coque** - Índice 96/100 - 4.9★ (1,523 reseñas)
3. **Santceloni** - Índice 95/100 - 4.8★ (1,204 reseñas)
...

[Lista completa 1-50]

## Nota de Prensa
[Descargable para medios]

## Compartir Ranking
[Botones sociales]
```

**Promoción:**
- Nota de prensa a medios locales
- Email a todos los lugares del ranking
- Gráficos para redes sociales
- Certificado digital descargable para negocios

#### 6. **Changelog Público Semanal**

**Página:** `/changelog`

**Contenido:**

```markdown
# Changelog - Actualizaciones de la Selección 4.7

## Semana del 14-20 de Octubre de 2025

### 🆕 Nuevas Incorporaciones (12)
- **La Tasquita de Enfrente** - Madrid - Restaurante - 4.8★ (156 reseñas) - Tier: Platino
- **Café de la Opera** - Barcelona - Café - 4.7★ (89 reseñas) - Tier: Oro
...

### ⬆️ Subidas de Tier (5)
- **El Rincón del Abuelo** - Sevilla - 4.7★ → 4.8★ - Oro → Platino
...

### ⬇️ Salidas (3)
- **Casa Pepe** - Valencia - 4.7★ → 4.6★ - Ya no cumple criterios
...

### 📊 Estadísticas
- **Total lugares:** 2,624 (+9 neto)
- **Por Tier:**
  - 💎 Diamante: 234
  - 🥇 Platino: 876
  - 🥈 Oro: 1,514
```

**RSS feed:** `/changelog.xml` para suscriptores

---

## 📅 PLAN DE ACCIÓN 30/60/90 DÍAS

### 🚨 DÍAS 0-30: FUNDAMENTOS CRÍTICOS (SEO TÉCNICO)

**Objetivo:** Hacer el sitio indexable y rastreable correctamente

#### Semana 1 (Días 1-7): **QUICK WINS**

| Tarea | Responsable | Tiempo | Prioridad |
|-------|-------------|--------|-----------|
| ✅ Migrar fichas a SSR con generateMetadata | Dev | 2 días | P0 |
| ✅ Implementar Schema.org (LocalBusiness, ItemList, BreadcrumbList) | Dev | 1 día | P0 |
| ✅ Crear sitemap_index.xml segmentado | Dev | 4 horas | P0 |
| ✅ Actualizar robots.txt con nuevo sitemap | Dev | 30 min | P0 |
| ✅ Alta en Google Search Console + envío sitemaps | Admin | 1 hora | P0 |
| ✅ Implementar 15 guías editoriales "Mejores X en [ciudad]" | Contenido | 2 días | P1 |
| ✅ Diseñar Badge "Selección 4.7" | Diseño | 1 día | P1 |
| ✅ Landing page `/sello-4-7` | Dev | 4 horas | P1 |
| ✅ Outreach a 100 locales para badge | Marketing | 2 días | P1 |
| ✅ Configurar negativos en Google Ads (casino, juegos, etc.) | Marketing | 2 horas | P0 |

**Entregables Semana 1:**
- ✅ Fichas 100% indexables
- ✅ Schema.org implementado
- ✅ Sitemap enviado a GSC
- ✅ 15 guías publicadas
- ✅ Badge disponible
- ✅ 10-20 negocios con badge (enlaces)

#### Semana 2-3 (Días 8-21): **CONTENIDO Y AUTORIDAD**

| Tarea | Responsable | Tiempo | Prioridad |
|-------|-------------|--------|-----------|
| ✅ Añadir campos editoriales a BD (migración) | Dev | 1 día | P1 |
| ✅ Crear 30 páginas programáticas (categoría + ciudad) | Dev | 3 días | P1 |
| ✅ Escribir contexto editorial para Top 100 lugares | Contenido | 5 días | P1 |
| ✅ Página pública de Metodología mejorada (Open Method) | Contenido | 1 día | P1 |
| ✅ Implementar Índice de Consistencia en fichas | Dev | 2 días | P1 |
| ✅ Preparar Top 10 Provinciales (Madrid, Barcelona, Sevilla) | Contenido | 2 días | P1 |
| ✅ Nota de prensa Top Provinciales | Marketing | 1 día | P1 |
| ✅ Contacto con 20 medios locales | Marketing | 3 días | P1 |

**Entregables Semana 2-3:**
- ✅ 30 páginas programáticas indexables
- ✅ Top 100 lugares con contexto editorial
- ✅ Índice de Consistencia visible
- ✅ Open Method público
- ✅ Top 10 Provinciales publicados
- ✅ 5-10 menciones en medios (objetivo)

#### Semana 4 (Días 22-30): **MEDICIÓN Y AJUSTE**

| Tarea | Responsable | Tiempo | Prioridad |
|-------|-------------|--------|-----------|
| ✅ Análisis GSC: páginas indexadas, CTR, keywords emergentes | SEO | 1 día | P0 |
| ✅ Análisis Google Ads: CAC, conversiones, ajustes | Marketing | 1 día | P0 |
| ✅ Informe de badges instalados y tráfico referido | Marketing | 1 día | P1 |
| ✅ Primera iteración de mejoras SEO basadas en datos | Dev | 2 días | P1 |
| ✅ Crear dashboard interno de métricas SEO | Dev | 1 día | P1 |

**Entregables Semana 4:**
- ✅ Informe completo GSC
- ✅ Ajustes de Ads optimizados
- ✅ Dashboard de métricas en tiempo real

**KPIs a medir al día 30:**
- **Páginas indexadas:** Objetivo >500 (fichas + programáticas + blog)
- **Impresiones en GSC:** Baseline para comparar mes 2
- **CTR promedio:** Baseline
- **Keywords posicionadas:** Baseline
- **Enlaces desde badges:** Objetivo 20-30
- **CAC:** < 15 € (conservador mes 1)
- **Conversiones:** Objetivo 30-50 suscriptores

---

### 📈 DÍAS 31-60: EXPANSIÓN DE CONTENIDO

**Objetivo:** Escalar contenido programático y editorial

#### Semana 5-6 (Días 31-45): **ESCALAR PÁGINAS PROGRAMÁTICAS**

| Tarea | Responsable | Tiempo | Prioridad |
|-------|-------------|--------|-----------|
| ✅ Crear 100 páginas adicionales (categoría + ubicación) | Dev | 4 días | P1 |
| ✅ Implementar ISR (revalidación cada 24h) | Dev | 1 día | P1 |
| ✅ Escribir texto editorial único para Top 30 ciudades | Contenido | 5 días | P1 |
| ✅ Publicar 10 rutas públicas indexables | Contenido | 3 días | P1 |
| ✅ Sistema de listas por ocasión (BD + páginas) | Dev | 3 días | P1 |
| ✅ Crear 5 listas piloto (celiacos, pet-friendly, brunch, romántico, terraza) | Contenido | 3 días | P1 |

**Entregables Semana 5-6:**
- ✅ 130 páginas programáticas total
- ✅ 10 rutas indexables
- ✅ 5 listas por ocasión
- ✅ ISR activo (contenido siempre fresco)

#### Semana 7-8 (Días 46-60): **PR Y AUTORIDAD**

| Tarea | Responsable | Tiempo | Prioridad |
|-------|-------------|--------|-----------|
| ✅ Evento virtual "Top 50 Madrid 2025" | Marketing | 2 días | P1 |
| ✅ Nota de prensa + contacto con 50 medios | Marketing | 3 días | P1 |
| ✅ Programa Embajadores: Reclutar 2 embajadores (Madrid, Barcelona) | Marketing | 5 días | P2 |
| ✅ Primeras 10 verificaciones de embajadores | Contenido | 3 días | P2 |
| ✅ Changelog público semanal automatizado | Dev | 2 días | P1 |
| ✅ Widget embebible para negocios | Dev | 1 día | P1 |

**Entregables Semana 7-8:**
- ✅ Evento Top 50 realizado
- ✅ 10-20 menciones en medios (objetivo)
- ✅ 2 embajadores activos
- ✅ Changelog público activo
- ✅ Widget disponible

**KPIs a medir al día 60:**
- **Páginas indexadas:** Objetivo >1,000
- **Impresiones GSC:** +200% vs día 30
- **Enlaces externos:** +50 vs día 30
- **Tráfico orgánico:** Baseline establecido
- **Conversiones acumuladas:** 80-150 suscriptores
- **CAC:** < 12 € (optimizado)
- **Badges instalados:** 50-80

---

### 🚀 DÍAS 61-90: OPTIMIZACIÓN Y MICRO-NICHOS

**Objetivo:** Penetrar nichos específicos y optimizar conversión

#### Semana 9-10 (Días 61-75): **MICRO-INTENCIONES**

| Tarea | Responsable | Tiempo | Prioridad |
|-------|-------------|--------|-----------|
| ✅ Expandir listas por ocasión a 15 categorías | Contenido | 5 días | P1 |
| ✅ Páginas por barrio (Top 10 ciudades) | Dev + Contenido | 5 días | P1 |
| ✅ Guías "Dónde [verbo] en [ciudad]" (desayunar, cenar, tapear, etc.) | Contenido | 5 días | P1 |
| ✅ Sistema de tags y filtros avanzados | Dev | 3 días | P2 |
| ✅ Implementar FAQ schema en páginas clave | Dev | 1 día | P1 |

**Entregables Semana 9-10:**
- ✅ 15 listas por ocasión
- ✅ 30 páginas de barrios
- ✅ 20 guías por intención
- ✅ FAQ schema implementado

#### Semana 11-12 (Días 76-90): **ACTIVACIÓN Y RETENCIÓN**

| Tarea | Responsable | Tiempo | Prioridad |
|-------|-------------|--------|-----------|
| ✅ Test A/B: Trial sin tarjeta vs con tarjeta | Product | 5 días | P0 |
| ✅ Free tier limitado (5 lugares/día sin suscripción) | Dev | 2 días | P0 |
| ✅ Sistema de alertas automáticas (cambios de Tier) | Dev | 3 días | P1 |
| ✅ Newsletter semanal con changelog | Marketing | 2 días | P1 |
| ✅ Programa de referidos (1 mes gratis por referido) | Dev + Marketing | 3 días | P2 |
| ✅ Análisis de churn y mejoras de retención | Product | 2 días | P0 |

**Entregables Semana 11-12:**
- ✅ Free tier activo
- ✅ Trial sin tarjeta testeado
- ✅ Alertas automáticas
- ✅ Newsletter activa
- ✅ Programa de referidos
- ✅ Plan de reducción de churn

**KPIs a medir al día 90:**
- **Páginas indexadas:** Objetivo >2,000
- **Impresiones GSC:** +500% vs día 30
- **Tráfico orgánico:** >1,000 visitas/mes
- **Keywords Top 10:** >50 keywords
- **Enlaces externos:** >150 total
- **Conversiones acumuladas:** 200-350 suscriptores
- **CAC final:** < 10 €
- **LTV/CAC:** >3
- **Churn mensual:** < 8%
- **Badges instalados:** 150-250

---

## 📊 MÉTRICAS NORTE

### Métricas de Producto (Exclusividad)

| Métrica | Objetivo Mes 3 | Objetivo Mes 6 | Objetivo Año 1 |
|---------|---------------|----------------|----------------|
| **% fichas con Índice de Consistencia** | 100% | 100% | 100% |
| **% fichas con contexto editorial humano** | 30% | 60% | 80% |
| **% fichas "Revisado hace ≤30 días"** | 20% | 50% | 80% |
| **Tiempo medio ahorrado (min) vs búsqueda tradicional** | 45 min | 45 min | 45 min |
| **Locales con sello 4.7 físico** | 150 | 350 | 500 |
| **Embajadores activos** | 2 | 5 | 10 |

### Métricas SEO

| Métrica | Objetivo Mes 3 | Objetivo Mes 6 | Objetivo Año 1 |
|---------|---------------|----------------|----------------|
| **Páginas indexadas** | 2,000 | 4,000 | 6,000 |
| **Impresiones mensuales (GSC)** | 50K | 200K | 500K |
| **Clics orgánicos mensuales** | 1,000 | 5,000 | 15,000 |
| **CTR promedio** | 2% | 2.5% | 3% |
| **Keywords Top 10** | 50 | 150 | 300 |
| **Keywords Top 3** | 10 | 40 | 100 |
| **Domain Rating (Ahrefs)** | 15 | 25 | 35 |
| **Enlaces externos (backlinks)** | 150 | 400 | 800 |

### Métricas de Negocio

| Métrica | Objetivo Mes 3 | Objetivo Mes 6 | Objetivo Año 1 |
|---------|---------------|----------------|----------------|
| **Suscriptores activos** | 250 | 700 | 1,500 |
| **MRR (Monthly Recurring Revenue)** | 625 € | 1,750 € | 3,750 € |
| **CAC (Coste Adquisición Cliente)** | < 10 € | < 8 € | < 7 € |
| **LTV (Lifetime Value)** | > 30 € | > 40 € | > 50 € |
| **Ratio LTV/CAC** | > 3 | > 4 | > 5 |
| **Churn mensual** | < 8% | < 6% | < 5% |
| **Tasa de conversión (free → paid)** | 3% | 5% | 7% |

### Métricas de Autoridad

| Métrica | Objetivo Mes 3 | Objetivo Mes 6 | Objetivo Año 1 |
|---------|---------------|----------------|----------------|
| **Menciones en medios** | 20 | 60 | 120 |
| **Enlaces editoriales nuevos/mes** | 10 | 20 | 30 |
| **Búsquedas de marca (Google)** | 500 | 2,000 | 5,000 |
| **Tráfico directo mensual** | 500 | 2,000 | 5,000 |
| **Seguidores redes sociales** | 500 | 2,000 | 5,000 |

---

## ⚡ QUICK WINS (SEMANA 1)

### Día 1-2: SSR/SSG en Fichas

**Archivo:** `app/(public)/[category]/[province]/[slug]/page.tsx`

**Cambio:**
```typescript
// ❌ ANTES: 'use client' con fetch en useEffect
'use client';
export default function PlaceDetailPage() { ... }

// ✅ DESPUÉS: Server Component con generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> { ... }
export default async function PlaceDetailPage({ params }: Props) { ... }
```

**Impacto:** 🔴→🟢 Google ve contenido completo

**Tiempo:** 2 días

---

### Día 2: Schema.org

**Archivos a modificar:**
- `app/(public)/[category]/[province]/[slug]/page.tsx` → LocalBusiness
- `app/(public)/mapa/page.tsx` → ItemList
- `components/layout/Breadcrumbs.tsx` (crear) → BreadcrumbList

**Ejemplo:**
```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": place.name,
      "address": { ... },
      "aggregateRating": { ... },
      // ...
    })
  }}
/>
```

**Impacto:** Google muestra rich snippets (⭐ en resultados)

**Tiempo:** 1 día

---

### Día 3: Sitemap Segmentado + GSC

**Crear:**
- `app/sitemap-static.ts`
- `app/sitemap-places.ts`
- `app/sitemap-blog.ts`
- `app/sitemap-categories.ts`

**Actualizar:** `app/robots.ts`

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { ... },
    sitemap: 'https://casicinco.com/sitemap.xml', // Ya genera index automáticamente
  };
}
```

**Enviar a GSC:**
1. Ir a Google Search Console
2. Sitemaps → Añadir sitemap
3. URL: `https://casicinco.com/sitemap.xml`

**Impacto:** Indexación acelerada

**Tiempo:** 4 horas

---

### Día 3-4: 15 Guías Editoriales

**Páginas a crear:**
- `/guias/mejores-restaurantes-madrid`
- `/guias/mejores-restaurantes-barcelona`
- `/guias/mejores-hoteles-malaga`
- `/guias/mejores-bares-sevilla`
- ... (15 total)

**Estructura:**
```markdown
# Mejores Restaurantes de Madrid ≥4.7★

Hemos seleccionado los **[N] mejores restaurantes de Madrid** con nota ≥4.7.

## Por Qué Esta Lista es Diferente
- ✅ Solo lugares con ≥4.7★ y mínimo 100 reseñas
- ✅ Actualizado semanalmente
- ✅ Sin compra de posiciones
- ✅ Verificado manualmente

## Tiempo Ahorrado
📊 Te ahorras aproximadamente **45 minutos** vs buscar en Google Maps.

## Top 10 Restaurantes Madrid

[Lista con contexto de cada uno]

## Mapa Interactivo
[Mapa con marcadores]

## Guías Relacionadas
- [Mejores bares de Madrid]
- [Mejores cafeterías de Madrid]
```

**Impacto:** Contenido editorial de calidad → Rankings Google

**Tiempo:** 2 días (15 guías × 45 min cada una)

---

### Día 4-5: Badge + Landing

**Diseñar:**
- Badge "Selección 4.7 Casi Cinco 2025"
- Versiones: PNG, SVG, imprimible

**Crear:**
- `/sello-4-7` (landing page)
- Formulario de solicitud
- Sistema de verificación (lugar en BD)

**Impacto:** 10-20 enlaces en semana 1

**Tiempo:** 1.5 días

---

### Día 5: Google Ads - Negativos

**Añadir keywords negativas:**
```
-casino
-casinos
-juego
-juegos
-apuestas
-ruleta
-poker
-slots
-tragaperras
-gratis
-free
```

**Impacto:** Evitar clics no cualificados (ahorrar 20-30% presupuesto)

**Tiempo:** 2 horas

---

### Día 6-7: Outreach Badges

**Proceso:**
1. Extraer top 100 lugares por ciudad
2. Buscar email/teléfono de contacto
3. Enviar email personalizado:

```
Asunto: [Restaurante] seleccionado para Casi Cinco (≥4.7★)

Hola [Nombre],

Hemos incluido [Restaurante] en nuestra selección de mejores lugares 
de [Ciudad] con nota ≥4.7★.

Pueden solicitar un sello gratuito "Selección 4.7" para su puerta:
[Link a /sello-4-7]

Sin coste, sin compromiso. Solo reconocimiento a la excelencia.

Saludos,
Equipo Casi Cinco
```

**Objetivo:** 100 emails enviados → 20-30 respuestas → 10-15 badges instalados

**Impacto:** Enlaces naturales desde webs de negocios

**Tiempo:** 2 días

---

## 📦 ROADMAP DE EXCLUSIVIDAD (ENTREGABLES)

### Q1 2025 (Enero-Marzo)

| Entregable | Descripción | Estado |
|------------|-------------|--------|
| **Open Method v1** | Página `/metodologia` completa con reglas, fórmulas y ejemplos | 🟡 Mejorar |
| **Índice de Consistencia v1** | Métrica visible en todas las fichas con desglose | ⚪ Pendiente |
| **Badge "Selección 4.7"** | Diseño, landing, formulario, primeros 50 instalados | ⚪ Pendiente |
| **15 Guías editoriales** | Mejores [categoría] en [ciudad Top 15] | ⚪ Pendiente |
| **Top 10 Provinciales** | Rankings Madrid, Barcelona, Sevilla | ⚪ Pendiente |
| **Changelog semanal** | Página `/changelog` con altas/bajas/cambios | ⚪ Pendiente |
| **Schema.org completo** | LocalBusiness, ItemList, BreadcrumbList | ⚪ Pendiente |
| **SSR/SSG en fichas** | Fichas 100% indexables | ⚪ Pendiente |

### Q2 2025 (Abril-Junio)

| Entregable | Descripción | Estado |
|------------|-------------|--------|
| **100 páginas programáticas** | `/[categoría]/[ubicación]` con contenido único | ⚪ Pendiente |
| **Listas por ocasión (8)** | Celiacos, pet-friendly, brunch, romántico, terraza, grupos, negocios, familiar | ⚪ Pendiente |
| **Programa Embajadores** | 2 ciudades piloto (Madrid, Barcelona) | ⚪ Pendiente |
| **Widget embebible** | Para webs de negocios | ⚪ Pendiente |
| **Evento Top 50 Provincial** | Madrid 2025 + nota de prensa | ⚪ Pendiente |
| **Free tier** | 5 lugares/día sin suscripción | ⚪ Pendiente |
| **Alertas automáticas** | Email cuando lugar cambia de Tier | ⚪ Pendiente |

### Q3 2025 (Julio-Septiembre)

| Entregable | Descripción | Estado |
|------------|-------------|--------|
| **Termómetro horas punta (beta)** | Predicción de afluencia por patrones | ⚪ Pendiente |
| **Expansión Embajadores** | 5 ciudades adicionales | ⚪ Pendiente |
| **500 badges instalados** | Objetivo enlaces naturales | ⚪ Pendiente |
| **Guías por barrio** | Top 10 ciudades, principales barrios | ⚪ Pendiente |
| **Sistema de referidos** | 1 mes gratis por referido convertido | ⚪ Pendiente |
| **App móvil nativa (PWA)** | Instalable, notificaciones push | ⚪ Pendiente |

### Q4 2025 (Octubre-Diciembre)

| Entregable | Descripción | Estado |
|------------|-------------|--------|
| **Ranking anual completo** | Top 100 España 2025 por categoría | ⚪ Pendiente |
| **Embajadores en 10 ciudades** | Cobertura nacional | ⚪ Pendiente |
| **1,000 badges instalados** | Red de enlaces consolidada | ⚪ Pendiente |
| **API pública (beta)** | Para integraciones externas | ⚪ Pendiente |
| **Gamificación v1** | Badges de explorador, niveles | ⚪ Pendiente |

---

## 🎯 CONCLUSIÓN

### Proyecto Viable SI:

1. ✅ **Se corrige SSR/SSG INMEDIATAMENTE** (Semana 1)
   - Sin esto, 0% tráfico orgánico en fichas

2. ✅ **Se implementa Schema.org** (Semana 1)
   - Rich snippets = mayor CTR

3. ✅ **Se añade contenido editorial humano** (Mes 1-3)
   - Evitar penalización por "contenido fino"

4. ✅ **Se ejecuta estrategia de autoridad** (Mes 1-3)
   - Badges → Enlaces naturales
   - Rankings → PR y menciones
   - Embajadores → Contenido verificado

5. ✅ **Se optimiza CAC/LTV desde día 1**
   - Free tier o trial sin tarjeta
   - Medición obsesiva de conversión
   - Ajuste continuo de Ads

### Diferenciación Real vs Michelin/Repsol/TripAdvisor:

**Tu Ventaja Competitiva:**
1. 🔢 **Reglas públicas y medibles** (Índice de Consistencia)
2. 🔄 **Actualización continua** (semanal vs anual)
3. 🎯 **Ocasión de uso práctica** (listas temáticas)
4. 💎 **Política sin compra de ranking** (transparencia total)
5. 🏅 **Señales offline** (sello + QR → búsquedas de marca)

Esta combinación es **única** y tu **moat** (foso defensivo).

### Próximos Pasos Inmediatos:

**Hoy mismo:**
1. Leer `LEEME_PRIMERO.md` si no lo has hecho
2. Revisar `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md`
3. Planificar sprint de Semana 1

**Mañana:**
1. Empezar migración SSR/SSG en fichas
2. Diseñar Badge "Selección 4.7"
3. Preparar lista de 100 negocios para outreach

**Próximos 7 días:**
1. Completar todos los Quick Wins
2. Enviar sitemap a GSC
3. Publicar 15 guías editoriales
4. 10-20 badges instalados

---

## 📚 DOCUMENTOS RELACIONADOS

| Documento | Descripción |
|-----------|-------------|
| `ROADMAP_MEJORAS.md` | Mejoras técnicas y UX (complementario) |
| `OPTIMIZACION_GOOGLE_API_COMPLETA.md` | Costes optimizados (ya implementado) |
| `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md` | Sistema de indexación actual |
| `CHECKLIST_FUNCIONAL.md` | Verificación de funcionalidades |
| `SISTEMA_MONETIZACION.md` | Detalles de Stripe y suscripción |

---

**Actualizado:** 18 de Octubre de 2025  
**Versión:** 1.0  
**Estado:** 🟢 LISTO PARA EJECUTAR

---

**🚀 LA PERFECCIÓN NO ES UN DESTINO, ES UN CAMINO. EMPECEMOS. 🚀**

