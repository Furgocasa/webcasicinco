-- ========================================
-- VERIFICAR QUÉ SON LOS 4 BORRADORES
-- ========================================

-- 1. Ver los 4 borradores en detalle
SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  review_count,
  published,
  (ai_description IS NOT NULL) as tiene_ia,
  (photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0) as tiene_fotos_supabase,
  (photos IS NOT NULL AND array_length(photos, 1) > 0) as tiene_fotos_google,
  created_at
FROM public.places
WHERE published = false
ORDER BY created_at DESC;

-- 2. Estadísticas de borradores
SELECT 
  COUNT(*) as total_borradores,
  SUM(CASE WHEN ai_description IS NOT NULL THEN 1 ELSE 0 END) as con_ia,
  SUM(CASE WHEN ai_description IS NULL THEN 1 ELSE 0 END) as sin_ia,
  SUM(CASE WHEN photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0 THEN 1 ELSE 0 END) as con_fotos_supabase
FROM public.places
WHERE published = false;

-- 3. Si tienen IA, publicarlos (porque están completos)
-- UPDATE public.places
-- SET published = true,
--     updated_at = NOW()
-- WHERE published = false 
--   AND ai_description IS NOT NULL;

-- 4. Si NO tienen IA, eliminarlos (lugares incompletos del sistema antiguo)
-- DELETE FROM public.places
-- WHERE published = false 
--   AND ai_description IS NULL;

