# 🚀 Roadmap de Mejoras - Casi Cinco

**Versión Actual:** 3.0.0 BETA 3.0  
**Fecha:** 18 de Octubre de 2025  
**Enfoque:** Mejoras críticas SEO + Conversión + UX  
**Actualizado con:** Auditoría de experto programador

---

## ✅ BLOQUEADORES CRÍTICOS - COMPLETADOS (18 OCT 2025)

### **✅ 1. SSR/SSG en Fichas de Lugares** 🟢 **COMPLETADO**

#### **Problema Resuelto:**
- **CRÍTICO:** Fichas usan `'use client'` con fetch en `useEffect`
- **Consecuencia:** Google ve "Cargando..." permanentemente
- **Impacto:** **0% de tráfico orgánico en 2,612 fichas**
- **Estado:** ❌ Bloqueador SEO total

#### **Solución:**
```typescript
// ❌ ANTES: app/(public)/[category]/[province]/[slug]/page.tsx
'use client';
export default function PlaceDetailPage() {
  const [place, setPlace] = useState(null);
  useEffect(() => {
    fetch(`/api/places/by-slug/${slug}`).then(...);
  }, [slug]);
}

// ✅ DESPUÉS: Server Component con generateMetadata
import { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = await fetchPlaceBySlug(params.slug);
  
  return {
    title: `${place.name} - ${place.category} ${place.rating}★ en ${place.city} | Casi Cinco`,
    description: `${place.name}: ${place.rating}★ con ${place.user_ratings_total} reseñas. ${place.ai_description}`,
    openGraph: {
      title: place.name,
      description: place.ai_description,
      images: [place.photos[0]],
      type: 'website',
    },
  };
}

// Pre-generar rutas estáticas (SSG)
export async function generateStaticParams() {
  const places = await supabase
    .from('places')
    .select('category, province, slug')
    .eq('published', true);
  
  return places.map(p => ({
    category: p.category,
    province: p.province,
    slug: p.slug,
  }));
}

// Componente sin 'use client'
export default async function PlaceDetailPage({ params }: Props) {
  const place = await fetchPlaceBySlug(params.slug);
  
  return (
    <div>
      <h1>{place.name}</h1>
      {/* Contenido renderizado en servidor */}
    </div>
  );
}
```

**Impacto:** 🔥 Google indexa 2,612 páginas correctamente  
**Tiempo:** 4 horas  
**Estado:** ✅ **COMPLETADO 18 OCT 2025**

---

### **✅ 2. Schema.org (Datos Estructurados)** 🟢 **COMPLETADO**

#### **Problema:**
- Sin datos estructurados → Sin rich snippets
- CTR 30-50% más bajo en resultados de Google
- No aparecen estrellas ⭐ en búsquedas

#### **Solución:**
```typescript
// 1. LocalBusiness en fichas individuales
<script type="application/ld+json">
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
    "addressCountry": "ES"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": place.latitude,
    "longitude": place.longitude
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": place.rating,
    "reviewCount": place.user_ratings_total
  }
}
</script>

// 2. ItemList en listados (/mapa, /restaurantes/madrid, etc.)
// 3. BreadcrumbList en todas las páginas
// 4. Organization en home
```

**Impacto:** ⭐ Rich snippets en Google = +40% CTR  
**Tiempo:** Incluido en SSR/SSG  
**Estado:** ✅ **COMPLETADO 18 OCT 2025**

---

### **✅ 3. Trial SIN Tarjeta (30 días)** 🟢 **COMPLETADO**

#### **Problema Actual:**
- Trial de 30 días **REQUIERE tarjeta** en Stripe
- Fricción brutal en onboarding
- Conversión visitante → trial probablemente **<1%**

#### **Solución:**
**A. Trial se gestiona en Supabase (no en Stripe):**
```sql
-- Ya implementado: trigger que da 30 días automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{trial_ends_at}',
    to_jsonb((NOW() + INTERVAL '30 days')::text)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**B. Modal de bienvenida al primer login:**
```typescript
// components/auth/WelcomeModal.tsx (CREAR NUEVO)
// Mostrar 3 opciones:
// 1. 🎁 Trial 30 días SIN tarjeta (DESTACADO)
// 2. ⚡ Premium Mensual 2.99€ (con tarjeta)
// 3. 👑 Premium Anual 24.99€ (con tarjeta, ahorra 30%)
```

**C. Flujo mejorado:**
```
Usuario se registra
  ↓
