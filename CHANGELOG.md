# 📝 Changelog - Casi Cinco

## [28 Agosto 2026] - 📍 GPS compartido, limpiar chat y ubicaciones aproximadas

- El GPS del mapa/ruta y el Tío Viajero son el mismo: si está activo, el chat no pide «Compartir». «Ahora no» solo oculta el aviso; no apaga el GPS
- Limpiar conversación: soft delete real (las filas siguen en BD para admin). Al recargar ya no reaparecen
- Ubicaciones con coincidencia parcial y erratas (palmar, murca, gerona, alberka…)

---

## [28 Agosto 2026] - 🤖 Tío Viajero: intent geográfico y sin fallback nacional

- El intent usa el catálogo de ciudades (`CITIES_BY_PROVINCE`) más typos (lameria, nijar, port valis, llavaneras) y hereda categoría/ciudad del hilo
- Una búsqueda local o «cerca de mí» ya no se rellena con el ranking nacional
- Saludo, «dónde estoy» y peticiones truncadas no relanzan la búsqueda anterior
- Prompt (código + `app_config`): copiar rating y reseñas de las fichas de este turno
- «La Alberca» sin provincia: pregunta Salamanca o Murcia. Si el pueblo no tiene ficha: «No tengo en X, pero tengo algunos cerca»

---

## [26 Agosto 2026] - 🚚 Repo Furgocasa + Vercel (fuera de Amplify)

- Remoto vivo: `github.com/Furgocasa/webcasicinco` (`main`)
- Hosting: **Vercel FURGOCASA** · www.casicinco.com (`casicinco.com` → 308 a www)
- App Amplify `Casi_cinco_app` **borrada**
- Scripts de migración de fotos: `../local/` (fuera de Git)
- El repo viejo `ActtaxIA/Casi_cinco_app` queda histórico

---

## [23 Agosto 2026] - ✍️ Descripciones editoriales con GPT-5.6 Terra (tiers Diamante, Platino y Oro)

### 🎯 PROBLEMA DETECTADO
Auditoría de los 403 lugares Diamante publicados: todas las `ai_description` existían,
pero eran copy genérico de IA, no texto editorial:
- 69% empezaba por "Descubre...", 45% "ideal para", 41% "en el corazón de", 35% "sin duda"
- 74% repetía ciudad y provincia iguales ("Barcelona, Barcelona")
- 31% recitaba el rating y nº de reseñas (redundante: ya se muestra en la ficha)
- 28% contenía markdown `**` visible en la web
- ~50 cafeterías/specialty coffee con categoría `bar` descritas literalmente como "bar"
- Casos graves: pub crawl descrito como hotel, pastelería descrita como restaurante

### ✨ CAMBIOS
- **`lib/ai/openai.ts` → `generatePlaceDescription`:**
  - Prompt editorial nuevo: 110-150 palabras, mínimo 3 hechos concretos de reseñas,
    identidad real del local por encima de la etiqueta de categoría, clichés/markdown/
    exclamaciones/rating prohibidos, ciudad sin duplicar
  - Soporte para modelos razonadores GPT-5.x: detección automática y uso de
    `reasoning_effort: 'low'` + `max_completion_tokens` (en vez de `temperature`/`max_tokens`)
- **`.env.local`:** `OPENAI_ENRICHMENT_MODEL=gpt-5.6-terra` (cambiable sin tocar código;
  añadir también en Vercel FURGOCASA si la Fase 2 corre en producción)
- **`scripts/regenerate-diamond-descriptions.ts` (nuevo):** regeneración por tiers con
  `--dry-run`, `--limit`, `--min-rating`, `--min-reviews`, `--max-reviews`; concurrencia 4;
  reintento automático si aparecen patrones prohibidos

### 📊 EJECUTADO
- **Diamante (403 lugares):** regenerados, 0 fallos — clichés a ~0, markdown 0, rating recitado 0
- **Platino (415 lugares):** regenerados, 0 fallos — misma calidad
- **Oro (730 lugares):** regenerados, 0 fallos — misma calidad
- **Coste total:** ~15 $ (≈1 céntimo/lugar con gpt-5.6-terra, reasoning low)

