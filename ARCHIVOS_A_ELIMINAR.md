# 🗑️ ARCHIVOS MARKDOWN A ELIMINAR O CONSOLIDAR

**Análisis:** 18 de Octubre de 2025  
**Total de .md encontrados:** 64 archivos  
**Criterio:** Obsoletos, duplicados o consolidados en nuevos documentos

---

## ❌ ARCHIVOS PARA ELIMINAR (18 archivos)

### **1. Duplicados de índices (2 archivos)**

#### `INDICE_DOCUMENTACION_BETA_100.md` ❌
- **Razón:** Duplicado de `INDICE_MAESTRO_DOCUMENTACION.md`
- **Acción:** ELIMINAR (ya consolidado en índice maestro)

#### `BETA_100_RELEASE_NOTES.md` ❌
- **Razón:** Información obsoleta (hablaba de solo 300 lugares, ahora hay 2,612)
- **Acción:** ELIMINAR (información desactualizada)

---

### **2. Changelogs históricos obsoletos (4 archivos)**

#### `CHANGELOG_BLOG_MEJORAS_18OCT2025.md` ❌
- **Razón:** Changelog específico de una fecha, ya en CHANGELOG.md
- **Acción:** MOVER a `docs/archive/` o ELIMINAR

#### `CHANGELOG_SISTEMA_ANALYTICS_CHATBOT.md` ❌
- **Razón:** Changelog específico, ya integrado en sistema
- **Acción:** MOVER a `docs/archive/`

#### `CHANGELOG_OPTIMIZACIONES_17OCT2025.md` ❌
- **Razón:** Changelog específico de una fecha
- **Acción:** MOVER a `docs/archive/`

#### `RESUMEN_IMPLEMENTACION_17OCT2025.md` ❌
- **Razón:** Resumen de implementación específico (chatbot subcategorías)
- **Acción:** MOVER a `docs/archive/` (puede tener valor histórico)

---

### **3. Optimizaciones Google API - Duplicados (1 archivo)**

#### `OPTIMIZACION_COSTES_GOOGLE_API.md` ❌
- **Razón:** DUPLICADO de `OPTIMIZACION_GOOGLE_API_COMPLETA.md`
- **Contenido:** Versión antigua, menos completa
- **Acción:** ELIMINAR (la completa tiene todo)

---

### **4. Documentos de mejoras específicas consolidadas (5 archivos)**

#### `MEJORAS_CHATBOT_SUBCATEGORIAS.md` ❌
- **Razón:** Mejora específica ya implementada
- **Acción:** MOVER a `docs/archive/`

#### `MEJORA_QUERIES_BUSQUEDA.md` ❌
- **Razón:** Mejora específica ya implementada
- **Acción:** MOVER a `docs/archive/`

#### `MEJORA_BUSQUEDAS_SUBCATEGORIAS.md` ❌
- **Razón:** Similar a MEJORAS_CHATBOT_SUBCATEGORIAS.md
- **Acción:** MOVER a `docs/archive/`

#### `BUSQUEDA_MANUAL_LUGARES.md` ❌
- **Razón:** Feature específica, no crítica para entender sistema
- **Acción:** MOVER a `docs/archive/`

#### `IMPLEMENTAR_TRACKING.md` ❌
- **Razón:** Tracking ya implementado (Google Analytics + PageTracker)
- **Acción:** MOVER a `docs/archive/`

---

### **5. Checklists obsoletos (2 archivos)**

#### `CHECKLIST_FUNCIONAL.md` ❌
- **Razón:** Checklist de verificación ya cumplido
- **Fecha:** 12 Oct 2025 (obsoleto por nuevo plan estratégico)
- **Acción:** MOVER a `docs/archive/`

#### `VERIFICAR_PRODUCCION.md` ⚠️
- **Razón:** Checklist de producción
- **Acción:** MANTENER (útil para deploys futuros)

---

### **6. Documentos de status obsoletos (2 archivos)**

#### `MOBILE_ADAPTATION_STATUS.md` ❌
- **Razón:** Status point-in-time, ya no relevante
- **Acción:** MOVER a `docs/archive/`

