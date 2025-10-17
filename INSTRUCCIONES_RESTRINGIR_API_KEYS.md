# 🔒 INSTRUCCIONES: Restringir API Keys de Google Maps

**URGENTE - HACER HOY MISMO**  
**Tiempo estimado:** 15-20 minutos  
**Objetivo:** Evitar abusos y reducir costes innecesarios

---

## 🎯 Resumen

Necesitas:
1. **Restringir** tu API Key actual (frontend)
2. **Crear** una segunda API Key (backend)
3. **Actualizar** variables de entorno en AWS Amplify

---

## 📋 PASO 1: Restringir API Key Frontend

### 1.1. Acceder a Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto: **"casi-5-app-474718"** (o el que uses)

### 1.2. Identificar tu API Key Actual

- Busca la API Key que actualmente usas en `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Nombre probable: "API key 1" o similar
- **Haz clic en el nombre** para editarla

### 1.3. Configurar Restricciones de Aplicación

En la sección **"Application restrictions"**:

1. Selecciona: **"HTTP referrers (web sites)"**

2. En **"Website restrictions"**, añade estos dominios:
   ```
   https://casicinco.com/*
   https://www.casicinco.com/*
   https://*.amplifyapp.com/*
   http://localhost:3000/*
   ```

3. Haz clic en **"ADD AN ITEM"** para cada dominio

### 1.4. Configurar Restricciones de API

En la sección **"API restrictions"**:

1. Selecciona: **"Restrict key"**

2. **SOLO MARCA ESTAS APIs:**
   - ✅ Maps JavaScript API
   - ✅ Maps Static API (opcional, si la usas)

3. **DESMARCA TODO LO DEMÁS**, especialmente:
   - ❌ Places API
   - ❌ Places API (New)
   - ❌ Geocoding API
   - ❌ Directions API

4. Haz clic en **"SAVE"**

---

## 📋 PASO 2: Crear API Key para Backend

### 2.1. Crear Nueva API Key

1. En la misma página de credentials, haz clic en: **"+ CREATE CREDENTIALS"**
2. Selecciona: **"API key"**
3. Google creará una nueva key
4. **COPIA LA KEY** y guárdala en un lugar seguro

### 2.2. Renombrar la Key

1. Haz clic en el lápiz (editar) junto a la nueva key
2. Cambia el nombre a: **"Casi5 - Backend Key"**
3. Haz clic en el nombre para editarla

### 2.3. Configurar Restricciones de Aplicación

En **"Application restrictions"**:
- Selecciona: **"None"**
- (Esta key se usa desde el servidor, no desde navegador)

### 2.4. Configurar Restricciones de API

En **"API restrictions"**:

1. Selecciona: **"Restrict key"**

2. **SOLO MARCA ESTAS APIs:**
   - ✅ Places API
   - ✅ Places API (New) (si está disponible)
   - ✅ Geocoding API
   - ✅ Directions API

3. **DESMARCA:**
   - ❌ Maps JavaScript API
   - ❌ Maps Static API
   - ❌ Todo lo demás

4. Haz clic en **"SAVE"**

---

## 📋 PASO 3: Actualizar Variables de Entorno en AWS Amplify

### 3.1. Acceder a AWS Amplify

1. Ve a: https://console.aws.amazon.com/amplify/
2. Selecciona tu app: **"casi-5-app"**
3. En el menú lateral, ve a: **"App settings"** → **"Environment variables"**

### 3.2. Verificar Variables Actuales

Deberías tener:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = [tu key frontend restringida]
GOOGLE_PLACES_API_KEY = [???]
```

### 3.3. Actualizar Variables

1. **Si `GOOGLE_PLACES_API_KEY` ya existe:**
   - Haz clic en **"Edit"**
   - Reemplaza con la **nueva key de backend** que creaste
   - Haz clic en **"Save"**

2. **Si `GOOGLE_PLACES_API_KEY` NO existe:**
   - Haz clic en **"Add variable"**
   - Key: `GOOGLE_PLACES_API_KEY`
   - Value: [tu nueva key de backend]
   - Haz clic en **"Save"**

3. **Verifica que ambas keys sean DIFERENTES:**
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → Key restringida (solo mapa)
   - `GOOGLE_PLACES_API_KEY` → Key backend (solo servidor)

