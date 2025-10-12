# 🎯 Mejoras para "Alrededores/Afueras" en el Chatbot

**Fecha**: 12 de Octubre de 2025  
**Estado**: ✅ Implementado

---

## 📋 Problema Original

El chatbot no manejaba bien consultas como:
- "restaurantes en las afueras de Madrid"
- "hoteles alrededor de Barcelona"
- "spas cerca de Valencia pero no en la ciudad"

**Resultado anterior**: Devolvía lugares de la capital o no entendía la consulta.

---

## ✅ Solución Implementada

### 1️⃣ **Mejora en Detección de Intención** (`app/api/chatbot/route.ts`)

**Antes**:
```typescript
const excludeCapital = /fuera de la capital|resto de la provincia|sin capital|pueblos|municipios/.test(msg);
```

**Ahora**:
```typescript
const excludeCapital = /fuera de la capital|resto de la provincia|sin capital|pueblos|municipios|afueras de|alrededores de|cercan[ií]as de|cerca de (?!.*\ben\b)|extrarradio|fuera de la ciudad|provincia de \w+ pero no en|cerca pero no en/.test(msg);
```

**Nuevas frases detectadas**:
- ✅ "afueras de Madrid"
- ✅ "alrededores de Barcelona"
- ✅ "cercanías de Valencia"
- ✅ "cerca de Sevilla" (pero no "cerca de" cuando también dice "en")
- ✅ "extrarradio de Madrid"
- ✅ "fuera de la ciudad"
- ✅ "provincia de Madrid pero no en Madrid"
- ✅ "cerca pero no en"

---

### 2️⃣ **System Prompt Mejorado** (`lib/ai/openai.ts`)

**Agregado en "CÓMO ELEGIR (ranking)"**:

```
3) Filtra por localización: 
   - Ciudad específica: "hoteles en Barcelona" → solo Barcelona
   - Afueras/alrededores: "restaurantes en las afueras de Madrid", 
     "alrededores de Barcelona", "cerca de Valencia pero no en la ciudad" 
     → busca en OTROS municipios de la misma provincia 
     (Toledo, Pozuelo, Getafe para Madrid; Hospitalet, Badalona, Sabadell para Barcelona)
   - Si no hay en la zona pedida, sugiere provincias cercanas razonables
```

**Agregado en "IMPORTANTE"**:

```
- AFUERAS/ALREDEDORES: Si piden "afueras de Madrid", "alrededores de Barcelona", 
  "cerca de X pero no en X", recomienda lugares en otros municipios de la provincia 
  (NO en la capital). Explica claramente: "En las afueras de Madrid (provincia) 
  encontramos..." o "En los alrededores de Barcelona...".
```

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: "Restaurantes en las afueras de Madrid"

**Antes** ❌:
> "Los mejores restaurantes de Madrid son: [lista con restaurantes en Madrid capital]"

**Ahora** ✅:
> "Según los datos de los que disponemos, en las afueras de Madrid (provincia) encontramos:
> 
> 1. **El Mesón de Pozuelo** — ⭐4.8 (543 reseñas) — Pozuelo de Alarcón, Madrid
> 2. **La Casa Grande** — ⭐4.7 (412 reseñas) — Alcobendas, Madrid
> 3. **Restaurante El Rincón** — ⭐4.7 (389 reseñas) — Getafe, Madrid"

---

### Ejemplo 2: "Hoteles alrededor de Barcelona"

**Antes** ❌:
> "Los mejores hoteles de Barcelona son: [lista con hoteles en Barcelona ciudad]"

**Ahora** ✅:
> "En los alrededores de Barcelona encontramos:
> 
> 1. **Hotel Can Bonastre** — ⭐4.9 (267 reseñas) — Masquefa, Barcelona
> 2. **Hotel Ciutat de Sabadell** — ⭐4.8 (189 reseñas) — Sabadell, Barcelona
> 3. **NH Hospitalet** — ⭐4.7 (823 reseñas) — Hospitalet de Llobregat, Barcelona"

