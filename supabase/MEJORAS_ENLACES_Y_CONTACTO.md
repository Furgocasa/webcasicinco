# 🔗 Mejoras: Enlaces y Datos de Contacto en el Chatbot

**Fecha**: 12 de Octubre de 2025  
**Estado**: ✅ Implementado

---

## 📋 Problema Original

El usuario identificó dos problemas críticos:

1. **El chatbot decía "no tengo acceso"** cuando le preguntaban por:
   - Dirección de un lugar
   - Teléfono  
   - Página web
   
   **Pero estos datos SÍ están en la base de datos** ❌

2. **No había enlaces a las páginas de detalle**
   - El chatbot recomendaba lugares pero no facilitaba el acceso
   - Faltaba tráfico intra-web
   - Usuario tenía que buscar manualmente cada lugar ❌

---

## ✅ Solución Implementada

### 1️⃣ **Datos Extendidos en Query** (`app/api/chatbot/route.ts`)

**Antes** (línea 100):
```typescript
.select('id, name, category, rating, review_count, city, province, region')
```

**Ahora**:
```typescript
.select('id, name, slug, category, rating, review_count, city, province, region, address, phone, website')
```

**Nuevos campos disponibles**:
- ✅ `slug` → Para generar enlaces internos
- ✅ `address` → Dirección completa
- ✅ `phone` → Teléfono de contacto
- ✅ `website` → Página web oficial

---

### 2️⃣ **Contexto Enriquecido** (`lib/ai/openai.ts`)

**Antes** (línea 317):
```typescript
`${i + 1}. ${p.name} — ⭐${p.rating} (${p.review_count} reseñas) — ${p.city}, ${p.province} — ${p.category}`
```

**Ahora** (línea 317-323):
```typescript
const slug = p.slug || '';
const internalLink = slug ? `/${p.category}/${p.province?.toLowerCase().replace(/\s+/g, '-')}/${slug}` : '';
const address = p.address ? ` | Dirección: ${p.address}` : '';
const phone = p.phone ? ` | Tel: ${p.phone}` : '';
const website = p.website ? ` | Web: ${p.website}` : '';

return `${i + 1}. ${p.name} — ⭐${p.rating} (${p.review_count} reseñas) — ${p.city}, ${p.province} — ${p.category}${address}${phone}${website} | Ver detalles: ${internalLink}`;
```

**Resultado**: El chatbot recibe TODA la información para cada lugar.

---

### 3️⃣ **System Prompt Actualizado**

**Cambios en "FORMATO DE RESPUESTA"**:

```
- Después, bullets: Nombre — ⭐rating · nº reseñas — Ciudad, Provincia — 
  (valor breve y concreto) — [Ver detalles](/categoria/provincia/slug)
  
- SIEMPRE incluye el enlace [Ver detalles] al final de cada lugar usando 
  el formato del campo "Ver detalles:" en la lista.
  
- Si el usuario pregunta por dirección, teléfono o web, úsalos de los campos 
  disponibles (Dirección, Tel, Web).
```

**Cambios en "PROHIBIDO"**:

```
- Decir "no tengo acceso a información", "no puedo", "no sé" cuando SÍ tienes 
  los datos (dirección, teléfono, web están disponibles en la lista).
  
- Omitir el enlace [Ver detalles] en las recomendaciones (siempre inclúyelo 
  para facilitar la navegación).
```

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Recomendación con Enlaces

**Usuario**: "mejores restaurantes en málaga"

**Antes** ❌:
> "Los 5 mejores restaurantes de Málaga son:
> 
> 1. **El Pimpi** — ⭐4.8 (12,300 reseñas) — Málaga, Málaga
> 2. **El Mesón de Cervantes** — ⭐4.7 (8,500 reseñas) — Málaga, Málaga"

**Ahora** ✅:
> "Según los datos de los que disponemos, los 5 mejores restaurantes son:
> 
> 1. **El Pimpi** — ⭐4.8 (12,300 reseñas) — Málaga, Málaga — [Ver detalles](/restaurante/malaga/el-pimpi-malaga)
> 2. **El Mesón de Cervantes** — ⭐4.7 (8,500 reseñas) — Málaga, Málaga — [Ver detalles](/restaurante/malaga/meson-de-cervantes)"

---

### Ejemplo 2: Pregunta por Dirección

**Usuario**: "¿Cuál es la dirección de El Pimpi?"

**Antes** ❌:
> "Lo siento, no tengo acceso a información específica sobre direcciones."

**Ahora** ✅:
> "El Pimpi está ubicado en Calle Granada, 62, 29015 Málaga. 
> 
> [Ver detalles completos](/restaurante/malaga/el-pimpi-malaga)"

---

### Ejemplo 3: Pregunta por Teléfono y Web

**Usuario**: "dame el teléfono y web de El Mesón de Cervantes"

**Antes** ❌:
> "Lo siento, no tengo acceso a esa información. Te recomiendo buscarlo en Google."

**Ahora** ✅:
> "El Mesón de Cervantes:
> 
> - 📞 Teléfono: +34 952 21 62 74
> - 🌐 Web: www.mesondeservantes.com
> 
> [Ver todos los detalles](/restaurante/malaga/meson-de-cervantes)"

