# 🔧 FIX: Error de tipos en función de proximidad GPS

**Error:**
```
ERROR: 42804: structure of query does not match function result type
DETAIL: Returned type character varying does not match expected type text in column 2.
```

---

## 🎯 CAUSA DEL PROBLEMA

La tabla `places` tiene columnas con tipo `VARCHAR` (character varying), pero la función las declaraba como `TEXT`. PostgreSQL es estricto con los tipos y no hace conversión automática.

---

## ✅ SOLUCIÓN RÁPIDA

### **Opción 1: Ejecutar la versión corregida (RECOMENDADO)**

1. Ve a: [Supabase SQL Editor](https://supabase.com/dashboard)

2. Copia **TODO** el contenido de:
   ```
   supabase/migrations/20251030_search_places_by_proximity_FIXED.sql
   ```

3. Pega en SQL Editor y haz clic en **Run**

4. Deberías ver:
   ```
   ✅ DROP FUNCTION (si existía)
   ✅ CREATE FUNCTION
   ✅ GRANT
   ✅ CREATE INDEX
   ✅ COMMENT
   ```

---

### **Opción 2: Verificar tipos primero (DIAGNÓSTICO)**

Si quieres entender el problema antes:

1. Ejecuta el diagnóstico:
   ```
   supabase/diagnostics/verificar_tipos_columnas.sql
   ```

2. Compara los tipos reales con los esperados por la función

3. Luego ejecuta la versión FIXED (Opción 1)

---

## 🔍 QUÉ HACE LA VERSIÓN CORREGIDA

La nueva versión incluye **conversiones explícitas** usando `::TEXT`:

```sql
SELECT 
  p.id,
  p.name::TEXT,        -- ✅ Convierte VARCHAR → TEXT
  p.slug::TEXT,        -- ✅ Convierte VARCHAR → TEXT
  p.category::TEXT,    -- ✅ Convierte VARCHAR → TEXT
  p.city::TEXT,        -- ✅ Convierte VARCHAR → TEXT
  p.province::TEXT,    -- ✅ Convierte VARCHAR → TEXT
  ...
```

Esto asegura que **todos los tipos coincidan exactamente** con lo declarado en `RETURNS TABLE`.

---

## 🧪 PROBAR QUE FUNCIONA

Después de ejecutar la versión FIXED:

```sql
-- Prueba básica: 5 lugares cerca de Madrid
SELECT 
  name,
  city,
  province,
  ROUND(distance_km, 2) as "Distancia (km)",
  rating
FROM search_places_by_proximity(
  40.416775,  -- Madrid lat
  -3.703790,  -- Madrid lng
  30000,      -- 30km radio
  NULL,       -- Todas las categorías
  NULL,       -- Todos los precios
  NULL,       -- Sin filtro de texto
  5           -- Top 5
);
```

**Resultado esperado:**
```
name                | city   | province | Distancia (km) | rating
--------------------|--------|----------|----------------|-------
DiverXO             | Madrid | Madrid   | 3.24           | 4.7
La Terraza del Casino| Madrid| Madrid   | 1.85           | 4.6
...
```

---

## 📋 CAMBIOS EN LA VERSIÓN FIXED

| Item | Original | Fixed |
|------|----------|-------|
| Conversión de tipos | ❌ Implícita | ✅ Explícita (::TEXT) |
| DROP antes de CREATE | ❌ No | ✅ Sí (limpia función antigua) |
| GRANT permisos | ❌ No | ✅ Sí (anon, authenticated) |
| STABLE attribute | ❌ No | ✅ Sí (optimización) |
| Comentarios | ✅ Sí | ✅ Sí (mejorados) |

---

## ⚠️ NOTAS IMPORTANTES

1. **El DROP FUNCTION es seguro:**
   - Solo afecta a la función de proximidad
   - No borra datos de la tabla `places`
   - No afecta otras funciones

2. **Los permisos GRANT son necesarios:**
   - Sin ellos, usuarios anónimos no pueden ejecutar la función
   - El chatbot usa autenticación, así que necesita `authenticated`

3. **STABLE attribute:**
   - Indica que la función no modifica la BD
   - Permite a PostgreSQL optimizar mejor las queries
   - Es más eficiente que VOLATILE (default)

---

## 🎯 DESPUÉS DE EJECUTAR

1. ✅ Vuelve al chatbot y prueba:
   - "¿dónde estoy?"
   - "restaurantes cerca de mí"

2. ✅ Verifica en la consola del navegador (F12):
   ```
   📍 Búsqueda por proximidad: lat=..., lng=..., radio=50km
   ✅ Encontrados X lugares por proximidad
   ```

3. ✅ Si ves el mensaje anterior, **¡TODO FUNCIONA!** 🎉

---

## 🔧 SI SIGUE SIN FUNCIONAR

### **Error: permission denied**
```sql
GRANT EXECUTE ON FUNCTION search_places_by_proximity(
  DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT, INTEGER, TEXT, INTEGER
) TO anon, authenticated;
```

### **Error: function does not exist**
- Vuelve a ejecutar el script FIXED completo
- Asegúrate de copiar TODO el contenido

### **Error: type "geography" does not exist**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
Luego vuelve a ejecutar el script FIXED.

### **No encuentra lugares (0 results)**
- Verifica que los lugares tienen coordenadas:
```sql
SELECT COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) 
FROM places WHERE published = true;
```
- Si es bajo (<90%), reindexar lugares en `/admin/indexar`

---

## ✅ CHECKLIST

- [ ] Ejecutar `verificar_tipos_columnas.sql` (opcional, para diagnóstico)
- [ ] Ejecutar `20251030_search_places_by_proximity_FIXED.sql` completo
- [ ] Verificar: `✅ CREATE FUNCTION` en el resultado
- [ ] Verificar: `✅ GRANT` en el resultado
- [ ] Probar query de prueba (Madrid 30km)
- [ ] Abrir chatbot y compartir ubicación
- [ ] Preguntar "¿dónde estoy?"
- [ ] Preguntar "restaurantes cerca de mí"
- [ ] Verificar que menciona distancias: "a X km de ti"

---

**¡Con esto debería funcionar perfectamente! 🚀**


