# 📍 ACTIVAR GEOLOCALIZACIÓN EN TÍO VIAJERO IA

**Fecha:** 30 Octubre 2025  
**Estado:** Código implementado ✅ - Requiere migración en Supabase ⚠️

---

## 🎯 OBJETIVO

Hacer que el **Tío Viajero IA** pueda:
1. ✅ Detectar la ubicación GPS del usuario
2. ✅ Responder a preguntas como "¿dónde estoy?"
3. ✅ Recomendar lugares cercanos usando distancia real (km)
4. ✅ Mencionar distancias: "Restaurante X a 8.5km de ti"

---

## ⚠️ ACCIÓN REQUERIDA

La funcionalidad está **100% programada** en el código, pero necesitas **ejecutar una migración SQL** en Supabase para activarla.

---

## 📋 PASOS PARA ACTIVAR

### **PASO 1: Verificar si ya está activada**

1. Ve a: [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **Casi Cinco**
3. Ve a: **SQL Editor**
4. Copia y pega el contenido de:
   ```
   supabase/diagnostics/verificar_funcion_proximidad.sql
   ```
5. Haz clic en **Run**

**¿Qué esperar?**
- ✅ Si ves `search_places_by_proximity` en los resultados → **Ya está activada, no necesitas hacer nada**
- ❌ Si NO aparece nada → **Continúa con el PASO 2**

---

### **PASO 2: Ejecutar la migración (si no está activada)**

1. Abre el archivo:
   ```
   supabase/migrations/20251030_search_places_by_proximity.sql
   ```

2. Copia **TODO** el contenido del archivo

3. Vuelve a: [Supabase SQL Editor](https://supabase.com/dashboard)

4. Pega el contenido y haz clic en **Run**

5. Deberías ver:
   ```
   ✅ CREATE FUNCTION
   ✅ CREATE INDEX
   ```

6. Si ves errores, consulta la sección **"🔧 SOLUCIÓN DE PROBLEMAS"** abajo

---

### **PASO 3: Probar que funciona**

#### **Opción A: Desde Supabase SQL Editor**

Ejecuta esta consulta de prueba:

```sql
-- Buscar restaurantes en 50km desde Almería (36.84, -2.46)
SELECT 
  name,
  city,
  province,
  ROUND(distance_km::numeric, 2) as "Distancia (km)",
  rating
FROM public.search_places_by_proximity(
    36.84,           -- user_lat
    -2.46,           -- user_lng
    50000,           -- radius_meters (50km)
    'restaurante',   -- place_category
    NULL,            -- price_level_filter
    NULL,            -- text_search_term
    10               -- result_limit
)
ORDER BY distance_km;
```

**Resultado esperado:**
```
name                     | city    | province | Distancia (km) | rating
-------------------------|---------|----------|----------------|-------
Restaurante Los Mellizos | Almería | Almería  | 2.30           | 4.6
Casa Puga                | Almería | Almería  | 1.85           | 4.5
...
```

#### **Opción B: Desde el Chatbot**

1. Abre: [https://casicinco.com](https://casicinco.com)
2. Abre el chatbot (Tío Viajero) en la esquina inferior derecha
3. **Comparte tu ubicación** cuando el navegador te lo pida
4. Escribe cualquiera de estas preguntas:
   - **"¿dónde estoy?"**
   - **"restaurantes cerca de mí"**
   - **"bares aquí"**
   - **"hoteles cerca"**

**Respuestas esperadas:**

Si preguntas **"¿dónde estoy?"**:
```
Estás en Madrid, Madrid (Comunidad de Madrid). 
¿Te gustaría que te recomiende algún lugar cercano?
```

Si preguntas **"restaurantes cerca de mí"**:
```
Aquí tienes restaurantes cerca de ti:

1. La Barraca — ⭐4.6 · 1.230 reseñas — a 2.3km de ti en Madrid
   [Ver detalles](/restaurante/madrid/la-barraca) | [Ver en mapa](/mapa?place=xxx)

2. Casa Lucio — ⭐4.5 · 890 reseñas — a 3.7km de ti en Madrid
   [Ver detalles](/restaurante/madrid/casa-lucio) | [Ver en mapa](/mapa?place=xxx)
...
```

---

## 🔍 CÓMO SABER SI ESTÁ FUNCIONANDO

### **Indicadores visuales:**

1. **Al abrir el chat**, verás:
   - 📍 Notificación: "Ubicación compartida"
   - Badge verde: "Ubicación compartida - Puedes preguntar por lugares cerca de mí"

2. **En el mensaje de bienvenida**, verás líneas adicionales:
   - 📍 "Tengo tu ubicación. Puedes preguntarme por lugares 'cerca' o 'aquí'"
   - 📍 "Restaurante de pescado cerca de mí"
   - 🍔 "Hamburguesería económica aquí"

### **Logs del navegador:**

Abre la consola del navegador (F12) y busca:

```
📍 Ubicación obtenida: {lat: 36.84, lng: -2.46}
📍 Ubicación recibida: 36.84, -2.46
📍 Ubicación detectada: Almería, Almería
📍 Búsqueda por proximidad: lat=36.84, lng=-2.46, radio=50km
✅ Encontrados 8 lugares por proximidad
```

### **Logs del servidor (Vercel):**

Si tienes acceso a logs de Vercel, busca:

```
📍 Ubicación recibida: 36.84, -2.46
📍 Ubicación detectada: Almería, Almería
🌍 Búsqueda por proximidad GPS activada
📍 Encontrados 8 lugares por proximidad GPS
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### **Error: `function public.search_places_by_proximity does not exist`**

**Causa:** La migración no se ejecutó correctamente.

**Solución:**
1. Vuelve al **PASO 2**
2. Asegúrate de copiar **TODO** el contenido del archivo
3. Ejecuta de nuevo en SQL Editor

---

### **Error: `permission denied for function`**

**Causa:** Los usuarios anónimos/autenticados no tienen permisos.

**Solución:**
```sql
GRANT EXECUTE ON FUNCTION public.search_places_by_proximity 
TO anon, authenticated;
```

---

### **Error: `type "geography" does not exist`**

**Causa:** PostGIS no está habilitado.

**Solución:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Luego vuelve a ejecutar la migración completa.

---

### **Error: `column "distance_km" does not exist`**

**Causa:** La función no devuelve el campo `distance_km`.

**Solución:**
1. Verifica que ejecutaste la versión correcta de la migración
2. La función debe tener en su RETURNS TABLE:
   ```sql
   distance_km NUMERIC
   ```

---

### **El chatbot dice "No tengo lugares cerca" pero sé que hay**

**Causa:** Pocas coordenadas GPS en la base de datos.

**Diagnóstico:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(latitude) FILTER (WHERE latitude IS NOT NULL) as con_coords,
  ROUND(100.0 * COUNT(latitude) FILTER (WHERE latitude IS NOT NULL) / COUNT(*), 2) as porcentaje
FROM places
WHERE published = true;
```

**Solución:**
- Si el porcentaje es <90%, necesitas ejecutar el geocoding de lugares
- Ve a: `/admin/indexar` y reindexar lugares sin coordenadas

---

### **Las distancias son incorrectas**

**Causa:** Coordenadas invertidas (lng, lat en lugar de lat, lng).

**Diagnóstico:**
```sql
-- Verificar algunas coordenadas conocidas
SELECT 
  name, 
  city, 
  latitude, 
  longitude 
FROM places 
WHERE city = 'Madrid' 
LIMIT 5;
```

Coordenadas correctas de Madrid:
- Latitud: ~40.4 (positivo)
- Longitud: ~-3.7 (negativo)

Si están al revés, reporta el problema.

---

### **El navegador no pide permiso de ubicación**

**Causas posibles:**
1. Ya denegaste el permiso anteriormente
2. El sitio no está en HTTPS (localhost está OK)
3. Navegador no soporta geolocalización

**Solución:**
1. Abre configuración del navegador → Permisos → Ubicación
2. Busca `casicinco.com` (o `localhost`)
3. Cambia a "Permitir"
4. Recarga la página

---

### **Chrome Desktop no pide ubicación**

**Causa:** Chrome Desktop usa geolocalización por IP/WiFi (menos precisa).

**Comportamiento esperado:**
- ✅ Móvil: GPS preciso (±10-50m)
- ⚠️ Desktop: IP/WiFi aproximado (±1-5km)
- 📱 La precisión se muestra en la notificación

**No es un error**, la funcionalidad sigue funcionando.

---

## 📊 RADIO DE BÚSQUEDA

**Actual:** 50km desde la ubicación del usuario

**Cambiar el radio:**

Edita: `app/api/chatbot/route.ts` línea ~220:

```typescript
radiusKm: 50     // 🆕 Buscar en radio de 50km
```

Opciones recomendadas:
- **30km**: Zonas urbanas densas (Madrid, Barcelona)
- **50km**: Default (funciona bien en general)
- **100km**: Zonas rurales o con pocos lugares indexados

---

## 🎯 PALABRAS CLAVE DETECTADAS

El sistema detecta estas palabras para activar búsqueda GPS:

- ✅ **"cerca"** → "restaurantes cerca"
- ✅ **"aquí"** / **"aqui"** → "hoteles aquí"
- ✅ **"cerca de mí"** / **"cerca de mi"** → "bares cerca de mí"
- ✅ **"en mi zona"** → "spas en mi zona"
- ✅ **"alrededor"** → "lugares alrededor"
- ✅ **"cercano"** / **"cercanos"** → "restaurantes cercanos"
- ✅ **"por donde estoy"** → "hoteles por donde estoy"
- ✅ **"donde estoy"** / **"dónde estoy"** → "¿dónde estoy?"
- ✅ **"mi ubicación"** / **"mi ubicacion"** → "¿cuál es mi ubicación?"
- ✅ **"ubicación actual"** → "mi ubicación actual"

---

## 📚 ARCHIVOS CLAVE

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/20251030_search_places_by_proximity.sql` | Función SQL PostGIS |
| `supabase/diagnostics/verificar_funcion_proximidad.sql` | Diagnóstico |
| `app/api/chatbot/route.ts` | Detección de intención y búsqueda |
| `lib/ai/openai.ts` | System prompt de la IA |
| `components/ChatbotFloating.tsx` | UI del chatbot |
| `lib/google/geocoding.ts` | Conversión coords → ciudad/provincia |

---

## ✅ CHECKLIST COMPLETO

- [ ] **PASO 1:** Verificar si la función existe (SQL diagnóstico)
- [ ] **PASO 2:** Ejecutar migración (si no existe)
- [ ] **PASO 3A:** Probar desde SQL Editor (consulta de prueba)
- [ ] **PASO 3B:** Probar desde chatbot (preguntar "¿dónde estoy?")
- [ ] Verificar que aparece notificación de ubicación compartida
- [ ] Verificar que menciona distancias: "a X km de ti"
- [ ] Verificar que ordena por proximidad real
- [ ] Probar en móvil (GPS preciso)
- [ ] Probar en desktop (WiFi/IP aproximado)

---

## 🚀 ESTADO FINAL ESPERADO

Una vez activado:

| Feature | Estado ANTES | Estado DESPUÉS |
|---------|--------------|----------------|
| Búsqueda por ciudad | ✅ Funciona | ✅ Funciona |
| Búsqueda por provincia | ✅ Funciona | ✅ Funciona |
| "¿dónde estoy?" | ❌ No responde | ✅ "Estás en Madrid, Madrid" |
| "restaurantes cerca" | ❌ Busca por ciudad (texto) | ✅ Busca por GPS (distancia real) |
| Ordena por distancia | ❌ No | ✅ Sí (por distance_km) |
| Menciona distancias | ❌ No | ✅ "a 8.5km de ti" |
| Precisión desktop | ❌ N/A | ⚠️ WiFi/IP (±1-5km) |
| Precisión móvil | ❌ N/A | ✅ GPS (±10-50m) |

---

## 🎉 RESULTADO FINAL

El **Tío Viajero IA** podrá:

1. ✅ **Detectar tu ubicación automáticamente** cuando abres el chat
2. ✅ **Responder "¿dónde estoy?"** con tu ciudad, provincia y región
3. ✅ **Recomendar lugares cercanos** ordenados por distancia real (km)
4. ✅ **Mencionar distancias** en cada recomendación: "a 8.5km de ti"
5. ✅ **Ajustar el radio** de búsqueda según la densidad de lugares
6. ✅ **Funcionar en móvil y desktop** con diferentes niveles de precisión

---

**¿LISTO? ¡Ejecuta la migración y el Tío Viajero tendrá súper poderes GPS! 🗺️✨**

---

## 💬 SOPORTE

Si tienes problemas:
1. Revisa los logs del navegador (F12 → Console)
2. Revisa los logs de Vercel (si tienes acceso)
3. Ejecuta el SQL de diagnóstico
4. Verifica que PostGIS está habilitado
5. Comprueba que los lugares tienen coordenadas


