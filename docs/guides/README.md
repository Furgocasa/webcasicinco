# 📘 Guías Paso a Paso

Esta carpeta contiene **guías prácticas** para setup, configuración y deployment.

---

## 📁 Contenido

### 🚀 **Setup Inicial**

#### `CONFIGURACION_COMPLETA.md`
**Propósito:** Setup inicial completo del proyecto desde cero  
**Incluye:**
- Git repository setup
- Scripts de automatización (setup.ps1, start.ps1)
- NPM configuration (.npmrc)
- Variables de entorno
- Estructura del proyecto

**Audiencia:** Nuevos desarrolladores  
**Cuándo usarlo:** Primera vez configurando el proyecto

---

### ☁️ **Deployment**

#### `DEPLOY_AWS.md`
**Propósito:** Guía completa de deployment en AWS Amplify  
**Incluye:**
- Conectar repositorio GitHub
- Build settings
- Variables de entorno (9 críticas)
- Dominio personalizado
- Stripe webhooks
- Auto-deploy

**Audiencia:** DevOps, Desarrolladores  
**Cuándo usarlo:** Deploy a producción

---

#### `VERIFICAR_PRODUCCION.md` ⭐
**Propósito:** Checklist completo post-deploy  
**Incluye:**
- Verificar variables de entorno críticas
- Errores comunes y soluciones
- Google Maps API key verification
- Pasos para deployar cambios
- Post-deploy verification

**Audiencia:** DevOps, QA  
**Cuándo usarlo:** Después de cada deploy

---

#### `VERIFICAR_VARIABLES_AWS.md`
**Propósito:** Variables de entorno críticas en AWS Amplify  
**Incluye:**
- 9 variables críticas (Supabase, Google, OpenAI, Stripe)
- Troubleshooting de variables faltantes
- Verificación de `OPENAI_API_KEY`

**Audiencia:** DevOps  
**Cuándo usarlo:** Troubleshooting de deploy

---

### 🌐 **Configuración de Dominio**

#### `CONFIGURAR_DOMINIO.md`
**Propósito:** Configurar casicinco.com en AWS Amplify  
**Incluye:**
- Añadir dominio en Amplify
- Configurar DNS records
- SSL/HTTPS automático
- Actualizar Google Maps para nuevo dominio

**Audiencia:** DevOps  
**Cuándo usarlo:** Setup inicial de producción

---

### 💳 **Pagos y Stripe**

#### `CONFIGURAR_STRIPE.md`
**Propósito:** Configurar Stripe para suscripciones mensuales/anuales  
**Incluye:**
- Crear cuenta Stripe
- Obtener API keys
- Crear productos y precios
- Configurar webhooks
- Testing en local y producción
- Trial de 30 días

**Audiencia:** Desarrolladores Backend, DevOps  
**Cuándo usarlo:** Setup de monetización

---

### 🔐 **Autenticación**

#### `GOOGLE_OAUTH_SETUP.md`
**Propósito:** Configurar login con Google OAuth  
**Incluye:**
- Setup OAuth 2.0 Client ID en Google Cloud
- Configurar provider en Supabase
- Actualizar redirect URLs
- Testing

**Audiencia:** Desarrolladores Backend  
**Cuándo usarlo:** Setup inicial de autenticación

---

### 🔒 **Seguridad**

#### `INSTRUCCIONES_RESTRINGIR_API_KEYS.md` 🔴 CRÍTICO
**Propósito:** Restringir Google Maps API keys para seguridad  
**Incluye:**
- **Frontend key:** Restricciones por dominio
- **Backend key:** Sin restricciones de aplicación
- APIs permitidas por key
- Actualizar variables en AWS Amplify
- Redeploy

**Audiencia:** DevOps (URGENTE)  
**Cuándo usarlo:** INMEDIATAMENTE después de crear keys

---

### 🔍 **SEO**

#### `INSTRUCCIONES_GOOGLE_SEARCH_CONSOLE.md`
**Propósito:** Configurar Google Search Console para SEO  
**Incluye:**
- Añadir propiedad en GSC
- Verificar dominio
- Enviar sitemap
- Monitorear indexación

**Audiencia:** SEO, Marketing, DevOps  
**Cuándo usarlo:** Post-deploy, antes de lanzamiento público

---

## 🎯 Guías por Flujo de Trabajo

### **Flujo: Setup Inicial (Primera Vez)**
```
1. CONFIGURACION_COMPLETA.md
2. GOOGLE_OAUTH_SETUP.md
3. CONFIGURAR_STRIPE.md (opcional)
```

### **Flujo: Deploy a Producción**
```
1. DEPLOY_AWS.md
2. VERIFICAR_VARIABLES_AWS.md
3. INSTRUCCIONES_RESTRINGIR_API_KEYS.md (🔴 CRÍTICO)
4. CONFIGURAR_DOMINIO.md
5. VERIFICAR_PRODUCCION.md
6. INSTRUCCIONES_GOOGLE_SEARCH_CONSOLE.md
```

### **Flujo: Troubleshooting Deploy**
```
1. VERIFICAR_VARIABLES_AWS.md
2. VERIFICAR_PRODUCCION.md
3. INSTRUCCIONES_RESTRINGIR_API_KEYS.md
```

### **Flujo: Setup Monetización**
```
1. CONFIGURAR_STRIPE.md
2. Código en: /docs/systems/SISTEMA_MONETIZACION.md
```

---

## ⚠️ Guías Críticas

### 🔴 **URGENTE - Leer AHORA:**
1. `INSTRUCCIONES_RESTRINGIR_API_KEYS.md` - Evitar abuso de API keys

### 🟡 **IMPORTANTE - Antes de Deploy:**
1. `DEPLOY_AWS.md`
2. `VERIFICAR_VARIABLES_AWS.md`
3. `VERIFICAR_PRODUCCION.md`

### 🟢 **RECOMENDADO - Post-Deploy:**
1. `CONFIGURAR_DOMINIO.md`
2. `INSTRUCCIONES_GOOGLE_SEARCH_CONSOLE.md`

---

## 📊 Checklist de Configuración

### **Setup Inicial:**
- [ ] Clonar repositorio
- [ ] Ejecutar `CONFIGURACION_COMPLETA.md`
- [ ] Configurar variables de entorno (.env.local)
- [ ] Ejecutar migraciones SQL
- [ ] `npm install && npm run dev`

### **Deploy a Producción:**
- [ ] Completar `DEPLOY_AWS.md`
- [ ] Verificar 9 variables críticas (`VERIFICAR_VARIABLES_AWS.md`)
- [ ] **CRÍTICO:** Restringir API keys (`INSTRUCCIONES_RESTRINGIR_API_KEYS.md`)
- [ ] Configurar dominio (`CONFIGURAR_DOMINIO.md`)
- [ ] Checklist post-deploy (`VERIFICAR_PRODUCCION.md`)

### **SEO y Lanzamiento:**
- [ ] Enviar sitemap a GSC (`INSTRUCCIONES_GOOGLE_SEARCH_CONSOLE.md`)
- [ ] Verificar SSR/SSG funcionando
- [ ] Verificar Schema.org presente

---

## 🔗 Enlaces Relacionados

- **Sistemas técnicos:** `../systems/`
- **Estrategia y roadmap:** `../strategy/`
- **Índice completo:** `/INDICE_MAESTRO_DOCUMENTACION.md`
- **Comandos útiles:** `/COMANDOS_UTILES.md`

---

**📚 Carpeta creada:** 26 de Octubre de 2025  
**Versión:** Documentación v3.0.0  
**Total de guías:** 9





