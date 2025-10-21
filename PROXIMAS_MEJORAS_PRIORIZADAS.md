# 🎯 PRÓXIMAS MEJORAS PRIORIZADAS - Casi Cinco

**Fecha:** 18 de Octubre de 2025  
**Basado en:** Implementación crítica completada + Auditoría experto  
**Estado actual:** SSR/SSG ✅ | Trial sin tarjeta ✅ | Sitemap ✅ | Redes Sociales ✅

---

## 🔥 PRIORIDAD MÁXIMA (P0) - Hacer AHORA

### **1. Deploy a Producción + Testing** ⚡ **URGENTE**
**Tiempo estimado:** 1-2 horas  
**Impacto:** 🔥 **CRÍTICO - Sin deploy, todo lo anterior no sirve**

#### Acciones:
```bash
# 1. Verificar build local
npm run build
npm start

# 2. Commit de cambios
git add .
git commit -m "Feature: SSR/SSG fichas + Trial sin tarjeta + Sitemap segmentado"
git push origin main

# 3. Deploy en AWS Amplify (automático al push)
# Esperar 5-10 minutos

# 4. Verificar en producción:
# - https://casicinco.com/restaurante/madrid/[cualquier-slug]
# - Ver código fuente → Schema.org presente
# - Registrar usuario → WelcomeModal aparece
```

#### Testing crítico:
- [ ] Fichas renderizan correctamente (SSR)
- [ ] Schema.org visible en código fuente
- [ ] WelcomeModal aparece al registrarse
- [ ] Trial de 30 días se asigna (ver Supabase)
- [ ] Sitemaps accesibles: `/sitemap-index.xml`, `/sitemap-places.xml`

**¿Por qué P0?** Sin deploy, ninguna mejora está activa. Sin testing, no sabes si funciona.

---

### **2. Ejecutar Script de Redes Sociales** 📷 **ALTA**
**Tiempo estimado:** 2-3 horas (procesamiento automático)  
**Impacto:** 🔥 **Engagement + Growth orgánico**

#### Pasos:
1. **Configurar Google Custom Search ID** (opcional):
   - https://programmablesearchengine.google.com/
   - Crear engine para `instagram.com/*`
   - Añadir a `.env.local`: `GOOGLE_SEARCH_ENGINE_ID=xxx`

2. **Opción A: Panel de Admin (Recomendado)**:
   - Ir a: `https://casicinco.com/admin/redes-sociales`
   - Procesar 100 lugares primero (validar)
   - Luego procesar en lotes de 500

3. **Opción B: Script CLI**:
   ```bash
   npm run social-media process 100   # Top 100
   npm run social-media process 500   # Top 500
   npm run social-media process 3111  # Todos
   ```

#### Estrategia gradual (recomendada):
- **Día 1:** Top 100 lugares (validar calidad) - **$0.50**
- **Día 2:** Top 500 lugares - **$2.50**
- **Semana 2:** Resto (~2,600 lugares) - **~$0.50**
- **Total:** ~$3 (80% gratis via scraping)

#### Siguiente paso:
- Desde cuenta @casicinco de Instagram:
  - Seguir a todos los lugares con Instagram
  - Engagement esperado: 20-30% follow back
  - ~600-900 seguidores orgánicos

**¿Por qué P0?** Engagement con lugares + crecimiento orgánico + mejor UX.

---

### **3. Enviar Sitemap a Google Search Console** 📊 **URGENTE**
**Tiempo estimado:** 15 minutos  
**Impacto:** 🔥 **CRÍTICO - Sin esto, Google no indexa rápido**

#### Pasos:
1. Ir a: https://search.google.com/search-console
2. Seleccionar propiedad `casicinco.com`
3. Menú lateral → **Sitemaps**
4. Añadir nuevo sitemap: `https://casicinco.com/sitemap-index.xml`
5. Enviar

#### Verificar:
- Estado: "Correcto" ✅
- URLs descubiertas: ~2,700+ (lugares + blog + estáticas)
- Esperar 24-48h para primera indexación

**¿Por qué P0?** Es el "switch" para que Google empiece a indexar las 2,612 fichas.

---

## 🚀 ALTA PRIORIDAD (P1) - Semana 1-2

### **3. 15 Guías Editoriales SEO** 📝 **MUY ALTA**
**Tiempo estimado:** 8-12 horas (2 días)  
**Impacto:** 🔥 **Contenido ranqueable + Link building**

#### Objetivo:
Crear contenido editorial **humano 100%** (no IA) que rankee en Google y genere autoridad.