---

## 🎯 Beneficios

### Para el Usuario:
✅ **Acceso directo** a información de contacto sin salir del chat  
✅ **Un clic** para ver detalles completos del lugar  
✅ **Experiencia fluida** navegando entre chatbot y páginas  
✅ **Más confianza** en las recomendaciones (ve que hay datos reales)

### Para el Negocio:
✅ **Aumento del tráfico interno** (de chatbot → páginas de detalle)  
✅ **Más conversiones** (usuarios llegan más rápido a las páginas)  
✅ **Mejor engagement** (menos abandonos por falta de información)  
✅ **Datos útiles** para analytics (origen: chatbot)

---

## 📊 Formato de Enlaces Internos

**Estructura**:
```
/[category]/[province]/[slug]
```

**Ejemplos**:
```
/restaurante/malaga/el-pimpi-malaga
/hotel/barcelona/hotel-arts-barcelona
/spa/valencia/balneario-chulilla
/bar/madrid/bar-cock-madrid
```

**Nota**: Las provincias con espacios se reemplazan por guiones:
- "Islas Baleares" → "islas-baleares"
- "Las Palmas" → "las-palmas"

---

## 🔧 Instalación

### Paso 1: Código ya actualizado ✅

Los cambios en el código ya están aplicados en:
- `app/api/chatbot/route.ts` (query extendida)
- `lib/ai/openai.ts` (contexto enriquecido + prompt)

### Paso 2: Actualizar Base de Datos

Ejecuta el siguiente SQL en **Supabase SQL Editor**:

```bash
# Archivo: supabase/22-prompt-con-enlaces-y-datos.sql
```

**Cómo ejecutarlo**:

1. Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/sql
2. Copia y pega el contenido de `22-prompt-con-enlaces-y-datos.sql`
3. Haz clic en **"Run"**
4. Verifica que aparece: `"System Prompt actualizado con enlaces y datos de contacto"`

### Paso 3: Probar

**Recarga la aplicación** (Ctrl+R) y prueba:

```
👤 Usuario: "mejores restaurantes en madrid"
🤖 Tío Viajero: [Debería incluir enlaces [Ver detalles] en cada recomendación]

👤 Usuario: "¿cuál es la dirección de [nombre del restaurante]?"
🤖 Tío Viajero: [Debería dar la dirección completa + enlace]

👤 Usuario: "dame el teléfono de [nombre del hotel]"
🤖 Tío Viajero: [Debería dar el teléfono + enlace]
```

---

## 📈 Métricas a Monitorear

### 1. Tráfico del Chatbot a Páginas

```sql
-- Analizar clicks desde el chatbot (si tienes analytics)
SELECT 
  referrer,
  COUNT(*) as visitas
FROM page_views
WHERE referrer LIKE '%chatbot%'
GROUP BY referrer
ORDER BY visitas DESC;
```

### 2. Preguntas sobre Datos de Contacto

```sql
-- Mensajes preguntando por dirección/teléfono/web
SELECT message, created_at 
FROM chat_history 
WHERE role = 'user' 
  AND (
    message ILIKE '%dirección%' OR 
    message ILIKE '%dirección%' OR
    message ILIKE '%teléfono%' OR
    message ILIKE '%telefono%' OR
    message ILIKE '%web%' OR
    message ILIKE '%página%' OR
    message ILIKE '%sitio%'
  )
ORDER BY created_at DESC
LIMIT 50;
```

### 3. Uso de "Ver detalles"

```sql
-- Respuestas del chatbot con enlaces
SELECT message, created_at 
FROM chat_history 
WHERE role = 'assistant' 
  AND message LIKE '%Ver detalles%'
ORDER BY created_at DESC
LIMIT 50;
```

---

## ✅ Checklist de Implementación

- [x] Extender query en `searchPlacesTool` con `slug`, `address`, `phone`, `website`
- [x] Actualizar contexto en `openai.ts` para incluir todos los datos
- [x] Actualizar format en `openai.ts` para generar enlaces internos
- [x] Actualizar system prompt con instrucciones de enlaces
- [x] Actualizar "PROHIBIDO" para no decir "no tengo acceso"
- [x] Crear script SQL `22-prompt-con-enlaces-y-datos.sql`
- [ ] **Ejecutar SQL en Supabase** ← PENDIENTE (hazlo tú)
- [ ] Recargar aplicación y probar
- [ ] Verificar con ejemplos reales
- [ ] Monitorear tráfico del chatbot a páginas

---

## 🚀 Próximas Mejoras

### Corto Plazo:
- [ ] Agregar botones clickeables en vez de solo enlaces markdown
- [ ] Incluir fotos en miniatura en las respuestas
- [ ] Agregar horarios de apertura si están disponibles

### Medio Plazo:
- [ ] Tracking de clicks en enlaces del chatbot
- [ ] Sugerencias proactivas: "¿Quieres ver el menú?" "¿Reservar mesa?"
- [ ] Integración con Google Maps para "Cómo llegar"

---

**¡Listo para usar!** 🎉

Con estas mejoras, el chatbot pasa de ser solo informativo a ser una **herramienta de navegación activa** que impulsa el tráfico interno y mejora la experiencia del usuario.


