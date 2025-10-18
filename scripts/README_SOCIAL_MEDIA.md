# 📱 Script de Búsqueda de Redes Sociales

**Fecha:** 18 de Octubre de 2025  
**Objetivo:** Encontrar y almacenar perfiles de Instagram, Facebook, Twitter y TikTok de los lugares

---

## 🎯 PROBLEMA QUE RESUELVE

1. **Growth orgánico:** Seguir a lugares desde `@casicinco` → engagement natural
2. **SEO:** Añadir redes sociales al Schema.org → más autoridad
3. **UX:** Usuarios pueden seguir directamente al lugar desde la ficha
4. **Viralidad:** Lugares comparten que están en CasiCinco

---

## 🚀 USO DEL SCRIPT

### **Opción 1: Búsqueda automática con IA (Recomendado)**

```bash
# Procesar top 50 lugares
npm run social-media process 50

# Procesar top 100 lugares
npm run social-media process 100

# Procesar todos (sin límite, cuidado con costes API)
npm run social-media process 2000
```

**Cómo funciona:**
1. Obtiene lugares sin redes sociales de Supabase
2. Por cada lugar, consulta a Claude para buscar perfiles oficiales
3. Claude devuelve URLs verificadas con nivel de confianza
4. Actualiza automáticamente en Supabase

**Coste estimado:**
- ~$0.01 por lugar (Claude Sonnet)
- 100 lugares = ~$1.00
- 1000 lugares = ~$10.00

---

### **Opción 2: Exportar CSV para rellenar manualmente**

```bash
# Exportar top 100 lugares a CSV
npm run social-media export 100
```

**Resultado:**
- Crea archivo: `social-media-export-[timestamp].csv`
- Contiene: id, nombre, ciudad, website
- Columnas vacías para: instagram_url, facebook_url, twitter_url, tiktok_url

**Rellenar manualmente:**
1. Abrir CSV en Excel/Google Sheets
2. Buscar perfil de Instagram de cada lugar
3. Copiar URL completa
4. Guardar CSV

---

### **Opción 3: Importar CSV con datos**

```bash
# Importar URLs desde CSV
npm run social-media import social-media-export-123.csv
```

**Formato CSV esperado:**
```csv
id,name,city,province,category,website,instagram_url,facebook_url,twitter_url,tiktok_url
uuid-1,"Rest. A","Madrid","Madrid","restaurante","web.com","https://instagram.com/resta",,,
uuid-2,"Rest. B","Barcelona","Barcelona","hotel",,"https://instagram.com/restb","https://facebook.com/restb",,
```

---

## 📊 ESTRATEGIA RECOMENDADA

### **Fase 1: Top 100 (Primera semana)**

1. **Ejecutar IA para top 100:**
   ```bash
   npm run social-media process 100
   ```

2. **Revisar resultados en Supabase:**
   ```sql
   SELECT name, city, instagram_url, facebook_url 
   FROM places 
   WHERE instagram_url IS NOT NULL
   LIMIT 100;
   ```

3. **Seguir desde @casicinco:**
   - Ir a cada perfil de Instagram
   - Seguir
   - Like a último post
   - Comentar algo relevante

**Resultado esperado:**
- 60-80% de los top 100 tienen Instagram
- 20-30% siguen de vuelta
- Algunos comparten que están en CasiCinco

---

### **Fase 2: Top 500 (Segunda semana)**

```bash
npm run social-media process 500
```

**Engagement selectivo:**
- Seguir solo a lugares con +1000 seguidores
- Mencionar en stories semanales
- Posts destacando "Top 10 con mejor Instagram"

---

### **Fase 3: Todos (Mes 2)**

```bash
npm run social-media process 2000
```

**Automatización:**
- Bot que sigue automáticamente
- Engagement programado
- Detección de menciones

---

## 🔍 VALIDACIÓN DE RESULTADOS

### **Ver lugares con Instagram:**
```sql
SELECT 
  name, 
  city, 
  instagram_url, 
  rating, 
  review_count
FROM places 
WHERE instagram_url IS NOT NULL
ORDER BY rating DESC, review_count DESC;
```

### **Estadísticas:**
```sql
-- Total con RRSS
SELECT 
  COUNT(*) FILTER (WHERE instagram_url IS NOT NULL) as con_instagram,
  COUNT(*) FILTER (WHERE facebook_url IS NOT NULL) as con_facebook,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE instagram_url IS NOT NULL) * 100.0 / COUNT(*), 1) as porcentaje_instagram
FROM places
WHERE published = true;
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **1. Rate Limits de Claude:**
- Claude permite ~1000 requests/min
- Script tiene pausa de 2s entre requests
- Máximo ~30 lugares/minuto
- 100 lugares = ~3-4 minutos
- 1000 lugares = ~30-35 minutos

### **2. Calidad de resultados:**
- **High confidence:** Perfil verificado, ubicación match
- **Medium confidence:** Perfil probable, revisar manualmente
- **Low confidence:** No encontrado o dudoso

### **3. False positives:**
- Lugares con nombres comunes pueden tener perfiles erróneos
- **Revisar manualmente** los primeros 50 antes de seguir masivamente
- **No seguir** perfiles con <100 seguidores (probablemente falsos)

---

## 📈 IMPACTO ESPERADO

### **SEO:**
- ✅ Schema.org con `sameAs` → más señales de autoridad
- ✅ Google conecta perfiles sociales con tu ficha

### **Growth:**
- ✅ 100 lugares seguidos = 20-30 follows de vuelta
- ✅ 500 lugares seguidos = 100-150 follows de vuelta
- ✅ Algunos comparten contenido de CasiCinco

### **Viralidad:**
- ✅ Stories "Somos parte de @casicinco 🏆"
- ✅ Posts mencionando el badge "Selección 4.7"
- ✅ Efecto red

---

## 🛠️ TROUBLESHOOTING

### **Error: ANTHROPIC_API_KEY no encontrada**
```bash
# Añadir en .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

### **Error: Too many requests**
- Reducir batch size: `npm run social-media process 50`
- Aumentar pausa en el script (línea 170): `setTimeout(resolve, 5000)`

### **Resultados con baja confianza**
- Usar opción manual (export + import)
- Buscar en Google: "[nombre lugar] instagram"

---

## 📝 PRÓXIMOS PASOS

1. ✅ **Ejecutar para top 100:**
   ```bash
   npm run social-media process 100
   ```

2. ✅ **Revisar resultados en Supabase**

3. ✅ **Seguir desde @casicinco**

4. ✅ **Deploy cambios en UI** (Instagram visible en fichas)

5. ✅ **Engagement activo:**
   - Likes
   - Comentarios
   - Menciones en stories

---

**¿Listo para empezar?**

```bash
npm run social-media process 50
```

¡Ve los perfiles aparecer en las fichas de lugares! 🎉

