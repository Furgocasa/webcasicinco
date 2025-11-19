# 🔧 Documentación de Sistemas

Esta carpeta contiene la **documentación técnica completa** de todos los sistemas core del proyecto.

---

## 📁 Contenido

### ⭐ **Documento Maestro**

#### `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md` ⭐⭐⭐⭐⭐
**Propósito:** DOCUMENTO MAESTRO que explica el sistema completo de 2 fases  
**Incluye:**
- **FASE 1:** Indexación rápida (sin IA)
- **FASE 2:** Enriquecimiento con IA (OpenAI GPT-4)
- **FASE 3:** Publicación manual
- Flujos de datos, APIs, base de datos

**Audiencia:** TODO EL EQUIPO (lectura obligatoria)  
**Frecuencia de uso:** ⭐⭐⭐⭐⭐ Diaria

---

### 🔍 **Sistema de Indexación**

#### `SISTEMA_INDEXACION_PROFESIONAL_COMPLETO.md`
**Propósito:** Sistema completo de indexación profesional  
**Incluye:**
- Logs en tiempo real
- Pausa/Resume/Cancelar
- Modal flotante profesional
- Control zombie jobs
- Validaciones

**Audiencia:** Desarrolladores Backend  
**Frecuencia de uso:** ⭐⭐⭐ Semanal

---

### 💰 **Monetización y Pagos**

#### `SISTEMA_MONETIZACION.md`
**Propósito:** Sistema Freemium Light con trial de 30 días  
**Incluye:**
- 3 tipos de usuario (Admin, Free, Regular)
- Trial sin tarjeta
- Planes mensuales/anuales con Stripe
- Webhooks y sincronización
- Access control

**Audiencia:** Desarrolladores Full Stack  
**Frecuencia de uso:** ⭐⭐⭐ Según necesidad

---

### 📸 **Gestión de Fotos**

#### `SISTEMA_FOTOS_SUPABASE.md`
**Propósito:** Sistema de fotos con Supabase Storage  
**Incluye:**
- Migración desde Google Photos API
- Upload/Download automático
- Helpers de URL
- Ahorro €45,000/año

**Audiencia:** Desarrolladores Backend  
**Frecuencia de uso:** ⭐⭐⭐ Según necesidad

---

### 🔍 **Google APIs**

#### `SISTEMA_LLAMADAS_GOOGLE_API.md`
**Propósito:** Cuándo y cómo se usa Google Places API  
**Incluye:**
- Arquitectura 2 fases (indexación vs visualización)
- Casos legítimos de uso
- Optimizaciones implementadas
- Cost breakdown por llamada

**Audiencia:** Desarrolladores, DevOps  
**Frecuencia de uso:** ⭐⭐⭐⭐ Frecuente

---

#### `OPTIMIZACION_GOOGLE_API_COMPLETA.md`
**Propósito:** Todas las optimizaciones implementadas  
**Incluye:**
- MapContext Provider (ahorro 66%)
- Update ratings sin reindexar
- Fotos en Supabase
- Caché de búsquedas
- API keys restringidas
- **Ahorro total: ~€108,300/año**

**Audiencia:** Desarrolladores, Managers (para métricas)  
**Frecuencia de uso:** ⭐⭐⭐⭐ Frecuente

---

### 🎯 **Filtrado y Tiers**

#### `SISTEMA_FILTRADO.md`
**Propósito:** Sistema de filtros avanzados basado en Tiers  
**Incluye:**
- Tiers: Diamond (4.9+), Platinum (4.8+), Gold (4.7+), Silver (4.6+), Bronze (4.5+)
- Números reales por categoría
- Lógica de filtrado
- UI/UX de filtros

**Audiencia:** Desarrolladores Frontend/Backend  
**Frecuencia de uso:** ⭐⭐⭐ Según necesidad

---

### 📱 **Redes Sociales**

#### `SISTEMA_REDES_SOCIALES.md`
**Propósito:** Scraping y gestión de perfiles sociales  
**Incluye:**
- Script `scrape-social-media.js`
- Validación automática
- Diagnóstico y limpieza
- Reportes generados
- Estrategia de scraping gradual

**Audiencia:** Desarrolladores, Administradores  
**Frecuencia de uso:** ⭐⭐ Según necesidad

---

### 🤖 **Chatbot IA**

#### `CHATBOT_TIO_VIAJERO.md`
**Propósito:** Chatbot "Tío Viajero" con OpenAI GPT-4  
**Incluye:**
- Detección inteligente de categoría/cantidad
- Respeto de tiers del usuario
- Enlaces internos automáticos
- Análisis de disponibilidad de contacto
- UI/UX: floating button, modal, historial
- Analytics y evaluación IA

**Audiencia:** Desarrolladores Full Stack, IA  
**Frecuencia de uso:** ⭐⭐⭐ Según necesidad

---

## 🎯 Cómo Usar Esta Carpeta

### **Si eres nuevo:**
1. **OBLIGATORIO:** Lee `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md`
2. Profundiza en el sistema en el que trabajarás
3. Consulta `SISTEMA_LLAMADAS_GOOGLE_API.md` para entender costes

### **Si eres desarrollador Backend:**
1. `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md` ⭐
2. `SISTEMA_INDEXACION_PROFESIONAL_COMPLETO.md`
3. `SISTEMA_FOTOS_SUPABASE.md`
4. `SISTEMA_LLAMADAS_GOOGLE_API.md`

### **Si eres desarrollador Frontend:**
1. `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md` ⭐
2. `SISTEMA_FILTRADO.md`
3. `CHATBOT_TIO_VIAJERO.md`

### **Si eres Full Stack:**
1. Lee todos los SISTEMA_*.md según necesidad
2. `SISTEMA_MONETIZACION.md` para pagos
3. `OPTIMIZACION_GOOGLE_API_COMPLETA.md` para optimizaciones

---

## 📊 Estado Actual de Sistemas

| Sistema | Estado | Documentación |
|---------|--------|---------------|
| Indexación | ✅ COMPLETO | `SISTEMA_INDEXACION_PROFESIONAL_COMPLETO.md` |
| Enriquecimiento IA | ✅ COMPLETO | `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md` |
| Fotos Supabase | ✅ OPTIMIZADO (96.8%) | `SISTEMA_FOTOS_SUPABASE.md` |
| Google API | ✅ OPTIMIZADO (~€108k/año) | `OPTIMIZACION_GOOGLE_API_COMPLETA.md` |
| Monetización | ✅ IMPLEMENTADO | `SISTEMA_MONETIZACION.md` |
| Chatbot IA | ✅ FUNCIONAL | `CHATBOT_TIO_VIAJERO.md` |
| Filtrado | ✅ COMPLETO | `SISTEMA_FILTRADO.md` |
| Redes Sociales | ✅ FUNCIONAL | `SISTEMA_REDES_SOCIALES.md` |

---

## 🔗 Enlaces Relacionados

- **Estrategia y planificación:** `../strategy/`
- **Guías de setup/deploy:** `../guides/`
- **Índice completo:** `/INDICE_MAESTRO_DOCUMENTACION.md`
- **Comandos útiles:** `/COMANDOS_UTILES.md`
- **Conexiones APIs:** `/CONEXION_FRONTEND_BACKEND.md`

---

**📚 Carpeta creada:** 26 de Octubre de 2025  
**Versión:** Documentación v3.0.0  
**Total de sistemas documentados:** 9













