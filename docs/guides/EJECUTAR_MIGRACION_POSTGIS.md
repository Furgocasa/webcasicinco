# 🗺️ EJECUTAR MIGRACIÓN POSTGIS - Búsqueda por Proximidad GPS

## ⚠️ ACCIÓN REQUERIDA

Para activar la búsqueda por proximidad GPS en el **Tío Viajero**, necesitas ejecutar una migración SQL en Supabase.

---

## 📋 PASOS PARA EJECUTAR

### 1️⃣ **Acceder a Supabase SQL Editor**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **Casi Cinco**
3. En el menú lateral, haz clic en: **SQL Editor**

### 2️⃣ **Abrir el archivo de migración**

Abre el archivo:
```
supabase/migrations/20251030_search_places_by_proximity.sql
```

### 3️⃣ **Copiar y Pegar el SQL**

1. Copia **TODO** el contenido del archivo
2. Pega en el SQL Editor de Supabase
3. Haz clic en **Run** (o pulsa `Ctrl+Enter` / `Cmd+Enter`)

### 4️⃣ **Verificar que se ejecutó correctamente**

Deberías ver mensajes como:
```
✅ CREATE FUNCTION
✅ CREATE INDEX
```

Si ves errores, revisa que:
- El usuario tenga permisos de crear funciones
- PostGIS esté habilitado (debería estar por defecto)
- No haya conflictos con funciones existentes

---

## 🔍 QUÉ HACE ESTA MIGRACIÓN

### **Crea la función `search_places_by_proximity`**

Esta función:
- ✅ Recibe coordenadas GPS del usuario (lat/lng)
- ✅ Recibe radio de búsqueda (metros)
- ✅ Filtra por categoría, price_level, texto
- ✅ Usa **ST_DWithin** para búsqueda espacial eficiente
- ✅ Usa **ST_Distance** para calcular distancia exacta (km)
- ✅ Ordena por distancia → rating → reseñas
- ✅ Devuelve campo `distance_km` para cada lugar

### **Crea el índice espacial**

```sql
CREATE INDEX idx_places_location ON places 
USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography);
```

Este índice:
- ✅ Acelera búsquedas espaciales con PostGIS
- ✅ Hace que ST_DWithin sea instantáneo (even con 10k+ lugares)
- ✅ Usa tipo `GIST` (Generalized Search Tree) para geografías

---

## 🧪 PROBAR QUE FUNCIONA

### **Desde Supabase SQL Editor:**

```sql
-- Buscar restaurantes en 50km desde Almería (36.84, -2.46)
SELECT name, city, province, distance_km
FROM public.search_places_by_proximity(
    36.84,           -- user_lat
    -2.46,           -- user_lng
    50000,           -- radius_meters (50km)
    'restaurante',   -- place_category
    NULL,            -- price_level_filter
    NULL,            -- text_search_term
    10               -- result_limit
);
```

**Resultado esperado:**
```
name                     | city    | province | distance_km
-------------------------|---------|----------|------------
Restaurante Los Mellizos | Almería | Almería  | 2.30
Casa Puga                | Almería | Almería  | 1.85
El Quinto Toro           | Níjar   | Almería  | 15.42
...
```

### **Desde el Chatbot:**

1. Abre Casi Cinco: https://casicinco.com
2. Abre el chatbot (Tío Viajero)
3. Comparte tu ubicación cuando te lo pida
4. Escribe: **"restaurantes cerca de mí"**
5. Deberías ver:
   - ✅ Lugares ordenados por distancia
   - ✅ Distancias en km: "Restaurante X a 8.5km de ti"
   - ✅ Solo lugares dentro del radio (50km)

---

## 🚀 ESTADO TRAS LA MIGRACIÓN

| Feature | Estado ANTES | Estado DESPUÉS |
|---------|-------------|----------------|
| Búsqueda por ciudad | ✅ Funciona | ✅ Funciona |
| Búsqueda por provincia | ✅ Funciona | ✅ Funciona |
| Búsqueda "cerca de mí" | ❌ Busca por ciudad (texto) | ✅ Busca por GPS (distancia real) |
| Ordena por distancia | ❌ No tiene distancia | ✅ Ordena por distance_km |
| Menciona distancias | ❌ No | ✅ "a 8.5km de ti" |
| Casos ambiguos (Murcia) | ❌ Solo capital | ✅ Toda provincia |

---

## 📊 MONITOREO

Después de ejecutar, verifica en logs:

```bash
# En Vercel logs, busca:
📍 Búsqueda por proximidad: lat=36.84, lng=-2.46, radio=50km
✅ Encontrados 8 lugares por proximidad
```

Si ves:
```bash
❌ Error en búsqueda por proximidad: function public.search_places_by_proximity does not exist
```

→ La migración NO se ejecutó. Repite los pasos.

---

## ❓ PROBLEMAS COMUNES

### **Error: `function does not exist`**
→ La migración no se ejecutó. Vuelve a ejecutar el SQL.

### **Error: `permission denied for function`**
→ El usuario de la API no tiene permisos. Ejecuta:
```sql
GRANT EXECUTE ON FUNCTION public.search_places_by_proximity TO anon, authenticated;
```

### **Error: `type "geography" does not exist`**
→ PostGIS no está habilitado. Ejecuta:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### **La búsqueda es lenta (>2s)**
→ El índice no se creó. Ejecuta:
```sql
CREATE INDEX IF NOT EXISTS idx_places_location ON public.places 
USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography);
```

---

## ✅ CHECKLIST

- [ ] Acceder a Supabase SQL Editor
- [ ] Copiar contenido de `supabase/migrations/20251030_search_places_by_proximity.sql`
- [ ] Pegar en SQL Editor
- [ ] Ejecutar (Run)
- [ ] Verificar: `✅ CREATE FUNCTION` y `✅ CREATE INDEX`
- [ ] Probar desde SQL Editor (consulta de prueba)
- [ ] Probar desde chatbot: "restaurantes cerca de mí"
- [ ] Verificar que menciona distancias: "a X km de ti"

---

## 🎯 PRÓXIMOS PASOS

Una vez ejecutada la migración:

1. ✅ **Búsqueda GPS funcionará automáticamente**
2. ✅ **No requiere redeploy** (solo cambio en BD)
3. ✅ **Funcionará en todos los ambientes** (dev, staging, prod)
4. 🔄 **Considera aumentar el radio** si hay pocas zonas cubiertas:
   - Actual: 50km
   - Editar en: `app/api/chatbot/route.ts` línea ~220 (`radiusKm: 50`)

---

## 📚 DOCUMENTACIÓN

- **Función SQL:** `supabase/migrations/20251030_search_places_by_proximity.sql`
- **API Chatbot:** `app/api/chatbot/route.ts` (líneas 210-230)
- **System Prompt:** `lib/ai/openai.ts` (líneas 347-354)
- **Frontend:** `components/ChatbotFloating.tsx` (líneas 150-170)

---

**¿LISTO? ¡Ejecuta la migración y el Tío Viajero tendrá súper poderes GPS! 🗺️✨**














