# OPTIMIZACIÓN DE FOTOS - REDUCIR COSTOS DE GOOGLE PLACES API

**Fecha:** 19 Octubre 2025  
**Prioridad:** 🔥 CRÍTICA  
**Ahorro potencial:** ~$500/mes (92% reducción de costos)

---

## 📊 PROBLEMA IDENTIFICADO

### **Consumo Actual de Google Places API**

El mayor gasto NO proviene de las búsquedas, sino de **Google Places Photos API**:

| Servicio | Uso | Costo unitario | Estimado mensual |
|----------|-----|----------------|------------------|
| **Photos API** | 75,000 fotos/mes | $7/1,000 | **$525** 🔥 |
| Place Details (update) | 2,000/mes | $17/1,000 | $34 |
| Directions (con caché) | 500/mes | $5/1,000 | $2.50 |
| Autocomplete | 2,000/mes | $2.83/1,000 | $5.66 |
| **TOTAL ACTUAL** | | | **~$570/mes** |

### **¿Por qué es tan alto el costo de fotos?**

Cada vez que un usuario ve un lugar en la plataforma, se descarga la foto desde Google Places API:

```typescript
// lib/utils/photo-helper.ts
https://maps.googleapis.com/maps/api/place/photo?photo_reference=${photoRef}&key=${API_KEY}
```

**Costo:** $0.007 por foto

**Páginas afectadas:**
- `/mapa` - Muestra múltiples lugares con fotos
- `/ruta` - Lista de lugares en rutas
- Páginas públicas - `/restaurante`, `/bar`, `/hotel`, `/cafeteria`
- Páginas de provincia - Ej: `/restaurante/madrid`
- Páginas de lugar individual

**Estimación conservadora:**
- 100 usuarios/día × 10 lugares vistos × 1 foto = 1,000 fotos/día
- 30,000 fotos/mes × $0.007 = **$210/mes**

**Estimación realista con tráfico moderado:**
- 250 usuarios/día × 10 lugares × 1 foto = 2,500 fotos/día
- 75,000 fotos/mes × $0.007 = **$525/mes** 🔥

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Migrar Fotos a Supabase Storage**

#### **Ventajas:**
1. **Ahorro brutal:** De $525/mes a $0.50/mes (99.9% ahorro)
2. **Velocidad:** Sin redirecciones, servidas directamente desde CDN
3. **Control:** Podemos comprimir, redimensionar, cachear
4. **Sin límites:** No hay cuota por visualización
5. **Integración:** Ya tenemos Supabase en el stack

#### **Costos de Supabase Storage:**
- Almacenamiento: $0.021/GB/mes
- Transferencia: $0.09/GB (primera 50GB gratis)
- Estimación: 500 lugares × 5 fotos × 200KB = 500MB = **$0.50/mes**

---

## 🛠️ ARCHIVOS CREADOS

### **1. Script SQL de Verificación**
📄 `supabase/verificar_fotos.sql`

Este script proporciona 7 consultas para analizar el estado de las fotos:

1. **Resumen General** - Total de lugares, cuántos tienen fotos en Supabase vs Google
2. **Desglose por Categoría** - Costos por categoría (restaurante, bar, hotel, cafeteria)
3. **Desglose por Provincia** - Top 10 provincias con más fotos pendientes
4. **Candidatos Prioritarios** - Top 20 lugares para migrar primero
5. **Estadísticas de Almacenamiento** - Cuánto ocupa en Supabase
6. **Comparativa de Costos** - Ahorro mensual y anual
7. **Lista de IDs Pendientes** - Para usar en el script de migración

**Uso:**
```sql
-- Ejecutar en Supabase SQL Editor
-- O desde psql/pgAdmin conectado a tu base de datos
```

### **2. Script de Migración TypeScript**
📄 `scripts/migrate-photos-to-supabase.ts`

Script Node.js para migrar fotos automáticamente:

**Características:**
- Migración por lotes (configurable)
- Modo `--dry-run` para simular sin cambios
- Filtro por categoría `--category restaurante`
- Límite configurable `--limit 10`
- Reportes detallados de progreso
- Cálculo automático de ahorros

**Uso:**
```bash
# Simular migración (sin cambios reales)
npx tsx scripts/migrate-photos-to-supabase.ts --dry-run

# Migrar primeros 10 lugares
npx tsx scripts/migrate-photos-to-supabase.ts --limit 10

# Migrar solo restaurantes
npx tsx scripts/migrate-photos-to-supabase.ts --category restaurante --limit 50

# Migración completa (sin límite)
npx tsx scripts/migrate-photos-to-supabase.ts
```

