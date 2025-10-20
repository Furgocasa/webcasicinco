-- ═══════════════════════════════════════════════════════════════════════════
-- LISTAR LOS 88 LUGARES CON FOTOS EXPIRADAS/INVÁLIDAS
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Este script lista los lugares que tienen photo_references de Google Places API
-- pero no tienen fotos migradas a Supabase.
--
-- Estos lugares tienen fotos expiradas que devuelven 403 Forbidden.
--
-- Uso:
--   Ejecutar en Supabase SQL Editor para ver la lista completa
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  review_count,
  CASE 
    WHEN photos IS NULL THEN 0
    WHEN photos::text = '[]' THEN 0
    WHEN photos::text = 'null' THEN 0
    ELSE jsonb_array_length(photos::jsonb)
  END as num_photo_refs,
  created_at
FROM places
WHERE published = true
  AND photos IS NOT NULL
  AND photos::text != '[]'
  AND photos::text != 'null'
  AND photos::text != ''
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL OR array_length(photo_urls, 1) = 0)
ORDER BY 
  review_count DESC,
  rating DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- RESUMEN ESTADÍSTICO
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'Total lugares sin fotos migradas' as descripcion,
  COUNT(*) as cantidad
FROM places
WHERE published = true
  AND photos IS NOT NULL
  AND photos::text != '[]'
  AND photos::text != 'null'
  AND photos::text != ''
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL OR array_length(photo_urls, 1) = 0)

UNION ALL

SELECT 
  'Por categoría' as descripcion,
  NULL as cantidad

UNION ALL

SELECT 
  category as descripcion,
  COUNT(*) as cantidad
FROM places
WHERE published = true
  AND photos IS NOT NULL
  AND photos::text != '[]'
  AND photos::text != 'null'
  AND photos::text != ''
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL OR array_length(photo_urls, 1) = 0)
GROUP BY category
ORDER BY cantidad DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- EXPORTAR A CSV (OPCIONAL)
-- ═══════════════════════════════════════════════════════════════════════════
-- Copiar el resultado de la primera query y pegarlo en Excel/Sheets

