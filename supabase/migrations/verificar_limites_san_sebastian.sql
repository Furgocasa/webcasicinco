-- ============================================================================
-- VERIFICACIÓN DE LÍMITES EN SAN SEBASTIÁN
-- ============================================================================
-- Este script verifica cuántos lugares hay de San Sebastián y por qué solo 60
-- ============================================================================

DO $$
DECLARE
  total_san_sebastian INTEGER;
  con_rating_alto INTEGER;
  con_resenas_altas INTEGER;
  por_categoria RECORD;
  r RECORD;
BEGIN
  RAISE NOTICE '📊 Verificando límites en San Sebastián...';
  RAISE NOTICE '================================================================================';

  -- Contar total de lugares en San Sebastián
  SELECT COUNT(*)
  INTO total_san_sebastian
  FROM places
  WHERE city ILIKE '%san sebastián%' OR city ILIKE '%donostia%';

  -- Contar con rating >= 4.7
  SELECT COUNT(*)
  INTO con_rating_alto
  FROM places
  WHERE (city ILIKE '%san sebastián%' OR city ILIKE '%donostia%')
    AND rating >= 4.7;

  -- Contar con reseñas >= 50
  SELECT COUNT(*)
  INTO con_resenas_altas
  FROM places
  WHERE (city ILIKE '%san sebastián%' OR city ILIKE '%donostia%')
    AND review_count >= 50;

  RAISE NOTICE '🏙️ SAN SEBASTIÁN - Análisis de límites:';
  RAISE NOTICE '  - Total lugares: %', total_san_sebastian;
  RAISE NOTICE '  - Con rating >= 4.7: %', con_rating_alto;
  RAISE NOTICE '  - Con reseñas >= 50: %', con_resenas_altas;
  RAISE NOTICE '';

  -- Análisis por categoría
  RAISE NOTICE '📋 Por categoría (rating >= 4.7, reseñas >= 50):';
  FOR por_categoria IN (
    SELECT category, COUNT(*) as count
    FROM places
    WHERE (city ILIKE '%san sebastián%' OR city ILIKE '%donostia%')
      AND rating >= 4.7
      AND review_count >= 50
    GROUP BY category
    ORDER BY count DESC
  ) LOOP
    RAISE NOTICE '  - %: % lugares', por_categoria.category, por_categoria.count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '🔍 Top 10 lugares de San Sebastián (rating >= 4.7, reseñas >= 50):';
  FOR r IN (
    SELECT name, category, rating, review_count, published
    FROM places
    WHERE (city ILIKE '%san sebastián%' OR city ILIKE '%donostia%')
      AND rating >= 4.7
      AND review_count >= 50
    ORDER BY rating DESC, review_count DESC
    LIMIT 10
  ) LOOP
    RAISE NOTICE '  - %: % estrellas, % reseñas, %', 
                 r.name, r.rating, r.review_count, 
                 CASE WHEN r.published THEN 'Publicado' ELSE 'Borrador' END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '💡 CONCLUSIÓN:';
  IF con_resenas_altas <= 60 THEN
    RAISE NOTICE '  ✅ Es normal que solo haya ~% lugares en San Sebastián', con_resenas_altas;
    RAISE NOTICE '  📍 San Sebastián es una ciudad pequeña con filtros estrictos';
    RAISE NOTICE '  🎯 Filtros: rating >= 4.7, reseñas >= 50, solo España';
  ELSE
    RAISE NOTICE '  ⚠️ Hay % lugares que cumplen criterios, pero solo se indexaron 60', con_resenas_altas;
    RAISE NOTICE '  🔍 Posible límite de Google Places API o error en indexación';
  END IF;

  RAISE NOTICE '================================================================================';

END $$;
