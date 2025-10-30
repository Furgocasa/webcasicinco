# 🚨 ACCIONES INMEDIATAS CRÍTICAS - Casi Cinco

**Fecha:** 18 de Octubre de 2025  
**Urgencia:** MÁXIMA  
**Bloquean:** Tráfico orgánico + Conversión de usuarios

---

## ⚠️ SITUACIÓN ACTUAL

### Problemas Críticos Detectados:

1. 🔴 **2,612 fichas invisibles para Google** (client-side rendering)
2. 🔴 **0% de tráfico orgánico en fichas** (el 80% del contenido)
3. 🔴 **Trial requiere tarjeta** → conversión <1%
4. 🟠 **Sin rich snippets** en Google (sin Schema.org)
5. 🟠 **Sitemap no enviado** a Google Search Console

### Consecuencia:
- **SEO bloqueado completamente** en páginas principales
- **Conversión de usuarios brutal** por fricción en trial
- **Perdiendo competición** vs Tripadvisor/Michelin por visibilidad

---

## 🎯 PLAN DE ACCIÓN - PRÓXIMOS 7 DÍAS

### **DÍA 1-2: SSR/SSG en Fichas** 🔴 **ULTRA CRÍTICO**

**Problema:** Google ve "Cargando..." en fichas de lugares

**Archivo a modificar:**
```
app/(public)/[category]/[province]/[slug]/page.tsx
```

**Cambios necesarios:**

#### ❌ CÓDIGO ACTUAL (MALO):
```typescript
'use client';

export default function PlaceDetailPage() {
  const [place, setPlace] = useState(null);
  
  useEffect(() => {
    const fetchPlace = async () => {
      const response = await fetch(`/api/places/by-slug/${slug}`);
      const data = await response.json();
      setPlace(data.place);
    };
    fetchPlace();
  }, [slug]);
  
  if (!place) return <div>Cargando...</div>; // ← Google ve esto
}
```

#### ✅ CÓDIGO CORRECTO (BUENO):
```typescript
// SIN 'use client'
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: { category: string; province: string; slug: string }
}

// 1. Generar metadata dinámica
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  
  const { data: place } = await supabase
    .from('places')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();
  
  if (!place) {
    return {
      title: 'Lugar no encontrado | Casi Cinco',
    };
  }
  
  return {
    title: `${place.name} - ${place.rating}★ en ${place.city}, ${place.province} | Casi Cinco`,
    description: `${place.name}: ${place.rating}★ con ${place.user_ratings_total} reseñas. ${place.ai_description?.substring(0, 150)}...`,
    openGraph: {
      title: place.name,
      description: place.ai_description,
      images: place.photos?.slice(0, 1) || [],
      type: 'website',
    },
  };
}

// 2. Pre-generar rutas estáticas (opcional pero recomendado)
export async function generateStaticParams() {
  const supabase = await createClient();
  
  const { data: places } = await supabase
    .from('places')
    .select('category, province, slug')
    .eq('published', true)
    .limit(100); // Empezar con top 100, luego expandir
  
  return (places || []).map((place) => ({
    category: place.category,
    province: place.province,
    slug: place.slug,
  }));
}

// 3. Componente principal (Server Component)
export default async function PlaceDetailPage({ params }: Props) {
  const supabase = await createClient();
  
  const { data: place, error } = await supabase
    .from('places')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();
  
  if (error || !place) {
    notFound(); // Usar not-found.tsx de Next.js
  }
  
  // TODO: Las partes interactivas (favoritos, compartir, mapa) 
  // deben ir en Client Components separados
  return (
    <div>
      <h1>{place.name}</h1>
      <p>{place.rating}★ ({place.user_ratings_total} reseñas)</p>
      {/* ... resto del contenido ... */}
    </div>
  );
}
```

**Partes interactivas → Client Components:**
```typescript
// components/places/PlaceFavoriteButton.tsx
'use client';

export function PlaceFavoriteButton({ placeId }: { placeId: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  // ... lógica de favoritos
}

// components/places/PlaceShareButton.tsx
'use client';

export function PlaceShareButton({ place }: { place: Place }) {
  // ... lógica de compartir
}

// components/places/PlaceMap.tsx
'use client';

export function PlaceMap({ lat, lng }: { lat: number; lng: number }) {
  // ... mapa de Google
}
```

**Verificación:**
1. `npm run build` → Ver que genera rutas estáticas
2. `curl https://casicinco.com/restaurante/madrid/[slug]` → Ver HTML completo
3. Google Search Console → Ver que indexa correctamente

