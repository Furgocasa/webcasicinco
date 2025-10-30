-- ====================================
-- DIAGNÓSTICO: ¿Cómo está escrito "Níjar" en la BD?
-- ====================================

-- 1) Ver EXACTAMENTE cómo está escrito (con tildes, espacios, etc.)
SELECT 
  DISTINCT city,
  LENGTH(city) as longitud,
  encode(city::bytea, 'hex') as hex_encoding  -- Ver caracteres exactos
FROM places 
WHERE province = 'Almería';

-- 2) Probar diferentes variantes de búsqueda
SELECT 
  name,
  city,
  province,
  '✅ ILIKE níjar' as test
FROM places 
WHERE city ILIKE 'níjar'
UNION ALL
SELECT 
  name,
  city,
  province,
  '✅ ILIKE nijar' as test
FROM places 
WHERE city ILIKE 'nijar'
UNION ALL
SELECT 
  name,
  city,
  province,
  '✅ ILIKE %níjar%' as test
FROM places 
WHERE city ILIKE '%níjar%'
UNION ALL
SELECT 
  name,
  city,
  province,
  '✅ = Níjar' as test
FROM places 
WHERE city = 'Níjar';

-- 3) ¿Algún lugar tiene "Níjar" en la dirección pero ciudad diferente?
SELECT 
  name,
  city,
  address,
  province
FROM places 
WHERE (address ILIKE '%níjar%' OR address ILIKE '%nijar%')
  AND province = 'Almería';