**Ejemplo de salida:**
```
╔════════════════════════════════════════════════════════════╗
║   MIGRACIÓN DE FOTOS A SUPABASE                            ║
╚════════════════════════════════════════════════════════════╝

🔍 Buscando lugares con fotos pendientes de migración...
✅ Encontrados 347 lugares para migrar

📊 ESTADÍSTICAS:
   Lugares a migrar: 347
   Total de fotos: 1,735
   Ahorro estimado: $121.45/mes ($1,457.40/año)

🚀 Iniciando migración...

[1/347]
📸 Migrando: Casa Lucio (restaurante - Madrid)
   Google Photos: 5 fotos
   ✅ Subidas 5 fotos a Supabase
   ✅ Base de datos actualizada
   💰 Ahorro: $3.50/mes
```

### **3. Endpoint API de Migración**
📄 `app/api/admin/migrate-photos/route.ts`

API REST para ejecutar la migración desde el panel admin:

**Endpoints:**

#### `POST /api/admin/migrate-photos`
Ejecutar migración de fotos

**Body:**
```json
{
  "limit": 10,           // Opcional: número máximo de lugares a migrar
  "category": "restaurante",  // Opcional: filtrar por categoría
  "dryRun": false        // Opcional: simular sin cambios
}
```

**Response:**
```json
{
  "success": true,
  "message": "Migración completada: 10 lugares",
  "stats": {
    "total": 10,
    "migrated": 9,
    "errors": 1,
    "skipped": 0,
    "savings": 31.50
  },
  "results": [
    {
      "id": "uuid",
      "name": "Casa Lucio",
      "status": "success",
      "photos": 5,
      "savings": 3.50
    }
  ]
}
```

#### `GET /api/admin/migrate-photos`
Obtener estadísticas sin ejecutar migración

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 500,
    "withSupabasePhotos": 153,
    "withGooglePhotos": 347,
    "withoutPhotos": 0,
    "pendingMigration": 347,
    "estimatedMonthlyCost": 121.45,
    "estimatedMonthlySavings": 121.45
  }
}
```

---

## 📋 PLAN DE EJECUCIÓN

### **Fase 1: Verificación (5 min)**

1. **Ejecutar script SQL de verificación:**
   ```bash
   # En Supabase SQL Editor, copiar y pegar todo el contenido de:
   supabase/verificar_fotos.sql
   ```

2. **Revisar resultados:**
   - Query #1: Resumen general → Cuántos lugares necesitan migración
   - Query #6: Comparativa de costos → Ahorro potencial exacto
   - Query #4: Top 20 lugares → Priorizar los más visitados

### **Fase 2: Migración de Prueba (10 min)**

3. **Migración simulada (dry-run):**
   ```bash
   npx tsx scripts/migrate-photos-to-supabase.ts --dry-run --limit 5
   ```
   
4. **Migración real de 5 lugares de prueba:**
   ```bash
   npx tsx scripts/migrate-photos-to-supabase.ts --limit 5
   ```

5. **Verificar resultados:**
   - Comprobar en Supabase Storage → bucket `place-photos`
   - Verificar en la web que las fotos se muestran correctamente
   - Revisar consola del navegador (no debe haber errores)

### **Fase 3: Migración Completa (variable)**

6. **Migración por categorías (recomendado):**
   ```bash
   # Restaurantes primero (suelen tener más tráfico)
   npx tsx scripts/migrate-photos-to-supabase.ts --category restaurante
   
   # Luego bares
   npx tsx scripts/migrate-photos-to-supabase.ts --category bar
   
   # Cafeterías
   npx tsx scripts/migrate-photos-to-supabase.ts --category cafe
   
   # Hoteles
   npx tsx scripts/migrate-photos-to-supabase.ts --category hotel
   ```

   **O migración completa de una vez:**
   ```bash
   npx tsx scripts/migrate-photos-to-supabase.ts
   ```

**Tiempo estimado:**
- 500 lugares × 2 segundos/foto × 5 fotos = ~1.5 horas
- Se puede interrumpir y reanudar (script ignora lugares ya migrados)

### **Fase 4: Verificación Post-Migración (5 min)**

7. **Re-ejecutar script SQL de verificación:**
   - Query #1 debería mostrar: `solo_google = 0` (todos migrados)
   - Query #6 debería mostrar: `ahorro_mes_usd > $100`

8. **Probar en producción:**
   - Visitar `/mapa` → Verificar que fotos cargan correctamente
   - Visitar `/restaurante/madrid` → Comprobar velocidad
   - Abrir DevTools → Network → Fotos deben venir de Supabase (`.supabase.co`)

---

## 🔧 FUNCIONAMIENTO TÉCNICO

### **Cómo funciona `photo-helper.ts`**

El helper ya está optimizado para priorizar Supabase:

```typescript
// lib/utils/photo-helper.ts
export function getPlacePhotoUrl(place, index = 0) {
  // 1️⃣ PRIORIDAD: URLs de Supabase (GRATIS)
  if (place.photo_urls && place.photo_urls.length > index) {
    const url = place.photo_urls[index];
    // Optimización extra: comprimir imágenes con query params
    return `${url}?width=400&quality=80`;
  }

  // 2️⃣ FALLBACK: photo_reference de Google (CARO)
  if (place.photos && place.photos.length > index) {
    return `https://maps.googleapis.com/maps/api/place/photo?...`;
  }

  // 3️⃣ Sin fotos
  return null;
}
```

### **Proceso de Migración**

```
┌─────────────────────────────────────────────────────────────┐
│  1. OBTENER LUGARES PENDIENTES                              │
│     SELECT * FROM places                                     │
│     WHERE photos IS NOT NULL                                 │
│       AND (photo_urls IS NULL OR array_length = 0)          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. POR CADA LUGAR:                                          │
│     a) Descargar foto desde Google Places API                │
│        https://maps.googleapis.com/maps/api/place/photo      │
│                                                              │
│     b) Subir a Supabase Storage                              │
│        bucket: place-photos                                  │
│        path: places/{place_id}/0.jpg                         │
│                                                              │
│     c) Obtener URL pública                                   │
│        https://{project}.supabase.co/storage/v1/...          │
│                                                              │
│     d) Actualizar BD                                         │
│        UPDATE places                                         │
│        SET photo_urls = [url1, url2, ...]                   │
│        WHERE id = place.id                                   │
└─────────────────────────────────────────────────────────────┘
```

### **Bucket de Supabase Storage**

El bucket `place-photos` debe estar configurado como **público**:

```sql
-- Ejecutar en Supabase SQL Editor si el bucket no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-photos', 'place-photos', true);

