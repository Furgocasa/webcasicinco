# 🛠️ Comandos Útiles - Casi Cinco App

## 📋 **Guía Rápida de Comandos**

---

## 🗄️ **1. SUPABASE - SQL**

### **Verificar Integridad de Datos**
```sql
-- Ejecutar en Supabase Dashboard → SQL Editor
@supabase/verificar_integridad_datos.sql
```

**Qué verifica:**
- ✅ Total de lugares vs publicados vs borradores
- ✅ Categorías válidas (restaurante, bar, cafe, hotel)
- ✅ País válido (España)
- ✅ Enriquecimiento IA
- ✅ Fotos presentes
- ✅ Slugs únicos

---

### **Contar Lugares por Estado**
```sql
SELECT 
  COUNT(*) FILTER (WHERE published = true) as publicados,
  COUNT(*) FILTER (WHERE published = false) as borradores,
  COUNT(*) as total
FROM places;
```

---

### **Ver Lugares sin IA (publicados)**
```sql
SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  review_count
FROM places
WHERE ai_description IS NULL
  AND published = true
ORDER BY created_at DESC
LIMIT 20;
```

---

### **Limpiar Trabajos Zombie**
```sql
SELECT cancel_zombie_jobs();
```

---

### **Ver Estadísticas por Categoría**
```sql
SELECT 
  category,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE published = true) as publicados,
  ROUND(AVG(rating), 2) as rating_promedio,
  SUM(review_count) as total_reseñas
FROM places
GROUP BY category
ORDER BY total DESC;
```

---

### **Ver Top 10 Provincias**
```sql
SELECT 
  province,
  COUNT(*) as total_lugares,
  COUNT(*) FILTER (WHERE published = true) as publicados,
  ROUND(AVG(rating), 2) as rating_promedio
FROM places
GROUP BY province
ORDER BY total_lugares DESC
LIMIT 10;
```

---

### **Buscar Lugar por Nombre**
```sql
SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  published,
  created_at
FROM places
WHERE name ILIKE '%nombre%'
ORDER BY created_at DESC;
```

---

### **Lugares Duplicados (mismo slug)**
```sql
SELECT 
  slug,
  COUNT(*) as cantidad,
  array_agg(name) as nombres
FROM places
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;
```

---

### **Despublicar Lugar Específico**
```sql
UPDATE places
SET published = false
WHERE id = 'UUID-DEL-LUGAR';
```

---

### **Publicar Todos los Borradores**
```sql
UPDATE places
SET published = true
WHERE published = false
  AND ai_description IS NOT NULL; -- Solo si tienen IA
```

---

### **Eliminar Lugar por ID**
```sql
DELETE FROM places
WHERE id = 'UUID-DEL-LUGAR';
```

---

### **Ver Últimos Trabajos de Indexación**
```sql
SELECT 
  id,
  status,
  total_places,
  processed_places,
  successful_places,
  started_at,
  completed_at,
  EXTRACT(EPOCH FROM (completed_at - started_at))/60 as duracion_minutos
FROM indexation_jobs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 💻 **2. FRONTEND - Consola del Navegador**

### **Test API Admin Places**
```javascript
// En /admin/lugares, abrir consola:
fetch('/api/admin/places?page=1&limit=10')
  .then(r => r.json())
  .then(d => console.log('Resultado:', d));

// Debe devolver:
// { success: true, places: [...], total: 2612, page: 1, totalPages: 262 }
```

---

### **Test API Public Places**
```javascript
// En /mapa, abrir consola:
fetch('/api/places?limit=100&category=restaurante&province=Madrid')
  .then(r => r.json())
  .then(d => console.log('Lugares:', d.places.length, 'de', d.total));
```

---

### **Ver Estado de Autenticación**
```javascript
// En cualquier página admin:
console.log('User:', await (await fetch('/api/auth/user')).json());
```

---

### **Forzar Recarga Sin Caché**
```javascript
// En cualquier página:
window.location.reload(true);

// O con Ctrl+Shift+R (Windows/Linux)
// O con Cmd+Shift+R (Mac)
```

---

### **Ver Todos los Lugares Cargados**
```javascript
// En /admin/lugares, consola:
console.log('Total lugares cargados:', window.__NEXT_DATA__);
```

---

## 🔧 **3. DESARROLLO LOCAL**

### **Instalar Dependencias**
```bash
npm install
```

---

### **Modo Desarrollo**
```bash
npm run dev
```
Abre: `http://localhost:3000`

---

### **Build para Producción**
```bash
npm run build
```

---

### **Limpiar Caché de Next.js**
```bash
rm -rf .next
npm run build
```

---

### **Verificar TypeScript**
```bash
npx tsc --noEmit
```

---

### **Ver Logs del Servidor**
```bash
# En desarrollo:
npm run dev

# Buscar errores:
grep -r "ERROR" .next/
```

---

## 🧪 **4. TESTING**

### **Test Rápido de Indexación**
1. Ir a `/admin/indexar`
2. Configurar:
   - Provincia: Ávila (pequeña)
   - Categoría: hotel
3. Iniciar
4. Verificar:
   - ✅ Modal se abre
   - ✅ Logs aparecen en tiempo real
   - ✅ Botones pausar/cancelar funcionan

---

### **Test de Eliminación**
```javascript
// En consola del navegador (/admin/lugares):
const placeId = 'PEGAR-ID-DE-LUGAR-AQUI';
fetch(`/api/places/${placeId}`, { method: 'DELETE' })
  .then(r => r.json())
  .then(d => console.log('Eliminado:', d));
```

---

