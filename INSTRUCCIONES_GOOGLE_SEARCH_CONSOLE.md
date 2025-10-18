# 🔍 INSTRUCCIONES: Google Search Console - Sitemap Actualizado

**Fecha:** 18 de Octubre de 2025  
**Acción:** Enviar nuevo sitemap con páginas programáticas a Google

---

## 🎯 ¿QUÉ HEMOS HECHO?

Hemos añadido **208 páginas programáticas** al sitemap:
- `/restaurante/Madrid`
- `/restaurante/Barcelona`
- `/hotel/Madrid`
- `/hotel/Valencia`
- `/bar/Sevilla`
- `/cafe/Málaga`
- ... (todas las combinaciones categoría + provincia)

---

## 🚀 PASO A PASO: Enviar Sitemap a Google

### 1. Acceder a Google Search Console

```
https://search.google.com/search-console
```

- **Propiedad:** `casicinco.com`
- **Usuario:** Tu cuenta de Google asociada al proyecto

---

### 2. Verificar que el sitemap funciona

**Antes de enviarlo a Google, verifica que está accesible:**

1. Abre en tu navegador:
   ```
   https://casicinco.com/sitemap-index.xml
   ```

2. Deberías ver un XML con 4 sitemaps:
   - `sitemap-static.xml` ✅
   - **`sitemap-categories.xml` ← NUEVO** ✅
   - `sitemap-places.xml` ✅
   - `sitemap-blog.xml` ✅

3. Verifica el nuevo sitemap de categorías:
   ```
   https://casicinco.com/sitemap-categories.xml
   ```

4. Deberías ver ~208 URLs como:
   ```xml
   <url>
     <loc>https://casicinco.com/restaurante/Madrid</loc>
     <lastmod>2025-10-18T...</lastmod>
     <changefreq>daily</changefreq>
     <priority>0.8</priority>
   </url>
   ```

---

### 3. Enviar sitemap en Google Search Console

#### Opción A: Ya tienes el sitemap enviado (solo actualizar)

Si ya enviaste `sitemap-index.xml` antes:

1. **Ve a:** Sitemaps (menú izquierda)
2. **Busca:** `sitemap-index.xml`
3. **Haz clic en:** "..." (tres puntos) → **"Volver a enviar"**
4. Google lo procesará automáticamente y detectará las nuevas URLs

**Tiempo:** 1-3 días para indexar las 208 páginas nuevas

---

#### Opción B: Primera vez enviando sitemap

Si nunca has enviado el sitemap:

1. **Ve a:** Sitemaps (menú izquierda)
2. **En "Añadir un sitemap nuevo":**
   ```
   sitemap-index.xml
   ```
3. **Haz clic en:** "ENVIAR"

**Resultado:**
- Google descubrirá los 4 sitemaps automáticamente
- Empezará a indexar las 3,319+ URLs (estáticas + categorías + lugares + blog)

---

### 4. Verificar progreso de indexación

Después de 24-48 horas:

1. **Ve a:** Sitemaps
2. **Verifica estado:**
   - ✅ **Correcto:** "Correcta" (verde)
   - ⚠️ **Procesando:** "Enviado" (amarillo) → espera 24h
   - ❌ **Error:** "No se ha podido recuperar" (rojo) → revisar

3. **Verifica URLs descubiertas:**
   - Deberías ver **+208 URLs** en el contador
   - Google mostrará: "Descubiertas: 3,319" (o similar)

---

### 5. Monitorear indexación en tiempo real

**Opción A: Buscar en Google**

```
site:casicinco.com restaurante Madrid
```

Deberías ver la página `/restaurante/Madrid` en resultados.

---

**Opción B: Inspección de URL**

1. **Ve a:** Inspeccionar URL (barra superior)
2. **Pega:** `https://casicinco.com/restaurante/Madrid`
3. **Haz clic en:** "Inspeccionar"
4. **Si NO está indexada:**
   - Haz clic en "Solicitar indexación"
   - Google la indexará en 1-2 días

---

## 📊 RESULTADOS ESPERADOS

### Semana 1 (1-7 días)
- ✅ Google descubre las 208 URLs
- ✅ Empieza a rastrearlas
- ⏳ Aún no aparecen en resultados

### Semana 2-3 (7-21 días)
- ✅ Primeras páginas indexadas
- ✅ Aparecen en búsquedas de marca:
  - "casicinco restaurantes madrid"
  - "casicinco hoteles barcelona"

