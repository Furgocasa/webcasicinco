-- ================================================================
-- Actualizar imágenes de blog con fotos reales de lugares
-- ================================================================
-- Este script actualiza los featured_image_url de los posts
-- para usar la foto del primer lugar de su lista (Top 10)
-- en vez de imágenes genéricas de Unsplash
-- ================================================================

-- Función auxiliar para construir URL de foto de Google Places
-- Similar a getPlacePhotoUrl() del frontend
CREATE OR REPLACE FUNCTION get_google_photo_url(photo_ref TEXT)
RETURNS TEXT AS $$
BEGIN
  IF photo_ref IS NULL OR photo_ref = '' THEN
    RETURN NULL;
  END IF;
  
  -- URL de Google Places Photo API (tamaño 1200x600 para featured image)
  RETURN 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=' || photo_ref || '&key=YOUR_API_KEY';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Actualizar cada post con la foto del primer lugar de su Top 10
-- ================================================================

DO $$
DECLARE
  blog_record RECORD;
  first_place RECORD;
  photo_url TEXT;
  updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🚀 Iniciando actualización de imágenes de blog...';
  RAISE NOTICE '';
  
  -- Iterar sobre cada post de blog
  FOR blog_record IN 
    SELECT id, slug, category, location, location_type, title
    FROM blog_posts
    WHERE published = true
    ORDER BY created_at
  LOOP
    RAISE NOTICE '📝 Procesando: %', blog_record.title;
    
    -- Obtener el primer lugar (mejor valorado) que coincida
    SELECT photo_reference, name, rating
    INTO first_place
    FROM places
    WHERE 
      category = blog_record.category
      AND published = true
      AND rating >= 4.7
      AND photo_reference IS NOT NULL
      AND (
        -- Para ciudades: buscar por city
        (blog_record.location_type = 'city' AND LOWER(city) = LOWER(blog_record.location))
        OR
        -- Para provincias: buscar por province
        (blog_record.location_type = 'province' AND LOWER(province) = LOWER(blog_record.location))
        OR
        -- Para comunidades: buscar por community
        (blog_record.location_type = 'community' AND LOWER(community) = LOWER(blog_record.location))
      )
    ORDER BY rating DESC, review_count DESC
    LIMIT 1;
    
    -- Si encontramos un lugar con foto
    IF first_place.photo_reference IS NOT NULL THEN
      photo_url := get_google_photo_url(first_place.photo_reference);
      
      -- Actualizar el post
      UPDATE blog_posts
      SET 
        featured_image_url = photo_url,
        updated_at = NOW()
      WHERE id = blog_record.id;
      
      updated_count := updated_count + 1;
      RAISE NOTICE '   ✅ Imagen actualizada: % (Rating: %)', first_place.name, first_place.rating;
    ELSE
      RAISE NOTICE '   ⚠️  No se encontró lugar con foto para esta ubicación';
    END IF;
    
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ Actualización completada!';
  RAISE NOTICE '📊 Posts actualizados: %', updated_count;
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- Limpiar función temporal
DROP FUNCTION IF EXISTS get_google_photo_url(TEXT);

-- ================================================================
-- NOTA IMPORTANTE
-- ================================================================
-- Este script usa photo_reference de Google Places.
-- Las URLs generadas incluyen 'YOUR_API_KEY' como placeholder.
-- 
-- En el frontend, getPlacePhotoUrl() ya maneja esto correctamente
-- usando process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
-- 
-- Las imágenes se renderizarán correctamente porque el componente
-- Image de Next.js llamará a getPlacePhotoUrl() en tiempo de ejecución.
-- ================================================================

