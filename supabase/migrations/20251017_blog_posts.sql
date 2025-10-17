-- ================================================================
-- SISTEMA DE BLOG PARA SEO
-- ================================================================
-- 
-- Tabla para almacenar posts de blog generados con IA
-- Cada post es un "Top 10" de lugares filtrados por categoría/ubicación
-- 
-- Ejemplos:
-- - "Los 10 Mejores Restaurantes de Murcia"
-- - "Los 10 Mejores Hoteles de la Provincia de Cuenca"
-- - "Los 10 Mejores Bares de Madrid"
--
-- ================================================================

-- Crear tabla de posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  
  -- Filtros para obtener lugares
  category TEXT NOT NULL CHECK (category IN ('restaurante', 'bar', 'cafe', 'hotel')),
  location TEXT NOT NULL, -- nombre de ciudad o provincia
  location_type TEXT NOT NULL CHECK (location_type IN ('city', 'province', 'community')),
  
  -- Contenido generado por IA
  intro_text TEXT NOT NULL, -- Introducción de 300-400 palabras
  conclusion_text TEXT, -- Conclusión opcional
  
  -- SEO
  keywords TEXT[], -- Keywords para SEO
  featured_image_url TEXT, -- URL de imagen destacada (opcional)
  
  -- Metadata
  published BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug) WHERE published = true;
CREATE INDEX idx_blog_posts_category ON blog_posts(category) WHERE published = true;
CREATE INDEX idx_blog_posts_location ON blog_posts(location) WHERE published = true;
CREATE INDEX idx_blog_posts_category_location ON blog_posts(category, location, location_type) WHERE published = true;
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC) WHERE published = true;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Función para incrementar vistas
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts 
  SET views_count = views_count + 1 
  WHERE slug = post_slug AND published = true;
END;
$$ LANGUAGE plpgsql;

-- Función auxiliar para generar slug desde título
CREATE OR REPLACE FUNCTION generate_blog_slug(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convertir a minúsculas, quitar acentos, reemplazar espacios por guiones
  base_slug := lower(title_text);
  base_slug := translate(base_slug, 
    'áéíóúàèìòùäëïöüâêîôûñç', 
    'aeiouaeiouaeiouaeiounce');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  final_slug := base_slug;
  
  -- Verificar unicidad y añadir número si existe
  WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) - Lectura pública, escritura solo admin
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer posts publicados
CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT
  USING (published = true);

-- Política: Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "blog_posts_admin_all" ON blog_posts
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'authenticated' 
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ================================================================
-- DATOS DE EJEMPLO (para testing)
-- ================================================================

-- Insertar un post de ejemplo
INSERT INTO blog_posts (
  slug,
  title,
  meta_description,
  category,
  location,
  location_type,
  intro_text,
  keywords
) VALUES (
  'mejores-restaurantes-murcia',
  'Los 10 Mejores Restaurantes de Murcia (2025)',
  'Descubre los mejores restaurantes de Murcia con más de 4.7 estrellas en Google. Guía actualizada con los locales top de gastronomía murciana.',
  'restaurante',
  'Murcia',
  'city',
  'Murcia, conocida por su rica tradición gastronómica mediterránea, alberga algunos de los mejores restaurantes del sureste español. En esta guía hemos seleccionado cuidadosamente los 10 establecimientos mejor valorados de la ciudad, todos con una puntuación superior a 4.7 estrellas en Google Maps.

La gastronomía murciana se caracteriza por sus productos de huerta, sus arroces marineros y sus tradicionales pastelitos de carne. Estos restaurantes no solo destacan por mantener viva esta tradición culinaria, sino también por ofrecer propuestas innovadoras que fusionan lo mejor de la cocina local con técnicas contemporáneas.

Cada uno de estos locales ha sido verificado por nuestro sistema de calidad, que analiza miles de reseñas reales de comensales. Solo incluimos establecimientos con valoraciones consistentemente altas, asegurando que tu experiencia gastronómica en Murcia sea excepcional.

¿Listo para descubrir los mejores sabores de la capital murciana? Aquí está nuestra selección de los 10 restaurantes imprescindibles.',
  ARRAY['restaurantes murcia', 'mejores restaurantes murcia', 'donde comer murcia', 'gastronomia murciana', 'restaurantes 5 estrellas murcia']
) ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- COMENTARIOS ÚTILES
-- ================================================================

COMMENT ON TABLE blog_posts IS 'Posts de blog SEO con Top 10 de lugares por categoría/ubicación';
COMMENT ON COLUMN blog_posts.slug IS 'URL-friendly identifier (e.g., mejores-restaurantes-murcia)';
COMMENT ON COLUMN blog_posts.intro_text IS 'Texto introductorio generado por IA (300-400 palabras)';
COMMENT ON COLUMN blog_posts.location_type IS 'Tipo de ubicación: city (ciudad), province (provincia), community (comunidad)';

