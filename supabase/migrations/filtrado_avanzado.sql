-- ============================================================================
-- ACTUALIZACIÓN: SISTEMA DE FILTRADO AVANZADO
-- ============================================================================
-- Ejecutar DESPUÉS de supabase_setup.sql
-- ============================================================================

-- Añadir columnas de filtrado avanzado a la tabla places
ALTER TABLE places ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
ALTER TABLE places ADD COLUMN IF NOT EXISTS price_level INTEGER; -- 1-4 (€ a €€€€)
ALTER TABLE places ADD COLUMN IF NOT EXISTS community VARCHAR(100); -- CCAA
ALTER TABLE places ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Índices para filtrado rápido
CREATE INDEX IF NOT EXISTS idx_places_reviews_count ON places(reviews_count);
CREATE INDEX IF NOT EXISTS idx_places_price_level ON places(price_level);
CREATE INDEX IF NOT EXISTS idx_places_community ON places(community);
CREATE INDEX IF NOT EXISTS idx_places_city ON places(city);
CREATE INDEX IF NOT EXISTS idx_places_rating_reviews ON places(rating, reviews_count);

-- Índice compuesto para búsquedas complejas
CREATE INDEX IF NOT EXISTS idx_places_filter_composite 
ON places(category, province, community, rating, reviews_count, is_published);

-- ============================================================================
-- FUNCIÓN: get_quality_tier
-- Determina el tier de calidad según rating y número de reseñas
-- ============================================================================
CREATE OR REPLACE FUNCTION get_quality_tier(
  p_rating DECIMAL,
  p_reviews_count INTEGER
)
RETURNS VARCHAR AS $$
BEGIN
  -- TIER DIAMANTE: 4.8★+ con 1,000+ reseñas
  IF p_rating >= 4.8 AND p_reviews_count >= 1000 THEN
    RETURN 'diamond';
  
  -- TIER PLATINUM: 4.8★+ con 500-999 reseñas
  ELSIF p_rating >= 4.8 AND p_reviews_count >= 500 THEN
    RETURN 'platinum';
  
  -- TIER GOLD: 4.7★+ con 200+ reseñas
  ELSIF p_rating >= 4.7 AND p_reviews_count >= 200 THEN
    RETURN 'gold';
  
  -- TIER SILVER: 4.7★+ con 50+ reseñas
  ELSIF p_rating >= 4.7 AND p_reviews_count >= 50 THEN
    RETURN 'silver';
  
  -- TIER BRONZE: 4.7★+ con menos de 50 reseñas
  ELSIF p_rating >= 4.7 THEN
    RETURN 'bronze';
  
  -- NO CALIFICA
  ELSE
    RETURN 'none';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- VISTA: places_with_tier
-- Vista que incluye el tier de calidad
-- ============================================================================
CREATE OR REPLACE VIEW places_with_tier AS
SELECT 
  p.*,
  get_quality_tier(p.rating, p.reviews_count) as quality_tier,
  CASE 
    WHEN get_quality_tier(p.rating, p.reviews_count) = 'diamond' THEN 5
    WHEN get_quality_tier(p.rating, p.reviews_count) = 'platinum' THEN 4
    WHEN get_quality_tier(p.rating, p.reviews_count) = 'gold' THEN 3
    WHEN get_quality_tier(p.rating, p.reviews_count) = 'silver' THEN 2
    WHEN get_quality_tier(p.rating, p.reviews_count) = 'bronze' THEN 1
    ELSE 0
  END as tier_rank
FROM places p
WHERE p.is_published = true;