---

### **DÍA 2: Schema.org** 🔴 **CRÍTICO**

**Añadir a la página de fichas:**

```typescript
export default async function PlaceDetailPage({ params }: Props) {
  const place = await fetchPlace(params.slug);
  
  // Determinar tipo según categoría
  const schemaType = {
    restaurante: 'Restaurant',
    hotel: 'Hotel',
    bar: 'BarOrPub',
    cafe: 'CafeOrCoffeeShop',
  }[place.category] || 'LocalBusiness';
  
  // Schema.org JSON-LD
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
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
    }
  };
  
  return (
    <>
      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      
      {/* Contenido de la página */}
      <div>
        <h1>{place.name}</h1>
        {/* ... */}
      </div>
    </>
  );
}
```

**Verificar:**
- Google Rich Results Test: https://search.google.com/test/rich-results
- Debe mostrar: Rating stars, review count, precio, ubicación

---

### **DÍA 3-4: Trial SIN Tarjeta** 🔴 **CRÍTICO CONVERSIÓN**

#### **A. Crear WelcomeModal.tsx**

```typescript
// components/auth/WelcomeModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Clock, Zap, Crown } from 'lucide-react';

export function WelcomeModal() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Mostrar solo al primer login
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShow(true);
    }
  }, []);

  const handleFreeTrial = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    localStorage.setItem('selectedPlan', 'trial');
    setShow(false);
    router.push('/mapa');
  };

  const handleSubscribe = async (planId: 'premium_monthly' | 'premium_yearly') => {
    localStorage.setItem('hasSeenWelcome', 'true');
    
    // Llamar a Stripe checkout SIN trial
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        planId, 
        trialDays: 0 // ← IMPORTANTE: Sin trial en Stripe
      }),
    });
    
    const { url } = await response.json();
    window.location.href = url;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-white">
        <h2 className="text-3xl font-bold text-center mb-2">
          ¡Bienvenido a Casi Cinco!
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Elige cómo quieres empezar:
        </p>

        <div className="space-y-4">
          {/* OPCIÓN 1: Trial Gratis - DESTACADA */}
          <button
            onClick={handleFreeTrial}
            className="w-full p-6 border-2 border-indigo-500 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition text-left"
          >
            <div className="flex items-start gap-4">
              <Clock className="h-8 w-8 text-indigo-600 shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  🎁 Prueba Gratis 30 Días
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Sin tarjeta · Sin compromiso · Acceso completo
                </p>
                <div className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                  Empezar Ahora →
                </div>
              </div>
            </div>
          </button>

          {/* OPCIÓN 2: Premium Mensual */}
          <button
            onClick={() => handleSubscribe('premium_monthly')}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition text-left"
          >
            <div className="flex items-start gap-4">
              <Zap className="h-8 w-8 text-indigo-600 shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  ⚡ Premium Mensual
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  2.99€/mes · Cancela cuando quieras
                </p>
                <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg font-medium text-sm">
                  Suscribirse
                </div>
              </div>
            </div>
          </button>

          {/* OPCIÓN 3: Premium Anual */}
          <button
            onClick={() => handleSubscribe('premium_yearly')}
            className="w-full p-6 border-2 border-purple-300 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-left"
          >
            <div className="flex items-start gap-4">
              <Crown className="h-8 w-8 text-purple-600 shrink-0" />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    👑 Premium Anual
                  </h3>
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Ahorra 30%
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  24.99€/año · Solo 2.08€/mes
                </p>
                <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                  Mejor Valor
                </div>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Puedes cambiar de plan en cualquier momento desde tu perfil
        </p>
      </Card>
    </div>
  );
}
```

#### **B. Incluir WelcomeModal en el layout**

```typescript
// app/(public)/layout.tsx o después del login
import { WelcomeModal } from '@/components/auth/WelcomeModal';

export default function PublicLayout({ children }) {
  return (
    <>
      {children}
      <WelcomeModal />
    </>
  );
}
```

#### **C. Actualizar pricing/page.tsx**

```typescript
// Línea 49 - ELIMINAR el trial de Stripe
body: JSON.stringify({
  planId,
  trialDays: 0, // ← Cambiar de 30 a 0
}),
```

#### **D. Verificar que el trigger SQL ya existe**

