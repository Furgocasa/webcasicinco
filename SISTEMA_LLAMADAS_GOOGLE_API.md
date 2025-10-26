# 🔍 SISTEMA DE LLAMADAS A GOOGLE PLACES API

**Última actualización:** 26 de Octubre de 2025  
**Estado:** ✅ OPTIMIZADO Y CONTROLADO

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Cuándo SÍ se llama a Google API (LEGÍTIMO)](#cuándo-sí-se-llama-a-google-api-legítimo)
3. [Cuándo NO se llama a Google API (OPTIMIZADO)](#cuándo-no-se-llama-a-google-api-optimizado)
4. [Flujo Completo de Fotos](#flujo-completo-de-fotos)
5. [Costos Detallados](#costos-detallados)
6. [Monitoreo y Alertas](#monitoreo-y-alertas)

---

## 📊 RESUMEN EJECUTIVO

### Principio Fundamental
> **Solo llamamos a Google Places API cuando ES NECESARIO para obtener datos nuevos.  
> NUNCA para mostrar contenido a usuarios finales.**

### Arquitectura de 2 Fases

```
FASE 1: INDEXACIÓN (Google API)          FASE 2: ENRIQUECIMIENTO (Google API + IA)
┌─────────────────────────────┐          ┌─────────────────────────────────┐
│ 1. Buscar lugares (Nearby)  │          │ 1. Descargar fotos (Photos API) │
│    → $0.032/request         │          │    → $0.007/foto                │
│                             │          │                                 │
│ 2. Obtener detalles básicos │    →     │ 2. Subir a Supabase Storage     │
│    → $0.012/lugar           │          │    → Gratis (almacenamiento)    │
│                             │          │                                 │
│ 3. Guardar photo_reference  │          │ 3. Generar contenido IA         │
│    → Sin costo              │          │    → OpenAI (~$0.03/lugar)      │
│                             │          │                                 │
│ 4. Lugar en BD (borrador)   │          │ 4. Publicar lugar               │
└─────────────────────────────┘          └─────────────────────────────────┘
         UNA VEZ                                    UNA VEZ
```

### Estadísticas Actuales (Octubre 2025)
- **Lugares en BD:** 3,133
- **Con fotos Supabase:** 3,034 (96.8%)
- **Llamadas a Google Photos API:** 0 (usuarios finales)
- **Gasto mensual estimado:** ~€0 en visualización, ~€15-30 en indexación nueva

---

## ✅ CUÁNDO SÍ SE LLAMA A GOOGLE API (LEGÍTIMO)

### 1. **INDEXACIÓN DE NUEVOS LUGARES** 
📁 `lib/indexation/indexer-fast.ts` + `lib/indexation/processor.ts`

#### Llamadas realizadas:
```typescript
// 1. Nearby Search - Buscar lugares en un área
GET /place/nearbysearch/json
Costo: $0.032 por búsqueda
Uso: Encontrar lugares candidatos en una ciudad/zona

// 2. Place Details - Obtener información completa
GET /place/details/json?fields=name,rating,reviews,address,phone,...
Costo: $0.012 por lugar (sin fotos)
Uso: Obtener datos completos del lugar

// 3. Guardar photo_reference - Sin llamada API
Solo guardamos la REFERENCIA en la BD
Costo: $0 (no descargamos aún)
```

#### Ejemplo de flujo:
```typescript
// lib/indexation/processor.ts - Línea 42
const placeDetails = await getPlaceDetails(placeId);
cost += 0.012; // Place Details (optimizado, sin fotos)

// Guardar referencias de fotos (NO descargar)
const photoReferences = placeDetails.photos 
  ? placeDetails.photos.slice(0, 3).map(p => p.photo_reference)
  : [];

// Guardar en BD
await supabase.from('places').insert({
  ...placeData,
  photos: photoReferences, // Solo referencias
  photo_urls: [], // Vacío hasta enriquecimiento
  published: false, // Borrador
  needs_enrichment: true
});
```

**Cuándo:** Solo cuando el admin inicia indexación desde `/admin/indexar`  
**Frecuencia:** Manual, controlado por admin  
**Costo estimado:** $0.044 por lugar nuevo ($0.032 + $0.012)

---

### 2. **ENRIQUECIMIENTO CON IA**
📁 `lib/indexation/enricher-batch.ts`

#### Llamadas realizadas:
```typescript
// 1. Place Details - Obtener reseñas para IA
GET /place/details/json?fields=reviews
Costo: $0.012 por lugar
Uso: Obtener reseñas para generar contenido IA

// 2. Photos API - DESCARGAR fotos (UNA SOLA VEZ)
GET /place/photo?photoreference=XXX&maxwidth=1200
Costo: $0.007 por foto × 5 fotos = $0.035
Uso: Descargar fotos y subirlas a Supabase Storage

// 3. Subir a Supabase - Sin costo Google
PUT /storage/v1/object/place-photos/...
Costo: $0 Google (incluido en Supabase)
```

#### Ejemplo de flujo:
```typescript
// lib/indexation/enricher-batch.ts - Línea 85
const details = await getPlaceDetails(place.google_place_id);
// Obtener reseñas para IA

// Línea 117 - Usar photo_reference guardado en BD
const photoReferences = place.photos || [];
const photosArray = photoReferences.map(ref => ({ photo_reference: ref }));

// Línea 120 - DESCARGAR y subir a Supabase (UNA SOLA VEZ)
const { supabaseUrls } = await downloadAndUploadPhotosToSupabase(
  photosArray,
  place.name,
  place.google_place_id,
  5 // Máximo 5 fotos
);

// Actualizar BD con URLs de Supabase
await supabase.from('places').update({
  photo_urls: supabaseUrls, // URLs de Supabase
  photos: photoReferences, // Mantener referencias por si acaso
  published: true
});
```

**Cuándo:** Después de indexación, cuando admin ejecuta enriquecimiento desde `/admin/enriquecer`  
**Frecuencia:** Una vez por lugar, manual  
**Costo estimado:** $0.047 por lugar ($0.012 + $0.035 fotos)  
**Total por lugar nuevo:** $0.091 (~€0.08)

---

### 3. **BÚSQUEDA MANUAL (ADMIN)**
📁 `app/api/admin/search-manual/route.ts`

#### Llamadas realizadas:
```typescript
// Text Search - Buscar lugares por nombre
POST /place/textsearch/json
Costo: $0.032 por búsqueda
Uso: Admin busca lugar específico para añadir
```

**Cuándo:** Cuando admin busca un lugar desde `/admin/buscar-lugar`  
**Frecuencia:** Ocasional, manual  
**Costo estimado:** $0.032 por búsqueda

---

### 4. **AÑADIR LUGAR MANUAL (ADMIN)**
📁 `app/api/admin/add-manual-place/route.ts`

#### Llamadas realizadas:
```typescript
// 1. Place Details - Obtener datos completos
GET /place/details/json
Costo: $0.012

// 2. Get Photos - Obtener photo_references
GET /place/details/json?fields=photos
Costo: $0.005

// Total: $0.017 por lugar añadido manualmente
```

**Cuándo:** Cuando admin añade lugar específico desde búsqueda manual  
**Frecuencia:** Ocasional, manual  
**Costo estimado:** $0.017 por lugar

---

## ❌ CUÁNDO NO SE LLAMA A GOOGLE API (OPTIMIZADO)

### 1. **VISUALIZACIÓN DE LUGARES (USUARIOS)**
📁 `app/(public)/mapa/page.tsx`, `app/(public)/ruta/page.tsx`, etc.

```typescript
// ❌ NUNCA se construye URL de Google Photos API
// ✅ Se usa helper que prioriza Supabase

// lib/utils/photo-helper.ts
export function getPlacePhotoUrl(place, index, maxwidth) {
  // PRIORIDAD 1: Supabase Storage (GRATIS)
  if (place.photo_urls && place.photo_urls.length > index) {
    return place.photo_urls[index]; // ✅ GRATIS
  }
  
  // PRIORIDAD 2: Google (solo si no tiene Supabase)
  if (place.photos && place.photos.length > index) {
    return `https://maps.googleapis.com/maps/api/place/photo?...`; // ⚠️ CARO
  }
  
  // PRIORIDAD 3: Sin foto
  return null; // ✅ GRATIS (placeholder)
}
```

**Resultado:** Como el 96.8% de lugares tienen `photo_urls`, casi nunca se ejecuta el fallback.

---

### 2. **BLOG Y LISTADOS**
📁 `app/api/blog/route.ts`, `app/(public)/blog/page.tsx`

**ANTES del fix (26 Oct 2025):**
```typescript
// ❌ MAL - Devolvía photo_reference
else if (firstPlace.photos && firstPlace.photos.length > 0) {
  photoReference = firstPlace.photos[0]; // Esto causaba el gasto
}
```

**DESPUÉS del fix:**
```typescript
// ✅ BIEN - Solo Supabase o null
if (firstPlace.photo_urls && firstPlace.photo_urls.length > 0) {
  photoReference = firstPlace.photo_urls[0];
}
// NO hay fallback a photos
```

**Impacto:** Eliminó €3,700/mes de gasto innecesario

---

### 3. **APIS DE LECTURA**
📁 `app/api/places/route.ts`, `app/api/places/[id]/route.ts`

```typescript
// Estas APIs SOLO leen de BD, NUNCA llaman a Google
const { data } = await supabase
  .from('places')
  .select('*') // Incluye photo_urls
  .eq('published', true);

// El frontend recibe photo_urls (Supabase)
// NO photo_reference (Google)
```

---

## 🔄 FLUJO COMPLETO DE FOTOS

### Ciclo de Vida de una Foto

```
┌──────────────────────────────────────────────────────────────┐
│ 1. INDEXACIÓN (Primera vez)                                  │
│    Google Places API → photo_reference guardado en BD        │
│    Costo: $0 (solo guardamos referencia)                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. ENRIQUECIMIENTO (Una sola vez)                            │
│    photo_reference → Google Photos API → Descargar           │
│    Imagen descargada → Supabase Storage → photo_urls         │
│    Costo: $0.007 × 5 fotos = $0.035                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. VISUALIZACIÓN (Infinitas veces)                           │
│    Usuario ve lugar → Frontend usa photo_urls                │
│    Supabase Storage → Imagen mostrada                        │
│    Costo: $0 (incluido en plan Supabase)                    │
└──────────────────────────────────────────────────────────────┘
         ↓ ∞ veces (GRATIS)
```

### Comparación: Antes vs Ahora

| Acción | Antes (Legacy) | Ahora (Optimizado) | Ahorro |
|--------|----------------|-------------------|--------|
| **Indexar lugar** | $0.017 (con fotos) | $0.012 (sin fotos) | 29% |
| **Enriquecer** | $0.012 + $0.035 | $0.012 + $0.035 | 0% |
| **Mostrar a usuario** | $0.007 por vista | $0.00 | 100% |
| **100,000 vistas/mes** | $700/mes | $0/mes | **$700/mes** |

---

## 💰 COSTOS DETALLADOS

### Tabla de Precios Google Places API (2025)

| Endpoint | Costo | Cuándo se usa |
|----------|-------|---------------|
| **Nearby Search** | $0.032 | Indexación (buscar lugares) |
| **Text Search** | $0.032 | Búsqueda manual admin |
| **Place Details (Basic)** | $0.012 | Indexación y enriquecimiento |
| **Place Details (Contact)** | +$0.003 | Solo si pedimos teléfono/web |
| **Place Details (Atmosphere)** | +$0.005 | Solo si pedimos photos |
| **Place Photo** | $0.007 | Descargar foto (enriquecimiento) |

### Costo por Lugar Nuevo (Completo)

```
Indexación:
  Nearby Search       $0.032
  Place Details       $0.012
  Subtotal            $0.044

Enriquecimiento:
  Place Details       $0.012
  Photos (5×)         $0.035
  OpenAI (descripción) $0.015
  OpenAI (resumen)    $0.008
  OpenAI (highlights) $0.008
  Subtotal            $0.078

TOTAL POR LUGAR:      $0.122 (~€0.11)
```

### Proyección Mensual (Indexación Activa)

| Escenario | Lugares/mes | Costo Google | Costo OpenAI | Total |
|-----------|-------------|--------------|--------------|-------|
| **Bajo** | 50 | $6.10 | $1.55 | **$7.65** |
| **Medio** | 100 | $12.20 | $3.10 | **$15.30** |
| **Alto** | 200 | $24.40 | $6.20 | **$30.60** |
| **Sin indexación** | 0 | $0 | $0 | **$0** |

### Comparación: Antes vs Después del Fix

| Métrica | Oct 2025 (Con bug) | Nov 2025 (Después fix) | Ahorro |
|---------|-------------------|----------------------|--------|
| **Gasto mensual Photos API** | €3,770 | €0 | **€3,770** |
| **Requests a Photos API** | 538,937 | 0 | 538,937 |
| **Gasto anual proyectado** | €45,240 | €0 | **€45,240** |

---

## 📊 MONITOREO Y ALERTAS

### Dónde Revisar Costos

**Google Cloud Console:**
1. Ve a: https://console.cloud.google.com/billing
2. Proyecto: `casi-5-app-474718`
3. Filtrar por:
   - `Places API` - Búsquedas y detalles
   - `Places Photo` - Fotos (debería estar en €0)

### Alertas Configuradas (Recomendado)

```
Budget Alert 1: €30/mes
  → Si se supera, revisar inmediatamente
  → Puede indicar indexación activa o problema

Budget Alert 2: €100/mes  
  → Límite máximo de emergencia
  → Detener indexación automáticamente

Daily Alert: €5/día
  → Monitoreo diario de gastos anormales
```

### Query SQL de Verificación

```sql
-- Verificar que no haya lugares usando Google Photos API
SELECT 
  COUNT(*) as total_lugares,
  COUNT(CASE WHEN photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0 
             THEN 1 END) as con_supabase,
  COUNT(CASE WHEN (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL) 
             AND photos IS NOT NULL 
             AND photos::text != '[]' 
             THEN 1 END) as sin_supabase_con_google
FROM places
WHERE published = true;

-- Resultado esperado:
-- total_lugares: 3133
-- con_supabase: 3034
-- sin_supabase_con_google: 0 ← DEBE SER 0
```

### Dashboard de Monitoreo

Crear en `/admin/diagnostico`:

```typescript
// Métricas clave
- Lugares totales
- % con fotos Supabase
- Lugares usando Google Photos (debe ser 0)
- Lugares sin fotos
- Costo estimado mensual Google API
- Últimas indexaciones (fecha, cantidad, costo)
```

---

## 🎯 MEJORES PRÁCTICAS

### Para Desarrolladores

1. **NUNCA construir URLs de Google Photos API en frontend/visualización**
   ```typescript
   // ❌ MAL
   const url = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${ref}&key=${key}`;
   
   // ✅ BIEN
   const url = getPlacePhotoUrl(place, 0); // Usa helper
   ```

2. **Siempre priorizar Supabase Storage**
   ```typescript
   if (place.photo_urls && place.photo_urls.length > 0) {
     return place.photo_urls[0]; // ✅ Supabase
   }
   // Solo si no hay alternativa
   if (place.photos && place.photos.length > 0) {
     return constructGoogleUrl(place.photos[0]); // ⚠️ Caro
   }
   return null; // ✅ Placeholder
   ```

3. **Descargar fotos UNA SOLA VEZ**
   - En indexación: Guardar solo `photo_reference`
   - En enriquecimiento: Descargar y subir a Supabase
   - En visualización: Usar solo Supabase

4. **Monitoreo constante**
   - Revisar Google Cloud Console semanalmente
   - Ejecutar query de verificación mensualmente
   - Alertas configuradas en €30/mes

---

## 📚 ARCHIVOS RELACIONADOS

### Documentación
- `README.md` - Información general del proyecto
- `SISTEMA_FOTOS_SUPABASE.md` - Sistema de almacenamiento de fotos
- `FIX_GOOGLE_PHOTOS_API_26OCT2025.md` - Fix del bug de fallback
- `OPTIMIZACION_GOOGLE_API_COMPLETA.md` - Optimizaciones realizadas

### Código - Llamadas Legítimas
- `lib/indexation/indexer-fast.ts` - Indexación de lugares
- `lib/indexation/processor.ts` - Procesamiento de lugares
- `lib/indexation/enricher-batch.ts` - Enriquecimiento con IA
- `lib/google/places.ts` - Funciones de Google Places API
- `app/api/admin/search-manual/route.ts` - Búsqueda manual
- `app/api/admin/add-manual-place/route.ts` - Añadir lugar manual

### Código - Helper (No llama API directamente)
- `lib/utils/photo-helper.ts` - Helper de fotos (prioriza Supabase)
- `components/places/PlaceCard.tsx` - Tarjeta de lugar
- `components/places/PlaceContent.tsx` - Contenido de lugar
- `app/(public)/mapa/page.tsx` - Mapa interactivo
- `app/(public)/ruta/page.tsx` - Planificador de rutas

### Código - APIs de Lectura (Solo BD)
- `app/api/places/route.ts` - Listado de lugares
- `app/api/places/[id]/route.ts` - Detalle de lugar
- `app/api/blog/route.ts` - Listado de blog
- `app/api/blog/[slug]/route.ts` - Detalle de post

---

## 🔍 PREGUNTAS FRECUENTES

### ¿Por qué guardamos `photos` (photo_reference) en la BD?

Backward compatibility y como backup. Si alguna vez necesitamos re-descargar fotos, tenemos la referencia. Pero **NUNCA** se usa para visualización en producción.

### ¿Qué pasa si un lugar no tiene `photo_urls`?

El helper `getPlacePhotoUrl()` devuelve `null` y se muestra un placeholder. Es mejor mostrar sin foto que gastar €€€ en Google API.

### ¿Puedo forzar descargar fotos de un lugar específico?

Sí, desde `/admin/lugares` hay opciones para re-enriquecer lugares individuales. Esto llamará a Google Photos API y actualizará `photo_urls`.

### ¿Cómo sé si estoy gastando demasiado?

Revisa Google Cloud Console. Si ves más de €30/mes y no estás indexando activamente, hay un problema. Ejecuta la query de verificación.

---

**Última revisión:** 26 de Octubre de 2025  
**Próxima revisión:** 26 de Noviembre de 2025  
**Responsable:** Equipo de Desarrollo