-- ============================================================================
-- FUNCIÓN: search_places_advanced
-- Búsqueda avanzada con todos los filtros
-- ============================================================================
CREATE OR REPLACE FUNCTION search_places_advanced(
  p_category VARCHAR DEFAULT NULL,
  p_province VARCHAR DEFAULT NULL,
  p_community VARCHAR DEFAULT NULL,
  p_city VARCHAR DEFAULT NULL,
  p_min_rating DECIMAL DEFAULT 4.7,
  p_max_rating DECIMAL DEFAULT 5.0,
  p_min_reviews INTEGER DEFAULT NULL,
  p_max_reviews INTEGER DEFAULT NULL,
  p_price_level INTEGER DEFAULT NULL,
  p_search_term VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  category VARCHAR,
  province VARCHAR,
  community VARCHAR,
  city VARCHAR,
  rating DECIMAL,
  reviews_count INTEGER,
  price_level INTEGER,
  quality_tier VARCHAR,
  tier_rank INTEGER,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  photos TEXT[],
  google_maps_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.category,
    p.province,
    p.community,
    p.city,
    p.rating,
    p.reviews_count,
    p.price_level,
    p.quality_tier,
    p.tier_rank,
    p.address,
    p.latitude,
    p.longitude,
    p.photos,
    p.google_maps_url
  FROM places_with_tier p
  WHERE 
    (p_category IS NULL OR p.category = p_category)
    AND (p_province IS NULL OR p.province = p_province)
    AND (p_community IS NULL OR p.community = p_community)
    AND (p_city IS NULL OR p.city = p_city)
    AND p.rating >= p_min_rating
    AND p.rating <= p_max_rating
    AND (p_min_reviews IS NULL OR p.reviews_count >= p_min_reviews)
    AND (p_max_reviews IS NULL OR p.reviews_count <= p_max_reviews)
    AND (p_price_level IS NULL OR p.price_level = p_price_level)
    AND (
      p_search_term IS NULL 
      OR p.name ILIKE '%' || p_search_term || '%'
      OR p.description ILIKE '%' || p_search_term || '%'
    )
  ORDER BY 
    p.tier_rank DESC,
    p.reviews_count DESC,
    p.rating DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ESTADÍSTICAS: get_filter_stats
-- Obtiene estadísticas para los filtros
-- ============================================================================
CREATE OR REPLACE FUNCTION get_filter_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_places', COUNT(*),
    'by_tier', json_build_object(
      'diamond', COUNT(*) FILTER (WHERE quality_tier = 'diamond'),
      'platinum', COUNT(*) FILTER (WHERE quality_tier = 'platinum'),
      'gold', COUNT(*) FILTER (WHERE quality_tier = 'gold'),
      'silver', COUNT(*) FILTER (WHERE quality_tier = 'silver'),
      'bronze', COUNT(*) FILTER (WHERE quality_tier = 'bronze')
    ),
    'by_category', (
      SELECT json_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM places_with_tier
        GROUP BY category
      ) cat_counts
    ),
    'by_reviews_range', json_build_object(
      'under_50', COUNT(*) FILTER (WHERE reviews_count < 50),
      'from_50_to_100', COUNT(*) FILTER (WHERE reviews_count >= 50 AND reviews_count < 100),
      'from_100_to_200', COUNT(*) FILTER (WHERE reviews_count >= 100 AND reviews_count < 200),
      'from_200_to_500', COUNT(*) FILTER (WHERE reviews_count >= 200 AND reviews_count < 500),
      'from_500_to_1000', COUNT(*) FILTER (WHERE reviews_count >= 500 AND reviews_count < 1000),
      'over_1000', COUNT(*) FILTER (WHERE reviews_count >= 1000)
    ),
    'avg_rating', ROUND(AVG(rating), 2),
    'avg_reviews', ROUND(AVG(reviews_count), 0)
  )
  INTO result
  FROM places_with_tier;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- MAPEO DE COMUNIDADES AUTÓNOMAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS province_to_community (
  province VARCHAR(100) PRIMARY KEY,
  community VARCHAR(100) NOT NULL,
  community_code VARCHAR(2) NOT NULL
);