-- Política de acceso público para lectura
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'place-photos' );
```

---

## 📊 MONITOREO POST-MIGRACIÓN

### **Métricas a vigilar:**

1. **Consumo de Google API:**
   - Google Cloud Console → APIs & Services → Dashboard
   - Verificar que "Places API - Photo" baja drásticamente
   - Esperado: De ~75,000/mes a <1,000/mes

2. **Uso de Supabase Storage:**
   - Supabase Dashboard → Storage
   - Bucket `place-photos` → Debería tener ~2,500 archivos (500 lugares × 5 fotos)
   - Tamaño total: ~500MB - 1GB

3. **Performance:**
   - Lighthouse en `/mapa` → LCP debería mejorar
   - Core Web Vitals → CLS debería ser mejor (sin redirecciones)

### **Alertas recomendadas:**

```bash
# Google Cloud Console
# Crear alerta de presupuesto:
# - Presupuesto mensual: $50
# - Alertas: 50%, 75%, 90%, 100%
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **1. Backup de photo_references**

El script **NO elimina** los `photo_reference` de Google. Los mantiene como backup en la columna `photos` por si acaso.

### **2. Lugares nuevos**

Los nuevos lugares indexados deberían usar directamente Supabase. Verificar que la función `downloadAndUploadPhotosToSupabase()` se llama en:
- `lib/indexation/index-processor.ts`
- `app/api/admin/add-manual-place/route.ts`

### **3. Rate limits**

El script tiene pausas de 1 segundo entre migraciones para evitar saturar la Google Places API. Si aparecen errores `OVER_QUERY_LIMIT`, aumentar la pausa:

```typescript
// En scripts/migrate-photos-to-supabase.ts
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
```

### **4. Actualización de ratings**

Cuando actualizas ratings en `/api/admin/update-ratings`, las fotos ya están en Supabase, así que no hay costo adicional.

---

## 🎯 RESUMEN EJECUTIVO

### **Antes de la migración:**
- Costo mensual: **~$570**
- Fotos: Google Places API ($525/mes)
- Velocidad: Regular (redirecciones)

### **Después de la migración:**
- Costo mensual: **~$43**
- Fotos: Supabase Storage ($0.50/mes)
- Velocidad: Excelente (CDN directo)

### **Ahorro:**
- **$527/mes** (92% reducción)
- **$6,324/año**

### **Esfuerzo:**
- Setup inicial: 30 minutos
- Migración: 1-2 horas (automatizado)
- Mantenimiento: 0 horas (automático para nuevos lugares)

---

## 📞 SOPORTE

Si encuentras problemas durante la migración:

1. **Errores de red/timeout:**
   - Reducir `limit` en el script (ej: `--limit 10`)
   - Aumentar pausas entre migraciones

2. **Bucket no existe:**
   - Crear manualmente en Supabase Dashboard → Storage
   - Nombre: `place-photos`
   - Público: Sí

3. **Fotos no se muestran:**
   - Verificar políticas RLS en `storage.objects`
   - Comprobar que el bucket es público
   - Revisar consola del navegador para errores CORS

---

**Última actualización:** 19 Octubre 2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para producción