#### Estructura de cada guía:
```markdown
# Los 10 Mejores Restaurantes en Madrid [2025]

## Introducción (150-200 palabras)
- Contexto de Madrid como destino gastronómico
- Criterios de selección (rating 4.7+, reseñas verificadas)

## 1. [Nombre Restaurante] ⭐ 4.9 (2,345 reseñas)
- Por qué es especial
- Plato estrella
- Rango de precio
- [CTA: Ver en Casi Cinco]

## 2. [Nombre Restaurante] ⭐ 4.8 (1,890 reseñas)
...

## Mapa Interactivo
[Embed del mapa de Casi Cinco con estos 10 lugares]

## Preguntas Frecuentes
- ¿Cuál es el mejor restaurante de Madrid?
- ¿Dónde comer bien y barato en Madrid?

## Conclusión + CTA
"Descubre más restaurantes con 4.7+ estrellas en nuestro mapa interactivo"
```

#### Guías a crear (prioritarias):
1. **Madrid:** Restaurantes | Hoteles | Bares
2. **Barcelona:** Restaurantes | Hoteles | Bares
3. **Málaga:** Restaurantes | Hoteles
4. **Valencia:** Restaurantes | Hoteles
5. **Sevilla:** Restaurantes | Hoteles
6. **Bilbao:** Restaurantes
7. **San Sebastián:** Restaurantes

**Total:** 15 guías

#### Keywords objetivo (long-tail):
- "mejores restaurantes madrid 2025"
- "restaurantes 5 estrellas barcelona"
- "hoteles baratos málaga centro"
- "dónde comer bien sevilla"

#### Implementación técnica:
```typescript
// Crear: app/(public)/guias/[slug]/page.tsx
export async function generateMetadata({ params }) {
  return {
    title: `Los 10 Mejores ${category} en ${city} [2025] | Casi Cinco`,
    description: `Guía actualizada de los mejores ${category} en ${city}. Solo establecimientos con 4.7+ estrellas y cientos de reseñas verificadas.`
  };
}
```

**¿Por qué P1?** Es el contenido que Google rankea más rápido (informational queries). Genera tráfico en 15-30 días.

---

### **4. Badge "Selección 4.7" + Outreach** 🏆 **ALTA**
**Tiempo estimado:** 12-16 horas (2-3 días)  
**Impacto:** 🔗 **20-30 backlinks naturales**

#### Concepto:
Crear un **sello de calidad** que los establecimientos quieran poner en su web/Instagram.

#### A. Diseño del badge:
```
┌─────────────────────┐
│   ⭐ SELECCIÓN 4.7  │
│                     │
│   [NOMBRE LUGAR]    │
│                     │
│   Casi Cinco 2025   │
└─────────────────────┘
```

**Versiones:**
- Digital (PNG transparente, SVG)
- Física (sticker 10x10cm para puerta/ventana)
- Instagram Story template

#### B. Landing page: `/sello-seleccion-47`
```markdown
# Sello "Selección 4.7" - Casi Cinco

## ¿Qué es?
Un reconocimiento a establecimientos con:
- ⭐ Valoración 4.7+ en Google
- 💬 +500 reseñas verificadas
- 📍 Presencia destacada en Casi Cinco

## ¿Por qué es valioso?
- Solo el 8% de establecimientos lo consiguen
- Muestra tu excelencia a clientes potenciales
- Aumenta confianza en tu negocio

## Cómo conseguirlo
1. Mantén valoración 4.7+ en Google
2. Solicítalo aquí [Formulario]
3. Descarga y usa el sello

## Widget para tu web
<div class="casicinco-badge" data-place-id="XXX"></div>
<script src="https://casicinco.com/widget.js"></script>
```

#### C. Widget embebible:
```javascript
// public/widget.js
(function() {
  // Muestra badge + rating + link a ficha
  // Inyectable en cualquier web
})();
```

#### D. Outreach (100 locales):
**Email template:**
```
Asunto: 🌟 Enhorabuena - Sello "Selección 4.7"

Hola [Nombre],

Nos encanta ver que [Restaurante X] mantiene una valoración
excepcional de [4.8★] en Google con [1,245 reseñas].

Por eso, queremos reconocer tu excelencia con nuestro
Sello "Selección 4.7" (solo para el 8% de mejores locales).

✨ Qué obtienes:
- Badge digital para tu web
- Sticker físico para tu puerta
- Aparición destacada en casicinco.com
- Mención en nuestras RRSS

🎁 Es 100% gratis y sin compromiso.

¿Te interesa? Responde "SÍ" y te enviamos el kit completo.

[Tu nombre]
Casi Cinco - Los mejores con 4.7+ estrellas
```

**Segmentación:**
- Top 100 restaurantes de cada ciudad principal
- Hoteles boutique <50 habitaciones
- Bares/cafeterías trendy

**Conversión esperada:** 20-30% → 20-30 badges en webs → 20-30 backlinks

**¿Por qué P1?** Link building natural + autoridad de marca. Backlinks valen oro para SEO.

---

