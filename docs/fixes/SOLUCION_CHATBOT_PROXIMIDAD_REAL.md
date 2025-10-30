# 🎯 SOLUCIÓN: Chatbot con búsqueda por proximidad REAL

**Fecha:** 30 octubre 2025  
**Problema:** El chatbot busca por nombre de ciudad (texto), no por distancia GPS real

---

## 📊 **CÓMO FUNCIONA HOY (Estado Actual)**

### Frontend → Backend:
```typescript
// 1. Frontend captura GPS
userLocation = { lat: 36.9742, lng: -2.0303 }

// 2. Backend convierte coordenadas → texto
getCityAndProvinceFromCoords(36.9742, -2.0303)
→ { city: 'Níjar', province: 'Almería', region: 'Andalucía' }

// 3. Busca por NOMBRE (búsqueda textual)
SELECT * FROM places WHERE city ILIKE 'Níjar' ❌
```

### Mapa (comparación):
```typescript
// ✅ El mapa SÍ usa distancia real con Haversine
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Ordena lugares:
places.sort((a, b) => {
  const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
  const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
  return distA - distB;
});
```

---

## ✅ **CÓMO DEBERÍA FUNCIONAR (Propuesta)**

### Opción A: Cálculo de distancia en Backend (JavaScript)

```typescript
// app/api/chatbot/route.ts

async function searchPlacesTool(supabase: any, params: SearchParams & { 
  userCoords?: { lat: number; lng: number };
  radiusKm?: number; 
}) {
  let query = supabase
    .from('places')
    .select('id, name, slug, category, rating, review_count, city, province, region, address, phone, website, ai_description, subcategory, price_level, latitude, longitude')
    .eq('published', true);

  // Filtros normales (categoría, precio, etc.)
  if (params.category) query = query.eq('category', params.category);
  if (params.priceLevel) { /* ... */ }
  
  // Obtener TODOS los lugares candidatos
  const { data: allPlaces } = await query;
  
  // Si hay coordenadas del usuario, filtrar por distancia
  if (params.userCoords && allPlaces) {
    const placesWithDistance = allPlaces
      .map(place => ({
        ...place,
        distance: calculateDistance(
          params.userCoords!.lat,
          params.userCoords!.lng,
          place.latitude,
          place.longitude
        )
      }))
      .filter(place => place.distance <= (params.radiusKm || 50)) // Radio de 50km por defecto
      .sort((a, b) => a.distance - b.distance); // Ordenar por proximidad
    
    return placesWithDistance.slice(0, params.limit || 15);
  }
  
  // Si no hay coords, búsqueda normal por provincia/ciudad
  if (params.province) query = query.eq('province', params.province);
  if (params.city) query = query.ilike('city', params.city);
  
  const { data } = await query.order('rating', { ascending: false }).limit(params.limit || 15);
  return data || [];
}

// Función de Haversine (igual que en el mapa)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

```typescript
// Modificar parseIntent para pasar coordenadas directamente:
if (hasProximityKeyword && !city && !province && detectedLocation) {
  usesLocation = true;
  return {
    category,
    userCoords: location, // 🆕 Pasar lat/lng directos
    radiusKm: 50,        // 🆕 Radio de búsqueda
    topN,
    usesLocation,
    priceLevel
  };
}
```

### Opción B: Búsqueda por distancia en Supabase (PostGIS) 🏆 MEJOR

**REQUISITO:** La tabla `places` debe tener columnas `latitude` y `longitude` (ya las tiene para el mapa)

```sql
-- Crear índice espacial para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_places_location 
ON places USING GIST (
  geography(ST_Point(longitude, latitude))
);
```

```typescript
// app/api/chatbot/route.ts

async function searchPlacesTool(supabase: any, params: SearchParams & { 
  userCoords?: { lat: number; lng: number };
  radiusKm?: number; 
}) {
  let query = supabase
    .from('places')
    .select('id, name, slug, category, rating, review_count, city, province, region, address, phone, website, ai_description, subcategory, price_level, latitude, longitude')
    .eq('published', true);

  // Filtros normales
  if (params.category) query = query.eq('category', params.category);
  if (params.priceLevel) { /* ... */ }
  
  // 🆕 Si hay coordenadas del usuario, buscar por distancia con PostGIS
  if (params.userCoords) {
    const radiusMeters = (params.radiusKm || 50) * 1000; // Convertir km a metros
    
    // Usar ST_DWithin para buscar lugares dentro del radio
    const { data, error } = await supabase.rpc('search_places_by_proximity', {
      user_lat: params.userCoords.lat,
      user_lng: params.userCoords.lng,
      radius_meters: radiusMeters,
      place_category: params.category || null,
      price_level_filter: params.priceLevel || null,
      result_limit: params.limit || 15
    });
    
    if (error) {
      console.error('Error en búsqueda por proximidad:', error);
      return [];
    }
    
    return data || [];
  }
  
  // Si no hay coords, búsqueda normal por provincia/ciudad
  if (params.province) query = query.eq('province', params.province);
  if (params.city) query = query.ilike('city', params.city);
  
  const { data } = await query.order('rating', { ascending: false }).limit(params.limit || 15);
  return data || [];
}
```

```sql
-- Crear función RPC en Supabase para búsqueda por proximidad
-- supabase/migrations/XXXXX_search_places_by_proximity.sql