INSERT INTO province_to_community (province, community, community_code) VALUES
  -- Andalucía
  ('Almería', 'Andalucía', 'AN'),
  ('Cádiz', 'Andalucía', 'AN'),
  ('Córdoba', 'Andalucía', 'AN'),
  ('Granada', 'Andalucía', 'AN'),
  ('Huelva', 'Andalucía', 'AN'),
  ('Jaén', 'Andalucía', 'AN'),
  ('Málaga', 'Andalucía', 'AN'),
  ('Sevilla', 'Andalucía', 'AN'),
  
  -- Aragón
  ('Huesca', 'Aragón', 'AR'),
  ('Teruel', 'Aragón', 'AR'),
  ('Zaragoza', 'Aragón', 'AR'),
  
  -- Asturias
  ('Asturias', 'Principado de Asturias', 'AS'),
  
  -- Islas Baleares
  ('Islas Baleares', 'Islas Baleares', 'IB'),
  
  -- Canarias
  ('Las Palmas', 'Canarias', 'CN'),
  ('Santa Cruz de Tenerife', 'Canarias', 'CN'),
  
  -- Cantabria
  ('Cantabria', 'Cantabria', 'CB'),
  
  -- Castilla y León
  ('Ávila', 'Castilla y León', 'CL'),
  ('Burgos', 'Castilla y León', 'CL'),
  ('León', 'Castilla y León', 'CL'),
  ('Palencia', 'Castilla y León', 'CL'),
  ('Salamanca', 'Castilla y León', 'CL'),
  ('Segovia', 'Castilla y León', 'CL'),
  ('Soria', 'Castilla y León', 'CL'),
  ('Valladolid', 'Castilla y León', 'CL'),
  ('Zamora', 'Castilla y León', 'CL'),
  
  -- Castilla-La Mancha
  ('Albacete', 'Castilla-La Mancha', 'CM'),
  ('Ciudad Real', 'Castilla-La Mancha', 'CM'),
  ('Cuenca', 'Castilla-La Mancha', 'CM'),
  ('Guadalajara', 'Castilla-La Mancha', 'CM'),
  ('Toledo', 'Castilla-La Mancha', 'CM'),
  
  -- Cataluña
  ('Barcelona', 'Cataluña', 'CT'),
  ('Girona', 'Cataluña', 'CT'),
  ('Lleida', 'Cataluña', 'CT'),
  ('Tarragona', 'Cataluña', 'CT'),
  
  -- Comunidad Valenciana
  ('Alicante', 'Comunidad Valenciana', 'VC'),
  ('Castellón', 'Comunidad Valenciana', 'VC'),
  ('Valencia', 'Comunidad Valenciana', 'VC'),
  
  -- Extremadura
  ('Badajoz', 'Extremadura', 'EX'),
  ('Cáceres', 'Extremadura', 'EX'),
  
  -- Galicia
  ('A Coruña', 'Galicia', 'GA'),
  ('Lugo', 'Galicia', 'GA'),
  ('Ourense', 'Galicia', 'GA'),
  ('Pontevedra', 'Galicia', 'GA'),
  
  -- Madrid
  ('Madrid', 'Comunidad de Madrid', 'MD'),
  
  -- Murcia
  ('Murcia', 'Región de Murcia', 'MC'),
  
  -- Navarra
  ('Navarra', 'Comunidad Foral de Navarra', 'NC'),
  
  -- País Vasco
  ('Álava', 'País Vasco', 'PV'),
  ('Guipúzcoa', 'País Vasco', 'PV'),
  ('Vizcaya', 'País Vasco', 'PV'),
  
  -- La Rioja
  ('La Rioja', 'La Rioja', 'RI'),
  
  -- Ceuta y Melilla
  ('Ceuta', 'Ceuta', 'CE'),
  ('Melilla', 'Melilla', 'ML')
ON CONFLICT (province) DO NOTHING;

-- ============================================================================
-- TRIGGER: actualizar community automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_place_community()
RETURNS TRIGGER AS $$
BEGIN
  SELECT community INTO NEW.community
  FROM province_to_community
  WHERE province = NEW.province;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_place_community
  BEFORE INSERT OR UPDATE OF province ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_place_community();

-- ============================================================================
-- Actualizar places existentes con community
-- ============================================================================
UPDATE places p
SET community = pc.community
FROM province_to_community pc
WHERE p.province = pc.province;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON COLUMN places.reviews_count IS 'Número total de reseñas en Google Maps';
COMMENT ON COLUMN places.price_level IS 'Nivel de precio: 1 (€) a 4 (€€€€)';
COMMENT ON COLUMN places.community IS 'Comunidad Autónoma';
COMMENT ON COLUMN places.city IS 'Ciudad o municipio';
COMMENT ON FUNCTION get_quality_tier IS 'Calcula el tier de calidad: diamond, platinum, gold, silver, bronze';
COMMENT ON FUNCTION search_places_advanced IS 'Búsqueda avanzada con filtros completos';
COMMENT ON VIEW places_with_tier IS 'Vista de lugares con tier de calidad calculado';

-- ============================================================================
SELECT '✅ Sistema de filtrado avanzado instalado correctamente!' as message;
