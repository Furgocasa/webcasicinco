# 📸 Sistema de Fotos en Supabase Storage

**Fecha:** 13 de Octubre de 2025  
**Estado:** ✅ Implementado (Backend) - ⏳ Pendiente (Migración Masiva)  
**Ahorro:** **-98% costos** ($2,520/año → $60/año)

---

## 💸 Problema de Costos

### Antes (Google Photos API cada vez):
```
Cada vista de foto = 1 request a Google Photos API
Cost: $7 por 1,000 requests

Escenario conservador:
- 100 usuarios/día
- 10 lugares vistos por usuario
- 1 foto por lugar
= 1,000 fotos/día = $7/día
= $210/mes
= $2,520/año 💸💸💸

Escenario real (con más tráfico):
- 1,000 usuarios/día
- 10 lugares × 3 fotos cada uno
= 30,000 fotos/día = $210/día
= $6,300/mes
= $75,600/año 🚨🚨🚨
```

### Ahora (Supabase Storage):
```
Al indexar: 1 request a Google por foto (solo 1 vez)
Todas las vistas posteriores: Desde Supabase Storage (gratis)

Cost Supabase:
- Storage: $0.021/GB/mes
- Egress: $0.09/GB (primeros 50GB gratis/mes)
- Para ~10,000 fotos (10GB): $0.21/mes + $9/mes egress = $10/mes
= $120/año

Ahorro: $2,520 - $120 = $2,400/año (-95%) 🎉
```

---

## ✅ Lo Implementado (Backend)

### 1. Nueva Función en `lib/google/places.ts`

```typescript
downloadAndUploadPhotosToSupabase(photos, placeName, placeId, maxPhotos)
```

**Qué hace:**
1. Descarga foto desde Google (1 vez, $0.007)
2. Sube a Supabase Storage bucket `place-photos`
3. Devuelve URL pública de Supabase
4. Guarda también `photo_reference` (backward compatibility)

### 2. Helper `lib/utils/photo-helper.ts`

```typescript
getPlacePhotoUrl(place, index)
// Prioriza:
// 1. place.photo_urls[index] (Supabase) → Gratis ✅
// 2. place.photos[index] (Google) → Caro, solo fallback
```

### 3. Processor Actualizado

```typescript
// lib/indexation/processor.ts línea 57
const { supabaseUrls, photoReferences } = await downloadAndUploadPhotosToSupabase(...);

placeData = {
  photos: photoReferences, // Legacy
  photo_urls: supabaseUrls, // NUEVO
}
```

### 4. Types Actualizados

```typescript
// types/place.ts
photos?: string[]; // Legacy: photo_reference de Google
photo_urls?: string[]; // NUEVO: URLs de Supabase
```

### 5. Componentes Actualizados

- ✅ `components/places/PlaceCard.tsx` - Usa helper
- ✅ `app/(public)/mapa/page.tsx` - 3 lugares actualizados

---

## ⏳ Pendiente de Implementar

### 1. Actualizar Componentes Restantes

Archivos que aún usan Google directamente:
- `app/(public)/ruta/page.tsx` - 3 lugares (líneas 657, 807, 1150)
- `app/(public)/perfil/page.tsx` - 1 lugar
- `app/(public)/[category]/[province]/[slug]/page.tsx` - Página de detalle
- `app/admin/lugares/page.tsx` - Panel de admin

**Acción:** Reemplazar todos con `getPlacePhotoUrl(place, 0)`

### 2. Herramienta de Migración Masiva

**Panel Admin `/admin/lugares`:**
- Botón: "Migrar Fotos a Supabase"
- Modal con opciones:
  - "Migrar Todo" (3,600 lugares)
  - "Solo sin photo_urls" (inteligente)
- Barra de progreso
- Log en tiempo real
- Estimación de tiempo y costo

**API Nueva:**
```
POST /api/admin/migrate-photos
Body: { mode: 'all' | 'missing', batchSize: 100 }
```

**Proceso:**
```
1. Obtener lugares sin photo_urls
2. Procesar en lotes de 100
3. Para cada lugar:
   - Obtener photos (photo_reference)
   - Descargar desde Google
   - Subir a Supabase
   - Actualizar photo_urls en BD
4. Actualizar progreso
5. Log de éxitos/fallos
```