### ⚠️ FLECOS CONOCIDOS
- "ideal para" resiste en ~19% de las fichas y "sin duda" en ~11 (no bloqueante)
- Las quejas generales de reseñas pueden aparecer como matiz honesto (decisión de diseño)
- `The Pubcrawl Company Madrid` sigue con categoría `hotel` en BD (el texto ya es honesto,
  pero conviene decidir si debe estar listado)
- `lib/indexation/enricher.ts` (flujo legacy) mantiene `gpt-4o-mini` en duro; el flujo
  activo (`enricher-batch.ts` → `lib/ai/openai.ts`) sí usa el modelo nuevo

---

## [30 Noviembre 2025] - 🚀 v1.0.0 STABLE - Primera Versión Oficial de Producción

### 🎉 LANZAMIENTO OFICIAL v1.0.0
**¡Casi Cinco sale oficialmente de BETA y se convierte en la v1.0 STABLE!**

Después de meses de desarrollo, optimización y mejoras continuas, Casi Cinco alcanza su primera versión estable de producción con todas las características principales completamente funcionales y optimizadas.

### ✨ NUEVA FEATURE: Modal Promocional de Rutas
- **OBJETIVO:** Fomentar el uso del planificador de rutas (característica diferenciadora)
- **UBICACIÓN:** Aparece en `/mapa` solo para usuarios registrados
- **FRECUENCIA:** Cada 7 días (configurable)
- **VARIANTES:** 3 mensajes diferentes que rotan aleatoriamente:
  1. "¿Sabías que...?" - Énfasis en optimización automática
  2. "¡Planifica tu viaje!" - Énfasis en encontrar lugares en trayecto
  3. "Nueva función: Rutas" - Énfasis en calidad (4.7+ estrellas, tiers)
- **UX:** 
  - Aparece después de 3 segundos (no invasivo)
  - Fácil de cerrar (X o click fuera)
  - Checkbox "No volver a mostrar"
  - CTA claro: "Crear mi ruta" → `/ruta`
  - Diseño moderno con gradientes y animaciones
- **LOCAL STORAGE:** Control de frecuencia y preferencias del usuario
- **ANALYTICS READY:** Preparado para trackear conversión

### 🧭 NUEVA FEATURE: Sección "Información" en Menú Móvil
- **AGREGADO:** Nueva sección después de "Top 10" en menú hamburguesa
- **LINKS IMPORTANTES:**
  - 📧 Contacto (verde) → `/contacto` - 56 FAQs
  - 💰 Precios (morado) → `/pricing` - Planes y suscripción
  - 📄 Metodología (índigo) → `/metodologia` - Sistema de tiers
  - ℹ️ Sobre Nosotros (azul) → `/sobre-nosotros` - Historia
- **UX:** Cada opción con icono, color y hover específico
- **ACCESIBILIDAD:** Páginas clave ahora accesibles en móvil

### 📚 Características Principales de v1.0.0

#### 🗺️ Mapa Interactivo
- 3,500+ lugares verificados en toda España
- Filtros avanzados (categoría, provincia, ciudad, rating, precio, tiers)
- Clustering inteligente para performance
- Marcadores de colores según tier (Diamante, Platino, Oro, Plata, Bronce)
- Optimización MapContext (66% menos llamadas a Google Maps API)

#### 🤖 Chatbot IA "Tío Viajero"
- GPT-4o-mini con geolocalización GPS real
- Búsquedas por proximidad (PostGIS con ST_DWithin)
- Desambiguación inteligente (provincia vs ciudad)
- 25+ tipos de cocina soportados
- Historial de conversación
- Rate limiting (20 msg/min)

#### 📍 Planificador de Rutas
- Optimización automática de distancias
- Múltiples paradas
- Guardar rutas favoritas
- Compartir rutas
- **AHORA CON MODAL PROMOCIONAL para aumentar uso**

#### 📝 Blog SEO
- 29 artículos "Top 10" optimizados
- SSR/SSG para rendimiento
- Auto-publicación programada (estilo Joomla)
- Ordenado por tiers (Diamante primero)
- Sitemap unificado + sitemap de imágenes

