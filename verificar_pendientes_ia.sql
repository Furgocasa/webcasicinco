-- ============================================================================
-- VERIFICAR LUGARES PENDIENTES DE ENRIQUECIMIENTO IA
-- ============================================================================
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================================

-- 📊 CONTADOR PRINCIPAL: Lugares publicados sin IA
SELECT 
  COUNT(*) as pendientes_ia,
  'Lugares PUBLICADOS sin ai_description' as descripcion
FROM places
WHERE published = true
  AND ai_description IS NULL;

-- 📊 CONTADOR: Lugares publicados CON IA
SELECT 
  COUNT(*) as con_ia,
  'Lugares PUBLICADOS con ai_description' as descripcion
FROM places
WHERE published = true
  AND ai_description IS NOT NULL;

-- 📊 TOTAL PUBLICADOS
SELECT 
  COUNT(*) as total_publicados,
  'Total de lugares PUBLICADOS' as descripcion
FROM places
WHERE published = true;

-- 📊 DESGLOSE COMPLETO
SELECT 
  COUNT(*) FILTER (WHERE published = true AND ai_description IS NULL) as publicados_sin_ia,
  COUNT(*) FILTER (WHERE published = true AND ai_description IS NOT NULL) as publicados_con_ia,
  COUNT(*) FILTER (WHERE published = true) as total_publicados,
  COUNT(*) FILTER (WHERE published = false) as borradores,
  COUNT(*) as total_lugares,
  ROUND(
    (COUNT(*) FILTER (WHERE published = true AND ai_description IS NOT NULL)::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE published = true), 0)) * 100, 
    1
  ) as porcentaje_enriquecido
FROM places;

-- 📋 LISTADO: Primeros 10 lugares publicados SIN IA (si hay)
SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  review_count,
  published,
  CASE 
    WHEN ai_description IS NULL THEN '❌ Sin IA'
    ELSE '✅ Con IA'
  END as estado_ia,
  created_at
FROM places
WHERE published = true
  AND ai_description IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 📋 RESUMEN POR CATEGORÍA
SELECT 
  category,
  COUNT(*) FILTER (WHERE published = true AND ai_description IS NULL) as pendientes_ia,
  COUNT(*) FILTER (WHERE published = true AND ai_description IS NOT NULL) as con_ia,
  COUNT(*) FILTER (WHERE published = true) as total_publicados,
  ROUND(
    (COUNT(*) FILTER (WHERE published = true AND ai_description IS NOT NULL)::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE published = true), 0)) * 100, 
    1
  ) as porcentaje_enriquecido
FROM places
GROUP BY category
ORDER BY category;