#### `OPTIMIZACIONES_FRONTEND_COSTES.md` ❌
- **Razón:** Consolidado en OPTIMIZACION_GOOGLE_API_COMPLETA.md
- **Acción:** ELIMINAR (duplicado)

---

### **7. Stripe (1 archivo dudoso)**

#### `RESUMEN_STRIPE.md` ⚠️
- **Razón:** Resumen de implementación Stripe
- **Estado:** MANTENER (referencia útil, aunque SISTEMA_MONETIZACION.md tiene más info)
- **Acción:** MANTENER por ahora

---

## 📦 ARCHIVOS YA EN `docs/archive/` (14 archivos)

Estos ya están archivados correctamente:
- ✅ RESUMEN_OPTIMIZACIONES_IMPLEMENTADAS.md
- ✅ CORRECCION_FILTRO_GEOGRAFICO_CIUDADES.md
- ✅ BETA_10_OPTIMIZACION_INDEXACION.md
- ✅ PROBLEMAS_INDEXACION.md
- ✅ OPTIMIZACION_CRITICA_INDEXACION.md
- ✅ RESUMEN_OPTIMIZACION_INDEXACION.md
- ✅ MEJORAS_INDEXACION_SEGUNDO_PLANO_RESUMEN.md
- ✅ RESUMEN_TRABAJO_COMPLETO.md
- ✅ VERIFICACION_FINAL_SISTEMA.md
- ✅ CORRECCION_CRITICA_FILTRO_PAIS.md
- ✅ ANTES_Y_DESPUES.md
- ✅ RESUMEN_ACTUALIZACION_COMPLETA.md
- ✅ README_ACTUALIZACION.md
- ✅ RESUMEN_DEPLOY_AWS.md

**Acción:** MANTENER archivados

---

## ✅ ARCHIVOS CORE - MANTENER (22 archivos)

Estos son documentos activos y útiles:

### **Documentación estratégica (NUEVOS - Mantener):**
1. ✅ `ACCIONES_INMEDIATAS_CRITICAS.md` **← NUEVO**
2. ✅ `PLAN_ESTRATEGICO_2025_SEO_VIABILIDAD.md` **← NUEVO**
3. ✅ `RESUMEN_EJECUTIVO_ACCIONES.md` **← NUEVO**
4. ✅ `ROADMAP_MEJORAS.md` **← ACTUALIZADO**
5. ✅ `INDICE_MAESTRO_DOCUMENTACION.md` **← ACTUALIZADO**

### **Documentación esencial:**
6. ✅ `README.md`
7. ✅ `LEEME_PRIMERO.md`
8. ✅ `CHANGELOG.md`

### **Sistemas core:**
9. ✅ `FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md`
10. ✅ `SISTEMA_INDEXACION_PROFESIONAL_COMPLETO.md`
11. ✅ `SISTEMA_MONETIZACION.md`
12. ✅ `SISTEMA_FILTRADO.md`
13. ✅ `SISTEMA_FOTOS_SUPABASE.md`
14. ✅ `CHATBOT_TIO_VIAJERO.md`

### **Optimización y costes:**
15. ✅ `OPTIMIZACION_GOOGLE_API_COMPLETA.md`

### **Configuración:**
16. ✅ `CONFIGURACION_COMPLETA.md`
17. ✅ `CONEXION_FRONTEND_BACKEND.md`
18. ✅ `COMANDOS_UTILES.md`

### **Deploy:**
19. ✅ `DEPLOY_AWS.md`
20. ✅ `CONFIGURAR_DOMINIO.md`
21. ✅ `GOOGLE_OAUTH_SETUP.md`
22. ✅ `INSTRUCCIONES_RESTRINGIR_API_KEYS.md`
23. ✅ `VERIFICAR_VARIABLES_AWS.md`
24. ✅ `VERIFICAR_PRODUCCION.md`

### **Testing:**
25. ✅ `TESTERS/README.md`
26. ✅ `TESTERS/GUIA_RAPIDA.md`
27. ✅ `TESTERS/GUIA_TEST_INDEXACION.md`