Modal de bienvenida aparece
  ↓
Elige: Trial SIN tarjeta → Acceso inmediato 30 días
     o: Pago directo → Stripe Checkout
  ↓
Día 28: Banner naranja "Quedan 2 días de trial"
  ↓
Día 31: Paywall modal "Trial terminado. Suscríbete"
```

**Cambios técnicos:**
1. Eliminar `trial_period_days` de Stripe checkout
2. Trial = metadata en Supabase, no en Stripe
3. Crear `WelcomeModal.tsx`
4. Actualizar `pricing/page.tsx` para quitar `trialDays: 30` en checkout

**Impacto:** 🚀 Conversión visitante → trial: **1% → 10%+**  
**Tiempo:** 3 horas  
**Estado:** ✅ **COMPLETADO 18 OCT 2025**

---

### **✅ 4. Sitemap Segmentado** 🟢 **COMPLETADO**

#### **Estado Actual:**
- Sitemap único en `app/sitemap.ts`
- No enviado a Google Search Console
- No hay sitemap index

#### **Solución:**
```xml
<!-- public/sitemap_index.xml -->
<sitemapindex>
  <sitemap>
    <loc>https://casicinco.com/sitemap-static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-places.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-blog.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-categories.xml</loc>
  </sitemap>
</sitemapindex>
```

**Actualizar robots.txt:**
```txt
Sitemap: https://casicinco.com/sitemap_index.xml
```

**Enviar a GSC:**
1. Google Search Console → Sitemaps
2. Añadir: `https://casicinco.com/sitemap.xml`

**Impacto:** ⚡ Indexación acelerada  
**Tiempo:** 2 horas  
**Estado:** ✅ **COMPLETADO 18 OCT 2025**

**Pendiente:** Enviar a Google Search Console

---

### **✅ 5. SSR/SSG en Blog** 🟢 **COMPLETADO**

#### **Problema Resuelto:**
- ❌ Blog usaba `'use client'` igual que fichas
- ❌ Google no veía contenido de posts
- ❌ 0% tráfico orgánico desde blog

#### **Solución Implementada:**
- ✅ Migrado `blog/[slug]/page.tsx` a Server Component
- ✅ Migrado `blog/page.tsx` a Server Component
- ✅ Schema.org Article + ItemList + Breadcrumb
- ✅ generateMetadata() dinámico
- ✅ generateStaticParams() top 20 posts
- ✅ ISR inteligente (6h posts, 1h listado)

**Archivos creados:**
- `components/blog/BlogPostContent.tsx`
- `components/blog/BlogListContent.tsx`

**Impacto:** 🔥 Posts del blog 100% indexables  
**Tiempo:** 2 horas  
**Estado:** ✅ **COMPLETADO 18 OCT 2025**

---

## 🎯 Mejoras Prioritarias (Próximas 2 Semanas)

### **1. Optimización de Performance** ⚡ CRÍTICO

#### **Problema Actual:**
- Dashboard carga solo 100 lugares (debería mostrar estadísticas de los 3,528)
- Planificador carga 2000 lugares en memoria (pesado)
- Sin caché de datos entre páginas

#### **Solución:**
```typescript
// Crear hook de caché global
const usePlacesCache = () => {
  // Cache en localStorage con TTL
  // Compartir entre dashboard, lugares, planificador
  // Invalidar al hacer cambios
}

// Implementar Virtualization para listas largas
import { useVirtualizer } from '@tanstack/react-virtual';
```

**Impacto:** 🔥 Performance 3x más rápida  
**Tiempo:** 4-6 horas  

---

### **2. PWA Completa** 📱 ALTA PRIORIDAD

#### **Estado Actual:**
- ❌ No instalable en home screen
- ❌ No funciona offline
- ❌ No hay notificaciones

#### **Implementar:**
```javascript
// public/manifest.json
{
  "name": "Casi Cinco",
  "short_name": "Casi5",
  "icons": [...],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#6366f1"
}

// Service Worker básico
self.addEventListener('fetch', (event) => {
  // Caché de lugares para offline
  // Caché de imágenes
});
```

