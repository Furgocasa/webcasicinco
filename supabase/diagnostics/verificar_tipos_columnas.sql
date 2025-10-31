-- ====================================
-- DIAGNÓSTICO: Verificar tipos de columnas de la tabla places
-- ====================================

SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'places'
ORDER BY ordinal_position;

-- ====================================
-- Resultado esperado para comparar con la función
-- ====================================
-- La función espera:
-- id: UUID
-- name: TEXT
-- slug: TEXT
-- category: TEXT
-- rating: NUMERIC
-- review_count: INTEGER
-- city: TEXT
-- province: TEXT
-- region: TEXT
-- address: TEXT
-- phone: TEXT
-- website: TEXT
-- ai_description: TEXT
-- subcategory: TEXT
-- price_level: INTEGER
-- latitude: DOUBLE PRECISION
-- longitude: DOUBLE PRECISION


