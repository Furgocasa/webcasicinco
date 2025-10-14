-- Verificar que los campos nuevos existan
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'places'
  AND column_name IN ('needs_enrichment', 'enrichment_status')
ORDER BY column_name;

-- Ver algunos lugares de ejemplo
SELECT id, name, category, rating, review_count, 
       published, needs_enrichment, enrichment_status,
       (ai_description IS NOT NULL) as tiene_ia
FROM places
LIMIT 10;

-- Estadísticas
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN needs_enrichment = true THEN 1 ELSE 0 END) as pendientes_enriquecimiento,
  SUM(CASE WHEN ai_description IS NOT NULL THEN 1 ELSE 0 END) as con_ia,
  SUM(CASE WHEN published = true THEN 1 ELSE 0 END) as publicados
FROM places;

