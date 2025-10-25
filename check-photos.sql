-- Verificar estado de las fotos en la base de datos

-- 1. Contar lugares SIN fotos de Supabase
SELECT 
  'Sin photo_urls' as estado,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM places WHERE published = true), 2) as porcentaje
FROM places
WHERE published = true
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL);

-- 2. Contar lugares CON fotos de Supabase
SELECT 
  'Con photo_urls' as estado,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM places WHERE published = true), 2) as porcentaje
FROM places
WHERE published = true
  AND photo_urls IS NOT NULL 
  AND array_length(photo_urls, 1) > 0;

-- 3. Ver ejemplos de lugares SIN fotos (top 10)
SELECT 
  id,
  name,
  city,
  province,
  category,
  CASE 
    WHEN photo_urls IS NULL THEN 'NULL'
    WHEN array_length(photo_urls, 1) IS NULL THEN 'EMPTY_ARRAY'
    ELSE 'HAS_URLS'
  END as photo_urls_status,
  array_length(photo_urls, 1) as num_photos,
  CASE 
    WHEN photos IS NULL THEN 'NO_GOOGLE'
    ELSE 'HAS_GOOGLE'
  END as has_google_photos
FROM places
WHERE published = true
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL)
ORDER BY review_count DESC
LIMIT 10;

-- 4. Resumen por categoría
SELECT 
  category,
  COUNT(*) as total,
  SUM(CASE WHEN photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0 THEN 1 ELSE 0 END) as con_fotos,
  SUM(CASE WHEN photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL THEN 1 ELSE 0 END) as sin_fotos,
  ROUND(SUM(CASE WHEN photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as porcentaje_con_fotos
FROM places
WHERE published = true
GROUP BY category
ORDER BY total DESC;