### Mes 1-2 (30-60 días)
- ✅ **208 páginas indexadas**
- ✅ Empiezan a rankear para keywords genéricas:
  - "restaurantes madrid" (posición 50-100)
  - "hoteles barcelona" (posición 50-100)
- ✅ **Estimación:** +100-300 visitas orgánicas/mes

### Mes 3-6 (90-180 días)
- ✅ Mejoran posiciones con links internos
- ✅ Rankean en top 30-50 para keywords competitivas
- ✅ **Estimación:** +500-1000 visitas orgánicas/mes

---

## 🔍 QUERIES A MONITOREAR

Ve a **Google Search Console → Rendimiento** y busca:

### Keywords objetivo (aparecerán progresivamente):
- `restaurantes madrid`
- `hoteles barcelona`
- `bares sevilla`
- `cafeterias valencia`
- `mejores restaurantes madrid`
- `donde comer en barcelona`
- `hoteles baratos madrid`
- etc.

### Filtros útiles:
- **"Nuevas consultas"** → Ver keywords que antes no tenías
- **"Páginas"** → Filtrar por `/restaurante/` para ver tráfico de categorías

---

## ⚠️ PROBLEMAS COMUNES

### ❌ "No se ha podido recuperar"

**Causa:** El sitemap no es accesible

**Solución:**
1. Verifica que `https://casicinco.com/sitemap-index.xml` carga
2. Verifica que AWS Amplify deployó correctamente
3. Espera 1 hora (caché) y vuelve a enviar

---

### ❌ "Enviado, pero no indexado"

**Causa:** Google lo descubrió pero aún no lo rastreó

**Solución:**
- ✅ **Normal:** Google tarda 1-3 días en rastrear
- ⏳ Espera 48-72 horas
- Si persiste, usa "Solicitar indexación" manualmente

---

### ❌ URLs descubiertas = 0

**Causa:** El sitemap está vacío o mal formado

**Solución:**
1. Abre `https://casicinco.com/sitemap-categories.xml`
2. Verifica que hay `<url>` tags
3. Si está vacío, revisa que haya lugares en Supabase con `published = true`

---

## 🎯 PRÓXIMOS PASOS (POST-INDEXACIÓN)

Una vez que Google indexe las páginas:

### 1. Optimizar contenido
- Añadir descripciones únicas por provincia
- Añadir estadísticas (ej: "Madrid tiene 450 restaurantes casi cinco")
- Añadir mapa destacado

### 2. Link building interno
- Desde `/mapa` → links a `/restaurante/Madrid`
- Desde fichas de lugares → link a su categoría
- Desde blog → links a categorías relevantes

### 3. Link building externo
- Badges para lugares: "Estamos en CasiCinco"
- Menciones en redes sociales
- Guest posts en blogs de viajes

---

## 📈 MÉTRICAS A SEGUIR

**Google Search Console → Rendimiento:**
- **Impresiones:** Cuántas veces apareces en Google
- **Clics:** Cuántas visitas desde Google
- **CTR:** % de clics (objetivo: >3%)
- **Posición media:** Dónde rankeas (objetivo: <50)

**Google Analytics:**
- **Organic Search Traffic:** Tráfico desde Google
- **Landing Pages:** Páginas de entrada más visitadas
- **Conversiones:** Registros desde tráfico orgánico

---

## ✅ CHECKLIST POST-DEPLOY

- [ ] Verificar `sitemap-index.xml` accesible
- [ ] Verificar `sitemap-categories.xml` accesible
- [ ] Enviar/actualizar sitemap en Google Search Console
- [ ] Esperar 48h y verificar URLs descubiertas
- [ ] Solicitar indexación manual de 5-10 URLs clave
- [ ] Monitorear keywords en Rendimiento (7 días)
- [ ] Verificar errores en Cobertura (7 días)

---

## 🔗 ENLACES ÚTILES

- **Google Search Console:** https://search.google.com/search-console
- **Sitemap Index:** https://casicinco.com/sitemap-index.xml
- **Sitemap Categorías:** https://casicinco.com/sitemap-categories.xml
- **Validador XML:** https://www.xml-sitemaps.com/validate-xml-sitemap.html

---

**¿Dudas?** Consulta la documentación oficial:
https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

