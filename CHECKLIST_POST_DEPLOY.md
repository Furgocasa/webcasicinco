# ✅ CHECKLIST POST-DEPLOY - 18 OCT 2025

**Commit 1:** `5653e9e` - Feature: SSR/SSG fichas + Trial sin tarjeta + Sitemap  
**Commit 2:** (Pendiente) - Feature: SSR/SSG Blog + Schema.org  
**Push completado:** ✅ 18 OCT 2025  
**AWS Amplify:** Desplegando automáticamente...

---

## 🔄 1. MONITOREAR DEPLOY EN AWS AMPLIFY (5-10 minutos)

### Pasos:
1. Ir a: https://console.aws.amazon.com/amplify/
2. Seleccionar app: **Casi Cinco**
3. Ver sección "Deployments"
4. Estado actual: **Building...** 🔄

### Verificar:
- [ ] Build completo (verde ✅)
- [ ] Sin errores en logs
- [ ] Deploy exitoso

### Si hay errores:
```bash
# Ver logs de build
# Revisar especialmente:
# - Errores de TypeScript
# - Errores de importación
# - Variables de entorno faltantes
```

---

## 🧪 2. TESTING POST-DEPLOY (30 minutos)

### A. Verificar SSR/SSG en Fichas

#### Test 1: Ficha individual renderiza en servidor
```bash
# 1. Ir a cualquier ficha (ejemplo):
https://casicinco.com/restaurante/madrid/[cualquier-slug]

# 2. Ver código fuente (Ctrl+U o clic derecho → Ver código fuente)

# 3. Buscar (Ctrl+F):
✅ DEBE APARECER: <h1> con nombre del lugar
✅ DEBE APARECER: Descripción completa del lugar
✅ DEBE APARECER: Rating y reseñas
❌ NO DEBE APARECER: "Cargando..." o "Loading..."
```

**URLs de prueba:**
- https://casicinco.com/restaurante/malaga/[slug-de-prueba]
- https://casicinco.com/hotel/barcelona/[slug-de-prueba]
- https://casicinco.com/bar/madrid/[slug-de-prueba]

#### Test 2: Schema.org presente
```bash
# 1. Ver código fuente de una ficha
# 2. Buscar: <script type="application/ld+json">

✅ DEBE APARECER:
{
  "@context": "https://schema.org",
  "@type": "Restaurant" (o Hotel, Bar, etc.),
  "name": "...",
  "aggregateRating": {
    "ratingValue": 4.8,
    "reviewCount": 1234
  }
}
```

#### Test 3: Validar en Google Rich Results
```bash
# 1. Ir a: https://search.google.com/test/rich-results
# 2. Pegar URL de una ficha
# 3. Ejecutar test

✅ DEBE MOSTRAR:
- LocalBusiness detectado
- Rating visible
- Sin errores críticos
```

**Checklist SSR/SSG:**
- [ ] HTML completo en código fuente
- [ ] Schema.org presente y válido
- [ ] Meta tags dinámicos (title, description, og:image)
- [ ] Sin "Cargando..." en código fuente

---

### B. Verificar Sitemap Segmentado

#### Test 1: Sitemap Index
```bash
# URL: https://casicinco.com/sitemap-index.xml

✅ DEBE CONTENER:
<sitemapindex>
  <sitemap>
    <loc>https://casicinco.com/sitemap-static.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-places.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://casicinco.com/sitemap-blog.xml</loc>
  </sitemap>
</sitemapindex>
```

#### Test 2: Sitemap de Lugares
```bash
# URL: https://casicinco.com/sitemap-places.xml

✅ DEBE CONTENER:
- Lista de URLs de fichas
- ~2,600+ URLs
- lastmod, changefreq, priority
```

#### Test 3: robots.txt apunta al index
```bash
# URL: https://casicinco.com/robots.txt

✅ DEBE CONTENER:
Sitemap: https://casicinco.com/sitemap-index.xml
```