**Archivos a crear:**
1. `public/manifest.json`
2. `public/sw.js`
3. `public/icons/` (192x192, 512x512)
4. Actualizar `app/layout.tsx` con meta tags PWA

**Impacto:** 🌟 App instalable tipo nativa  
**Tiempo:** 2-3 horas

---

### **3. Sistema de Caché Inteligente** 💾 ALTA

#### **Problema:**
- Cada página carga datos de cero
- Sin sincronización entre tabs
- Datos obsoletos no se invalidan

#### **Solución:**
```typescript
// lib/cache/places-cache.ts
export class PlacesCache {
  private static CACHE_KEY = 'places_cache_v3';
  private static TTL = 10 * 60 * 1000; // 10 minutos
  
  static async getAll(): Promise<Place[]> {
    // Leer de cache
    // Si expiró, recargar
    // Guardar en localStorage + memory
  }
  
  static invalidate() {
    // Limpiar al hacer cambios
  }
}
```

**Impacto:** ⚡ Carga instantánea entre páginas  
**Tiempo:** 3-4 horas

---

### **4. Error Handling Robusto** 🛡️ MEDIA

#### **Problemas Actuales:**
- Errores no se muestran claramente al usuario
- Sin retry automático
- Sin fallbacks

#### **Implementar:**
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  // Capturar errores de React
  // Mostrar UI amigable
  // Botón "Intentar de nuevo"
}

// lib/api/fetcher.ts
export async function fetchWithRetry(url, options) {
  // Retry 3 veces con backoff
  // Timeout de 30s
  // Error handling consistente
}
```

**Impacto:** 🛡️ UX más confiable  
**Tiempo:** 2-3 horas

---

## 🎨 Mejoras de UX/UI (Próximo Mes)

### **5. Animaciones y Micro-interacciones** ✨

**Añadir:**
- Loading skeletons (en vez de spinners)
- Transitions entre páginas
- Gestos táctiles (swipe, pull-to-refresh)
- Haptic feedback (vibración en móvil)

**Librerías:**
```bash
npm install framer-motion
npm install react-spring
```

**Tiempo:** 4-6 horas

---

### **6. Modo Oscuro** 🌙

**Implementar:**
```typescript
// Detectar preferencia sistema
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// Toggle manual
const [theme, setTheme] = useState<'light' | 'dark'>('light');

// CSS variables
:root[data-theme='dark'] {
  --background: #111;
  --text: #fff;
}
```

**Tiempo:** 6-8 horas

---

### **7. Mejoras del Chatbot** 🤖

#### **Estado Actual:**
- ✅ Funciona
- ❌ No recuerda conversaciones anteriores (entre sesiones)
- ❌ No puede reservar o compartir

#### **Mejoras:**
```typescript
// Guardar conversaciones en BD
CREATE TABLE chat_sessions (
  id UUID,
  user_id UUID,
  messages JSONB,
  created_at TIMESTAMP
);

// Funciones del chatbot
- "Reservar mesa" → Link a teléfono/web
- "Compartir con amigo" → Share API
- "Añadir a favoritos" → DB
```

**Tiempo:** 8-10 horas

---

## 🔧 Mejoras Técnicas (Deuda Técnica)

### **8. Testing Automatizado** 🧪 MEDIA-ALTA

#### **Estado:**
- Archivos `__tests__/` existen pero no se usan
- Sin CI/CD testing

#### **Implementar:**
```typescript
// E2E con Playwright
test('Usuario puede buscar restaurantes', async ({ page }) => {
  await page.goto('/mapa');
  await page.fill('[placeholder*="Buscar"]', 'Barcelona');
  await expect(page.locator('.place-card')).toHaveCount(5);
});

// Unit tests con Jest
test('calculateQualityTier returns diamond for 4.9★ + 1500 reviews', () => {
  expect(calculateQualityTier(4.9, 1500)).toBe('diamond');
});
```

**Tiempo:** 10-12 horas

---

### **9. Optimización de Bundle** 📦 MEDIA

#### **Actual:**
- First Load JS: 84.2 kB (aceptable)
- Mapa: 22.2 kB (mejorable)

#### **Optimizar:**
```typescript
// Lazy loading de componentes pesados
const AdminDashboard = dynamic(() => import('./admin/dashboard'), {
  loading: () => <Skeleton />,
  ssr: false
});

