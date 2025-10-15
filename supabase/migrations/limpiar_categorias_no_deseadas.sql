-- ========================================
-- LIMPIAR CATEGORÍAS NO DESEADAS
-- ========================================
-- Mantener SOLO: restaurantes, bares, cafeterías, hoteles
-- Eliminar: spas, experiencias, monumentos, etc.

-- PASO 1: Ver qué categorías hay actualmente y cuántos lugares
SELECT category, COUNT(*) as total
FROM public.places
GROUP BY category
ORDER BY total DESC;

-- PASO 2: Ver lugares de categorías NO deseadas (antes de borrar)
SELECT category, COUNT(*) as total_a_borrar
FROM public.places
WHERE category NOT IN ('restaurante', 'bar', 'cafe', 'hotel')
GROUP BY category
ORDER BY total_a_borrar DESC;

-- PASO 3: Ver ejemplos de lugares que se borrarán
SELECT id, name, category, province, city, rating, review_count
FROM public.places
WHERE category NOT IN ('restaurante', 'bar', 'cafe', 'hotel')
ORDER BY category, rating DESC
LIMIT 20;

-- PASO 4: BORRAR categorías no deseadas
-- ⚠️ CUIDADO: Esto borrará permanentemente los lugares
-- Descomenta la siguiente línea cuando estés seguro:

DELETE FROM public.places
WHERE category NOT IN ('restaurante', 'bar', 'cafe', 'hotel');

-- PASO 5: Verificar que solo quedan las 4 categorías correctas
SELECT category, COUNT(*) as total
FROM public.places
GROUP BY category
ORDER BY category;

-- PASO 6: Total de lugares restantes
SELECT COUNT(*) as total_lugares_restantes FROM public.places;

-- PASO 7: Verificar distribución después de la limpieza
SELECT 
  category,
  COUNT(*) as total,
  AVG(rating) as rating_promedio,
  SUM(CASE WHEN published = true THEN 1 ELSE 0 END) as publicados,
  SUM(CASE WHEN needs_enrichment = true THEN 1 ELSE 0 END) as pendientes_ia
FROM public.places
GROUP BY category
ORDER BY total DESC;