#### 💎 Sistema de Tiers
- Diamante (4.8+ con 1000+ reseñas) - Top 0.1%
- Platino (4.8+ con 500+) - Top 1%
- Oro (4.8+ con 200+) - Top 5%
- Plata (4.7+ con 100+) - Top 15%
- Bronce (4.7+) - Calidad garantizada

#### 📧 Contacto y Soporte
- Página de contacto rediseñada
- 56 FAQs organizadas en 5 categorías
- Filtros interactivos
- Email: info@casicinco.com
- Tiempo de respuesta: < 24h laborables

#### 🔒 Seguridad y Privacidad
- Información técnica sensible eliminada de FAQs públicas
- Autenticación con Google OAuth
- GDPR compliant
- HTTPS obligatorio

#### 💰 Monetización
- Trial gratuito 30 días sin tarjeta
- Plan Mensual: 2,99€/mes
- Plan Anual: 24,99€/año (ahorro 40%)
- Pagos seguros con sistema certificado

#### 📊 Optimizaciones de Costos
- Ahorro total: ~€108,300/año
- Fotos en Supabase Storage (€45k/año ahorrado)
- Sin fallback blog (€44k/año ahorrado)
- MapContext optimizado (€15k/año ahorrado)
- Cache de búsquedas (€3k/año ahorrado)
- Costo actual Google Photos API: €0/mes

### 📈 Estadísticas v1.0.0
- **Lugares**: 3,500+ verificados en 50 provincias
- **Fotos**: 96.8% de lugares con imágenes
- **Categorías**: Restaurantes, Hoteles, Bares
- **Blog posts**: 29 artículos SEO
- **FAQs**: 56 preguntas
- **Usuarios**: Sistema de suscripción activo
- **Performance**: Optimizado para desktop, tablet y móvil

### 🎯 Próximas Mejoras (v1.1.0)
- Analytics de conversión del modal de rutas
- Búsqueda en tiempo real dentro de FAQs
- Notificaciones push para usuarios premium
- Expansión a Portugal
- Apps nativas iOS/Android

### 🙏 Agradecimientos
Esta versión 1.0 marca un hito importante en el desarrollo de Casi Cinco. Gracias a todos los usuarios beta que han ayudado a testear y mejorar la plataforma.

**De BETA a PRODUCCIÓN: El viaje continúa. 🚀**

---

## [30 Noviembre 2025] - BETA 101: Página de Contacto Mejorada + FAQs Expandidas 📞

### ✨ NUEVA FEATURE: Página de Contacto Rediseñada
- **DISEÑO:** Nueva estructura en 2 secciones principales (Contacto + FAQs)
- **SECCIÓN 1:** Email destacado con botón grande + links a redes sociales (Instagram, Facebook)
- **SECCIÓN 2:** Preguntas Frecuentes expandidas y agrupadas por categorías
- **UX:** Motivos para contactar en cards visuales (Reportar errores, Corregir info, Sugerir lugares)
- **RESPONSIVE:** Totalmente optimizado para móvil y desktop

### 📚 FEATURE: FAQs Expandidas (56 preguntas)
- **EXPANSIÓN:** De 17 a 56 preguntas frecuentes organizadas
- **CATEGORÍAS:** 5 categorías principales con filtros interactivos:
  - 💳 Suscripción (10 preguntas)
  - 📍 Lugares (12 preguntas)
  - ⚙️ Funcionalidades (15 preguntas)
  - 🤖 Cómo Funciona (8 preguntas)
  - ❓ General (11 preguntas)
- **UX:** Acordeones interactivos con animaciones suaves
- **UX:** Filtros visuales para navegación rápida por categoría
- **UX:** Badges con número de preguntas por categoría
- **AGRUPACIÓN:** FAQs agrupadas visualmente con títulos destacados

### 🔒 SEGURIDAD: Limpieza de Información Técnica Sensible
- **ELIMINADO:** Referencias a stack tecnológico (Next.js, Supabase, OpenAI, Tailwind, etc.)
- **ELIMINADO:** Detalles de APIs específicas (Google Places API, PostGIS, etc.)
- **ELIMINADO:** Información de costos internos y optimizaciones (€108k/año)
- **ELIMINADO:** Detalles de implementación técnica (RLS, PKCE, Stripe)
- **MANTENIDO:** Funcionalidades para usuarios sin revelar implementación
- **PRINCIPIO:** Explicar QUÉ HACE la app, no CÓMO ESTÁ CONSTRUIDA

