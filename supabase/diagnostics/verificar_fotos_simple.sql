-- ========================================
-- VERIFICAR FOTOS - VERSIÓN SIMPLE Y SEGURA
-- ========================================

-- 1. RESUMEN GENERAL - LA QUERY MÁS IMPORTANTE
SELECT 
  COUNT(*) as total_lugares,
  COUNT(CASE WHEN photo_urls IS NOT NULL THEN 1 END) as con_supabase,
  COUNT(CASE WHEN photo_urls IS NULL AND photos IS NOT NULL THEN 1 END) as solo_google,
  COUNT(CASE WHEN photo_urls IS NULL AND photos IS NULL THEN 1 END) as sin_fotos,
  -- Ahorro potencial (asumiendo 100 vistas/mes por lugar con Google Photos)
  COUNT(CASE WHEN photo_urls IS NULL AND photos IS NOT NULL THEN 1 END) * 100 * 0.007 as costo_mes_google_usd
FROM places
WHERE published = true;

-- 2. DESGLOSE POR CATEGORÍA
SELECT 
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN photo_urls IS NOT NULL THEN 1 END) as con_supabase,
  COUNT(CASE WHEN photo_urls IS NULL AND photos IS NOT NULL THEN 1 END) as solo_google,
  ROUND(COUNT(CASE WHEN photo_urls IS NULL AND photos IS NOT NULL THEN 1 END) * 100 * 0.007, 2) as costo_mes_usd
FROM places
WHERE published = true
GROUP BY category
ORDER BY solo_google DESC;

-- 3. TOP 20 LUGARES PARA MIGRAR (los más visitados)
SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  review_count,
  photos IS NOT NULL as tiene_google_photos,
  photo_urls IS NOT NULL as tiene_supabase_photos
FROM places
WHERE published = true
  AND photos IS NOT NULL
  AND photo_urls IS NULL
ORDER BY review_count DESC, rating DESC
LIMIT 20;

-- 4. CONTEO SIMPLE: ¿Cuántos lugares necesitan migración?
SELECT 
  COUNT(*) as total_pendientes_migracion
FROM places
WHERE published = true
  AND photos IS NOT NULL
  AND photo_urls IS NULL;