### **5. Páginas Programáticas: Categoría + Ciudad** 🗺️ **ALTA**
**Tiempo estimado:** 16-20 horas (3-4 días)  
**Impacto:** 📄 **+500 páginas ranqueables**

#### Concepto:
Crear páginas dinámicas para cada combinación **[categoría] + [ciudad]**.

Ejemplos:
- `/restaurante/madrid` - Mejores restaurantes de Madrid
- `/hotel/barcelona` - Mejores hoteles de Barcelona
- `/bar/sevilla` - Mejores bares de Sevilla

#### A. Crear ruta dinámica:
```typescript
// app/(public)/[category]/[location]/page.tsx

export async function generateStaticParams() {
  // Generar todas las combinaciones
  const categories = ['restaurante', 'hotel', 'bar'];
  const locations = ['madrid', 'barcelona', 'valencia', 'sevilla', 'malaga', ...];
  
  const combinations = [];
  for (const category of categories) {
    for (const location of locations) {
      // Solo si existen lugares en esa combinación
      const count = await getPlacesCount(category, location);
      if (count >= 5) {
        combinations.push({ category, location });
      }
    }
  }
  
  return combinations; // ~150-200 combinaciones
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, location } = params;
  const places = await getPlacesByLocation(category, location);
  
  return {
    title: `Los ${places.length} Mejores ${categoryName[category]} en ${capitalize(location)} [2025] | Casi Cinco`,
    description: `Descubre los mejores ${category} de ${location} con 4.7+ estrellas. ${places.length} establecimientos verificados con miles de reseñas.`,
  };
}

export default async function CategoryLocationPage({ params }: Props) {
  const places = await getPlacesByLocation(params.category, params.location);
  
  return (
    <div>
      <h1>Los Mejores {categoryName} en {capitalize(location)}</h1>
      
      {/* Intro editorial única por ciudad */}
      <IntroContent category={category} location={location} />
      
      {/* Grid de lugares */}
      <PlacesGrid places={places} />
      
      {/* Mapa interactivo */}
      <MapView places={places} />
      
      {/* FAQ dinámica */}
      <FAQ category={category} location={location} />
    </div>
  );
}
```

#### B. Contenido editorial único:
```typescript
// lib/content/city-intros.ts
export const cityIntros = {
  madrid: {
    restaurante: "Madrid es una de las capitales gastronómicas de Europa, con una escena culinaria que va desde tabernas centenarias hasta restaurantes con estrellas Michelin...",
    hotel: "La capital española ofrece una amplia variedad de alojamientos, desde hoteles boutique en Malasaña hasta grandes cadenas en el centro histórico...",
  },
  barcelona: { ... },
  // etc.
};
```

#### C. Schema.org ItemList:
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Mejores Restaurantes de Madrid",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Restaurant",
        "name": "Restaurante X",
        "url": "https://casicinco.com/restaurante/madrid/slug"
      }
    }
  ]
}
```

#### Keywords objetivo:
- "restaurantes madrid" (22,000 búsquedas/mes)
- "hoteles barcelona" (14,000 búsquedas/mes)
- "bares sevilla" (2,400 búsquedas/mes)

**¿Por qué P1?** Captura tráfico de búsquedas genéricas (alto volumen). Complementa las fichas individuales.

---

## 🟡 PRIORIDAD MEDIA (P2) - Semana 3-4

### **6. Banner "Quedan X días de trial"** ⏰ **MEDIA-ALTA**
**Tiempo estimado:** 4-6 horas  
**Impacto:** 🎯 **Mejora conversión trial → pago**

#### Implementación:
```typescript
// components/TrialBanner.tsx
'use client';

export function TrialBanner() {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    // Obtener días restantes desde Supabase
    const trialEndsAt = user.user_metadata?.trial_ends_at;
    if (!trialEndsAt) return;
    
    const days = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
    setDaysLeft(days);
  }, [user]);
  
  // No mostrar si:
  // - Tiene suscripción activa
  // - Trial ya expiró (mostrar paywall modal en su lugar)
  // - Quedan más de 7 días (solo mostrar últimos 7 días)
  if (!daysLeft || daysLeft > 7 || daysLeft < 0) return null;
  
  const color = daysLeft <= 2 ? 'bg-red-500' : daysLeft <= 5 ? 'bg-orange-500' : 'bg-yellow-500';
  
  return (
    <div className={`${color} text-white px-4 py-2 text-center`}>
      <span className="font-semibold">⏰ Quedan {daysLeft} días de trial.</span>
      {' '}
      <a href="/pricing" className="underline font-bold">
        Suscríbete ahora
      </a>
    </div>
  );
}
```

**¿Por qué P2?** Importante para conversión, pero no bloqueante. Primero necesitas usuarios en trial.

---

### **7. Paywall al Expirar Trial** 🔒 **MEDIA**
**Tiempo estimado:** 6-8 horas  
**Impacto:** 💰 **Fuerza decisión de pago**

#### Implementación:
```typescript
// components/PaywallModal.tsx
'use client';

