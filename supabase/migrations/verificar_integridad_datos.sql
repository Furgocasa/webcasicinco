-- ============================================================================
-- VERIFICACIÓN DE INTEGRIDAD DE DATOS - CASI CINCO APP
-- ============================================================================
-- Ejecuta este script en Supabase Dashboard → SQL Editor
-- Para verificar que todos los datos estén correctos después de la limpieza
-- ============================================================================

DO $$
DECLARE
  total_lugares INTEGER;
  publicados INTEGER;
  borradores INTEGER;
  sin_categoria INTEGER;
  categorias_invalidas INTEGER;
  paises_invalidos INTEGER;
  sin_ai_description INTEGER;
  con_ai_description INTEGER;
  sin_photos INTEGER;
  con_slug_duplicado INTEGER;
BEGIN
  -- 📊 CONTADORES GENERALES
  SELECT COUNT(*) INTO total_lugares FROM places;
  SELECT COUNT(*) INTO publicados FROM places WHERE published = true;
  SELECT COUNT(*) INTO borradores FROM places WHERE published = false;
  
  -- 🔍 VERIFICAR CATEGORÍAS
  SELECT COUNT(*) INTO sin_categoria FROM places WHERE category IS NULL;
  SELECT COUNT(*) INTO categorias_invalidas 
  FROM places 
  WHERE category NOT IN ('restaurante', 'bar', 'cafe', 'hotel');
  
  -- 🌍 VERIFICAR PAÍSES
  SELECT COUNT(*) INTO paises_invalidos 
  FROM places 
  WHERE country IS NULL OR country != 'España';
  
  -- 🎨 VERIFICAR ENRIQUECIMIENTO IA
  SELECT COUNT(*) INTO sin_ai_description 
  FROM places 
  WHERE ai_description IS NULL AND published = true;
  
  SELECT COUNT(*) INTO con_ai_description 
  FROM places 
  WHERE ai_description IS NOT NULL;
  
  -- 📸 VERIFICAR FOTOS
  SELECT COUNT(*) INTO sin_photos 
  FROM places 
  WHERE photos IS NULL OR photos = '[]'::jsonb;
  
  -- 🔗 VERIFICAR SLUGS DUPLICADOS
  SELECT COUNT(*) INTO con_slug_duplicado
  FROM (
    SELECT slug, COUNT(*) as cnt
    FROM places
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) AS duplicates;
  
  -- ============================================================================
  -- 📋 REPORTE
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 VERIFICACIÓN DE INTEGRIDAD DE DATOS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  
  -- General
  RAISE NOTICE '🏠 LUGARES TOTALES:';
  RAISE NOTICE '  ✓ Total en BD: %', total_lugares;
  RAISE NOTICE '  ✓ Publicados: % (% %%)', publicados, ROUND((publicados::NUMERIC / NULLIF(total_lugares, 0)) * 100, 1);
  RAISE NOTICE '  ✓ Borradores: % (% %%)', borradores, ROUND((borradores::NUMERIC / NULLIF(total_lugares, 0)) * 100, 1);
  RAISE NOTICE '';
  
  -- Categorías
  IF sin_categoria > 0 OR categorias_invalidas > 0 THEN
    RAISE NOTICE '⚠️  PROBLEMAS DE CATEGORÍAS:';
    IF sin_categoria > 0 THEN
      RAISE NOTICE '  ❌ Sin categoría: %', sin_categoria;
    END IF;
    IF categorias_invalidas > 0 THEN
      RAISE NOTICE '  ❌ Categorías inválidas: %', categorias_invalidas;
    END IF;
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '✅ CATEGORÍAS: Todas válidas (restaurante, bar, cafe, hotel)';
    RAISE NOTICE '';
  END IF;
  
  -- Países
  IF paises_invalidos > 0 THEN
    RAISE NOTICE '⚠️  PROBLEMAS DE UBICACIÓN:';
    RAISE NOTICE '  ❌ Lugares fuera de España: %', paises_invalidos;
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '✅ UBICACIÓN: Todos los lugares en España';
    RAISE NOTICE '';
  END IF;
  
  -- Enriquecimiento IA
  RAISE NOTICE '🎨 ENRIQUECIMIENTO IA:';
  RAISE NOTICE '  ✓ Con descripción IA: % (% %%)', con_ai_description, ROUND((con_ai_description::NUMERIC / NULLIF(total_lugares, 0)) * 100, 1);
  IF sin_ai_description > 0 THEN
    RAISE NOTICE '  ⚠️  Publicados sin IA: %', sin_ai_description;
  ELSE
    RAISE NOTICE '  ✅ Todos los publicados tienen IA';
  END IF;
  RAISE NOTICE '';
  
  -- Fotos
  RAISE NOTICE '📸 FOTOS:';
  RAISE NOTICE '  ✓ Con fotos: %', (total_lugares - sin_photos);
  IF sin_photos > 0 THEN
    RAISE NOTICE '  ⚠️  Sin fotos: %', sin_photos;
  END IF;
  RAISE NOTICE '';
  
  -- Slugs
  IF con_slug_duplicado > 0 THEN
    RAISE NOTICE '⚠️  PROBLEMAS DE SLUGS:';
    RAISE NOTICE '  ❌ Slugs duplicados: %', con_slug_duplicado;
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '✅ SLUGS: Todos únicos';
    RAISE NOTICE '';
  END IF;
  
  -- Resumen final
  RAISE NOTICE '============================================';
  IF sin_categoria = 0 AND categorias_invalidas = 0 AND paises_invalidos = 0 AND con_slug_duplicado = 0 THEN
    RAISE NOTICE '✅ ESTADO: DATOS ÍNTEGROS Y CORRECTOS';
  ELSE
    RAISE NOTICE '⚠️  ESTADO: SE ENCONTRARON PROBLEMAS';
    RAISE NOTICE 'Revisa los detalles arriba y ejecuta las correcciones necesarias.';
  END IF;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 🔍 DETALLES DE PROBLEMAS (si los hay)
