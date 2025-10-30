-- ====================================
-- DIAGNÓSTICO: Lugares en Almería/Níjar
-- ====================================

-- 1) ¿Cuántos lugares hay en Almería (provincia)?
SELECT 
  COUNT(*) as total_almeria,
  COUNT(*) FILTER (WHERE published = true) as publicados
FROM places 
WHERE province = 'Almería';

-- 2) ¿Qué ciudades hay en Almería?
SELECT 
  city,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE published = true) as publicados,
  array_agg(DISTINCT category) as categorias
FROM places 
WHERE province = 'Almería'
GROUP BY city
ORDER BY total DESC;

-- 3) ¿Hay algo en Níjar específicamente?
SELECT 
  id,
  name,
  category,
  city,
  province,
  rating,
  published
FROM places 
WHERE city ILIKE '%níjar%' OR city ILIKE '%nijar%' OR address ILIKE '%níjar%' OR address ILIKE '%nijar%';

-- 4) ¿Lugares más cercanos a Almería (provincias vecinas)?
SELECT 
  province,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE published = true) as publicados
FROM places 
WHERE province IN ('Granada', 'Murcia', 'Málaga')
GROUP BY province
ORDER BY total DESC;

-- 5) Top 5 restaurantes mejor valorados en Almería (si hay)
SELECT 
  name,
  city,
  province,
  rating,
  review_count,
  published
FROM places 
WHERE province = 'Almería' 
  AND category = 'restaurante'
  AND published = true
ORDER BY rating DESC, review_count DESC
LIMIT 5;

