-- ================================================================
-- ACTUALIZAR FECHAS DE BLOG PARA PARECER ORGÁNICO
-- ================================================================
--
-- Estrategia:
-- - 5 posts publicados HOY (recién lanzada la app)
-- - El resto distribuidos en los próximos 3 meses
-- - Cada 2-3 semanas un nuevo post
--
-- ================================================================

-- 1. POSTS PUBLICADOS HOY (5 posts principales)
UPDATE blog_posts
SET 
  created_at = NOW(),
  updated_at = NOW(),
  published = true
WHERE slug IN (
  'mejores-restaurantes-madrid',
  'mejores-restaurantes-barcelona',
  'mejores-hoteles-madrid',
  'mejores-bares-madrid',
  'mejores-cafeterias-madrid'
);

-- 2. POSTS PARA DENTRO DE 2 SEMANAS (5 posts)
UPDATE blog_posts
SET 
  created_at = NOW() + INTERVAL '14 days',
  updated_at = NOW() + INTERVAL '14 days',
  published = false  -- Se publicarán automáticamente en esa fecha
WHERE slug IN (
  'mejores-restaurantes-valencia',
  'mejores-restaurantes-sevilla',
  'mejores-bares-barcelona',
  'mejores-hoteles-barcelona',
  'mejores-cafeterias-barcelona'
);

-- 3. POSTS PARA DENTRO DE 4 SEMANAS (5 posts)
UPDATE blog_posts
SET 
  created_at = NOW() + INTERVAL '28 days',
  updated_at = NOW() + INTERVAL '28 days',
  published = false
WHERE slug IN (
  'mejores-restaurantes-malaga',
  'mejores-bares-sevilla',
  'mejores-bares-valencia',
  'mejores-hoteles-malaga',
  'mejores-restaurantes-murcia'
);

-- 4. POSTS PARA DENTRO DE 6 SEMANAS (5 posts)
UPDATE blog_posts
SET 
  created_at = NOW() + INTERVAL '42 days',
  updated_at = NOW() + INTERVAL '42 days',
  published = false
WHERE slug IN (
  'mejores-restaurantes-granada',
  'mejores-restaurantes-bilbao',
  'mejores-bares-murcia',
  'mejores-bares-granada',
  'mejores-hoteles-granada'
);

-- 5. POSTS PARA DENTRO DE 8 SEMANAS (5 posts)
UPDATE blog_posts
SET 
  created_at = NOW() + INTERVAL '56 days',
  updated_at = NOW() + INTERVAL '56 days',
  published = false
WHERE slug IN (
  'mejores-restaurantes-zaragoza',
  'mejores-restaurantes-alicante',
  'mejores-bares-bilbao',
  'mejores-hoteles-bilbao',
  'mejores-hoteles-zaragoza'
);

-- 6. POSTS PARA DENTRO DE 10 SEMANAS (4 posts)
UPDATE blog_posts
SET 
  created_at = NOW() + INTERVAL '70 days',
  updated_at = NOW() + INTERVAL '70 days',
  published = false
WHERE slug IN (
  'mejores-hoteles-cuenca',
  'mejores-restaurantes-asturias',
  'mejores-hoteles-cantabria',
  'mejores-restaurantes-cadiz'
);

-- ================================================================
-- FUNCIÓN PARA AUTO-PUBLICAR POSTS EN SU FECHA
-- ================================================================

CREATE OR REPLACE FUNCTION auto_publish_scheduled_posts()
RETURNS void AS $$
BEGIN
  -- Publicar posts cuya fecha ya pasó
  UPDATE blog_posts
  SET published = true
  WHERE published = false
    AND created_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGER DIARIO (opcional, para Supabase Cron Jobs)
-- ================================================================

COMMENT ON FUNCTION auto_publish_scheduled_posts() IS 
'Función para auto-publicar posts programados. 
Ejecutar diariamente con Supabase Cron Jobs o llamarla manualmente desde admin.';

-- ================================================================
-- VERIFICACIÓN
-- ================================================================

-- Ver distribución de posts por fecha
SELECT 
  DATE(created_at) as fecha_publicacion,
  published as publicado,
  COUNT(*) as cantidad,
  STRING_AGG(title, ', ') as titulos
FROM blog_posts
GROUP BY DATE(created_at), published
ORDER BY fecha_publicacion;