**Checklist Sitemaps:**
- [ ] `/sitemap-index.xml` accesible
- [ ] `/sitemap-static.xml` accesible
- [ ] `/sitemap-places.xml` accesible (2,600+ URLs)
- [ ] `/sitemap-blog.xml` accesible
- [ ] robots.txt apunta a sitemap-index.xml

---

### C. Verificar Trial Sin Tarjeta

#### Test 1: Registro nuevo usuario
```bash
# 1. Abrir ventana incógnito
# 2. Ir a: https://casicinco.com/registro
# 3. Registrar con email nuevo: test+18oct2025@tudominio.com
# 4. Completar registro
```

#### Test 2: WelcomeModal aparece
```bash
✅ DEBE APARECER al primer login:
- Modal con 3 opciones
- 🎁 Trial 30 días SIN tarjeta (destacado)
- ⚡ Premium Mensual 2.99€
- 👑 Premium Anual 24.99€
```

#### Test 3: Trial asignado en Supabase
```bash
# 1. Ir a Supabase Dashboard
# 2. Table Editor → auth.users
# 3. Buscar el usuario recién creado
# 4. Ver campo: raw_user_meta_data

✅ DEBE CONTENER:
{
  "trial_ends_at": "2025-11-17T...",
  "trial_started_at": "2025-10-18T...",
  "is_trial_active": true
}
```

**Checklist Trial:**
- [ ] WelcomeModal aparece al primer login
- [ ] Trial de 30 días asignado automáticamente
- [ ] Usuario puede acceder sin poner tarjeta
- [ ] `raw_user_meta_data` tiene `trial_ends_at`

---

### D. Verificar Páginas Clave

#### Homepage
```bash
URL: https://casicinco.com/
✅ Carga correctamente
✅ Sin errores en consola
```

#### Mapa
```bash
URL: https://casicinco.com/mapa
✅ Carga correctamente
✅ Lugares visibles
```

#### Pricing
```bash
URL: https://casicinco.com/pricing
✅ Botones de suscripción funcionan
✅ Redirige a Stripe (sin trialDays)
```

#### Admin
```bash
URL: https://casicinco.com/admin
✅ Solo accesible para admins
```

**Checklist Páginas:**
- [ ] Homepage funciona
- [ ] Mapa funciona
- [ ] Pricing funciona
- [ ] Admin protegida
- [ ] Blog funciona

---

## 📊 3. ENVIAR SITEMAP A GOOGLE SEARCH CONSOLE (5 minutos)

### Pasos:
1. **Ir a:** https://search.google.com/search-console
2. **Seleccionar propiedad:** `casicinco.com`
3. **Menú lateral:** Indexación → **Sitemaps**
4. **Añadir nuevo sitemap:** 
   ```
   https://casicinco.com/sitemap-index.xml
   ```
5. **Enviar**

### Verificar:
```bash
Estado: "Correcto" ✅
URLs descubiertas: ~2,700+
Última lectura: Fecha actual
```

### Nota:
- Google puede tardar 24-48h en procesar
- Monitorear en los próximos días:
  - Cobertura → Ver páginas indexadas
  - Rendimiento → Ver impresiones

**Checklist GSC:**
- [ ] Sitemap enviado a GSC
- [ ] Estado: Correcto
- [ ] URLs descubiertas visible

---

## 🔍 4. VERIFICACIÓN DE ERRORES

### A. Consola del navegador
```bash
# 1. Abrir DevTools (F12)
# 2. Tab "Console"
# 3. Navegar por varias páginas

❌ NO DEBE HABER:
- Errores rojos críticos
- Warnings de React/Next.js
- 404s de recursos
```

### B. Logs de AWS Amplify
```bash
# 1. AWS Amplify Console
# 2. Ver logs de runtime
# 3. Buscar errores

❌ NO DEBE HABER:
- Server errors (500)
- Build failures
- Missing env vars
```

