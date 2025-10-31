-- ====================================
-- FUNCIÓN: Búsqueda de lugares por proximidad GPS (VERSIÓN CORREGIDA)
-- ====================================
-- Permite buscar lugares dentro de un radio (km) desde coordenadas GPS
-- Usa PostGIS para cálculo eficiente de distancias geográficas
-- Ordena por proximidad y rating
--
-- FIX: Convierte explícitamente VARCHAR a TEXT para evitar errores de tipo

-- Primero, eliminar la función si existe (para recrearla limpia)
DROP FUNCTION IF EXISTS search_places_by_proximity(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER,
  TEXT,
  INTEGER,
  TEXT,
  INTEGER
);

-- Crear la función con conversiones explícitas
CREATE OR REPLACE FUNCTION search_places_by_proximity(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 50000,  -- 50km por defecto
  place_category TEXT DEFAULT NULL,
  price_level_filter INTEGER DEFAULT NULL,
  text_search_term TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  category TEXT,
  rating NUMERIC,
  review_count INTEGER,
  city TEXT,
  province TEXT,
  region TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  ai_description TEXT,
  subcategory TEXT,
  price_level INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name::TEXT,                    -- Conversión explícita
    p.slug::TEXT,                    -- Conversión explícita
    p.category::TEXT,                -- Conversión explícita
    p.rating,
    p.review_count,
    p.city::TEXT,                    -- Conversión explícita
    p.province::TEXT,                -- Conversión explícita
    p.region::TEXT,                  -- Conversión explícita
    p.address::TEXT,                 -- Conversión explícita
    p.phone::TEXT,                   -- Conversión explícita
    p.website::TEXT,                 -- Conversión explícita
    p.ai_description::TEXT,          -- Conversión explícita
    p.subcategory::TEXT,             -- Conversión explícita
    p.price_level,
    p.latitude,
    p.longitude,
    -- Calcular distancia en km
    (
      ST_Distance(
        geography(ST_Point(user_lng, user_lat)),
        geography(ST_Point(p.longitude, p.latitude))
      ) / 1000
    )::NUMERIC AS distance_km
  FROM places p
  WHERE p.published = true
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    -- Filtro de proximidad (dentro del radio)
    AND ST_DWithin(
      geography(ST_Point(p.longitude, p.latitude)),
      geography(ST_Point(user_lng, user_lat)),
      radius_meters
    )
    -- Filtro de categoría (opcional)
    AND (place_category IS NULL OR p.category = place_category)
    -- Filtro de precio (opcional)
    AND (price_level_filter IS NULL OR 
      (price_level_filter = 1 AND p.price_level IN (1, 2)) OR
      (price_level_filter = 2 AND p.price_level = 2) OR
      (price_level_filter = 3 AND p.price_level IN (3, 4))
    )
    -- Filtro de búsqueda textual (opcional)
    AND (text_search_term IS NULL OR 
      p.subcategory ILIKE '%' || text_search_term || '%' OR
      p.ai_description ILIKE '%' || text_search_term || '%' OR
      p.name ILIKE '%' || text_search_term || '%' OR
      p.ai_review_summary ILIKE '%' || text_search_term || '%'
    )
    -- Mínimo de reseñas para calidad
    AND p.review_count >= 50
  -- Ordenar por proximidad primero, luego por rating
  ORDER BY distance_km ASC, p.rating DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ====================================
-- PERMISOS: Permitir acceso a usuarios anónimos y autenticados
-- ====================================

GRANT EXECUTE ON FUNCTION search_places_by_proximity(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER,
  TEXT,
  INTEGER,
  TEXT,
  INTEGER
) TO anon, authenticated;

-- ====================================
-- ÍNDICE ESPACIAL para búsquedas rápidas
-- ====================================
-- PostGIS usará este índice para optimizar ST_DWithin

CREATE INDEX IF NOT EXISTS idx_places_location 
ON places USING GIST (
  geography(ST_Point(longitude, latitude))
);

-- ====================================
-- COMENTARIOS
-- ====================================

COMMENT ON FUNCTION search_places_by_proximity IS 
'Busca lugares dentro de un radio (metros) desde coordenadas GPS. 
Devuelve lugares ordenados por proximidad y rating con distancia en km.
Uso: SELECT * FROM search_places_by_proximity(36.84, -2.46, 50000, ''restaurante'', NULL, NULL, 10);';

COMMENT ON INDEX idx_places_location IS 
'Índice espacial GiST para búsquedas eficientes por proximidad GPS usando PostGIS';

-- ====================================
-- PRUEBA RÁPIDA (Opcional - comentar si no quieres ejecutar)
-- ====================================

-- Descomentar para probar inmediatamente después de crear la función:
/*
SELECT 
  name,
  city,
  province,
  ROUND(distance_km, 2) as "Distancia (km)",
  rating
FROM search_places_by_proximity(
  40.416775,  -- Madrid
  -3.703790,
  30000,      -- 30km
  NULL,       -- Todas las categorías
  NULL,       -- Todos los precios
  NULL,       -- Sin filtro de texto
  5           -- Top 5
);
*/


