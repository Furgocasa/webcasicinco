-- ============================================================================
-- VERIFICACIÓN DE ESTRUCTURA DE LA TABLA PLACES
-- ============================================================================
-- Este script muestra la estructura completa de la tabla places,
-- incluyendo qué columnas son NOT NULL (requeridas) y cuáles son opcionales.
-- ============================================================================

-- 1. Ver estructura completa de la tabla places
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'places' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver solo las columnas NOT NULL (requeridas)
SELECT 
    column_name,
    data_type,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'places' 
  AND table_schema = 'public'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 3. Ver solo las columnas NULLABLE (opcionales)
SELECT 
    column_name,
    data_type,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'places' 
  AND table_schema = 'public'
  AND is_nullable = 'YES'
ORDER BY ordinal_position;

-- 4. Ver un ejemplo de lugar existente para entender los datos
SELECT 
    id,
    name,
    category,
    country,
    region,
    province,
    city,
    address,
    rating,
    review_count,
    published,
    created_at
FROM places 
WHERE published = true 
LIMIT 3;

-- 5. Ver qué regiones existen actualmente en la BD
SELECT 
    region,
    COUNT(*) as cantidad
FROM places 
WHERE region IS NOT NULL
GROUP BY region
ORDER BY cantidad DESC;

-- 6. Ver qué provincias existen y sus regiones correspondientes
SELECT 
    province,
    region,
    COUNT(*) as cantidad
FROM places 
WHERE region IS NOT NULL
GROUP BY province, region
ORDER BY province, cantidad DESC;
