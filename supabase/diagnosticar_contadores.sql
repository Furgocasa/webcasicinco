-- ========================================
-- DIAGNOSTICAR INCOHERENCIA DE CONTADORES
-- ========================================

-- 1. Contador del DASHBOARD (published = false)
SELECT COUNT(*) as borradores_dashboard
FROM places
WHERE published = false;

-- 2. Contador de ENRIQUECER (needs_enrichment = true)
SELECT COUNT(*) as pendientes_enriquecer
FROM places
WHERE needs_enrichment = true
  AND enrichment_status = 'pending';

-- 3. Ver TODOS los estados posibles
SELECT 
  published,
  needs_enrichment,
  enrichment_status,
  COUNT(*) as total
FROM places
GROUP BY published, needs_enrichment, enrichment_status
ORDER BY COUNT(*) DESC;

-- 4. Ver lugares específicos con published=false
SELECT id, name, category, published, needs_enrichment, enrichment_status,
       (ai_description IS NOT NULL) as tiene_ia,
       (photo_urls IS NOT NULL) as tiene_fotos
FROM places
WHERE published = false
LIMIT 20;

-- 5. SOLUCIÓN: Marcar borradores viejos como necesitan enriquecimiento
-- Solo si son de las 4 categorías válidas
-- Descomenta para ejecutar:
-- UPDATE places
-- SET needs_enrichment = true,
--     enrichment_status = 'pending'
-- WHERE published = false
--   AND category IN ('restaurante', 'bar', 'cafe', 'hotel')
--   AND (needs_enrichment IS NULL OR needs_enrichment = false);

-- 6. Verificar coherencia después
-- SELECT 
--   COUNT(*) FILTER (WHERE published = false) as borradores,
--   COUNT(*) FILTER (WHERE needs_enrichment = true AND enrichment_status = 'pending') as pendientes_ia
-- FROM places;