export function PaywallModal() {
  const { user, checkTrialExpired } = useAuth();
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    const isExpired = checkTrialExpired();
    if (isExpired) {
      setShow(true);
      // Bloquear navegación
      document.body.style.overflow = 'hidden';
    }
  }, [user]);
  
  return (
    <Modal show={show} dismissible={false}>
      <h2>Tu trial de 30 días ha terminado 😔</h2>
      <p>Suscríbete para seguir disfrutando de:</p>
      <ul>
        <li>✅ Mapa interactivo con 2,600+ lugares</li>
        <li>✅ Chatbot IA ilimitado</li>
        <li>✅ Planificador de rutas</li>
      </ul>
      
      <div className="plans">
        <Plan name="Mensual" price="2.99€/mes" />
        <Plan name="Anual" price="24.99€/año" featured />
      </div>
      
      <Button onClick={handleSubscribe}>
        Suscribirme Ahora
      </Button>
    </Modal>
  );
}
```

**¿Por qué P2?** Sin usuarios en trial expirando (aún), no es urgente.

---

### **8. PWA Completa (Instalable)** 📱 **MEDIA**
**Tiempo estimado:** 4-6 horas  
**Impacto:** 🌟 **App "nativa" en móvil**

#### Archivos a crear:

**1. `public/manifest.json`:**
```json
{
  "name": "Casi Cinco - Los Mejores Lugares",
  "short_name": "Casi5",
  "description": "Descubre restaurantes, hoteles y bares con 4.7+ estrellas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**2. Service Worker básico:**
```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('casicinco-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/mapa',
        '/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first para assets estáticos
  // Network-first para API calls
});
```

**3. Actualizar `app/layout.tsx`:**
```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Casi Cinco'
  }
};
```

**¿Por qué P2?** Nice to have, pero no crítico para SEO ni conversión inicial.

---

## 🔵 PRIORIDAD BAJA (P3) - Mes 2

### **9. Modo Oscuro** 🌙
**Tiempo:** 6-8 horas  
**Impacto:** UX mejorada para algunos usuarios

### **10. Animaciones y Micro-interacciones** ✨
**Tiempo:** 6-8 horas  
**Impacto:** UX más pulida

### **11. Mejoras del Chatbot (Memoria entre sesiones)** 🤖
**Tiempo:** 8-10 horas  
**Impacto:** Chatbot más inteligente

### **12. Sistema de Caché Global** 💾
**Tiempo:** 4-6 horas  
**Impacto:** Performance 2-3x más rápida

---

## 📊 RESUMEN EJECUTIVO: ORDEN DE EJECUCIÓN

### **HOY (2-3 horas):**
1. ✅ Deploy a producción
2. ✅ Testing crítico
3. ✅ Enviar sitemap a GSC

### **Semana 1 (40 horas):**
4. 📝 15 Guías editoriales (12h)
5. 🏆 Badge + Outreach 100 locales (16h)
6. 🗺️ Páginas programáticas piloto (12h)

### **Semana 2 (20 horas):**
7. ⏰ Banner días restantes (6h)
8. 🔒 Paywall al expirar (8h)
9. 📱 PWA completa (6h)

### **Semana 3-4 (optativo):**
10. Modo oscuro, animaciones, mejoras UX

---

## 🎯 IMPACTO ESPERADO (90 días)

| Métrica | Actual | Mes 1 | Mes 2 | Mes 3 |
|---------|--------|-------|-------|-------|
| Páginas indexadas | 0 | 500+ | 1,000+ | 2,000+ |
| Tráfico orgánico | 0 | 500 | 2,000 | 5,000+ |
| Backlinks | 0 | 25 | 75 | 150+ |
| Usuarios trial | 0 | 50 | 200 | 500+ |
| Suscriptores | 0 | 5 | 30 | 100-200 |
| MRR | 0€ | 15€ | 90€ | 300-600€ |

---

## 💡 QUICK WINS (Bajo esfuerzo, alto impacto)

1. **Añadir precios a sitemap-places.xml** (30 min) → Ayuda a Google entender valor
2. **Crear página `/metodologia-seleccion`** (2h) → E-E-A-T para SEO
3. **Botón "Compartir lugar" en WhatsApp** (1h) → Viralidad orgánica
4. **Breadcrumbs visuales en fichas** (2h) → UX + SEO
5. **Optimizar imágenes con Next/Image** (4h) → Core Web Vitals

---

**¿Qué quieres atacar primero?** Te recomiendo este orden:
1. Deploy + Testing (HOY)
2. GSC sitemap (HOY)
3. 15 Guías editoriales (esta semana)
4. Badge + Outreach (semana próxima)

