# 🧪 PRUEBAS DEL TÍO VIAJERO - Geolocalización GPS

**Fecha:** 31 Octubre 2025  
**Objetivo:** Verificar que el Tío Viajero detecta ubicación y recomienda lugares cercanos

---

## ✅ CHECKLIST DE PRUEBAS

### **PASO 1: Abrir el chatbot**
- [ ] Ir a https://casicinco.com (o localhost)
- [ ] Hacer clic en el Tío Viajero (esquina inferior derecha)
- [ ] El navegador debe pedir permiso de ubicación
- [ ] Hacer clic en **"Permitir"**
- [ ] Debe aparecer notificación: "📍 Ubicación compartida"
- [ ] Debe aparecer badge verde: "Ubicación compartida - Puedes preguntar por lugares cerca de mí"

---

### **PASO 2: Verificar logs del navegador**

Abrir consola (F12 → Console) y buscar estos mensajes:

```
✅ 📍 Ubicación obtenida: {lat: XX.XX, lng: XX.XX}
✅ 📍 Ubicación compartida
```

**Si NO aparecen:**
- Verificar permisos del navegador (Configuración → Privacidad → Ubicación)
- Recargar la página
- Probar desde HTTPS (no funciona en HTTP excepto localhost)

---

### **PASO 3: Preguntar "¿dónde estoy?"**

**Escribir en el chat:**
```
¿dónde estoy?
```

**Respuestas válidas:**

✅ **Opción A (con geocoding):**
```
Estás en Madrid, Madrid (Comunidad de Madrid). 
¿Te gustaría que te recomiende algún lugar cercano?
```

✅ **Opción B (sin geocoding - fallback GPS):**
```
Tengo tu ubicación GPS activada. Puedo recomendarte 
lugares cercanos con distancias exactas. 
¿Qué tipo de lugar buscas?
```

❌ **Respuesta INCORRECTA:**
```
No tengo tu ubicación. ¿Puedes compartir tu ubicación...
```

Si recibes la respuesta incorrecta → El fallback GPS NO funcionó.

---

### **PASO 4: Buscar lugares cercanos**

**Escribir en el chat:**
```
restaurantes cerca de mí
```

**Respuesta esperada:**
```
Aquí tienes restaurantes cerca de ti:

1. Restaurante ABC — ⭐4.6 · 1.230 reseñas — a 2.3km de ti en Madrid
   [Ver detalles](/restaurante/madrid/abc) | [Ver en mapa](/mapa?place=xxx)

2. Bar XYZ — ⭐4.5 · 890 reseñas — a 5.7km de ti en Madrid
   [Ver detalles](/bar/madrid/xyz) | [Ver en mapa](/mapa?place=xxx)

3. Mesón DEF — ⭐4.4 · 650 reseñas — a 8.1km de ti en Madrid
   [Ver detalles](/restaurante/madrid/def) | [Ver en mapa](/mapa?place=yyy)
```

**Verificar:**
- ✅ Menciona distancias: "a X km de ti"
- ✅ Ordenados por proximidad (menor distancia primero)
- ✅ Incluye ambos enlaces: [Ver detalles] y [Ver en mapa]
- ✅ Muestra rating y reviews

---

### **PASO 5: Verificar logs del servidor**

En la consola del navegador (F12), buscar estos logs:

```
📍 Ubicación recibida: XX.XX, XX.XX

Uno de estos dos:
✅ Ubicación geocodificada: Ciudad, Provincia
O
🌍 Usando coordenadas GPS sin geocoding (fallback activado)

📍 Ubicación final enviada a IA: Tu ubicación GPS, GPS

🎯 Intent parseado: {...usesLocation: true, userCoords: {...}, radiusKm: 50}

🌍 Búsqueda por proximidad GPS activada

📍 Búsqueda por proximidad: lat=XX.XX, lng=XX.XX, radio=50km

✅ Encontrados X lugares por proximidad GPS
```

**Si ves TODOS estos mensajes → ✅ TODO FUNCIONA PERFECTAMENTE**

---

### **PASO 6: Probar otras variantes**

**Prueba A: "hoteles cerca"**
```
hoteles cerca
```
Debe mostrar hoteles con distancias.

