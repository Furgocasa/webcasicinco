-- ============================================================================
-- VERIFICACIÓN DE BORRADORES PENDIENTES DE ENRIQUECIMIENTO IA
-- ============================================================================
-- Este script verifica cuántos borradores (published=false) NO tienen ai_description
-- y cuántos sí, para asegurar la coherencia de los contadores en la app.
-- ============================================================================

DO $$
DECLARE
  borradores_sin_ia_count INTEGER;
  borradores_con_ia_count INTEGER;
  total_borradores_count INTEGER;
  publicados_sin_ia_count INTEGER;
  publicados_con_ia_count INTEGER;
  total_publicados_count INTEGER;
  total_sin_ia_count INTEGER;
  total_con_ia_count INTEGER;
  total_places_count INTEGER;
BEGIN
  RAISE NOTICE '📊 Verificando estado de enriquecimiento IA en BORRADORES vs PUBLICADOS...';
  RAISE NOTICE '================================================================================';

  -- Contar borradores sin ai_description
  SELECT COUNT(*)
  INTO borradores_sin_ia_count
  FROM places
  WHERE published = false AND ai_description IS NULL;

  -- Contar borradores con ai_description
  SELECT COUNT(*)
  INTO borradores_con_ia_count
  FROM places
  WHERE published = false AND ai_description IS NOT NULL;

  -- Contar total de borradores
  SELECT COUNT(*)
  INTO total_borradores_count
  FROM places
  WHERE published = false;

  -- Contar publicados sin ai_description
  SELECT COUNT(*)
  INTO publicados_sin_ia_count
  FROM places
  WHERE published = true AND ai_description IS NULL;

  -- Contar publicados con ai_description
  SELECT COUNT(*)
  INTO publicados_con_ia_count
  FROM places
  WHERE published = true AND ai_description IS NOT NULL;

  -- Contar total de publicados
  SELECT COUNT(*)
  INTO total_publicados_count
  FROM places
  WHERE published = true;

  -- Contar total sin IA (borradores + publicados)
  SELECT COUNT(*)
  INTO total_sin_ia_count
  FROM places
  WHERE ai_description IS NULL;

  -- Contar total con IA (borradores + publicados)
  SELECT COUNT(*)
  INTO total_con_ia_count
  FROM places
  WHERE ai_description IS NOT NULL;

  -- Contar total de lugares
  SELECT COUNT(*)
  INTO total_places_count
  FROM places;

  RAISE NOTICE '📝 BORRADORES (published = false):';
  RAISE NOTICE '  - Sin IA: %', borradores_sin_ia_count;
  RAISE NOTICE '  - Con IA: %', borradores_con_ia_count;
  RAISE NOTICE '  - Total: %', total_borradores_count;
  RAISE NOTICE '';

  RAISE NOTICE '✅ PUBLICADOS (published = true):';
  RAISE NOTICE '  - Sin IA: %', publicados_sin_ia_count;
  RAISE NOTICE '  - Con IA: %', publicados_con_ia_count;
  RAISE NOTICE '  - Total: %', total_publicados_count;
  RAISE NOTICE '';

  RAISE NOTICE '🎯 TOTALES (todos los lugares):';
  RAISE NOTICE '  - Sin IA: %', total_sin_ia_count;
  RAISE NOTICE '  - Con IA: %', total_con_ia_count;
  RAISE NOTICE '  - Total: %', total_places_count;
  RAISE NOTICE '';

  RAISE NOTICE '📊 RESUMEN:';
  RAISE NOTICE '  - El botón "Enriquecer IA" ahora debería mostrar: % lugares pendientes', total_sin_ia_count;
  RAISE NOTICE '  - Incluye % borradores + % publicados sin IA', borradores_sin_ia_count, publicados_sin_ia_count;
  RAISE NOTICE '';

  IF total_sin_ia_count = 0 THEN
    RAISE NOTICE '🎉 ¡Todos los lugares (borradores + publicados) están enriquecidos con IA!';
  ELSE
    RAISE NOTICE '⚠️ Hay % lugares pendientes de enriquecimiento IA.', total_sin_ia_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Listado de los primeros 10 lugares pendientes:';
    FOR r IN (
      SELECT id, name, category, province, published,
             CASE WHEN published THEN 'Publicado' ELSE 'Borrador' END as estado
      FROM places 
      WHERE ai_description IS NULL 
      ORDER BY published DESC, name 
      LIMIT 10
    ) LOOP
      RAISE NOTICE '  - ID: %, Nombre: %, Categoría: %, Provincia: %, Estado: %', 
                   r.id, r.name, r.category, r.province, r.estado;
    END LOOP;
  END IF;

  RAISE NOTICE '================================================================================';
  RAISE NOTICE 'Verificación completada.';

END $$;
