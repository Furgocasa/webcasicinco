# 🎩 Chatbot "Tío Viajero" - Guía Completa

**Última actualización:** 12 de Octubre de 2025  
**Estado:** ✅ Totalmente funcional  
**Modelo:** OpenAI GPT-4o-mini (configurable)

---

## 🎯 Descripción

"Tío Viajero" es el asistente de IA inteligente de InfluencersTrust que ayuda a los usuarios a encontrar los mejores lugares de España mediante conversación natural.

---

## ✨ Características Principales

### 1️⃣ **Detección Inteligente de Categorías**

**Sinónimos soportados:**

| Categoría | Palabras clave |
|-----------|----------------|
| **Restaurante** | restaurante, restaurantes, comer, cocina, tapas, asador, parrilla, gastronomía, donde como, sitio para comer, hambre |
| **Hotel** | hotel, hoteles, alojamiento, alojamientos, hostal, albergue, resort, parador, dormir, donde duermo, pernoctar, hospedaje, **apartamento, apartamentos, apartamentos turísticos, donde alojarme, donde quedarse** |
| **Spa** | spa, spas, balneario, wellness, termas, relax, relajarse |
| **Bar** | bar, bares, pub, coctelería, cocktail, copa, copas, cerveza |

---

### 2️⃣ **Detección de Cantidad (Plural/Singular)**

| Pregunta | Resultados |
|----------|-----------|
| "restaurantes en madrid" | **5 lugares** (plural) |
| "un restaurante en madrid" | **3 lugares** (singular) |
| "top 10 hoteles" | **10 lugares** (explícito) |
| "mejores spas" | **5 lugares** (plural) |

**Palabras que activan plural:** restaurantes, hoteles, spas, bares, lugares, sitios, alojamientos, apartamentos

---

### 3️⃣ **Manejo de Alrededores y Afueras**

**Frases detectadas:**
- ✅ "afueras de Madrid"
- ✅ "alrededores de Barcelona"
- ✅ "cerca de Valencia pero no en la ciudad"
- ✅ "cercanías de Sevilla"
- ✅ "extrarradio de Madrid"
- ✅ "fuera de la capital"
- ✅ "provincia de Madrid pero no en Madrid"

**Comportamiento:**
- Busca en **otros municipios** de la provincia (NO en la capital)
- Ejemplo: "afueras de Madrid" → Pozuelo, Getafe, Alcobendas, etc.

---

### 4️⃣ **Sistema de Enlaces Internos**

Cada recomendación incluye **2 enlaces clicables**:

1. **[Ver detalles]** → `/restaurante/malaga/el-pimpi-malaga`
   - Abre la página completa del lugar
   - Información detallada, fotos, reseñas

2. **[Ver en mapa]** → `/mapa?place=abc-123-def`
   - Abre el mapa con el lugar seleccionado
   - Card automática centrada
   - Zoom 15 en el lugar

**Características:**
- ✅ Enlaces internos **sin recarga** (navegación cliente)
- ✅ Enlaces externos **nueva pestaña**
- ✅ Markdown renderizado correctamente
- ✅ Negrita visible: `**texto**` → **texto**

---

### 5️⃣ **Datos de Contacto**

**Información disponible:**
- ✅ **Dirección completa**: "Calle Granada, 62, 29015 Málaga"
- ✅ **Teléfono**: "+34 952 21 62 74"
- ❌ **Web externa**: NO se proporciona directamente
  - Se invita a ver "Ver detalles" (retención de tráfico)

**Ejemplos:**
```
👤: "¿Cuál es la dirección de El Pimpi?"
🤖: "El Pimpi está en Calle Granada, 62, 29015 Málaga. [Ver detalles](/restaurante/malaga/el-pimpi)"

👤: "Dame el teléfono del hotel"
🤖: "Teléfono: +34 952 21 62 74 [Ver detalles](/hotel/malaga/gran-melia)"

👤: "¿Tienen web oficial?"
🤖: "Puedes ver toda la información, incluyendo su sitio web, en [Ver detalles](/hotel/malaga/gran-melia)"
```

---

### 6️⃣ **Sistema de Tiers Flexible**