### 3.4. Hacer Redeploy

1. En AWS Amplify, ve a la pestaña **"Deployments"**
2. Haz clic en **"Redeploy this version"** en el último deploy exitoso
3. Espera a que termine el deploy (5-10 minutos)

---

## 📋 PASO 4: Ejecutar Migración de Caché en Supabase

### 4.1. Acceder a Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **"Casi5 App - 2"**
3. En el menú lateral, ve a: **"SQL Editor"**

### 4.2. Ejecutar Migración

1. Haz clic en **"+ New query"**
2. Copia y pega el contenido del archivo: `supabase/migrations/20251017_search_cache.sql`
3. Haz clic en **"Run"**
4. Verifica que diga: **"Success. No rows returned"**

### 4.3. Verificar Tabla Creada

1. En el menú lateral, ve a: **"Table Editor"**
2. Busca la tabla: **"search_cache"**
3. Debería tener las columnas:
   - `id`
   - `search_query`
   - `province`
   - `city`
   - `category`
   - `place_ids`
   - `result_count`
   - `created_at`
   - `expires_at`
   - `last_used_at`

---

## ✅ VERIFICACIÓN FINAL

### Verificar API Keys

1. **Frontend Key (restringida):**
   ```bash
   # En Google Cloud Console > Credentials
   Nombre: API key 1 (o tu nombre original)
   
   Application restrictions: HTTP referrers
   Dominios: casicinco.com, *.amplifyapp.com, localhost
   
   API restrictions: Restrict key
   APIs habilitadas: SOLO Maps JavaScript API
   ```

2. **Backend Key (sin restricción de dominio):**
   ```bash
   # En Google Cloud Console > Credentials
   Nombre: Casi5 - Backend Key
   
   Application restrictions: None
   
   API restrictions: Restrict key
   APIs habilitadas: Places API, Geocoding API, Directions API
   ```

### Verificar Variables en AWS Amplify

```bash
# Environment variables
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIza...XYZ (frontend - restringida)
GOOGLE_PLACES_API_KEY = AIza...ABC (backend - diferente)
```

### Verificar Caché en Supabase

```sql
-- En Supabase SQL Editor
SELECT COUNT(*) FROM search_cache;
-- Debería retornar 0 (tabla vacía pero existe)
```

---

## 🧪 TESTING

### Test 1: Mapa funciona en producción

1. Ve a: https://casicinco.com/mapa
2. Verifica que el mapa se muestra correctamente
3. **NO** debería haber errores en la consola del navegador (F12)

### Test 2: Indexación funciona

1. Ve a: https://casicinco.com/admin/indexar
2. Inicia una indexación de prueba (1 provincia, 1 ciudad)
3. Verifica en los logs:
   - Primera búsqueda: **"🔍 Buscando en Google API"**
   - Al terminar: **"💾 Guardado en caché"**

### Test 3: Caché funciona

1. Repite la misma indexación de prueba
2. Verifica en los logs:
   - **"💾 CACHÉ HIT"** para búsquedas repetidas
   - **"Ahorro: $0.032"**

---

## ⚠️ Solución de Problemas

### Error: "This API key is not authorized to use this service or API"

**Causa:** La API key no tiene permisos para la API que intenta usar

**Solución:**
1. Verifica que la key correcta se usa en cada contexto:
   - Frontend → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Backend → `GOOGLE_PLACES_API_KEY`
2. Verifica que cada key tiene las APIs correctas habilitadas
3. Espera 5 minutos para que los cambios se propaguen

### Error: "RefererNotAllowedMapError"

**Causa:** El dominio no está en la lista de referrers permitidos

**Solución:**
1. Ve a Google Cloud Console
2. Edita la API key frontend
3. Añade el dominio que falta en "Website restrictions"
4. Asegúrate de incluir el `/*` al final

### Caché no funciona

**Causa:** La tabla no existe o no se ejecutó la migración

**Solución:**
1. Ve a Supabase → SQL Editor
2. Ejecuta la migración de nuevo
3. Verifica que la tabla existe

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en AWS Amplify
2. Revisa los logs del navegador (F12 → Console)
3. Verifica las API keys en Google Cloud Console
4. Contacta con el soporte de Google Cloud si es necesario

---

**Última actualización:** 17 de Octubre 2025

