-- ========================================
-- SCRIPT PARA PUBLICAR BORRADORES QUE YA TIENEN IA
-- ========================================
-- Este script encuentra lugares que tienen IA pero están como borradores
-- y los marca como publicados.

-- PASO 1: Ver lugares con IA pero no publicados (los "borradores fantasma")
SELECT id, name, category, province, city, published, 
       (ai_description IS NOT NULL) as tiene_ia,
       created_at
FROM public.places
WHERE published = false 
  AND ai_description IS NOT NULL
ORDER BY created_at DESC;

-- PASO 2: PUBLICAR estos lugares (porque ya están completos con IA)
UPDATE public.places
SET published = true,
    updated_at = NOW()
WHERE published = false 
  AND ai_description IS NOT NULL;

-- PASO 3: Verificar que se actualizaron
-- Ahora debería retornar 0 (o solo los borradores legítimos sin IA)
SELECT COUNT(*) as borradores_con_ia
FROM public.places
WHERE published = false 
  AND ai_description IS NOT NULL;

-- PASO 4: Ver estadísticas actualizadas
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN published = true THEN 1 ELSE 0 END) as publicados,
  SUM(CASE WHEN published = false THEN 1 ELSE 0 END) as borradores,
  SUM(CASE WHEN ai_description IS NOT NULL THEN 1 ELSE 0 END) as con_ia,
  SUM(CASE WHEN ai_description IS NULL THEN 1 ELSE 0 END) as sin_ia
FROM public.places;