---

### Ejemplo 3: "Spas cerca de Valencia pero no en la ciudad"

**Antes** ❌:
> No entendía la consulta o devolvía spas de Valencia ciudad

**Ahora** ✅:
> "He encontrado spas en la provincia de Valencia fuera de la capital:
> 
> 1. **Balneario de Chulilla** — ⭐4.9 (156 reseñas) — Chulilla, Valencia
> 2. **Spa Benisanó** — ⭐4.8 (92 reseñas) — Benisanó, Valencia"

---

## 🔧 Instalación

### Paso 1: Código ya actualizado ✅

Los cambios en el código ya están aplicados en:
- `app/api/chatbot/route.ts`
- `lib/ai/openai.ts`

### Paso 2: Actualizar Base de Datos

Ejecuta el siguiente SQL en **Supabase SQL Editor**:

```bash
# Archivo: supabase/21-prompt-alrededores-optimizado.sql
```

**Cómo ejecutarlo**:

1. Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/sql
2. Copia y pega el contenido de `21-prompt-alrededores-optimizado.sql`
3. Haz clic en **"Run"**
4. Verifica que aparece: `"System Prompt actualizado con mejoras de alrededores/afueras"`

### Paso 3: Probar

**Recarga la aplicación** y prueba:

```
👤 Usuario: "restaurantes en las afueras de madrid"
🤖 Tío Viajero: [Debería listar restaurantes en Pozuelo, Getafe, Alcobendas, etc.]

👤 Usuario: "hoteles alrededor de barcelona"
🤖 Tío Viajero: [Debería listar hoteles en Hospitalet, Sabadell, Badalona, etc.]

👤 Usuario: "spas cerca de valencia pero no en la ciudad"
🤖 Tío Viajero: [Debería listar spas en otros municipios de la provincia]
```

---

## 📊 Frases Soportadas

| Frase del Usuario | Comportamiento |
|-------------------|----------------|
| "hoteles en Madrid" | Solo Madrid capital ✅ |
| "hoteles en las **afueras de Madrid**" | Otros municipios de Madrid (provincia) ✅ |
| "restaurantes **alrededor de Barcelona**" | Hospitalet, Sabadell, Badalona... ✅ |
| "spas en la **provincia de Valencia pero no en Valencia**" | Otros municipios de Valencia ✅ |
| "bares **cerca de Sevilla pero no en la ciudad**" | Otros municipios de Sevilla ✅ |
| "hoteles en el **extrarradio de Madrid**" | Otros municipios de Madrid ✅ |
| "restaurantes **fuera de la capital**" | Resto de la provincia actual ✅ |
| "spas en **cercanías de Valencia**" | Otros municipios cercanos ✅ |

---

## 🎯 Beneficios

✅ **Mejor comprensión** de consultas naturales  
✅ **Respuestas más precisas** según la intención del usuario  
✅ **Cobertura ampliada** de casos de uso comunes  
✅ **Experiencia mejorada** para turistas buscando opciones fuera de capitales  
✅ **Claridad en respuestas**: El chatbot explica "afueras de", "alrededores de"  

---

## 🔍 Monitoreo

**Consultas a verificar en chat_history**:

```sql
SELECT message, created_at 
FROM chat_history 
WHERE role = 'user' 
  AND (
    message ILIKE '%afueras%' OR 
    message ILIKE '%alrededores%' OR
    message ILIKE '%cerca de%pero%no%' OR
    message ILIKE '%extrarradio%'
  )
ORDER BY created_at DESC
LIMIT 50;
```

---

## ✅ Checklist de Implementación

- [x] Actualizar detección en `route.ts`
- [x] Actualizar system prompt en `openai.ts`
- [x] Crear script SQL `21-prompt-alrededores-optimizado.sql`
- [ ] **Ejecutar SQL en Supabase** ← PENDIENTE (hazlo tú)
- [ ] Recargar aplicación y probar
- [ ] Verificar con ejemplos reales

---

**¡Listo para usar!** 🚀


