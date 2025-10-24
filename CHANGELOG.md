# 📝 Changelog - Casi Cinco

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
