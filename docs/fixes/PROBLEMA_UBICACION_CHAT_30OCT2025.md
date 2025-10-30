# 🚨 PROBLEMA CRÍTICO: Chat no encuentra lugares por ubicación

**Fecha:** 30 octubre 2025  
**Usuario:** Preguntó "restaurantes cerca de Níjar, Almería"  
**Resultado:** La IA dice "no tengo información"

---

## 🔍 DIAGNÓSTICO

### ❌ **PROBLEMA #1: Probablemente NO hay lugares en Almería en la BD**

El chatbot funciona en 2 fases:

#### **FASE 1: Búsqueda en Supabase** (Base de datos)
```typescript
// app/api/chatbot/route.ts línea 204-240
async function searchPlacesTool(supabase, params) {
  let query = supabase
    .from('places')
    .select('...')
    .eq('published', true);
    
  if (params.city) query = query.ilike('city', params.city);        // 🔍 Busca "Níjar"
  if (params.province) query = query.eq('province', params.province); // 🔍 Busca "Almería"
  
  const { data, error } = await query.order('rating', { ascending: false }).limit(limit);
  return data || [];
}
```

**SI NO HAY LUGARES EN SUPABASE → `candidates = []`**

#### **FASE 2: OpenAI genera respuesta**
```typescript
// lib/ai/openai.ts línea 393-401
const userContext = `
📊 DATOS CONTEXTUALES:
- Lugares totales: 3169
- Categorías: restaurante(2847), bar(254), hotel(68)
📍 UBICACIÓN DEL USUARIO: Níjar, Almería, Andalucía

${placesContext}  // ⚠️ Si candidates = [] → placesContext = ""

---
PREGUNTA DEL USUARIO: restaurantes cerca de Níjar, Almería
`;
```

**SI `placesContext` ESTÁ VACÍO → OpenAI dice "no tengo información"**

---

## ✅ **CÓMO FUNCIONA LA GEOLOCALIZACIÓN**

### 1️⃣ Frontend captura GPS
```typescript
// components/ChatbotFloating.tsx línea 45-65
navigator.geolocation.getCurrentPosition(
  (position) => {
    setUserLocation({
      lat: position.coords.latitude,  // Ej: 36.9742
      lng: position.coords.longitude  // Ej: -2.0303
    });
  }
);
```

### 2️⃣ Backend geocodifica a ciudad/provincia
```typescript
// app/api/chatbot/route.ts línea 427-446
if (location && location.lat && location.lng) {
  const geoResult = await getCityAndProvinceFromCoords(location.lat, location.lng);
  // geoResult = { city: 'Níjar', province: 'Almería', region: 'Andalucía' }
  
  detectedLocation = geoResult;
  context.userLocation = geoResult; // Para que OpenAI lo vea
}
```

### 3️⃣ parseIntent detecta proximidad
```typescript
// app/api/chatbot/route.ts línea 174-199
const proximityKeywords = ['cerca', 'aquí', 'cerca de mí', ...];
const hasProximityKeyword = proximityKeywords.some(k => msg.includes(k));

if (hasProximityKeyword && !city && !province && detectedLocation) {
  usesLocation = true;
  return {
    city: detectedLocation.city,     // 'Níjar'
    province: detectedLocation.province, // 'Almería'
    ...
  };
}
```

### 4️⃣ searchPlacesTool busca en Supabase
```typescript
// Busca lugares WHERE city = 'Níjar' AND province = 'Almería' AND published = true
const candidates = await searchPlacesTool(supabase, {
  category: 'restaurante',
  city: 'Níjar',
  province: 'Almería',
  limit: 100
});

// SI NO HAY → candidates = []
```

### 5️⃣ Si no hay, intenta provincias cercanas
```typescript
// app/api/chatbot/route.ts línea 502-513
const NEARBY_BY_PROVINCE = {
  'almería': ['Granada', 'Murcia', 'Málaga']
};

if (candidates.length === 0 && intent.province) {
  const near = NEARBY_BY_PROVINCE[intent.province.toLowerCase()];
  candidates = await searchPlacesTool(supabase, {
    category: 'restaurante',
    provinces: near, // ['Granada', 'Murcia', 'Málaga']
    limit: 100
  });
}
```

### 6️⃣ OpenAI recibe contexto y genera respuesta
```typescript
// lib/ai/openai.ts línea 410-425
const messages = [
  { 
    role: 'system', 
    content: systemPrompt // Con instrucciones de ser honesto con ubicaciones
  },
  { 
    role: 'user', 
    content: userContext // Con ubicación y lista de lugares
  }
];

const response = await openai.chat.completions.create({ messages });
```

---

## 🎯 **SOLUCIÓN**

### Opción 1: Indexar lugares de Almería
Ve a `/admin/indexar` y añade:
- Restaurantes de Níjar, Almería
- Restaurantes de Almería capital
- Restaurantes de Roquetas de Mar, Almería

### Opción 2: Mejorar búsqueda por distancia real
Actualmente buscamos por `city` y `province` (texto).  
**MEJORA:** Usar distancia geográfica real con PostGIS:

```sql
-- Buscar lugares dentro de 50km de lat/lng
SELECT * FROM places
WHERE published = true
  AND ST_DWithin(
    geography(ST_Point(longitude, latitude)),
    geography(ST_Point(-2.0303, 36.9742)),  -- Coordenadas de Níjar
    50000  -- 50km en metros
  )
ORDER BY 
  ST_Distance(
    geography(ST_Point(longitude, latitude)),
    geography(ST_Point(-2.0303, 36.9742))
  )
LIMIT 10;
```

### Opción 3: Respuesta más clara cuando no hay lugares
Ya está implementado en el prompt:
```
Si NO hay lugares en la ubicación pedida, di CLARAMENTE:
"Actualmente no tengo restaurantes indexados en Almería. 
¿Te gustaría ver opciones en provincias cercanas como Granada, Málaga o Murcia?"
```

---

## 📊 **VERIFICAR BD**

Ejecuta en Supabase:
```bash
supabase/diagnostics/verificar_lugares_almeria.sql
```

Esto te dirá:
1. ¿Cuántos lugares hay en Almería?
2. ¿Qué ciudades de Almería están indexadas?
3. ¿Hay algo en Níjar?
4. ¿Qué hay en provincias cercanas?

---

## 🔧 **PARA QUE FUNCIONE HOY**

1. **Verifica la BD** (ejecuta el SQL de diagnóstico)
2. **Si no hay lugares en Almería:**
   - Ve a `/admin/indexar`
   - Busca "Restaurantes Níjar Almería"
   - Indexa 5-10 lugares
   - Enriquécelos con IA en `/admin/enriquecer`
3. **Prueba de nuevo:**
   - Abre el chat
   - Permite ubicación GPS
   - Pregunta: "restaurantes cerca de mí"
   - Debería encontrar los lugares recién indexados

---

## 🚀 **MEJORA FUTURA: Búsqueda por distancia real**

**Problema actual:** Busca por nombre de ciudad (texto)  
**Solución:** Buscar por coordenadas GPS y radio (50km)

Requiere:
1. Añadir columnas `latitude`, `longitude` a tabla `places`
2. Crear índice espacial: `CREATE INDEX idx_places_location ON places USING GIST (geography(ST_Point(longitude, latitude)));`
3. Modificar `searchPlacesTool` para aceptar `lat/lng` y usar `ST_DWithin`

**Prioridad:** Media-Alta (mejora significativa de UX)