**Filtrado inteligente:**
- **Búsquedas locales** (ciudad/provincia): Mínimo **50 reseñas** (Tier Bronce)
- **Rankings nacionales**: Mínimo **500 reseñas** (Tier Platino)
- **Ordenamiento**: Por rating (desc), luego por número de reseñas (desc)

---

### 7️⃣ **Interfaz del Chatbot**

**Características UI:**
- ✅ **Avatar personalizado**: Imagen de "Tío Viajero"
- ✅ **Indicador online**: Punto verde pulsante
- ✅ **Historial limitado**: Solo últimos 10 mensajes (5 pares)
- ✅ **Scroll automático**: Siempre muestra los últimos mensajes
- ✅ **Botón limpiar** (🔄): Modal bonito dentro del chat (sin `confirm()` nativo)
- ✅ **Badge BETA**: Indica que está en desarrollo activo
- ✅ **Loading states**: "Pensando..." con spinner

---

## 📝 System Prompt

El chatbot usa un prompt detallado que incluye:

### **Política de Datos**
- Solo recomienda lugares de la lista disponible
- Puede usar conocimiento general de geografía
- Nunca inventa nombres

### **Cómo Elegir**
1. Filtra por categoría (restaurante/hotel/spa/bar)
2. Filtra por ubicación (ciudad/provincia/alrededores)
3. Aplica tier de calidad (50 o 500 reseñas según tipo de búsqueda)
4. Ordena por rating y reseñas
5. Devuelve N resultados (3-10 según contexto)

### **Formato de Respuesta**
```
Según los datos de los que disponemos y los cálculos de nuestro algoritmo, los 5 mejores lugares son:

1. **El Pimpi** — ⭐4.8 (12,300 reseñas) — Málaga, Málaga — [Ver detalles](/restaurante/malaga/el-pimpi) | [Ver en mapa](/mapa?place=id)
2. **Mesón de Cervantes** — ⭐4.7 (8,500 reseñas) — Málaga, Málaga — [Ver detalles](/restaurante/malaga/meson) | [Ver en mapa](/mapa?place=id)
...
```

### **Prohibido**
- ❌ Decir "no tengo acceso" cuando SÍ tiene los datos
- ❌ Dar URL de web externa
- ❌ Dar nombres fuera de la lista
- ❌ Omitir enlaces "Ver detalles" y "Ver en mapa"
- ❌ Dar solo 1 resultado cuando preguntan en plural

---

## 🔧 Archivos Clave

### **Backend**
- `app/api/chatbot/route.ts` - API principal del chatbot
  - Detección de intención (`parseIntent`)
  - Búsqueda de lugares (`searchPlacesTool`)
  - Gestión de historial
  - Rate limiting (20 msg/min)

- `lib/ai/openai.ts` - Integración con OpenAI
  - Función `chatbotResponse()`
  - Construcción del contexto
  - System prompt
  - Filtrado y ranking de lugares

### **Frontend**
- `components/ChatbotFloating.tsx` - Componente visual del chatbot
  - UI del chat flotante
  - Renderizado de markdown
  - Gestión de historial
  - Modal de confirmación personalizado

### **Base de Datos**
- `supabase/23-prompt-completo-final.sql` - Prompt actualizado en BD
- Tabla `chat_history` - Historial de conversaciones
- Tabla `app_config` - Configuración del chatbot

---

## 🧪 Ejemplos de Uso

### **Búsquedas Básicas**
```
👤: "restaurantes en madrid"
🤖: Los 5 mejores restaurantes con enlaces [Ver detalles] y [Ver en mapa]

👤: "hoteles en barcelona"
🤖: Los 5 mejores hoteles con enlaces

👤: "spas en málaga"
🤖: Los 5 mejores spas con enlaces
```

### **Alojamientos y Apartamentos**
```
👤: "alojamientos en cartagena"
🤖: Encuentra apartamentos turísticos y hoteles

👤: "apartamentos turísticos en valencia"
🤖: Encuentra lugares categorizados como "hotel" (apartamentos)
```

