-- Verificar estado de las fotos en la base de datos

-- 1. Contar lugares SIN fotos de Supabase
SELECT 
  'Sin photo_urls' as estado,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM places WHERE published = true), 2) as porcentaje
FROM places
WHERE published = true
  AND (photo_urls IS NULL OR photo_urls = '{}' OR photo_urls = '[]');

-- 2. Contar lugares CON fotos de Supabase
SELECT 
  'Con photo_urls' as estado,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM places WHERE published = true), 2) as porcentaje
FROM places
WHERE published = true
  AND photo_urls IS NOT NULL 
  AND photo_urls != '{}' 
  AND photo_urls != '[]';

-- 3. Ver ejemplos de lugares SIN fotos (top 10)
SELECT 
  id,
  name,
  city,
  province,
  category,
  CASE 
    WHEN photo_urls IS NULL THEN 'NULL'
    WHEN photo_urls = '{}' THEN 'EMPTY_OBJECT'
    WHEN photo_urls = '[]' THEN 'EMPTY_ARRAY'
    ELSE 'OTHER'
  END as photo_urls_status,
  CASE 
    WHEN photos IS NULL THEN 'NO_GOOGLE'
    ELSE 'HAS_GOOGLE'
  END as has_google_photos
FROM places
WHERE published = true
  AND (photo_urls IS NULL OR photo_urls = '{}' OR photo_urls = '[]')
ORDER BY review_count DESC
LIMIT 10;

-- 4. Resumen por categoría
SELECT 
  category,
  COUNT(*) as total,
  SUM(CASE WHEN photo_urls IS NOT NULL AND photo_urls != '{}' AND photo_urls != '[]' THEN 1 ELSE 0 END) as con_fotos,
  SUM(CASE WHEN photo_urls IS NULL OR photo_urls = '{}' OR photo_urls = '[]' THEN 1 ELSE 0 END) as sin_fotos,
  ROUND(SUM(CASE WHEN photo_urls IS NOT NULL AND photo_urls != '{}' AND photo_urls != '[]' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as porcentaje_con_fotos
FROM places
WHERE published = true
GROUP BY category
ORDER BY total DESC;