**Prueba B: "bares aquí"**
```
bares aquí
```
Debe mostrar bares con distancias.

**Prueba C: "restaurantes de sushi cerca de mí"**
```
restaurantes de sushi cerca de mí
```
Debe filtrar por subcategoría "sushi" Y mostrar distancias.

**Prueba D: "hoteles baratos cerca"**
```
hoteles baratos cerca
```
Debe filtrar por price_level 1-2 Y mostrar distancias.

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### **Problema 1: "No tengo tu ubicación"**

**Causa:** El navegador no compartió la ubicación o el fallback GPS no funcionó.

**Solución:**
1. Verificar permisos del navegador
2. Revisar logs de la consola (F12)
3. Buscar errores en la consola
4. Verificar que estés en HTTPS (o localhost)

---

### **Problema 2: No menciona distancias**

**Causa:** La búsqueda por proximidad GPS no se activó.

**Diagnóstico en logs:**
```
❌ NO debe aparecer: "🌍 Búsqueda por proximidad GPS activada"
❌ NO debe aparecer: "📍 Búsqueda por proximidad: lat=..."
```

**Solución:**
1. Verificar que usaste palabras clave: "cerca", "aquí", "cerca de mí"
2. Revisar que `intent.usesLocation = true` en logs
3. Verificar que `userCoords` tiene valores en logs

---

### **Problema 3: Error "function does not exist"**

**Causa:** La migración de Supabase no se ejecutó.

**Solución:**
Ejecutar en Supabase SQL Editor:
```sql
-- Archivo: supabase/migrations/20251030_search_places_by_proximity_FIXED.sql
-- Copiar TODO el contenido y ejecutar
```

---

### **Problema 4: 0 resultados cerca**

**Causa:** No hay lugares indexados en esa zona o no tienen coordenadas.

**Diagnóstico en Supabase:**
```sql
-- Verificar lugares con coordenadas
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as con_coords,
  ROUND(100.0 * COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) / COUNT(*), 2) as porcentaje
FROM places 
WHERE published = true;
```

**Solución:**
- Si porcentaje < 90% → Reindexar lugares en `/admin/indexar`
- Si porcentaje > 90% → Aumentar radio de búsqueda (en código: `radiusKm: 100`)

---

## 📊 TABLA DE RESULTADOS

| Prueba | ✅ / ❌ | Notas |
|--------|---------|-------|
| Notificación "Ubicación compartida" | | |
| Logs GPS en consola | | |
| Pregunta "¿dónde estoy?" | | |
| Pregunta "restaurantes cerca" | | |
| Menciona distancias "a X km" | | |
| Ordenados por proximidad | | |
| Enlaces funcionan | | |
| Prueba con "hoteles cerca" | | |
| Prueba con "bares aquí" | | |
| Filtros combinados (sushi + cerca) | | |

---

## 🎯 CRITERIOS DE ÉXITO

Para considerar que el Tío Viajero está **100% funcional**:

- ✅ Detecta ubicación GPS
- ✅ Muestra notificación de ubicación compartida
- ✅ Responde a "¿dónde estoy?"
- ✅ Busca por proximidad GPS real
- ✅ Menciona distancias en todas las recomendaciones cercanas
- ✅ Ordena por proximidad (menor distancia primero)
- ✅ Funciona con y sin Google Geocoding (fallback)
- ✅ Logs claros en cada paso
- ✅ Enlaces funcionan correctamente

---

## 🚀 RESULTADO ESPERADO

**Si TODAS las pruebas pasan:**

🎉 **EL TÍO VIAJERO ESTÁ COMPLETAMENTE FUNCIONAL** 🎩✨

Puede:
- ✅ Detectar tu ubicación automáticamente
- ✅ Responder "¿dónde estoy?"
- ✅ Recomendar lugares cercanos con distancias reales (km)
- ✅ Funcionar incluso si Google Geocoding falla
- ✅ Ordenar resultados por proximidad
- ✅ Filtrar por categoría + proximidad simultáneamente

**¡Está listo para producción!** 🚀

---

**"Las mejores recomendaciones están a solo unos kilómetros de distancia." — El Tío Viajero** 🎩

