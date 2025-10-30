# 🎯 MODELO DE NEGOCIO - FREEMIUM LIGHT (OPCIÓN B)

**Fecha:** 20 Octubre 2025  
**Estado:** A implementar

---

## 📋 RESUMEN EJECUTIVO

**Estrategia:** Freemium Light - Preview gratuito + Trial + Premium

```
🆓 Sin Login:
   - Ver primeros 10-20 lugares en mapa (geolocalizado)
   - Ver 1 ruta ejemplo predefinida
   - Blog público (SEO)
   - Páginas de categorías (limitadas)

✅ Con Login (FREE - 30 días trial):
   - Ver TODOS los lugares en mapa
   - Planificar rutas ilimitadas
   - Chatbot "Tío Viajero" ilimitado
   - Acceso completo a funcionalidades

💎 Premium (después de trial):
   - Todo lo anterior sin límites
   - Features exclusivas futuras
```

---

## 🎯 OBJETIVO

**Máxima conversión con preview atractivo:**
1. Usuario anónimo ve **suficiente valor** para registrarse
2. Usuario prueba **gratis 30 días** con todo desbloqueado
3. Usuario paga después del trial por la **experiencia completa**

---

## 🚀 IMPLEMENTACIÓN ACTUAL vs DESEADA

### ❌ **ACTUAL (Todo Bloqueado):**
```typescript
// middleware.ts línea 81
const protectedRoutes = ['/mapa', '/ruta', '/perfil'];
// ↑ Bloquea TODO sin login
```

**Problema:** Usuario anónimo NO ve valor → No se registra

### ✅ **DESEADA (Preview Limitado):**

#### **A. Páginas Públicas (sin restricción):**
```
✅ /                 → Home público
✅ /blog             → Blog completo (SEO)
✅ /blog/[slug]      → Posts individuales
✅ /[category]       → Top 10 por categoría (público)
✅ /[category]/[province] → Top 10 por provincia (público)
```

#### **B. Funcionalidad Limitada (preview):**
```
🔓 /mapa             → Mostrar primeros 10-20 lugares
                       + Banner "Regístrate gratis para ver los 3,133 lugares"

🔓 /ruta             → Mostrar 1 ruta ejemplo (Madrid-Barcelona)
                       + Banner "Regístrate gratis para planificar tus propias rutas"

🔓 /[category]/[province]/[slug] → Lugar individual público (SEO)
```

#### **C. Premium Features (requiere login):**
```
🔒 /perfil           → Requiere login siempre
🔒 Chatbot           → Requiere login siempre
🔒 Mapa completo     → Requiere login (después de ver preview)
🔒 Rutas custom      → Requiere login (después de ver ejemplo)
```

---

## 💻 CAMBIOS NECESARIOS

### 1️⃣ **Modificar Middleware** (eliminar protección total)

**Archivo:** `middleware.ts`

```typescript
// CAMBIAR línea 81:
const protectedRoutes = ['/mapa', '/ruta', '/perfil'];

// POR:
const protectedRoutes = ['/perfil'];  // Solo perfil requiere login siempre
```

**Efecto:** `/mapa` y `/ruta` ya NO redirigen a login automáticamente.

---

### 2️⃣ **Limitar Mapa Sin Login**

**Archivo:** `app/(public)/mapa/page.tsx`

Añadir lógica de preview limitado:

```typescript
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
// ... otros imports

export default function MapPage() {
  const { user } = useAuth();
  
  // ... código existente ...

  // ✅ NUEVO: Limitar lugares si no hay login
  const displayPlaces = useMemo(() => {
    if (!user) {
      // Sin login: solo primeros 20 lugares más cercanos
      return sortedPlaces.slice(0, 20);
    }
    
    // Con login: mostrar todos (con límite de 50 en lista)
    return sortedPlaces.slice(0, DISPLAY_LIMIT);
  }, [sortedPlaces, user]);

  return (
    <>
      {/* Banner de Preview si no hay login */}
      {!user && (
        <div className="fixed top-20 left-0 right-0 z-[998] bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm md:text-base">
              🎉 <strong>Mostrando 20 de 3,133 lugares</strong> - Regístrate gratis para ver todos
            </p>
            <Link href="/registro">
              <Button className="bg-white text-indigo-600 hover:bg-gray-100">
                Regístrate Gratis
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Mapa normal con displayPlaces limitados */}
      <GoogleMap>
        {displayPlaces.map(place => (
          <Marker key={place.id} {...place} />
        ))}
      </GoogleMap>
    </>
  );
}
```

