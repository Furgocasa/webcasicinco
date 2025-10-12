# 🚀 Roadmap de Mejoras - Casi Cinco

**Versión Actual:** 3.0.0 BETA 3.0  
**Fecha:** 12 de Octubre de 2025  
**Enfoque:** Mejoras basadas en código actual

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

## 💡 Mi Recomendación de Prioridades:

### **Semana 1: Estabilidad** 🛡️
1. Error Handling robusto (2-3h)
2. Testing básico E2E (4-6h)
3. Caché inteligente (3-4h)

### **Semana 2: Mobile UX** 📱
4. PWA completa (2-3h)
5. Animaciones básicas (4-6h)
6. Bottom nav funcional sin errores (6-8h)

### **Semana 3: Features** ✨
7. Favoritos mejorados (12-16h)
8. SEO optimizado (3-4h)

### **Semana 4: Performance** ⚡
9. Bundle optimization (4-6h)
10. Virtualización listas (4-6h)

---

## 📊 Quick Wins (Fáciles y Alto Impacto)

1. **PWA Manifest** (30 min) → App instalable
2. **Loading Skeletons** (2h) → UX mejorada
3. **Error Boundaries** (2h) → No más pantallas blancas
4. **Cache localStorage** (3h) → Navegación instant