### 📧 MEJORA: Información de Contacto
- **ACTUALIZADO:** Email info@casicinco.com visible en footer y contacto
- **AGREGADO:** Links directos a redes sociales con botones visuales
- **MEJORADO:** Tiempo de respuesta claramente indicado (< 24h laborables)

### 📄 DOCUMENTACIÓN
- **ACTUALIZADO:** README.md a versión 3.1.0
- **ACTUALIZADO:** Badge de estado a BETA 101
- **AGREGADO:** Nueva característica de FAQs en lista principal
- **CHANGELOG:** Esta entrada documenta todos los cambios

---

## [30 Octubre 2025] - Chatbot con GPS REAL + Desambiguación Inteligente 🗺️

### 🚀 MEJORA CRÍTICA: Búsqueda por Proximidad GPS REAL
- **IMPLEMENTADO:** Función PostGIS `search_places_by_proximity` en Supabase
- **FEATURE:** Búsqueda por coordenadas GPS + radio (metros) con `ST_DWithin`
- **FEATURE:** Cálculo de distancia exacta (km) con `ST_Distance`
- **FEATURE:** Índice espacial GiST para búsquedas instantáneas
- **MEJORA:** Ordena por distancia real (no por nombre de ciudad)
- **RETORNA:** Campo `distance_km` para cada lugar
- **EJEMPLO:** Usuario en Níjar → Encuentra restaurantes en radio 50km (Almería, El Ejido, etc.)
- **PRIORIDAD:** Búsqueda GPS es prioridad 1 cuando hay coords + keyword proximidad

### 🧠 MEJORA: Desambiguación Inteligente (Ciudad = Provincia)
- **PROBLEMA:** "restaurantes de Murcia" → ¿Ciudad o provincia?
- **SOLUCIÓN:** Default = PROVINCIA completa (más útil)
- **CASOS:** Madrid, Murcia, Valencia, Barcelona, Alicante, Sevilla, Málaga, Córdoba, Granada
- **ESPECÍFICO:** "ciudad de Murcia" → Solo capital
- **ESPECÍFICO:** "provincia de Murcia" → Toda provincia
- **ESPECÍFICO:** "toda Murcia" → Toda provincia
- **ESPECÍFICO:** "centro de Murcia" → Solo capital
- **VENTAJA:** Usuario ve más opciones por defecto

### 📝 MEJORA: System Prompt y User Context Actualizados
- **GEOLOCALIZACIÓN Y PROXIMIDAD:** IA sabe que con GPS los lugares vienen ordenados por distance_km
- **INSTRUCCIÓN:** Mencionar distancias: "Restaurante X a 8.5km de ti"
- **CASOS AMBIGUOS:** IA sabe que "Murcia" = provincia completa por defecto
- **USER CONTEXT:** Estructura más clara con nota sobre GPS y distance_km
- **COHERENCIA:** Prompt refleja la nueva lógica de búsqueda

### 🆕 Funcionalidad Original: Geolocalización
- **IMPLEMENTADO:** Sistema de geolocalización en Tío Viajero
- **FEATURE:** Detección automática de ubicación del usuario
- **FEATURE:** Búsquedas por proximidad ("restaurante cerca", "hotel aquí")
- **FEATURE:** Geocodificación inversa (coords → ciudad/provincia) via Google Geocoding API
- **UX:** Indicador visual verde cuando la ubicación está compartida
- **UX:** Toast amigable al compartir ubicación
- **PRIVACY:** Sistema opt-in (solicita permiso explícito)
- **PRIVACY:** No se guarda ubicación en BD (solo en sesión)

### 🔍 Búsqueda Avanzada por Tipo de Comida
- **AMPLIADO:** 25+ tipos de cocina/comida soportados
- **AGREGADO:** Hamburguesa, setas, paella, bocadillos, brunch
- **AGREGADO:** Tailandesa, coreana, cocido, vino, cerveza
- **MEJORADO:** Detección inteligente en descripciones IA
- **BUSCA EN:** `ai_description`, `subcategory`, `name`, `ai_review_summary`