CREATE OR REPLACE FUNCTION search_places_by_proximity(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 50000,
  place_category TEXT DEFAULT NULL,
  price_level_filter INTEGER DEFAULT NULL,
  result_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  category TEXT,
  rating NUMERIC,
  review_count INTEGER,
  city TEXT,
  province TEXT,
  region TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  ai_description TEXT,
  subcategory TEXT,
  price_level INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.category,
    p.rating,
    p.review_count,
    p.city,
    p.province,
    p.region,
    p.address,
    p.phone,
    p.website,
    p.ai_description,
    p.subcategory,
    p.price_level,
    p.latitude,
    p.longitude,
    (
      ST_Distance(
        geography(ST_Point(user_lng, user_lat)),
        geography(ST_Point(p.longitude, p.latitude))
      ) / 1000
    )::NUMERIC AS distance_km
  FROM places p
  WHERE p.published = true
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND ST_DWithin(
      geography(ST_Point(p.longitude, p.latitude)),
      geography(ST_Point(user_lng, user_lat)),
      radius_meters
    )
    AND (place_category IS NULL OR p.category = place_category)
    AND (price_level_filter IS NULL OR 
      (price_level_filter = 1 AND p.price_level IN (1, 2)) OR
      (price_level_filter = 2 AND p.price_level = 2) OR
      (price_level_filter = 3 AND p.price_level IN (3, 4))
    )
    AND p.review_count >= 50
  ORDER BY distance_km ASC, p.rating DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 **VENTAJAS DE LA OPCIÓN B (PostGIS)**

1. ✅ **Mucho más rápido** - La BD hace el cálculo, no JavaScript
2. ✅ **Escalable** - Con 10,000 lugares sigue siendo rápido
3. ✅ **Índice espacial** - PostGIS optimiza automáticamente
4. ✅ **Precisión** - PostGIS usa algoritmos geodésicos profesionales
5. ✅ **Menos datos transferidos** - Solo devuelve lugares dentro del radio
6. ✅ **Incluye distancia** - OpenAI puede decir "a 12km de ti"

---

## 📋 **PASOS PARA IMPLEMENTAR**

### 1. Verificar que `places` tiene lat/lng:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(latitude) as con_lat,
  COUNT(longitude) as con_lng
FROM places;
```

### 2. Crear la función RPC en Supabase:
- Ir a SQL Editor en Supabase
- Ejecutar el script de arriba

### 3. Crear índice espacial:
```sql
CREATE INDEX idx_places_location ON places 
USING GIST (geography(ST_Point(longitude, latitude)));
```

### 4. Modificar `searchPlacesTool` para usar RPC cuando hay coords

### 5. Modificar `parseIntent` para pasar coords directamente

### 6. Modificar `chatbotResponse` para incluir distancia en el contexto:
```typescript
const placesContext = candidates.map((p, i) => {
  return `${i + 1}. ${p.name} (${p.city}, ${p.province})
     ⭐ ${p.rating} (${p.review_count} reseñas)
     📍 A ${p.distance_km?.toFixed(1) || '?'} km de ti
     ${p.ai_description?.slice(0, 150) || ''}...`;
}).join('\n\n');
```

---

## 🚀 **RESULTADO FINAL**

Usuario pregunta: **"restaurantes cerca de mí"**

**Antes (búsqueda textual):**
```
❌ Busca city = 'Níjar'
❌ No encuentra nada (no hay lugares indexados en Níjar)
❌ Busca province = 'Almería'
✅ Encuentra 5 restaurantes (pero están en Almería capital, a 30km)
❌ No sabe cuál está más cerca
```

**Después (búsqueda por distancia):**
```
✅ Busca lugares dentro de 50km de (36.9742, -2.0303)
✅ Encuentra 8 restaurantes ordenados por proximidad:
   1. Bar La Plaza - Níjar (3.2 km) ⭐ 4.8
   2. Mesón El Cortijo - San José (8.5 km) ⭐ 4.9
   3. Café Ortega - Pulpí (15.3 km) ⭐ 4.9
   4. Restaurante Cuatro Rejas - Almería (28.7 km) ⭐ 4.8
   ...
✅ OpenAI puede decir exactamente la distancia
```

---

## ⚡ **PRIORIDAD**

**ALTA** - Esta mejora transforma el chatbot de "buscar por ciudad" a "buscar por proximidad real", que es lo que los usuarios esperan cuando comparten su ubicación GPS.

**IMPACTO:**
- ✅ Experiencia de usuario significativamente mejor
- ✅ Resultados más relevantes
- ✅ Cumple expectativas de geolocalización
- ✅ Mismo comportamiento que el mapa