### **Alrededores y Afueras**
```
👤: "restaurantes en las afueras de madrid"
🤖: En las afueras de Madrid (provincia) encontramos:
     1. **El Mesón de Pozuelo** — Pozuelo de Alarcón
     2. **La Casa Grande** — Alcobendas

👤: "hoteles alrededor de barcelona"
🤖: En los alrededores de Barcelona:
     1. **Hotel Can Bonastre** — Masquefa
     2. **NH Hospitalet** — Hospitalet de Llobregat
```

### **Datos de Contacto**
```
👤: "¿cuál es la dirección de El Pimpi?"
🤖: El Pimpi está en Calle Granada, 62, 29015 Málaga. 
    [Ver detalles](/restaurante/malaga/el-pimpi)

👤: "dame el teléfono"
🤖: Teléfono: +34 952 21 62 74
    [Ver detalles](/restaurante/malaga/el-pimpi)

👤: "¿tienen web?"
🤖: Puedes ver toda la información, incluyendo su sitio web, en
    [Ver detalles](/restaurante/malaga/el-pimpi)
```

---

## 📊 Configuración

### **Parámetros Editables** (en `/admin/configuracion`)

| Parámetro | Valor Actual | Descripción |
|-----------|--------------|-------------|
| **Modelo** | `gpt-4o-mini` | Modelo de OpenAI a usar |
| **Temperatura** | `0.7` | Creatividad (0-1) |
| **Max Tokens** | `400` | Longitud máxima de respuesta |
| **Historial** | `12` | Mensajes de contexto en conversación |
| **Habilitado** | `true` | Activar/desactivar chatbot |

**Otros modelos disponibles:**
- GPT-4o (más potente)
- GPT-4 Turbo
- GPT-4
- GPT-3.5 Turbo (más rápido y económico)

---

## 🔒 Seguridad

### **Rate Limiting**
- **20 mensajes por minuto** por usuario/sesión
- Mensaje de error: "Demasiadas preguntas. Espera un momento..."

### **Validación de Entrada**
- ✅ Mínimo 3 caracteres
- ✅ Máximo 500 caracteres
- ✅ Detección de spam (caracteres repetidos)
- ✅ Sin inyección de código

---

## 📈 Mejoras Futuras

### **Corto Plazo**
- [ ] Sugerencias de preguntas frecuentes (botones rápidos)
- [ ] Feedback (👍/👎) en respuestas
- [ ] Analytics de conversaciones

### **Medio Plazo**
- [ ] Respuestas multimodales (incluir imágenes)
- [ ] Integración directa con Google Maps ("Cómo llegar")
- [ ] Reservas directas desde el chat

### **Largo Plazo**
- [ ] Soporte multiidioma (inglés, francés)
- [ ] Personalización según preferencias del usuario
- [ ] Recomendaciones proactivas basadas en historial

---

## 🐛 Troubleshooting

### **El chatbot no responde**
✅ Verifica que `OPENAI_API_KEY` esté configurada en `.env.local`  
✅ Revisa la consola del servidor para errores  
✅ Comprueba que el chatbot esté habilitado en `/admin/configuracion`

### **Dice "no tengo acceso"**
❌ Esto NO debería pasar si el prompt está actualizado  
✅ Ejecuta `supabase/23-prompt-completo-final.sql` en Supabase  
✅ Recarga la aplicación para limpiar caché

### **Los enlaces no funcionan**
✅ Asegúrate de haber recargado con Ctrl+Shift+R  
✅ Limpia caché del navegador  
✅ Verifica que `renderMessageWithLinks()` esté implementado

### **Error de hidratación**
✅ Renderizado con `dangerouslySetInnerHTML` resuelve este problema  
✅ Si persiste, limpia `.next/` y reinicia el servidor

---

## 📊 Métricas

**Consultas típicas por categoría:**
- 🍽️ Restaurantes: ~40%
- 🏨 Hoteles/Alojamientos: ~30%
- 🧖 Spas: ~15%
- 🍺 Bares: ~10%
- 🗺️ Otros (rutas, información): ~5%

---

**¡El chatbot "Tío Viajero" está listo para guiar a tus usuarios! 🚀**






