```sql
-- Este trigger ya debería estar en Supabase
-- Si no existe, ejecutarlo:

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

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**Flujo esperado:**
1. Usuario se registra → `trial_ends_at` = NOW() + 30 días (automático)
2. Modal aparece → Elige trial gratis
3. Navega a `/mapa` → Banner muestra "🎁 Quedan 28 días"
4. Día 28 → Banner naranja "⚠️ Quedan 2 días"
5. Día 31 → Paywall modal "Trial terminado. Suscríbete para continuar"

---

### **DÍA 5: Sitemap + Google Search Console** 🟠 **ALTA**

#### **Verificar robots.txt:**

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://casicinco.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/perfil', '/login', '/registro'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

#### **Enviar a Google Search Console:**

1. Ir a: https://search.google.com/search-console
2. Añadir propiedad: `https://casicinco.com`
3. Verificar propiedad (archivo HTML o DNS)
4. Sitemaps → Añadir: `https://casicinco.com/sitemap.xml`
5. Esperar 24-48h para ver indexación

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Día 1-2: SSR/SSG
- [ ] Código migrado a Server Component
- [ ] `generateMetadata` implementado
- [ ] `generateStaticParams` implementado (al menos top 100)
- [ ] Build exitoso: `npm run build`
- [ ] HTML visible en: `curl https://casicinco.com/restaurante/madrid/[slug]`
- [ ] Google ve contenido completo (no "Cargando...")

### Día 2: Schema.org
- [ ] JSON-LD añadido a fichas
- [ ] Verificado en: https://search.google.com/test/rich-results
- [ ] Muestra: Rating stars, review count, ubicación

### Día 3-4: Trial sin tarjeta
- [ ] `WelcomeModal.tsx` creado
- [ ] Modal se muestra al primer login
- [ ] Opción trial sin tarjeta funciona
- [ ] `pricing/page.tsx` usa `trialDays: 0`
- [ ] Trigger SQL verificado en Supabase
- [ ] Banner muestra días restantes
- [ ] Paywall funciona al día 31

### Día 5: Sitemap + GSC
- [ ] Sitemap verificado en `/sitemap.xml`
- [ ] robots.txt apunta al sitemap
- [ ] Propiedad añadida en GSC
- [ ] Sitemap enviado a GSC
- [ ] Verificación de propiedad completada

---

## 📊 MÉTRICAS A MONITOREAR

### Inmediatas (Semana 1):
- **Build time:** Debe seguir siendo <5 min
- **Páginas generadas estáticamente:** Al menos 100
- **Conversión registro → trial:** Debe subir de <1% a >5%

### Corto plazo (Semanas 2-4):
- **Páginas indexadas (GSC):** >500 en semana 2
- **Impresiones (GSC):** Baseline establecido
- **Trial starts:** >20/semana
- **Conversión trial → pago:** >20% (objetivo optimista)

### Medio plazo (Meses 2-3):
- **Tráfico orgánico:** >1,000 visitas/mes
- **Keywords Top 10:** >50
- **Suscriptores totales:** 200-350
- **CAC:** <10€

---

## 🚨 ALERTAS Y PROBLEMAS COMUNES

### Problema 1: Build tarda mucho
**Causa:** `generateStaticParams` genera demasiadas rutas
**Solución:** Limitar a top 100-500 lugares inicialmente

### Problema 2: Modal no aparece
**Causa:** localStorage ya tiene flag
**Solución:** `localStorage.clear()` para testing

### Problema 3: Trial sigue pidiendo tarjeta
**Causa:** `trialDays: 30` sigue en código
**Solución:** Buscar todos los lugares donde se usa y cambiar a `0`

### Problema 4: Google no indexa
**Causa:** Todavía usa client-side rendering
**Solución:** Verificar que NO hay `'use client'` en página principal

---

## 📞 SIGUIENTE PASO DESPUÉS DE ESTOS 5 DÍAS

Una vez completados estos bloqueadores críticos:

### Semana 2: Contenido y autoridad
1. 15 guías editoriales
2. Badge "Selección 4.7"
3. Outreach a 100 locales

### Semana 3: Páginas programáticas
1. `/[category]/[location]`
2. Listas por ocasión
3. 30 páginas piloto

---

**IMPORTANTE:** Estos 5 días son **NO NEGOCIABLES**. Sin esto, el proyecto está bloqueado en tráfico orgánico y conversión de usuarios.

**Fecha objetivo de completación:** 23 de Octubre de 2025

---

**Documentos relacionados:**
- `PLAN_ESTRATEGICO_2025_SEO_VIABILIDAD.md` - Estrategia completa
- `ROADMAP_MEJORAS.md` - Roadmap actualizado con prioridades
- `SISTEMA_MONETIZACION.md` - Detalles de sistema de pagos actual

