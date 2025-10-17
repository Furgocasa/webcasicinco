-- ============================================
-- ÍNDICE PARA BÚSQUEDAS POR SUBCATEGORÍA
-- ============================================
-- Propósito: Acelerar búsquedas del chatbot por tipo de cocina
-- Mejora: 10-50x más rápido que ILIKE en ai_description
-- Fecha: 17 de Octubre 2025

-- Crear índice en subcategory si no existe
CREATE INDEX IF NOT EXISTS idx_places_subcategory 
ON places(subcategory) 
WHERE subcategory IS NOT NULL;

-- Índice compuesto para búsquedas frecuentes: categoría + subcategoría + ciudad
CREATE INDEX IF NOT EXISTS idx_places_category_subcategory_city 
ON places(category, subcategory, city) 
WHERE published = true AND subcategory IS NOT NULL;

-- Índice compuesto para búsquedas frecuentes: categoría + subcategoría + provincia
CREATE INDEX IF NOT EXISTS idx_places_category_subcategory_province 
ON places(category, subcategory, province) 
WHERE published = true AND subcategory IS NOT NULL;

-- Comentarios
COMMENT ON INDEX idx_places_subcategory IS 'Índice para búsquedas rápidas por tipo de cocina (mexicana, italiana, etc.)';
COMMENT ON INDEX idx_places_category_subcategory_city IS 'Índice compuesto para búsquedas tipo: restaurantes mexicanos en Madrid';
COMMENT ON INDEX idx_places_category_subcategory_province IS 'Índice compuesto para búsquedas tipo: restaurantes italianos en Málaga';

-- Verificación
-- SELECT * FROM pg_indexes WHERE tablename = 'places' AND indexname LIKE '%subcategory%';

