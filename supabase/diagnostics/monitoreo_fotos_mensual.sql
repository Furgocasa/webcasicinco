-- ═══════════════════════════════════════════════════════════════════════════
-- MONITOREO MENSUAL DE FOTOS
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Ejecutar el primer día de cada mes para verificar el estado del sistema
-- de fotos y detectar cualquier problema potencial.
--
-- Fecha última ejecución: 24 de Octubre de 2025
-- Resultado: 0 lugares problemáticos, sistema 100% optimizado
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════════
-- ║ 1. RESUMEN EJECUTIVO - Verificación rápida
-- ╚═══════════════════════════════════════════════════════════════════════════

SELECT 
  COUNT(*) as total_lugares_publicados,
  
  -- Lugares con fotos en Supabase (✅ GRATIS, rápido)
  COUNT(CASE 
    WHEN photo_urls IS NOT NULL 
    AND array_length(photo_urls, 1) > 0 
    THEN 1 
  END) as con_fotos_supabase,
  
  -- Lugares solo con Google Photos (⚠️ CARO, puede fallar)
  COUNT(CASE 
    WHEN (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL OR array_length(photo_urls, 1) = 0)
    AND photos IS NOT NULL 
    AND photos::text != '[]'
    AND photos::text != 'null'
    THEN 1 
  END) as solo_google_photos_ALERTA,
  
  -- Sin fotos de ningún tipo
  COUNT(CASE 
    WHEN (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL)
    AND (photos IS NULL OR photos::text = '[]' OR photos::text = 'null')
    THEN 1 
  END) as sin_fotos_ok,
  
  -- Porcentaje migrado a Supabase
  ROUND(
    COUNT(CASE WHEN photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0 THEN 1 END)::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as porcentaje_supabase,
  
  -- 🔥 COSTO MENSUAL ESTIMADO (asumiendo 10 vistas/mes por lugar)
  CONCAT(
    '€',
    ROUND(
      COUNT(CASE 
        WHEN (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL)
        AND photos IS NOT NULL 
        AND photos::text != '[]'
        THEN 1 
      END) * 10 * 0.007 * 0.92, -- Conversión USD a EUR aprox
      2
    )
  ) as costo_mensual_estimado_EUR
  
FROM places
WHERE published = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- INTERPRETACIÓN:
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- ✅ IDEAL: solo_google_photos_ALERTA = 0
-- ⚠️ REVISAR: solo_google_photos_ALERTA entre 1-50 (ejecutar limpieza)
-- 🔥 CRÍTICO: solo_google_photos_ALERTA > 50 (problema serio)
--
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════════
-- ║ 2. DESGLOSE POR CATEGORÍA
-- ╚═══════════════════════════════════════════════════════════════════════════

SELECT 
  category,
  COUNT(*) as total_lugares,
  
  COUNT(CASE 
    WHEN photo_urls IS NOT NULL 
    AND array_length(photo_urls, 1) > 0 
    THEN 1 
  END) as con_supabase,
  
  COUNT(CASE 
    WHEN (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL)
    AND photos IS NOT NULL 
    AND photos::text != '[]'
    THEN 1 
  END) as solo_google_PROBLEMA,
  
  -- Porcentaje migrado
  ROUND(
    COUNT(CASE WHEN photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0 THEN 1 END)::numeric 
    / COUNT(*)::numeric * 100, 
    1
  ) as porcentaje_migrado,
  
  -- Costo mensual por categoría
  CONCAT(
    '€',
    ROUND(
      COUNT(CASE 
        WHEN (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL)
        AND photos IS NOT NULL 
        THEN 1 
      END) * 10 * 0.007 * 0.92,
      2
    )
  ) as costo_mes_EUR
  
FROM places
WHERE published = true
GROUP BY category
ORDER BY solo_google_PROBLEMA DESC;


-- ╔═══════════════════════════════════════════════════════════════════════════
-- ║ 3. TOP 20 LUGARES PROBLEMÁTICOS (si los hay)
-- ╚═══════════════════════════════════════════════════════════════════════════

SELECT 
  id,
  name,
  category,
  province,
  city,
  rating,
  review_count,
  
  -- Número de photo_references que tiene
  CASE 
    WHEN photos IS NULL OR photos::text = '[]' THEN 0
    ELSE array_length(photos::text::text[], 1)
  END as num_photos_google,
  
  created_at,
  updated_at
  
FROM places
WHERE published = true
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL OR array_length(photo_urls, 1) = 0)
  AND photos IS NOT NULL
  AND photos::text != '[]'
  AND photos::text != 'null'
  
ORDER BY review_count DESC, rating DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════════════════
-- Si esta query devuelve resultados, HAY LUGARES PROBLEMÁTICOS que están
-- consumiendo Google Photos API y generando costos innecesarios.
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════════
-- ║ 4. ACCIÓN CORRECTIVA (Ejecutar solo si hay problemas)
-- ╚═══════════════════════════════════════════════════════════════════════════

-- ⚠️ DESCOMENTA Y EJECUTA SOLO SI LA QUERY #3 DEVUELVE LUGARES

-- UPDATE places
-- SET photos = NULL
-- WHERE photos IS NOT NULL
--   AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL)
--   AND published = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- Esta query limpia los photo_references expirados, evitando llamadas a
-- Google Photos API que resultan en 403 Forbidden.
--
-- RESULTADO ESPERADO:
-- - Costo de fotos: €0/mes
-- - Lugares siguen publicados con placeholder
-- - Sin llamadas a Google Photos API
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════════
-- ║ 5. HISTORIAL DE EJECUCIONES
-- ╚═══════════════════════════════════════════════════════════════════════════

-- Registrar cada ejecución mensual aquí:
--
-- ┌──────────────┬─────────────────┬───────────────┬──────────────┐
-- │ Fecha        │ Lugares Total   │ Problemáticos │ Acción       │
-- ├──────────────┼─────────────────┼───────────────┼──────────────┤
-- │ 24 Oct 2025  │ 3,133           │ 99 → 0        │ Limpieza ✅  │
-- │              │                 │               │              │
-- │              │                 │               │              │
-- └──────────────┴─────────────────┴───────────────┴──────────────┘
--
-- Añade una fila cada vez que ejecutes este script mensual
--
-- ═══════════════════════════════════════════════════════════════════════════