### **Supabase:**
28. ✅ `supabase/README.md`
29. ✅ `supabase/INSTRUCCIONES_MIGRACION.md`
30. ✅ `supabase/MEJORAS_ENLACES_Y_CONTACTO.md`
31. ✅ `supabase/MEJORAS_ALREDEDORES_AFUERAS.md`
32. ✅ `supabase/EJECUTAR_MIGRACION_CIUDADES.md`

### **Scripts:**
33. ✅ `scripts/README_SUBCATEGORIES.md`

### **Tests:**
34. ✅ `__tests__/README.md`

### **Stripe (mantener por ahora):**
35. ✅ `RESUMEN_STRIPE.md`

---

## 🎯 PLAN DE ACCIÓN

### **Paso 1: ELIMINAR archivos duplicados exactos (3 archivos)**
```bash
rm INDICE_DOCUMENTACION_BETA_100.md
rm BETA_100_RELEASE_NOTES.md
rm OPTIMIZACION_COSTES_GOOGLE_API.md
rm OPTIMIZACIONES_FRONTEND_COSTES.md
```

### **Paso 2: MOVER a archive (11 archivos)**
```bash
mv CHANGELOG_BLOG_MEJORAS_18OCT2025.md docs/archive/
mv CHANGELOG_SISTEMA_ANALYTICS_CHATBOT.md docs/archive/
mv CHANGELOG_OPTIMIZACIONES_17OCT2025.md docs/archive/
mv RESUMEN_IMPLEMENTACION_17OCT2025.md docs/archive/
mv MEJORAS_CHATBOT_SUBCATEGORIAS.md docs/archive/
mv MEJORA_QUERIES_BUSQUEDA.md docs/archive/
mv MEJORA_BUSQUEDAS_SUBCATEGORIAS.md docs/archive/
mv BUSQUEDA_MANUAL_LUGARES.md docs/archive/
mv IMPLEMENTAR_TRACKING.md docs/archive/
mv CHECKLIST_FUNCIONAL.md docs/archive/
mv MOBILE_ADAPTATION_STATUS.md docs/archive/
```

### **Paso 3: Actualizar INDICE_MAESTRO_DOCUMENTACION.md**
- Quitar referencias a archivos eliminados
- Añadir prominentemente los 3 nuevos documentos estratégicos

---

## 📊 RESUMEN

| Acción | Cantidad | Detalle |
|--------|----------|---------|
| **ELIMINAR** | 4 | Duplicados exactos u obsoletos |
| **MOVER a archive** | 11 | Documentos históricos con valor |
| **MANTENER activos** | 35 | Documentación core + nuevos estratégicos |
| **Ya archivados** | 14 | Correctamente archivados previamente |

**Total .md en raíz después de limpieza:** ~35 archivos (vs 50 actuales)  
**Reducción:** ~30% menos archivos en raíz  
**Beneficio:** Documentación más clara y navegable

---

## ✅ NUEVOS DOCUMENTOS ESTRATÉGICOS (PRIORIDAD MÁXIMA)

Estos 5 documentos son la **nueva documentación core**:

1. 🚨 **ACCIONES_INMEDIATAS_CRITICAS.md** - Qué hacer YA
2. 📊 **PLAN_ESTRATEGICO_2025_SEO_VIABILIDAD.md** - Estrategia completa
3. 📈 **RESUMEN_EJECUTIVO_ACCIONES.md** - Resumen ejecutivo
4. 🗺️ **ROADMAP_MEJORAS.md** - Roadmap actualizado con prioridades
5. 📚 **INDICE_MAESTRO_DOCUMENTACION.md** - Índice consolidado

**Estos reemplazan efectivamente a:**
- BETA_100_RELEASE_NOTES.md (obsoleto)
- INDICE_DOCUMENTACION_BETA_100.md (duplicado)
- Multiple changelogs específicos (consolidados)

---

**Fecha de análisis:** 18 de Octubre de 2025  
**Próxima revisión:** Mensual (eliminar archivos obsoletos)

