# 📝 Changelog - Casi Cinco

## [2.0.0 - BETA 2.0] - 12 de Octubre de 2025

### 🎉 **BETA 2.0 - Lanzamiento Mayor**

Esta versión representa un salto cualitativo en la plataforma, enfocándose en **protección de datos**, **mejora de conversión** y **experiencia de usuario excepcional**.

---

### ✨ **Nuevas Características Principales**

#### 🏠 **Home Renovada con Datos Reales**
- ✅ **API de estadísticas** (`/api/stats`) que obtiene datos reales de la BD
- ✅ **Stats dinámicas**: Total lugares, rating promedio, provincias, reseñas
- ✅ **Sección "Metodología"**: Explica Rating + Reseñas = Objetividad
- ✅ **Botón "Saber Más"** → Nueva página `/metodologia`
- ✅ **Propuesta de valor clara**: "No es subjetivo, es matemática pura"

#### 📖 **Página "Nuestra Metodología"** (NUEVA)
- ✅ Explicación completa del algoritmo objetivo
- ✅ Problema vs Solución (método tradicional vs Casi Cinco)
- ✅ Sistema de Tiers detallado con porcentajes reales
- ✅ Por qué funciona: Ley de grandes números + Sesgo reducido + IA sin sesgos
- ✅ Transparencia total: Qué hacemos y qué NO hacemos
- ✅ **Identidad del proyecto capturada**: "4.8★ con 2,000 reseñas no es opinión, es consenso"

#### 🧭 **Planificador de Rutas** (NUEVO)
- ✅ Cálculo de rutas con Google Directions API
- ✅ **Autocompletado de Google** en origen y destino (solo España)
- ✅ **Radio configurable**: 5km, 10km, 20km, 50km desde la ruta
- ✅ **Búsqueda inteligente**: Encuentra lugares a lo largo del camino
- ✅ **Filtros**: Categoría y tiers
- ✅ **Mapa sincronizado** con estilo de sección principal
- ✅ **Card flotante** idéntica al mapa principal
- ✅ **Lista lateral** con diseño coherente
- ✅ **Info de ruta**: Distancia y tiempo estimado
- ✅ **Protegida con login**: Solo usuarios registrados

#### 🔒 **Seguridad y Protección de Datos**
- ✅ **Eliminada sección `/listas`** → Protege la base de datos de scraping
- ✅ **Middleware mejorado**: `/mapa`, `/ruta`, `/perfil` requieren login
- ✅ **Redirección inteligente**: `?returnTo` para volver después de login
- ✅ **Solo 2 secciones principales**: Mapa y Rutas (enfoque claro)

---

### 🤖 **Mejoras del Chatbot "Tío Viajero"**

#### 🔗 **Sistema de Enlaces Internos**
- ✅ **Enlaces clicables** en markdown renderizados correctamente
- ✅ **Negrita visible**: `**texto**` → **texto** (sin `**`)
- ✅ **Navegación sin recarga**: Usa `router.push()` (SPA)
- ✅ **2 enlaces por lugar**:
  - "Ver detalles" → Página completa
  - "Ver en mapa" → Mapa con card centrada (`?place=ID`)

#### 📊 **Datos de Contacto y Retención**
- ✅ **Query extendida**: `slug`, `address`, `phone`, `website`
- ✅ **Responde con dirección y teléfono**
- ✅ **NO da web externa** → Solo invita a "Ver detalles" (retención de tráfico)
- ✅ **Prohibido decir "no tengo acceso"** cuando los datos están disponibles

#### 🏘️ **Detección de Alrededores/Afueras**
- ✅ **Frases soportadas**: "afueras de", "alrededores de", "cerca de X pero no en X"
- ✅ **Lógica correcta**: Excluye capital, busca en otros municipios
- ✅ **Respuestas claras**: "En las afueras de Madrid (provincia)..."

#### 🔢 **Detección Inteligente de Cantidad**
- ✅ **Plural → 5 resultados**: "restaurantes" → mínimo 5
- ✅ **Singular → 3 resultados**: "un restaurante" → mínimo 3
- ✅ **Explícito**: "top 10" → exactamente 10

#### 🏨 **Sinónimos Ampliados**
- ✅ **Hotel**: apartamento, apartamentos turísticos, alojamientos, donde alojarme, donde quedarse

