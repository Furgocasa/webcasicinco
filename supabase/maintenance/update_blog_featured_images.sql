-- ================================================================
-- ACTUALIZAR IMÁGENES DESTACADAS EN POSTS EXISTENTES
-- ================================================================
-- 
-- Este script añade URLs de imágenes de Unsplash a los posts
-- que no tienen imagen destacada
-- 
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- Restaurantes
UPDATE blog_posts 
SET featured_image_url = 'https://source.unsplash.com/1200x600/?restaurant,food,dining,' || LOWER(location) || ',spain'
WHERE category = 'restaurante' 
  AND (featured_image_url IS NULL OR featured_image_url = '');

-- Bares
UPDATE blog_posts 
SET featured_image_url = 'https://source.unsplash.com/1200x600/?bar,cocktail,drinks,' || LOWER(location) || ',spain'
WHERE category = 'bar' 
  AND (featured_image_url IS NULL OR featured_image_url = '');

-- Cafeterías
UPDATE blog_posts 
SET featured_image_url = 'https://source.unsplash.com/1200x600/?cafe,coffee,espresso,' || LOWER(location) || ',spain'
WHERE category = 'cafe' 
  AND (featured_image_url IS NULL OR featured_image_url = '');

-- Hoteles
UPDATE blog_posts 
SET featured_image_url = 'https://source.unsplash.com/1200x600/?hotel,luxury,accommodation,' || LOWER(location) || ',spain'
WHERE category = 'hotel' 
  AND (featured_image_url IS NULL OR featured_image_url = '');

-- Verificar resultado
SELECT 
  category,
  COUNT(*) as total_posts,
  COUNT(featured_image_url) as posts_con_imagen,
  COUNT(*) - COUNT(featured_image_url) as posts_sin_imagen
FROM blog_posts
GROUP BY category
ORDER BY category;