// Code splitting por rutas
// Eliminar dependencias no usadas
// Optimizar imágenes (Next Image)
```

**Impacto:** ⚡ -20% tamaño bundle  
**Tiempo:** 4-6 horas

---

### **10. SEO y Open Graph** 📈 MEDIA

#### **Mejorar:**
```typescript
// Metadata dinámica por lugar
export async function generateMetadata({ params }) {
  return {
    title: `${place.name} - ${place.rating}★ - Casi Cinco`,
    description: place.ai_description,
    openGraph: {
      images: [place.photos[0]],
    }
  }
}

// Sitemap dinámico
// robots.txt
// Schema.org markup
```

**Tiempo:** 3-4 horas

---

## 🚀 Features Nuevas (Largo Plazo)

### **11. Sistema de Favoritos Mejorado** ⭐

**Añadir:**
- Listas personalizadas ("Málaga 2025", "Hoteles Románticos")
- Compartir listas públicas
- Colaborar en listas (varios usuarios)
- Exportar a Google Maps

**Tiempo:** 12-16 horas

---

### **12. Recomendaciones IA Personalizadas** 🧠

**Implementar:**
```typescript
// Analizar historial del usuario
const userPreferences = analyzeUserHistory(userId);

// Generar recomendaciones
const recommendations = await openai.chat({
  model: 'gpt-4',
  messages: [{
    role: 'system',
    content: `Usuario le gustan: ${userPreferences.categories}
              Provincias visitadas: ${userPreferences.provinces}
              Recomienda 5 lugares nuevos similares`
  }]
});
```

**Tiempo:** 16-20 horas

---

### **13. Sistema de Reservas** 📞

**Integración:**
- Click to call
- WhatsApp directo
- Email de consulta
- Integración con TheFork/ElTenedor (API)

**Tiempo:** 20-30 horas

---

### **14. Gamificación** 🎮

**Ideas:**
- Badges por lugares visitados
- Niveles de explorador
- Retos mensuales
- Ranking de usuarios
- Puntos por reseñas

**Tiempo:** 30-40 horas

---

## 🔧 Refactorización de Código (Deuda Técnica)

### **15. Arquitectura de Estado** 

**Problema:**
- Muchos `useState` repetidos
- No hay estado global
- Props drilling

**Solución:**
```typescript
// Usar Zustand para estado global
import create from 'zustand';