### C. Network Tab
```bash
# 1. DevTools → Network
# 2. Navegar a una ficha
# 3. Ver respuestas

✅ DEBE SER:
- Status 200 OK
- HTML con contenido completo
- No 404s
```

**Checklist Errores:**
- [ ] Sin errores en consola
- [ ] Sin 404s de recursos
- [ ] Sin errores de servidor
- [ ] Logs de Amplify limpios

---

## 📈 5. MÉTRICAS INICIALES (Baseline)

### Google Search Console (Guardar para comparar)
```bash
Hoy (baseline):
- Páginas indexadas: ____
- Impresiones (7 días): ____
- Clicks (7 días): ____
- CTR promedio: ____%
- Posición promedio: ____
```

### Google Analytics
```bash
Hoy (baseline):
- Usuarios (7 días): ____
- Sesiones: ____
- Páginas vistas: ____
- Tasa de rebote: ____%
```

### Supabase (Usuarios trial)
```bash
Hoy:
- Total usuarios: ____
- Usuarios en trial activo: ____
- Suscriptores: ____
```

**Anotar estas métricas para comparar en 7, 14, 30 días.**

---

## ⚠️ TROUBLESHOOTING

### Problema 1: Build falla en Amplify
```bash
Solución:
1. Ver logs de error específico
2. Verificar variables de entorno en Amplify
3. Probar build local: npm run build
```

### Problema 2: WelcomeModal no aparece
```bash
Verificar:
1. localStorage.getItem('hasSeenWelcome') === null
2. Usuario recién registrado (no existente)
3. Console errors en navegador
```

### Problema 3: Sitemap devuelve 404
```bash
Verificar:
1. Estructura de carpetas correcta: app/sitemap-index.xml/route.ts
2. Deploy completado al 100%
3. Cache de CDN limpiado
```

### Problema 4: Schema.org no válido
```bash
Verificar:
1. JSON-LD bien formado (sin comas extra)
2. Campos requeridos presentes
3. Test en: https://validator.schema.org/
```

---

## ✅ CHECKLIST FINAL

### Deploy:
- [x] Push a GitHub completado
- [ ] Build en Amplify exitoso
- [ ] Deploy en producción activo
- [ ] Sin errores de build

### Testing SSR/SSG:
- [ ] Fichas renderizan HTML completo
- [ ] Blog posts renderizan HTML completo
- [ ] Schema.org presente y válido (fichas + blog)
- [ ] Rich Results Test aprobado
- [ ] Meta tags dinámicos correctos

### Testing Trial:
- [ ] WelcomeModal funciona
- [ ] Trial asignado en Supabase
- [ ] Usuario puede acceder sin tarjeta
- [ ] 30 días calculados correctamente

### Sitemaps:
- [ ] Sitemap index accesible
- [ ] Sub-sitemaps accesibles
- [ ] robots.txt actualizado
- [ ] Enviado a Google Search Console

### General:
- [ ] Homepage funciona
- [ ] Mapa funciona
- [ ] Pricing funciona
- [ ] Sin errores en consola
- [ ] Métricas baseline anotadas

---

## 📅 PRÓXIMOS PASOS (HOY)

1. **Esperar 5-10 minutos** → Build de Amplify complete
2. **Testing completo** (30 min) → Verificar todos los puntos
3. **Enviar sitemap a GSC** (5 min) → Activar indexación
4. **Monitorear 24h** → Ver primeros resultados

---

## 🎉 OBJETIVO ALCANZADO HOY

✅ **Deploy completado**  
✅ **SSR/SSG activo** → 2,612 páginas indexables  
✅ **Trial sin tarjeta** → Conversión mejorada  
✅ **Sitemap optimizado** → Indexación acelerada  

**Próxima tarea:** Crear guías editoriales esta semana 📝

---

**Última actualización:** 18 de Octubre de 2025  
**Estado:** Push completado, esperando build en Amplify

