# 📊 RESUMEN: MIGRACIÓN DE FOTOS A SUPABASE

**Fecha:** 19 Octubre 2025  
**Estado:** ⚠️ **CRÍTICO - ACCIÓN REQUERIDA**

---

## 🔥 SITUACIÓN ACTUAL

### **Datos Reales de tu Base de Datos:**

| Métrica | Cantidad |
|---------|----------|
| **Lugares pendientes de migración** | **3,050** |
| Lugares con fotos en Google | 3,050 |
| Lugares con fotos en Supabase | ? (verificar con Query #1) |
| Total de lugares publicados | ? (verificar con Query #1) |

---

## 💰 COSTO MENSUAL ESTIMADO

### **Escenario Conservador** (50 vistas/mes por lugar)
- 3,050 lugares × 50 vistas × $0.007 = **$1,067.50/mes**
- **$12,810/año**

### **Escenario Realista** (100 vistas/mes por lugar)
- 3,050 lugares × 100 vistas × $0.007 = **$2,135/mes**
- **$25,620/año** 🔥

### **Escenario con Tráfico Alto** (200 vistas/mes por lugar)
- 3,050 lugares × 200 vistas × $0.007 = **$4,270/mes**
- **$51,240/año** 💸

---

## ✅ SOLUCIÓN: MIGRAR A SUPABASE STORAGE

### **Costos Después de Migración:**

| Concepto | Costo |
|----------|-------|
| Almacenamiento (3,050 lugares × 5 fotos × 200KB) | ~3GB |
| Costo almacenamiento | $0.021/GB = **$0.06/mes** |
| Transferencia (primeros 50GB gratis) | **$0/mes** |
| **TOTAL SUPABASE** | **~$0.06/mes** |

### **Ahorro:**
- **De:** $2,135/mes (escenario realista)
- **A:** $0.06/mes
- **Ahorro:** **$2,134.94/mes** (**99.997%**)
- **Ahorro anual:** **$25,619/año**

---

## 🛠️ ARCHIVOS CREADOS

### ✅ **1. Script SQL de Verificación**
📄 `supabase/verificar_fotos_simple.sql`

**Para ejecutar las queries restantes:**

```sql
-- Query #1 - Ver resumen completo
SELECT 
  COUNT(*) as total_lugares,
  COUNT(CASE WHEN photo_urls IS NOT NULL THEN 1 END) as con_supabase,
  COUNT(CASE WHEN photo_urls IS NULL AND photos IS NOT NULL THEN 1 END) as solo_google,
  COUNT(CASE WHEN photo_urls IS NULL AND photos IS NULL THEN 1 END) as sin_fotos,
  COUNT(CASE WHEN photo_urls IS NULL AND photos IS NOT NULL THEN 1 END) * 100 * 0.007 as costo_mes_google_usd
FROM places
WHERE published = true;

-- Query #2 - Desglose por categoría
SELECT 
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN photo_urls IS NOT NULL THEN 1 END) as con_supabase,
  COUNT(CASE WHEN photo_urls IS NULL AND photos IS NOT NULL THEN 1 END) as solo_google,
  ROUND(COUNT(CASE WHEN photo_urls IS NULL AND photos IS NOT NULL THEN 1 END) * 100 * 0.007, 2) as costo_mes_usd
FROM places
WHERE published = true
GROUP BY category
ORDER BY solo_google DESC;

-- Query #3 - Top 20 lugares prioritarios
SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  review_count,
  photos IS NOT NULL as tiene_google_photos,
  photo_urls IS NOT NULL as tiene_supabase_photos
FROM places
WHERE published = true
  AND photos IS NOT NULL
  AND photo_urls IS NULL
ORDER BY review_count DESC, rating DESC
LIMIT 20;
```

### ✅ **2. Script TypeScript de Migración**
📄 `scripts/migrate-photos-to-supabase.ts`

**Características:**
- Descarga fotos desde Google Places API
- Las sube a Supabase Storage (bucket `place-photos`)
- Actualiza la columna `photo_urls` en la BD
- Mantiene `photos` como backup
- Modo dry-run para probar sin cambios
- Reportes detallados de progreso

**Uso (requiere variables de entorno):**
```bash
# Simulación
npx tsx scripts/migrate-photos-to-supabase.ts --dry-run --limit 5

# Migración real
npx tsx scripts/migrate-photos-to-supabase.ts --limit 10
```

### ✅ **3. Endpoint API de Migración**
📄 `app/api/admin/migrate-photos/route.ts`

**Endpoints disponibles:**

#### `GET /api/admin/migrate-photos`
Obtener estadísticas sin ejecutar migración

#### `POST /api/admin/migrate-photos`
Ejecutar migración desde el panel admin

**Body:**
```json
{
  "limit": 10,
  "category": "restaurante",
  "dryRun": false
}
```

---

## 🚀 PLAN DE EJECUCIÓN

### **OPCIÓN A: Usar el Endpoint API (RECOMENDADO)**

Desde tu navegador o Postman:

```bash
# 1. Obtener estadísticas
GET https://tu-dominio.com/api/admin/migrate-photos
Authorization: (tu sesión de admin)

# 2. Migración de prueba (5 lugares)
POST https://tu-dominio.com/api/admin/migrate-photos
{
  "limit": 5,
  "dryRun": false
}

# 3. Migración por lotes
POST https://tu-dominio.com/api/admin/migrate-photos
{
  "limit": 50,
  "category": "restaurante"
}
```

### **OPCIÓN B: Usar el Script CLI**

Necesitas configurar las variables de entorno en un archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
GOOGLE_MAPS_API_KEY=tu_google_api_key
```

Luego:
```bash
# Cargar variables y ejecutar
source .env.local  # En Linux/Mac
# o
$env:NEXT_PUBLIC_SUPABASE_URL="..." # En PowerShell

npx tsx scripts/migrate-photos-to-supabase.ts --limit 10
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **1. Tiempo Estimado de Migración**

Con 3,050 lugares:
- Velocidad: ~2 segundos por foto
- 3,050 lugares × 5 fotos × 2 seg = **8.5 horas**
- Recomendación: **Migrar por lotes de 50-100 lugares**

### **2. Límites de Google API**

- Evita migrar todo de una vez para no saturar la API
- El script tiene pausas automáticas entre migraciones
- Si aparece `OVER_QUERY_LIMIT`, esperar y reintentar

### **3. Verificación Post-Migración**

Después de cada lote, verifica:
1. Las fotos se muestran correctamente en la web
2. En Supabase Storage → bucket `place-photos` → hay archivos
3. En la BD → columna `photo_urls` tiene valores

### **4. Estrategia Recomendada**

**Fase 1:** Migrar lugares más visitados (Top 100)
- Ahorro inmediato: ~$70/mes
- Tiempo: ~20 minutos

**Fase 2:** Migrar por categorías
- Restaurantes primero (más tráfico)
- Luego bares, cafeterías, hoteles

**Fase 3:** Migrar el resto
- Procesar en lotes de 100
- Ejecutar durante horas de bajo tráfico

---

## 📈 MONITOREO

### **Google Cloud Console**
- Dashboard → APIs & Services
- Verificar que "Places API - Photo" baja drásticamente
- Configurar alerta de presupuesto: $50/mes

### **Supabase Dashboard**
- Storage → Bucket `place-photos`
- Verificar tamaño total: ~3GB esperado
- Revisar que las políticas de acceso público funcionan

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. ✅ **Ejecutar Query #1 y #2** del script SQL para confirmar costos exactos
2. ⏳ **Decidir método de migración:** API endpoint o Script CLI
3. ⏳ **Migración de prueba:** 5-10 lugares para verificar
4. ⏳ **Migración por lotes:** Empezar con top 100 lugares más visitados
5. ⏳ **Monitorear:** Verificar que todo funciona correctamente
6. ⏳ **Continuar migración:** Resto de lugares en lotes

---

## 💡 IMPACTO ESPERADO

### **Antes:**
- ❌ Costo: $2,135/mes
- ❌ Dependencia de Google API
- ❌ Límites de cuota
- ❌ Velocidad: Regular (redirecciones)

### **Después:**
- ✅ Costo: $0.06/mes
- ✅ Independencia total
- ✅ Sin límites
- ✅ Velocidad: Excelente (CDN directo)
- ✅ Ahorro: $25,619/año

---

**Estado:** ⏳ Pendiente de ejecución  
**Prioridad:** 🔥 CRÍTICA  
**Ahorro potencial:** **$25,619/año**  
**Tiempo estimado:** 8-10 horas (en lotes distribuidos)