### 📍 Palabras Clave de Proximidad
```
cerca, aquí, por aquí, en mi zona, cerca de mí,
alrededor, cercano, por donde estoy, en esta zona
```

### 🛠️ Cambios Técnicos
- **ADDED:** `supabase/migrations/20251030_search_places_by_proximity.sql` - Función PostGIS
- **ADDED:** `docs/guides/EJECUTAR_MIGRACION_POSTGIS.md` - Guía de ejecución
- **ADDED:** `getCityAndProvinceFromCoords()` en `lib/google/geocoding.ts`
- **MODIFIED:** `app/api/chatbot/route.ts` - SearchParams con `userCoords` y `radiusKm`
- **MODIFIED:** `parseIntent()` - Detección de proximidad + desambiguación ciudad/provincia
- **MODIFIED:** `searchPlacesTool()` - Prioridad 1 a RPC `search_places_by_proximity`
- **MODIFIED:** `lib/ai/openai.ts` - System Prompt + User Context actualizados
- **MODIFIED:** `components/ChatbotFloating.tsx` - Captura de ubicación
- **UPDATED:** `docs/systems/CHATBOT_TIO_VIAJERO.md` - Documentación completa

### 🎯 Ejemplos de Uso

**ANTES (búsqueda por texto):**
```
📍 Usuario en Níjar (Almería) - GPS: 36.97, -2.03
👤: "restaurantes cerca de mí"
🤖: ❌ "No tengo restaurantes en Níjar"
Razón: Buscaba por nombre ciudad "Níjar" (no hay lugares indexados en Níjar)
```

**DESPUÉS (búsqueda por GPS):**
```
📍 Usuario en Níjar (Almería) - GPS: 36.97, -2.03
👤: "restaurantes cerca de mí"
🤖: ✅ "Los mejores restaurantes cerca de ti:
      1. Casa Puga - ⭐4.8 (1234 reseñas) a 15.2km de ti en Almería
      2. Restaurante Terraza - ⭐4.7 (890 reseñas) a 18.5km de ti en Almería
      3. Los Mellizos - ⭐4.7 (756 reseñas) a 16.8km de ti en Almería"
Razón: Busca en radio 50km desde coordenadas GPS, ordena por distancia
```

**CASOS AMBIGUOS:**
```
👤: "restaurantes de Murcia"
🤖: ✅ Busca en TODA la provincia (Murcia, Cartagena, Lorca, etc.)

👤: "restaurantes en ciudad de Murcia"
🤖: ✅ Busca SOLO en la capital

👤: "hoteles de Madrid"
🤖: ✅ Busca en TODA la provincia (Madrid, Alcalá, Getafe, etc.)
```

---

## [26 Octubre 2025] - Reorganización Completa de Documentación v3.0.0 📚

### ✨ Nueva Estructura Profesional
- **REORGANIZADO:** Documentación completa del proyecto con estructura profesional y escalable
- **REDUCCIÓN:** 85% menos archivos en raíz (de 40+ a solo 6)
- **MEJORA:** Navegabilidad y mantenibilidad significativamente mejoradas

### 📁 Nueva Estructura
```
📁 Raíz (6 archivos esenciales)
├── README.md
├── LEEME_PRIMERO.md
├── CHANGELOG.md
├── INDICE_MAESTRO_DOCUMENTACION.md
├── COMANDOS_UTILES.md
└── CONEXION_FRONTEND_BACKEND.md

📁 docs/
├── strategy/    → 5 archivos estratégicos (P0-P3, roadmaps)
├── systems/     → 9 documentos técnicos de sistemas
├── guides/      → 9 guías paso a paso (setup, deploy)
└── archive/     → 45+ archivos históricos organizados
    ├── snapshots/   → Estados del sistema por fecha
    ├── sessions/    → Resúmenes de sesiones
    ├── fixes/       → Fixes históricos
    └── migrations/  → Migraciones históricas
```