#### 🎨 **UI/UX del Chatbot**
- ✅ **Botón limpiar** (🔄) con modal bonito (sin `confirm()`)
- ✅ **Historial limitado**: 10 mensajes (5 pares)
- ✅ **Scroll automático** al final al cargar
- ✅ **Renderizado robusto**: `dangerouslySetInnerHTML` para evitar errores de hidratación

---

### 🗺️ **Mejoras del Mapa**

#### 🔍 **Filtros Mejorados**
- ✅ **Búsqueda parcial de ciudad**: "murci" encuentra "Murcia"
- ✅ **Case-insensitive** y flexible

#### 🔗 **Navegación desde Chatbot**
- ✅ **Parámetro `?place=ID`**: Abre lugar directamente
- ✅ **Auto-zoom desactivado** cuando viene de chatbot (no interfiere)
- ✅ **Centrado perfecto** en zoom 15
- ✅ **Cierre mejorado**: Limpia URL al cerrar card

#### ⚡ **Optimización de Carga**
- ✅ **Caché v7** con manejo robusto de errores
- ✅ **Carga progresiva**: Filtros → Mapa → Lista
- ✅ **Lazy loading** en todas las imágenes
- ✅ **Loader interno** en mapa (no bloquea página completa)

---

### 🏷️ **Página de Detalle**
- ✅ **Categoría visible** con icono 🏷️ y badge translúcido

---

### 🐛 **Correcciones Críticas**

#### ❌ **Error "places is not defined"**
- ✅ Eliminadas referencias a variable inexistente
- ✅ Logs actualizados
- ✅ Chatbot funciona sin errores

#### 🔄 **Error de Hidratación**
- ✅ Renderizado simplificado con `dangerouslySetInnerHTML`
- ✅ Evita conflictos servidor-cliente

#### ⚙️ **Variables de Entorno**
- ✅ Archivo `.env.local` creado con todas las API keys

---

### 📁 **Archivos SQL Creados**

Scripts para actualizar el prompt del chatbot en Supabase:
- `supabase/20-update-prompt-coherente.sql`
- `supabase/21-prompt-alrededores-optimizado.sql`
- `supabase/22-prompt-con-enlaces-y-datos.sql`
- `supabase/23-prompt-completo-final.sql` ⭐ **Usar este (incluye todo)**

---

### 📖 **Documentación Nueva**

- `CHATBOT_TIO_VIAJERO.md` - Guía completa del chatbot
- `ESTADO_ACTUAL_PROYECTO.md` - Estado completo actualizado
- `LEEME_PRIMERO.md` - Punto de entrada para nuevos desarrolladores
- `INDICE_DOCUMENTACION.md` - Índice maestro
- `RESUMEN_SESION_12_OCT.md` - Resumen de la sesión
- `supabase/MEJORAS_ALREDEDORES_AFUERAS.md`
- `supabase/MEJORAS_ENLACES_Y_CONTACTO.md`

---

### 🚫 **Características Eliminadas**

- ❌ **Sección de Listas** (`/listas`) - Protección de base de datos

**Razón**: Prevenir scraping/copia masiva de la base de datos. 
Los usuarios ahora usan:
- 🗺️ Mapa (exploración visual limitada)
- 🧭 Rutas (búsqueda puntual)
- 🤖 Chatbot (recomendaciones específicas)

---

### 📊 **Estadísticas BETA 2.0**

- **Lugares indexados:** 3,547
- **Rating promedio:** 4.8★
- **Provincias cubiertas:** 50+
- **Categorías:** 6 (restaurante, hotel, spa, bar, experiencia, monumento)
- **Tiers de calidad:** 6 niveles
- **Páginas principales:** 5 (Home, Mapa, Rutas, Metodología, Pricing)
- **APIs creadas:** 20+
- **Archivos .md:** 10+ actualizados

---

## [1.1.0] - 12 de Octubre de 2025

### ✨ **Mejoras del Chatbot "Tío Viajero"**
(Ver detalles en versión anterior)

---

## [1.0.0] - 11 de Octubre de 2025

### ✨ Características Implementadas
(Ver detalles en versión anterior)

---

**Última actualización:** 12 de Octubre de 2025, 23:55h  
**Estado:** BETA 2.0 - Lista para testing extensivo y preparación para producción ✅
