-- ============================================================================
-- VERIFICACIÓN DE BORRADORES PENDIENTES DE ENRIQUECIMIENTO IA (CON RESULTADOS)
-- ============================================================================
-- Este script muestra los resultados en la pestaña "Results" de Supabase
-- ============================================================================

-- 1. RESUMEN GENERAL
SELECT 
  'RESUMEN GENERAL' as seccion,
  COUNT(*) as total_lugares,
  COUNT(CASE WHEN published = false THEN 1 END) as borradores,
  COUNT(CASE WHEN published = true THEN 1 END) as publicados,
  COUNT(CASE WHEN ai_description IS NULL THEN 1 END) as sin_ia,
  COUNT(CASE WHEN ai_description IS NOT NULL THEN 1 END) as con_ia
FROM places;

-- 2. BORRADORES (published = false)
SELECT 
  'BORRADORES' as seccion,
  COUNT(CASE WHEN ai_description IS NULL THEN 1 END) as sin_ia,
  COUNT(CASE WHEN ai_description IS NOT NULL THEN 1 END) as con_ia,
  COUNT(*) as total
FROM places
WHERE published = false;

-- 3. PUBLICADOS (published = true)
SELECT 
  'PUBLICADOS' as seccion,
  COUNT(CASE WHEN ai_description IS NULL THEN 1 END) as sin_ia,
  COUNT(CASE WHEN ai_description IS NOT NULL THEN 1 END) as con_ia,
  COUNT(*) as total
FROM places
WHERE published = true;

-- 4. LUGARES PENDIENTES DE IA (BORRADORES + PUBLICADOS)
SELECT 
  'PENDIENTES IA' as seccion,
  COUNT(CASE WHEN published = false THEN 1 END) as borradores_sin_ia,
  COUNT(CASE WHEN published = true THEN 1 END) as publicados_sin_ia,
  COUNT(*) as total_pendientes
FROM places
WHERE ai_description IS NULL;

-- 5. PRIMEROS 10 LUGARES PENDIENTES DE IA
SELECT 
  id,
  name,
  category,
  province,
  CASE WHEN published THEN 'Publicado' ELSE 'Borrador' END as estado,
  rating,
  review_count
FROM places
WHERE ai_description IS NULL
ORDER BY published DESC, name
LIMIT 10;

-- 6. ANÁLISIS POR CATEGORÍA (PENDIENTES)
SELECT 
  category,
  COUNT(CASE WHEN published = false THEN 1 END) as borradores_sin_ia,
  COUNT(CASE WHEN published = true THEN 1 END) as publicados_sin_ia,
  COUNT(*) as total_pendientes
FROM places
WHERE ai_description IS NULL
GROUP BY category
ORDER BY total_pendientes DESC;