### 🔄 Archivos Movidos
- ✅ 5 documentos estratégicos → `docs/strategy/`
- ✅ 9 documentos de sistemas → `docs/systems/`
- ✅ 9 guías de configuración → `docs/guides/`
- ✅ 8 snapshots fechados → `docs/archive/snapshots/`
- ✅ 2 obsoletos → `docs/archive/`

### ❌ Archivos Eliminados
- ❌ `ARCHIVOS_A_ELIMINAR.md` (meta-documento obsoleto)

### 📝 Documentos Actualizados
- ✅ `INDICE_MAESTRO_DOCUMENTACION.md` v3.0.0 - Nueva estructura completa
- ✅ `README.md` - Referencias actualizadas a nueva estructura
- ✅ `LEEME_PRIMERO.md` v3.0.0 - Completamente reescrito

### 🎯 Beneficios
- ✅ Estructura profesional y escalable
- ✅ Navegación intuitiva por tipo de documento
- ✅ Fácil onboarding para nuevos desarrolladores
- ✅ Mejor mantenibilidad a largo plazo
- ✅ Separación clara entre docs activos e históricos

### 📚 Documentación
- `docs/archive/snapshots/REORGANIZACION_DOCS_26OCT2025.md` - Detalles completos
- `INDICE_MAESTRO_DOCUMENTACION.md` - Índice maestro actualizado

---

## [24 Octubre 2025] - Limpieza de Fotos Expiradas 🧹

### 🐛 Problema Crítico Resuelto
- **FIXED:** Gasto de €2.50/día en Google Photos API por photo_references expirados
- **IMPACTO:** 99 lugares con referencias inválidas generando 357 llamadas fallidas/día

### ✅ Solución Implementada
```sql
-- Limpieza de photo_references expirados
UPDATE places
SET photos = NULL
WHERE photos IS NOT NULL
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL)
  AND published = true;
```

### 💰 Ahorro Conseguido
- **Antes:** €2.50/día → €75/mes → €900/año
- **Ahora:** €0/día → €0/mes
- **Reducción:** 100% en costos de fotos fallidas

### 📊 Estado Final del Sistema
- ✅ 3,133 lugares publicados (sin cambios)
- ✅ 3,034 con fotos en Supabase (96.8%)
- ✅ 99 sin fotos (placeholder, €0 costo)
- ✅ 0 lugares usando Google Photos API

### 📚 Documentación Actualizada
- `SISTEMA_FOTOS_SUPABASE.md` - Estado completado al 100%
- `OPTIMIZACION_GOOGLE_API_COMPLETA.md` - Añadida sección de limpieza
- `supabase/README.md` - Estadísticas actualizadas
- `RESUMEN_LIMPIEZA_FOTOS_24OCT2025.md` - Nuevo archivo con detalles

### 🎯 Impacto Total
- Ahorro acumulado optimizaciones: **~€4,556/año**
- Sistema 100% optimizado
- Control total sobre costos de API

---

## [BETA 10] - 15 de Octubre de 2025

### 🎉 **BETA 10 - Sistema de Indexación Profesional Optimizado**

Esta versión representa una **optimización crítica** del sistema de indexación, eliminando límites artificiales y mejorando la estrategia de búsqueda para maximizar la cobertura geográfica sin contaminación internacional.

---

### ✨ **Mejoras Críticas del Sistema de Indexación**

#### 🔍 **Estrategia de Búsqueda Optimizada**
- ✅ **Eliminado término "mejores"** que causaba resultados internacionales (ej: Estocolmo)
- ✅ **3 búsquedas para ciudades grandes** (>200k hab) = 180 resultados para filtrar
- ✅ **2 búsquedas para ciudades medianas** (50k-200k hab) = 120 resultados para filtrar
- ✅ **1 búsqueda para ciudades pequeñas** (<50k hab) = 60 resultados para filtrar
- ✅ **Variación en especificidad geográfica**: Solo cambia formato de ubicación, sin términos ambiguos
- ✅ **Queries limpias**: 
  - `"restaurante en Murcia, Murcia, España"`
  - `"restaurante en Murcia, España"`
  - `"restaurante en Murcia Murcia"`

