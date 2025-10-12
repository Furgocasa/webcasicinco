# 🗄️ Supabase Setup - Casi Cinco

**Última actualización:** 12 de Octubre de 2025

## 📋 Instrucciones de Instalación

### **Paso 1: Ejecutar Schema Base**
1. Ve a tu proyecto Supabase: https://zzycxijexoxrjpijslsb.supabase.co
2. Click en **"SQL Editor"** (menú lateral)
3. Abre el archivo: `01-schema-base.sql`
4. **Copia TODO el contenido** del archivo
5. Pégalo en el editor SQL de Supabase
6. Click **"Run"** (botón verde)
7. ✅ Deberías ver: "Setup completado correctamente!"

### **Paso 2: Ejecutar Filtrado Avanzado**
1. En el mismo SQL Editor
2. Abre el archivo: `02-filtrado-avanzado.sql`
3. **Copia TODO el contenido** del archivo
4. Pégalo en el editor SQL
5. Click **"Run"**
6. ✅ Deberías ver: "Filtrado avanzado configurado!"

### **Paso 3: CORREGIR POLÍTICAS RLS (IMPORTANTE)**
1. En el mismo SQL Editor
2. Abre el archivo: `04-fix-rls-policies.sql`
3. **Copia TODO el contenido** del archivo
4. Pégalo en el editor SQL
5. Click **"Run"**
6. ✅ Deberías ver: "Políticas RLS corregidas!"

**⚠️ ESTE PASO ES OBLIGATORIO** - Sin él, tendrás errores de permisos al indexar.

### **Paso 4: Ejecutar Sistema de Pagos (Opcional)**
1. En el mismo SQL Editor
2. Abre el archivo: `03-stripe-pagos.sql`
3. **Copia TODO el contenido** del archivo
4. Pégalo en el editor SQL
5. Click **"Run"**
6. ✅ Deberías ver: "Sistema de pagos configurado!"

---

## 📁 Archivos SQL

### **Setup Inicial (Obligatorios)**
- **`01-schema-base.sql`** - Tablas principales, índices, RLS
- **`02-filtrado-avanzado.sql`** - Sistema de tiers y filtros avanzados
- **`03-stripe-pagos.sql`** - Sistema de suscripciones y pagos (opcional)
- **`04-fix-rls-policies.sql`** - Corrección de políticas RLS (OBLIGATORIO)
- **`13-app-config.sql`** - Configuración del chatbot

### **Mejoras del Chatbot (Nuevos)**
- **`20-update-prompt-coherente.sql`** - Sincronización 50/500 reseñas
- **`21-prompt-alrededores-optimizado.sql`** - Detección de afueras/alrededores
- **`22-prompt-con-enlaces-y-datos.sql`** - Enlaces y datos de contacto
- **`23-prompt-completo-final.sql`** - ⭐ **USAR ESTE** - Prompt completo con TODAS las mejoras

### **Documentación**
- **`MEJORAS_ALREDEDORES_AFUERAS.md`** - Guía de mejoras de alrededores
- **`MEJORAS_ENLACES_Y_CONTACTO.md`** - Guía de enlaces intra-web

### **Utilidades**
- **`RESET.sql`** - Resetear lugares (cuidado, borra datos)

---

## ✅ Verificación

Después de ejecutar los 3 archivos, deberías tener:

### **Tablas creadas:**
- ✅ `places` - Lugares indexados
- ✅ `indexation_jobs` - Trabajos de indexación
- ✅ `user_favorites` - Favoritos de usuarios
- ✅ `subscriptions` - Suscripciones (si ejecutaste Stripe)
- ✅ `subscription_items` - Items de suscripción

### **Funciones creadas:**
- ✅ `calculate_quality_tier()` - Calcula tier automáticamente
- ✅ `find_nearby_places()` - Búsqueda geográfica
- ✅ `is_admin()` - Verificación de admin

### **Datos de prueba:**
- ✅ 2 lugares de ejemplo en Málaga
- ✅ Sistema de tiers funcionando

---

## 🚀 Siguiente Paso

Una vez ejecutados los SQLs:
1. **Reinicia el servidor** de Next.js
2. **Ve a** `http://localhost:3000/mapa`
3. **Deberías ver** los 2 lugares de ejemplo en el mapa
4. **Prueba los filtros** funcionando

---

## 🆘 Si hay errores

**Error común**: "relation does not exist"
- **Solución**: Ejecuta los archivos en orden (01, 02, 03)

**Error común**: "permission denied"
- **Solución**: Asegúrate de estar en el proyecto correcto

**Error común**: "extension not found"
- **Solución**: Supabase debería tener PostGIS habilitado por defecto