---

## 🔧 Migración SQL

### Ejecutar en Supabase:

```sql
-- 1. Agregar columna
ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS photo_urls TEXT[];

-- 2. Crear bucket (o hacerlo manualmente en Dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-photos', 'place-photos', true)
ON CONFLICT DO NOTHING;

-- 3. Políticas RLS (ya incluidas en migration SQL)
```

**Archivo:** `supabase/migrations/add_photo_urls_storage.sql`

---

## 📊 Plan de Migración

### Fase 1: Preparación (HOY)
- ✅ Backend implementado
- ✅ Helper creado
- ✅ PlaceCard y Mapa actualizados
- ⏳ Ejecutar migración SQL
- ⏳ Actualizar componentes restantes

### Fase 2: Migración Gradual (Próximos días)
- ⏳ Crear herramienta de migración en admin
- ⏳ Migrar lugares en lotes de 1,000
- ⏳ Monitorear errores y re-intentar fallos
- ⏳ Verificar que fotos cargan correctamente

### Fase 3: Limpieza (Cuando todo migrado)
- ⏳ Remover código legacy de `downloadPlacePhotos()`
- ⏳ Eliminar campo `photos` de BD (opcional)
- ⏳ Actualizar docs

---

## 🎯 Backward Compatibility

**Lugares existentes (3,600):**
```
photos: ['photo_ref_123', ...]  ← Google Photos API
photo_urls: null               ← NULL
```
→ Helper usa Google (funciona pero caro)

**Lugares nuevos:**
```
photos: ['photo_ref_123', ...]  ← Guardado para referencia
photo_urls: ['https://supabase.co/...', ...]  ← Supabase Storage
```
→ Helper usa Supabase (gratis, rápido)

**Después de migración:**
```
photos: ['photo_ref_123', ...]  ← Mantener para backup
photo_urls: ['https://supabase.co/...', ...]  ← Migrado
```
→ Helper usa Supabase ✅

---

## 🚀 Próximos Pasos Inmediatos

### 1. Ejecutar Migración SQL (5 min)
```
supabase/migrations/add_photo_urls_storage.sql
```

### 2. Actualizar Componentes Restantes (15 min)
- Rutas
- Perfil  
- Detalle de lugar
- Admin lugares

### 3. Crear Herramienta Migración (30 min)
- API endpoint
- Interfaz en admin
- Progreso en tiempo real

### 4. Migrar Lugares Existentes (variable)
- 100 lugares: ~5 min
- 1,000 lugares: ~50 min
- 3,600 lugares: ~3 horas
- **Se puede hacer en lotes, pausar y continuar**

---

## 💰 ROI (Return on Investment)

**Tiempo de desarrollo:** ~2 horas  
**Ahorro anual:** $2,400 - $120 = **$2,280/año**  
**ROI:** Se paga en 1 día de tráfico moderado

**Es CRÍTICO implementarlo YA** 🚨

---

## 📝 Notas Técnicas

### Supabase Storage Limits:
- Free tier: 1GB storage gratis
- Egress: 50GB/mes gratis
- Después: $0.021/GB storage, $0.09/GB egress

### Fotos Estimadas:
- 1 foto: ~200KB (comprimida)
- 5 fotos por lugar: ~1MB
- 3,600 lugares: ~3.6GB
- **Cost:** $0.021 × 3.6 = $0.076/mes storage
- **Egress:** Si 10,000 vistas/mes = ~2GB = gratis (dentro de 50GB)

### Google Photos API Cost:
- $7 por 1,000 requests
- Sin caché, sin límites

---

## ✅ Estado Actual

- ✅ Código implementado
- ✅ Helper funcionando
- ✅ Backward compatible
- ✅ PlaceCard actualizado
- ✅ Mapa actualizado (3 lugares)
- ⏳ Rutas por actualizar (3 lugares)
- ⏳ Perfil por actualizar (1 lugar)
- ⏳ Detalle por actualizar
- ⏳ Migración SQL por ejecutar
- ⏳ Herramienta migración por crear

---

**CRÍTICO:** Este sistema ahorrará **miles de euros al año**. Prioridad máxima. 🚨