export const usePlacesStore = create((set) => ({
  places: [],
  filters: {},
  setPlaces: (places) => set({ places }),
  applyFilters: (filters) => set({ filters }),
}));
```

**Tiempo:** 8-12 horas

---

### **16. TypeScript Strict Mode** 

**Activar:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Corregir:** ~50 errores de tipos  
**Tiempo:** 6-8 horas

---

### **17. Modularización de Componentes Grandes**

**Archivos a refactorizar:**
- `app/(public)/mapa/page.tsx` (2000+ líneas) → Dividir en 5-6 componentes
- `app/admin/dashboard/page.tsx` (800+ líneas) → Separar secciones
- `components/ChatbotFloating.tsx` → Separar lógica

**Tiempo:** 10-12 horas

---

## 💡 PRIORIDADES ACTUALIZADAS (Basadas en Auditoría)

### **🚨 Semana 1: BLOQUEADORES CRÍTICOS (P0)**
**Objetivo:** Desbloquear SEO y conversión

#### Días 1-2: SSR/SSG en Fichas
- [ ] Migrar `[category]/[province]/[slug]/page.tsx` a Server Component
- [ ] Implementar `generateMetadata` para SEO
- [ ] Implementar `generateStaticParams` para SSG
- [ ] Probar que Google ve contenido completo

**Impacto:** 2,612 páginas indexables → Tráfico orgánico desbloqueado

#### Día 2: Schema.org
- [ ] LocalBusiness en fichas
- [ ] ItemList en listados
- [ ] BreadcrumbList global
- [ ] Organization en home

**Impacto:** Rich snippets → +40% CTR

#### Días 3-4: Trial sin Tarjeta
- [ ] Crear `WelcomeModal.tsx`
- [ ] Eliminar `trial_period_days` de Stripe
- [ ] Actualizar lógica en `pricing/page.tsx`
- [ ] Banner de días restantes funcional
- [ ] Paywall al día 31

**Impacto:** Conversión 1% → 10%+

#### Día 5: Sitemap + GSC
- [ ] Crear sitemap segmentado
- [ ] Actualizar robots.txt
- [ ] Enviar a Google Search Console

---

### **🟠 Semana 2: Contenido y Autoridad (P1)**

#### Días 6-7: Guías Editoriales
- [ ] 15 guías "Mejores [categoría] en [ciudad]"
- [ ] Contenido humano 100% original
- [ ] Estructura H1/H2/H3 SEO-friendly

#### Días 8-10: Badge "Selección 4.7"
- [ ] Diseñar badge físico/digital
- [ ] Landing `/sello-4-7`
- [ ] Widget embebible
- [ ] Outreach a 100 locales

**Objetivo:** 20-30 enlaces naturales

---

### **🟡 Semana 3: Páginas Programáticas (P1-P2)**

#### Días 11-13: Categoría + Ubicación
- [ ] Crear `/[category]/[location]/page.tsx`
- [ ] 30 páginas programáticas piloto
- [ ] Contenido editorial único por ciudad
- [ ] ISR (revalidación 24h)

#### Días 14-15: Listas por Ocasión
- [ ] Sistema de tags (celiacos, pet-friendly, brunch, etc.)
- [ ] 5 listas piloto
- [ ] Páginas `/listas/[occasion]`

---

### **⚡ Semana 4: Performance y UX (P2)**

1. PWA completa (2-3h)
2. Error Handling robusto (2-3h)
3. Caché inteligente (3-4h)
4. Loading Skeletons (2h)
5. Bundle optimization (4-6h)

---

## 🎯 KPIs y Objetivos

### **Mes 1 (Días 1-30):**
- ✅ Páginas indexadas: >500
- ✅ Conversión trial: >5%
- ✅ Enlaces desde badges: 20-30
- ✅ Impresiones GSC: Baseline establecido

### **Mes 2 (Días 31-60):**
- ✅ Páginas indexadas: >1,000
- ✅ Conversión trial: >8%
- ✅ Tráfico orgánico: >1,000 visitas/mes
- ✅ Keywords Top 10: >50

### **Mes 3 (Días 61-90):**
- ✅ Páginas indexadas: >2,000
- ✅ Conversión trial: >10%
- ✅ Suscriptores totales: 200-350
- ✅ Enlaces externos: >150
- ✅ CAC < 10€

---

## 📊 Quick Wins Actualizados (Alto ROI)

### **Implementar ESTA SEMANA:**

1. **SSR en fichas** (2 días) → 🔥 **SIN ESTO, 0 SEO**
2. **Schema.org** (1 día) → ⭐ Rich snippets (+40% CTR)
3. **Trial sin tarjeta** (2 días) → 🚀 Conversión 10x
4. **Sitemap + GSC** (4h) → ⚡ Indexación acelerada

### **Semana siguiente:**

5. **15 guías editoriales** (2 días) → 📝 Contenido para rankear
6. **Badge + outreach** (2 días) → 🔗 20-30 enlaces
7. **WelcomeModal** (1 día) → 🎁 UX de onboarding mejorada
8. **30 páginas programáticas** (3 días) → 📄 Long-tail SEO

---

## 📚 Documentación Relacionada

- `PLAN_ESTRATEGICO_2025_SEO_VIABILIDAD.md` - Estrategia completa
- `SISTEMA_MONETIZACION.md` - Detalles de pagos actuales
- `OPTIMIZACION_GOOGLE_API_COMPLETA.md` - Costes optimizados
- `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md` - Sistema actual

---

**NOTA IMPORTANTE:** Las mejoras de performance y UX (PWA, caché, animaciones) son importantes pero **SECUNDARIAS** hasta que el SEO y la conversión estén desbloqueados. Primero tráfico + usuarios, luego optimizar la experiencia.