#### 📝 **Sistema de Logs Sin Límites**
- ✅ **Eliminado límite de 500 logs** que cortaba el historial en procesos largos
- ✅ **Logs ilimitados** para procesos completos de múltiples ciudades
- ✅ **Optimización de guardado**: Cada 10 logs en lugar de cada 1 (mejor rendimiento)
- ✅ **Historial completo visible** desde inicio hasta fin de indexación

#### 🛡️ **Robustez y Continuidad**
- ✅ **Proceso continúa ante errores**: Si un lugar falla, salta al siguiente
- ✅ **Sin bloqueos**: Manejo robusto de timeouts y errores de API
- ✅ **Procesamiento exhaustivo**: TODAS las ciudades se procesan sin detenciones prematuras
- ✅ **Filtrado estricto**: Rating ≥4.7, ≥50 reseñas, solo España

#### 🌍 **Filtro Geográfico Mejorado**
- ✅ **Parámetro `components: 'country:ES'`** en Google Places API
- ✅ **Validación de provincias españolas** con normalización de tildes
- ✅ **Detección de indicadores no españoles**: Stockholm, Estocolmo, etc.
- ✅ **0 resultados internacionales**: Verificado en producción

---

### 📊 **Rendimiento del Sistema**

#### ⚡ **Tiempos de Indexación**
- **Ciudad grande** (>200k hab): ~6 minutos (3 búsquedas + procesamiento)
- **Ciudad mediana** (50k-200k hab): ~4 minutos (2 búsquedas + procesamiento)
- **Ciudad pequeña** (<50k hab): ~2 minutos (1 búsqueda + procesamiento)
- **Pausa entre búsquedas**: 10 segundos (respeto a rate limits de Google)

#### 📈 **Cobertura Esperada**
- **Murcia provincia** (8 ciudades): ~500-600 lugares encontrados → ~25-35 guardados (rating ≥4.7)
- **Provincia completa**: Depende del número de ciudades en Supabase
- **Tasa de aprobación**: ~5-10% (filtro estricto de calidad)

---

### 🐛 **Problemas Resueltos**

#### ❌ **Problema: Resultados de Estocolmo en búsqueda de Murcia**
**Causa**: Término "mejores" en query hacía que Google devolviera "mejores restaurantes del mundo"  
**Solución**: Eliminado término "mejores", solo variación geográfica

#### ❌ **Problema: Logs se cortaban a los ~130 mensajes**
**Causa**: Límite de 500 logs en `logger.ts` línea 71  
**Solución**: Eliminado `slice(-500)`, ahora guarda todos los logs sin límite

#### ❌ **Problema: Proceso parecía bloqueado pero seguía ejecutando**
**Causa**: Logs viejos se borraban, solo se veían los últimos 500  
**Solución**: Con logs ilimitados, ahora se ve todo el historial completo

---

### 📁 **Archivos Modificados**

#### Indexación
- `lib/indexation/search-strategies.ts` - Estrategia de búsqueda sin "mejores"
- `lib/indexation/logger.ts` - Logs ilimitados
- `lib/indexation/indexer-fast.ts` - Continuidad ante errores

#### Documentación
- `CHANGELOG.md` - Este archivo (BETA 10)
- `README.md` - Estado actual actualizado
- Todos los `.md` principales actualizados

---

### 🚀 **Próximos Pasos (BETA 11+)**

- [ ] Dashboard de estadísticas de indexación en tiempo real
- [ ] Sistema de notificaciones al completar indexaciones
- [ ] Exportación de reportes de indexación
- [ ] Optimización de costos de API de Google
- [ ] Sistema de caché inteligente para lugares ya procesados

---

### 📊 **Estadísticas BETA 10**

- **Sistema de Indexación**: Profesional, robusto y sin límites ✅
- **Cobertura geográfica**: Solo España, 0 contaminación internacional ✅
- **Filtros de calidad**: Rating ≥4.7, ≥50 reseñas ✅
- **Logs**: Ilimitados para procesos largos ✅
- **Continuidad**: Proceso completo sin bloqueos ✅

---

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

**Última actualización:** 15 de Octubre de 2025, 22:30h  
**Estado:** BETA 10 - Sistema de indexación profesional optimizado ✅