### **Test de Publicación**
```javascript
// En consola:
const placeId = 'PEGAR-ID-AQUI';
fetch(`/api/admin/places/${placeId}/publish`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ published: true })
})
.then(r => r.json())
.then(d => console.log('Publicado:', d));
```

---

## 📊 **5. MONITOREO**

### **Ver Estadísticas en Dashboard**
```
1. Ir a /admin/dashboard
2. Verificar:
   - Total Lugares
   - Publicados
   - Rating Promedio
   - Pendientes IA
   - Cobertura
   - Distribución por Tiers
   - Top 10 Provincias
```

---

### **Ver Logs de Indexación**
```sql
-- En Supabase:
SELECT 
  id,
  status,
  jsonb_array_length(logs) as total_logs,
  logs -> -1 as ultimo_log
FROM indexation_jobs
WHERE status = 'running'
ORDER BY started_at DESC
LIMIT 5;
```

---

### **Ver Último Log de un Trabajo**
```sql
SELECT 
  (logs -> -1)->>'message' as ultimo_mensaje,
  (logs -> -1)->>'timestamp' as timestamp,
  (logs -> -1)->>'level' as nivel
FROM indexation_jobs
WHERE id = 'UUID-DEL-TRABAJO';
```

---

## 🚨 **6. SOLUCIÓN DE PROBLEMAS**

### **Problema: "No se cargan los lugares"**
```sql
-- 1. Verificar cantidad en BD:
SELECT COUNT(*) FROM places;

-- 2. Verificar API:
-- En navegador: /api/admin/places?page=1&limit=10

-- 3. Limpiar caché:
-- Ctrl+Shift+R en navegador
```

---

### **Problema: "Números no cuadran"**
```sql
-- Ejecutar verificación completa:
@supabase/verificar_integridad_datos.sql

-- Ver diferencias:
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE published = true) as publicados,
  COUNT(*) FILTER (WHERE published = false) as borradores
FROM places;
```

---

### **Problema: "Trabajo quedó en running"**
```sql
-- Cancelar trabajos zombie:
SELECT cancel_zombie_jobs();

-- O manualmente:
UPDATE indexation_jobs
SET status = 'failed',
    completed_at = NOW(),
    should_continue = false
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '2 hours';
```

---

### **Problema: "Error al borrar lugar"**
```javascript
// 1. Verificar autenticación:
fetch('/api/auth/user').then(r => r.json()).then(console.log);

// 2. Intentar borrar con log:
const id = 'UUID-LUGAR';
fetch(`/api/places/${id}`, { method: 'DELETE' })
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(console.log)
  .catch(console.error);
```

---

### **Problema: "Error photos.map"**
```sql
-- Verificar campo photos:
SELECT 
  id,
  name,
  jsonb_typeof(photos) as tipo_photos,
  photos
FROM places
WHERE jsonb_typeof(photos) != 'array'
   OR photos IS NULL
LIMIT 10;

-- Corregir:
UPDATE places
SET photos = '[]'::jsonb
WHERE jsonb_typeof(photos) != 'array'
   OR photos IS NULL;
```

---

## 🔐 **7. BACKUP Y RESTAURACIÓN**

### **Backup de Lugares**
```sql
-- En Supabase SQL Editor:
COPY (
  SELECT * FROM places
) TO STDOUT WITH CSV HEADER;

-- Guardar resultado como places_backup.csv
```

---

### **Backup de Trabajos de Indexación**
```sql
COPY (
  SELECT * FROM indexation_jobs
  WHERE created_at >= NOW() - INTERVAL '30 days'
) TO STDOUT WITH CSV HEADER;
```

---

## 📱 **8. ATAJOS DE TECLADO**

### **Navegador:**
- `Ctrl + Shift + R` - Recarga sin caché
- `F12` - Abrir DevTools
- `Ctrl + Shift + C` - Inspeccionar elemento
- `Ctrl + Shift + J` - Consola JavaScript

### **Supabase Dashboard:**
- `Ctrl + Enter` - Ejecutar query SQL
- `Ctrl + /` - Comentar línea

---

## 🎯 **9. COMANDOS DE PRODUCCIÓN**

### **Verificar Estado de Amplify**
```bash
# Ver estado del deployment:
aws amplify get-app --app-id YOUR_APP_ID

# Ver logs:
aws amplify get-branch --app-id YOUR_APP_ID --branch-name main
```

---

### **Invalidar Caché de CloudFront (si aplica)**
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

## ✅ **10. VERIFICACIONES DIARIAS**

### **Checklist Matutino**
```sql
-- 1. Total de lugares
SELECT COUNT(*) FROM places;

-- 2. Trabajos activos
SELECT COUNT(*) FROM indexation_jobs WHERE status = 'running';

-- 3. Trabajos completados hoy
SELECT COUNT(*) FROM indexation_jobs 
WHERE status = 'completed' 
  AND completed_at::date = CURRENT_DATE;

-- 4. Lugares añadidos hoy
SELECT COUNT(*) FROM places 
WHERE created_at::date = CURRENT_DATE;

-- 5. Errores recientes
SELECT COUNT(*) FROM indexation_jobs 
WHERE status = 'failed' 
  AND created_at >= NOW() - INTERVAL '24 hours';
```

---

## 📞 **11. CONTACTO Y AYUDA**

### **Si algo falla:**
1. Ejecutar: `@supabase/verificar_integridad_datos.sql`
2. Revisar logs en consola del navegador (F12)
3. Verificar autenticación: `/api/auth/user`
4. Limpiar caché: Ctrl+Shift+R
5. Revisar documentación: `CONEXION_FRONTEND_BACKEND.md`

---

**📝 Nota:** Guarda este archivo para referencia rápida.

**Última actualización:** 14 de Octubre de 2025

