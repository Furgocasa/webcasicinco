-- ====================================
-- PRUEBAS: Función de proximidad GPS
-- ====================================

-- TEST 1: Buscar restaurantes cerca de Madrid (40.416775, -3.703790)
-- Debería devolver restaurantes en un radio de 30km
SELECT 
  name,
  city,
  province,
  ROUND(distance_km::numeric, 2) as "Distancia (km)",
  rating,
  review_count
FROM search_places_by_proximity(
  40.416775,  -- Madrid lat
  -3.703790,  -- Madrid lng
  30000,      -- 30km radio
  'restaurante', -- Solo restaurantes
  NULL,       -- Todos los precios
  NULL,       -- Sin filtro de texto
  10          -- Top 10
)
ORDER BY distance_km;

-- ====================================

-- TEST 2: Buscar cualquier lugar cerca de Barcelona (41.3851, 2.1734)
SELECT 
  name,
  category,
  city,
  province,
  ROUND(distance_km::numeric, 2) as "Distancia (km)",
  rating
FROM search_places_by_proximity(
  41.3851,    -- Barcelona lat
  2.1734,     -- Barcelona lng
  40000,      -- 40km radio
  NULL,       -- Todas las categorías
  NULL,       -- Todos los precios
  NULL,       -- Sin filtro de texto
  10          -- Top 10
)
ORDER BY distance_km;

-- ====================================

-- TEST 3: Buscar hoteles baratos cerca de Valencia (39.4699, -0.3763)
SELECT 
  name,
  city,
  ROUND(distance_km::numeric, 2) as "Distancia (km)",
  price_level,
  rating,
  review_count
FROM search_places_by_proximity(
  39.4699,    -- Valencia lat
  -0.3763,    -- Valencia lng
  50000,      -- 50km radio
  'hotel',    -- Solo hoteles
  1,          -- Económicos (price_level 1-2)
  NULL,       -- Sin filtro de texto
  10          -- Top 10
)
ORDER BY distance_km;

-- ====================================

-- TEST 4: Buscar restaurantes de sushi cerca de tu ubicación
-- (Cambia las coordenadas por las tuyas)
SELECT 
  name,
  city,
  subcategory,
  ROUND(distance_km::numeric, 2) as "Distancia (km)",
  rating,
  review_count
FROM search_places_by_proximity(
  40.416775,  -- TU latitud
  -3.703790,  -- TU longitud
  50000,      -- 50km radio
  'restaurante', -- Solo restaurantes
  NULL,       -- Todos los precios
  'sushi',    -- Buscar "sushi" en subcategoría/descripción
  5           -- Top 5
)
ORDER BY distance_km;

-- ====================================
-- RESULTADO ESPERADO:
-- 
-- ✅ TEST 1: Deberías ver restaurantes de Madrid con distancias < 30km
-- ✅ TEST 2: Deberías ver lugares diversos de Barcelona con distancias < 40km
-- ✅ TEST 3: Deberías ver hoteles económicos de Valencia con distancias < 50km
-- ✅ TEST 4: Deberías ver restaurantes de sushi con distancias calculadas
-- 
-- Si ves resultados vacíos (0 rows):
-- - Puede que no haya lugares indexados en esa zona
-- - O que los lugares no tengan coordenadas GPS
-- - Prueba aumentando el radio o cambiando la ubicación
-- ====================================


