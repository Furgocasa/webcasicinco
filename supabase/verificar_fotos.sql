-- ========================================
-- VERIFICAR ESTADO DE MIGRACIÓN DE FOTOS
-- ========================================
-- Este script verifica cuántos lugares tienen fotos en Supabase vs Google
-- para calcular el consumo de API y el ahorro potencial

-- 1. RESUMEN GENERAL
SELECT 
  COUNT(*) as total_lugares,
  COUNT(CASE WHEN photo_urls IS NOT NULL AND cardinality(photo_urls) > 0 THEN 1 END) as con_supabase,
  COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
              AND photos IS NOT NULL 
              AND jsonb_typeof(photos) = 'array'
              AND jsonb_array_length(photos) > 0 THEN 1 END) as solo_google,
  COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
              AND (photos IS NULL OR jsonb_typeof(photos) != 'array' OR jsonb_array_length(photos) = 0) THEN 1 END) as sin_fotos,
  -- Cálculo de ahorro potencial
  COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
              AND photos IS NOT NULL 
              AND jsonb_typeof(photos) = 'array'
              AND jsonb_array_length(photos) > 0 THEN 1 END) * 100 as vistas_mes_estimadas,
  ROUND(COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
                    AND photos IS NOT NULL 
                    AND jsonb_typeof(photos) = 'array'
                    AND jsonb_array_length(photos) > 0 THEN 1 END) * 100 * 0.007, 2) as costo_mes_estimado_usd
FROM places
WHERE published = true;

-- 2. DESGLOSE POR CATEGORÍA
SELECT 
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN photo_urls IS NOT NULL AND cardinality(photo_urls) > 0 THEN 1 END) as con_supabase,
  COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
              AND photos IS NOT NULL 
              AND jsonb_typeof(photos) = 'array'
              AND jsonb_array_length(photos) > 0 THEN 1 END) as solo_google,
  ROUND(COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
                    AND photos IS NOT NULL 
                    AND jsonb_typeof(photos) = 'array'
                    AND jsonb_array_length(photos) > 0 THEN 1 END) * 100 * 0.007, 2) as costo_mes_usd
FROM places
WHERE published = true
GROUP BY category
ORDER BY solo_google DESC;

-- 3. DESGLOSE POR PROVINCIA (top 10 con más fotos pendientes)
SELECT 
  province,
  COUNT(*) as total,
  COUNT(CASE WHEN photo_urls IS NOT NULL AND cardinality(photo_urls) > 0 THEN 1 END) as con_supabase,
  COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
              AND photos IS NOT NULL 
              AND jsonb_typeof(photos) = 'array'
              AND jsonb_array_length(photos) > 0 THEN 1 END) as solo_google,
  ROUND(COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
                    AND photos IS NOT NULL 
                    AND jsonb_typeof(photos) = 'array'
                    AND jsonb_array_length(photos) > 0 THEN 1 END) * 100 * 0.007, 2) as costo_mes_usd
FROM places
WHERE published = true
GROUP BY province
ORDER BY solo_google DESC
LIMIT 10;

-- 4. LUGARES CON MAYOR NÚMERO DE FOTOS DE GOOGLE (candidatos prioritarios para migración)
SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  review_count,
  CASE 
    WHEN photos IS NOT NULL AND jsonb_typeof(photos) = 'array' THEN jsonb_array_length(photos)
    ELSE 0
  END as num_fotos_google,
  COALESCE(cardinality(photo_urls), 0) as num_fotos_supabase,
  -- Cálculo de costo mensual estimado por lugar (asumiendo 100 vistas/mes)
  CASE 
    WHEN photos IS NOT NULL AND jsonb_typeof(photos) = 'array' THEN ROUND(jsonb_array_length(photos) * 100 * 0.007, 2)
    ELSE 0
  END as costo_mes_usd
FROM places
WHERE published = true
  AND photos IS NOT NULL
  AND jsonb_typeof(photos) = 'array'
  AND jsonb_array_length(photos) > 0
  AND (photo_urls IS NULL OR cardinality(photo_urls) = 0)
ORDER BY review_count DESC, rating DESC
LIMIT 20;

-- 5. ESTADÍSTICAS DE ALMACENAMIENTO (Supabase Storage)
-- Nota: Supabase cobra ~$0.021/GB/mes de almacenamiento
SELECT 
  COUNT(*) as lugares_con_fotos_supabase,
  SUM(cardinality(photo_urls)) as total_fotos_supabase,
  -- Estimación: ~200KB por foto comprimida
  ROUND(SUM(cardinality(photo_urls)) * 0.2, 2) as storage_mb_estimado,
  ROUND(SUM(cardinality(photo_urls)) * 0.2 / 1024 * 0.021, 4) as costo_storage_mes_usd
FROM places
WHERE published = true
  AND photo_urls IS NOT NULL
  AND cardinality(photo_urls) > 0;

-- 6. COMPARATIVA DE COSTOS
-- Mostrar el ahorro real de la migración
WITH stats AS (
  SELECT 
    COUNT(CASE WHEN (photo_urls IS NULL OR cardinality(photo_urls) = 0) 
                AND photos IS NOT NULL 
                AND jsonb_typeof(photos) = 'array'
                AND jsonb_array_length(photos) > 0 THEN 1 END) as lugares_google,
    COUNT(CASE WHEN photo_urls IS NOT NULL AND cardinality(photo_urls) > 0 THEN 1 END) as lugares_supabase,
    COALESCE(SUM(CASE 
      WHEN photos IS NOT NULL AND jsonb_typeof(photos) = 'array' THEN jsonb_array_length(photos) 
      ELSE 0 
    END), 0) as total_fotos_google,
    COALESCE(SUM(CASE 
      WHEN photo_urls IS NOT NULL AND cardinality(photo_urls) > 0 THEN cardinality(photo_urls) 
      ELSE 0 
    END), 0) as total_fotos_supabase
  FROM places
  WHERE published = true
)
SELECT 
  lugares_google,
  lugares_supabase,
  total_fotos_google,
  total_fotos_supabase,
  -- Costo mensual de Google Photos API (asumiendo 100 vistas/lugar/mes)
  ROUND(lugares_google * 100 * 0.007, 2) as costo_google_mes_usd,
  -- Costo mensual de Supabase Storage
  ROUND(total_fotos_supabase * 0.2 / 1024 * 0.021, 4) as costo_supabase_mes_usd,
  -- Ahorro mensual
  ROUND(lugares_google * 100 * 0.007 - (total_fotos_supabase * 0.2 / 1024 * 0.021), 2) as ahorro_mes_usd,
  -- Ahorro anual
  ROUND((lugares_google * 100 * 0.007 - (total_fotos_supabase * 0.2 / 1024 * 0.021)) * 12, 2) as ahorro_anual_usd
FROM stats;

-- 7. LISTA DE IDs DE LUGARES PENDIENTES DE MIGRACIÓN (para el script)
-- Este resultado se puede usar directamente en el script de migración
SELECT 
  id,
  place_id,
  name,
  category,
  province,
  rating,
  review_count,
  CASE 
    WHEN photos IS NOT NULL AND jsonb_typeof(photos) = 'array' THEN jsonb_array_length(photos)
    ELSE 0
  END as num_fotos_google,
  COALESCE(cardinality(photo_urls), 0) as num_fotos_supabase
FROM places
WHERE published = true
  AND photos IS NOT NULL
  AND jsonb_typeof(photos) = 'array'
  AND jsonb_array_length(photos) > 0
  AND (photo_urls IS NULL OR cardinality(photo_urls) = 0)
ORDER BY review_count DESC, rating DESC
LIMIT 50;