**Cálculo de lugares cercanos:**
```typescript
// Ordenar por proximidad al usuario primero
const sortedPlaces = useMemo(() => {
  if (!userLocation) return allPlaces;
  
  return allPlaces.sort((a, b) => {
    const distA = calculateDistance(userLocation, { lat: a.latitude, lng: a.longitude });
    const distB = calculateDistance(userLocation, { lat: b.latitude, lng: b.longitude });
    return distA - distB;
  });
}, [allPlaces, userLocation]);
```

---

### 3️⃣ **Limitar Rutas Sin Login**

**Archivo:** `app/(public)/ruta/page.tsx`

Mostrar solo ruta ejemplo:

```typescript
export default function RutaPage() {
  const { user } = useAuth();
  const [isExampleRoute, setIsExampleRoute] = useState(!user);

  useEffect(() => {
    if (!user) {
      // Cargar ruta ejemplo automáticamente
      setOrigin('Madrid, España');
      setDestination('Barcelona, España');
      calculateRoute();
    }
  }, [user]);

  return (
    <>
      {/* Banner de Preview */}
      {!user && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 mb-4">
          <p className="text-center">
            🎉 <strong>Ruta de ejemplo: Madrid → Barcelona</strong>
            <br />
            <Link href="/registro" className="underline">
              Regístrate gratis para planificar tus propias rutas
            </Link>
          </p>
        </div>
      )}

      {/* Deshabilitar inputs si no hay login */}
      <div className={!user ? 'opacity-50 pointer-events-none' : ''}>
        <Autocomplete
          onPlaceSelected={handleOriginSelected}
          disabled={!user}
        />
      </div>

      {/* Mostrar ruta ejemplo */}
      <GoogleMap>
        {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
      </GoogleMap>
    </>
  );
}
```

---

### 4️⃣ **Lugares Individuales Públicos (SEO)**

**Archivos:** `app/(public)/[category]/[province]/[slug]/page.tsx`

**Mantener públicos** para SEO (ya están públicos ✅)

Añadir CTA al final:

```typescript
export default function PlacePage({ params }) {
  const { user } = useAuth();
  
  return (
    <>
      {/* Contenido del lugar (público) */}
      <PlaceContent place={place} />

      {/* CTA si no hay login */}
      {!user && (
        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white text-center">
          <h3 className="text-2xl font-bold mb-2">
            ¿Te gusta {place.name}?
          </h3>
          <p className="mb-4">
            Descubre 3,133 lugares excepcionales más en toda España
          </p>
          <Link href="/registro">
            <Button className="bg-white text-indigo-600 hover:bg-gray-100">
              Regístrate Gratis - 30 días de prueba
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
```

---

## 🎨 BANNERS Y CTAs

### **Banner Principal (sin login):**
```tsx
<div className="fixed top-16 left-0 right-0 z-[998] bg-gradient-to-r from-indigo-600 to-purple-600">
  <div className="container mx-auto px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-2xl">🎉</span>
      <div>
        <p className="font-bold text-white">Preview Gratis</p>
        <p className="text-xs text-indigo-100">
          Regístrate para ver los 3,133 lugares
        </p>
      </div>
    </div>
    <Link href="/registro">
      <Button className="bg-white text-indigo-600 font-semibold">
        Prueba Gratis 30 Días
      </Button>
    </Link>
  </div>
</div>
```

### **Overlay en Mapa (después de 20 lugares):**
```tsx
{!user && (
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none" />
)}
```

---

## 📊 FLUJO DE CONVERSIÓN

### **1. Usuario Anónimo:**
```
1. Entra a casicinco.com
2. Ve home con propuesta de valor
3. Click "Ver Mapa" → Ve 20 lugares cercanos + banner
4. Intrigado por la calidad → Click "Regístrate Gratis"
5. Registro rápido (email o Google)
```

### **2. Usuario Registrado (Trial):**
```
1. Acceso completo inmediato
2. Ve los 3,133 lugares
3. Usa chatbot ilimitadamente
4. Planifica rutas personalizadas
5. Después de 30 días → Paywall suave
```