-- ============================================================================

-- Lugares con categorías inválidas
DO $$
DECLARE
  problema_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO problema_count 
  FROM places 
  WHERE category NOT IN ('restaurante', 'bar', 'cafe', 'hotel') OR category IS NULL;
  
  IF problema_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '📋 LUGARES CON CATEGORÍAS INVÁLIDAS:';
    RAISE NOTICE '============================================';
  END IF;
END $$;

SELECT 
  id,
  name,
  COALESCE(category, 'NULL') as categoria,
  province,
  city,
  published
FROM places
WHERE category NOT IN ('restaurante', 'bar', 'cafe', 'hotel') 
   OR category IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Lugares fuera de España
DO $$
DECLARE
  problema_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO problema_count 
  FROM places 
  WHERE country IS NULL OR country != 'España';
  
  IF problema_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '📋 LUGARES FUERA DE ESPAÑA:';
    RAISE NOTICE '============================================';
  END IF;
END $$;

SELECT 
  id,
  name,
  COALESCE(country, 'NULL') as pais,
  province,
  city,
  published
FROM places
WHERE country IS NULL OR country != 'España'
ORDER BY created_at DESC
LIMIT 10;

-- Slugs duplicados
DO $$
DECLARE
  problema_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO problema_count
  FROM (
    SELECT slug, COUNT(*) as cnt
    FROM places
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) AS duplicates;
  
  IF problema_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '📋 SLUGS DUPLICADOS:';
    RAISE NOTICE '============================================';
  END IF;
END $$;

SELECT 
  slug,
  COUNT(*) as cantidad,
  array_agg(name) as nombres,
  array_agg(id) as ids
FROM places
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ============================================================================
-- ✅ VERIFICACIÓN FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ VERIFICACIÓN COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Si encontraste problemas, puedes ejecutar los scripts de limpieza:';
  RAISE NOTICE '  - limpiar_categorias_invalidas.sql';
  RAISE NOTICE '  - limpiar_paises_invalidos.sql';
  RAISE NOTICE '  - reparar_slugs_duplicados.sql';
  RAISE NOTICE '';
END $$;

