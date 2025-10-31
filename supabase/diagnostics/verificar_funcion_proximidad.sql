-- ====================================
-- DIAGNÓSTICO: Verificar función de proximidad GPS
-- ====================================

-- 1. Verificar si PostGIS está habilitado
SELECT 
  extname as "Extension",
  extversion as "Version"
FROM pg_extension 
WHERE extname = 'postgis';

-- Si no aparece nada, ejecutar:
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ====================================

-- 2. Verificar si la función existe
SELECT 
  routine_name as "Function Name",
  routine_type as "Type",
  data_type as "Return Type"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'search_places_by_proximity';

-- Si no aparece nada, la función NO existe → ejecutar migración

-- ====================================

-- 3. Verificar si el índice espacial existe
SELECT 
  indexname as "Index Name",
  indexdef as "Definition"
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'places'
  AND indexname LIKE '%location%';

-- Si no aparece nada, el índice NO existe → ejecutar migración

-- ====================================

-- 4. PROBAR la función (si existe)
-- ⚠️ Solo ejecutar si la función existe (paso 2 devolvió resultados)

-- Ejemplo: Buscar restaurantes en 50km desde Almería (36.84, -2.46)
SELECT 
  name,
  city,
  province,
  ROUND(distance_km::numeric, 2) as "Distancia (km)",
  rating,
  review_count
FROM public.search_places_by_proximity(
    36.84,           -- user_lat (Almería)
    -2.46,           -- user_lng (Almería)
    50000,           -- radius_meters (50km)
    'restaurante',   -- place_category
    NULL,            -- price_level_filter
    NULL,            -- text_search_term
    10               -- result_limit
)
ORDER BY distance_km;

-- ====================================

-- 5. PROBAR con coordenadas de Madrid (40.416775, -3.703790)
SELECT 
  name,
  city,
  province,
  ROUND(distance_km::numeric, 2) as "Distancia (km)",
  rating,
  review_count
FROM public.search_places_by_proximity(
    40.416775,       -- user_lat (Madrid)
    -3.703790,       -- user_lng (Madrid)
    30000,           -- radius_meters (30km)
    NULL,            -- place_category (todas)
    NULL,            -- price_level_filter
    NULL,            -- text_search_term
    10               -- result_limit
)
ORDER BY distance_km;

-- ====================================

-- 6. Verificar que los lugares tienen coordenadas
SELECT 
  COUNT(*) as "Total Lugares",
  COUNT(latitude) as "Con Latitud",
  COUNT(longitude) as "Con Longitud",
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as "Con Coordenadas Completas",
  ROUND(100.0 * COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) / COUNT(*), 2) as "% con Coords"
FROM places
WHERE published = true;

-- ====================================
-- RESULTADO ESPERADO:
-- 
-- ✅ PostGIS: extname = 'postgis', extversion = '3.x'
-- ✅ Función: routine_name = 'search_places_by_proximity'
-- ✅ Índice: indexname = 'idx_places_location'
-- ✅ Prueba Almería: 5-10 restaurantes con distancias reales
-- ✅ Prueba Madrid: 5-10 lugares con distancias reales
-- ✅ Coordenadas: >95% de lugares con coordenadas
-- 
-- ❌ Si falta alguno: ejecutar la migración completa
-- ====================================