### **3. Usuario Premium:**
```
1. Paga ($9.99/mes o $99/año)
2. Acceso ilimitado permanente
3. Features exclusivas futuras:
   - Favoritos sincronizados
   - Listas personalizadas
   - Recomendaciones IA avanzadas
   - Rutas multi-destino
```

---

## 💰 PROYECCIÓN DE CONVERSIÓN

### **Embudo Actual (Todo Bloqueado):**
```
100 visitantes → 5 registros → 1 pago
Tasa conversión: 1%
```

### **Embudo Nuevo (Preview + Trial):**
```
100 visitantes → 20 registros → 5 pagos
Tasa conversión: 5% (5x mejor)
```

**Razón:** Preview genera **confianza** y **deseo** antes de pedir registro.

---

## 🚨 RIESGOS Y MITIGACIONES

### **Riesgo 1: Usuarios se quedan con preview**
**Mitigación:**
- Preview debe ser **insuficiente** pero **atractivo**
- 20 lugares vs 3,133 es **claro valor añadido**
- Banner constante recordando el upgrade

### **Riesgo 2: SEO duplicado**
**Mitigación:**
- Lugares individuales son únicos (ya OK ✅)
- Preview del mapa no indexable (cliente-side)
- Blog sigue siendo SEO (público)

### **Riesgo 3: Abuse de cuentas gratis**
**Mitigación:**
- Trial de 30 días (no renovable)
- Email verificado obligatorio
- IP tracking para prevenir múltiples cuentas

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Backend (1 hora)**
- [x] Fix error 406 subscriptions (✅ Hecho)
- [ ] Modificar middleware (quitar /mapa y /ruta de protectedRoutes)
- [ ] Verificar que lugares individuales son públicos

### **Fase 2: Frontend Mapa (2 horas)**
- [ ] Limitar a 20 lugares sin login
- [ ] Añadir banner de preview
- [ ] Añadir overlay de blur al hacer scroll
- [ ] Deshabilitar filtros avanzados sin login

### **Fase 3: Frontend Rutas (1 hora)**
- [ ] Mostrar ruta ejemplo automática
- [ ] Deshabilitar inputs sin login
- [ ] Añadir banner explicativo

### **Fase 4: CTAs y Banners (1 hora)**
- [ ] Banner top sticky en páginas preview
- [ ] CTAs en lugares individuales
- [ ] Modal de upgrade suave (no intrusivo)

### **Fase 5: Testing (1 hora)**
- [ ] Probar flujo completo sin login
- [ ] Verificar SEO de lugares individuales
- [ ] Confirmar que trial funciona
- [ ] Medir tiempo de conversión

---

## 📈 MÉTRICAS A TRACKEAR

### **Conversión:**
```
- Visitantes únicos
- % que ven preview mapa
- % que ven preview ruta
- % que se registran
- % que pagan después de trial
```

### **Engagement:**
```
- Tiempo en preview
- Clicks en lugares (preview)
- Scrolls en mapa
- Interacciones con banner
```

### **Calidad:**
```
- Tasa de cancelación trial
- Feedback usuarios
- Soporte tickets
```

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. ✅ **Confirmar con stakeholder** el modelo exacto
2. 🔧 **Implementar cambios** (5-6 horas trabajo)
3. 🧪 **Testing exhaustivo** en local
4. 🚀 **Deploy a producción**
5. 📊 **Monitorear métricas** primera semana

---

## 💡 MEJORAS FUTURAS

### **V2: Preview Dinámico**
```typescript
// Mostrar diferentes lugares cada vez
const previewPlaces = useMemo(() => {
  const seed = Math.floor(Date.now() / 86400000); // Cambia diario
  return shuffleWithSeed(allPlaces, seed).slice(0, 20);
}, [allPlaces]);
```

### **V3: Gamificación**
```
"Has visto 15 de 20 lugares del preview"
"Regístrate para desbloquear los otros 3,113"
```

### **V4: Social Proof**
```
"2,453 usuarios registrados esta semana"
"⭐ 4.8/5 en valoraciones"
```

---

*Documento creado: 20 Octubre 2025*
*Última actualización: 20 Octubre 2025*

