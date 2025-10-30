-- ====================================
-- FUNCIÓN: Búsqueda de lugares por proximidad GPS
-- ====================================
-- Permite buscar lugares dentro de un radio (km) desde coordenadas GPS
-- Usa PostGIS para cálculo eficiente de distancias geográficas
-- Ordena por proximidad y rating

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
    p.name,
    p.slug,
    p.category,
    p.rating,
    p.review_count,
    p.city,
    p.province,
    p.region,
    p.address,
    p.phone,
    p.website,
    p.ai_description,
    p.subcategory,
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
$$ LANGUAGE plpgsql;

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
Devuelve lugares ordenados por proximidad y rating.
Uso: SELECT * FROM search_places_by_proximity(36.9742, -2.0303, 50000, ''restaurante'', NULL, NULL, 10);';

COMMENT ON INDEX idx_places_location IS 
'Índice espacial GiST para búsquedas eficientes por proximidad GPS';

