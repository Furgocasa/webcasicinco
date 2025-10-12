-- ============================================
-- CASI CINCO - SETUP DE BASE DE DATOS SUPABASE
-- ============================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Habilitar extensión para búsquedas geográficas
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- TABLA: places
-- ============================================

CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_place_id VARCHAR UNIQUE NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL CHECK (category IN ('restaurante', 'hotel', 'spa', 'experiencia', 'bar', 'monumento')),
  subcategory VARCHAR,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER NOT NULL CHECK (review_count >= 0),
  country VARCHAR NOT NULL,
  region VARCHAR NOT NULL,
  province VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  phone VARCHAR,
  website VARCHAR,
  price_level INTEGER CHECK (price_level BETWEEN 1 AND 4),
  ai_description TEXT,
  ai_review_summary TEXT,
  ai_highlights JSONB,
  photos JSONB,
  google_maps_url VARCHAR,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  indexed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para places
CREATE INDEX idx_places_rating ON public.places(rating DESC);
CREATE INDEX idx_places_category ON public.places(category);
CREATE INDEX idx_places_province ON public.places(province);
CREATE INDEX idx_places_region ON public.places(region);
CREATE INDEX idx_places_city ON public.places(city);
CREATE INDEX idx_places_published ON public.places(published);
CREATE INDEX idx_places_featured ON public.places(featured);
CREATE INDEX idx_places_slug ON public.places(slug);
CREATE INDEX idx_places_google_id ON public.places(google_place_id);

-- Índice geoespacial para búsquedas por ubicación
CREATE INDEX idx_places_location ON public.places 
USING GIST (ST_MakePoint(longitude, latitude));

-- Índice de texto completo para búsquedas
CREATE INDEX idx_places_search ON public.places 
USING GIN (to_tsvector('spanish', name || ' ' || COALESCE(address, '') || ' ' || city));

-- ============================================
-- TABLA: indexation_jobs
-- ============================================

CREATE TABLE IF NOT EXISTS public.indexation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
  search_params JSONB NOT NULL,
  total_places INTEGER DEFAULT 0,
  processed_places INTEGER DEFAULT 0,
  successful_places INTEGER DEFAULT 0,
  failed_places INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_log JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para indexation_jobs
CREATE INDEX idx_jobs_status ON public.indexation_jobs(status);
CREATE INDEX idx_jobs_admin ON public.indexation_jobs(admin_user_id);
CREATE INDEX idx_jobs_created ON public.indexation_jobs(created_at DESC);

-- ============================================
-- TABLA: user_favorites
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- Índices para user_favorites
CREATE INDEX idx_favorites_user ON public.user_favorites(user_id);
CREATE INDEX idx_favorites_place ON public.user_favorites(place_id);

-- ============================================
-- CONFIGURAR STORAGE PARA FOTOS
-- ============================================

-- Crear bucket público para fotos de lugares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'place-photos',
  'place-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indexation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para places
-- Lectura pública de lugares publicados
CREATE POLICY "Public read published places" ON public.places
  FOR SELECT
  USING (published = true);

-- Solo admins pueden insertar lugares
CREATE POLICY "Admins can insert places" ON public.places
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Solo admins pueden actualizar lugares
CREATE POLICY "Admins can update places" ON public.places
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Solo admins pueden eliminar lugares
CREATE POLICY "Admins can delete places" ON public.places
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Políticas para indexation_jobs
-- Solo admins pueden ver sus propios jobs
CREATE POLICY "Admins can view their jobs" ON public.indexation_jobs
  FOR SELECT
  USING (
    admin_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Solo admins pueden crear jobs
CREATE POLICY "Admins can create jobs" ON public.indexation_jobs
  FOR INSERT
  WITH CHECK (
    admin_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Solo admins pueden actualizar sus jobs
CREATE POLICY "Admins can update their jobs" ON public.indexation_jobs
  FOR UPDATE
  USING (
    admin_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Políticas para user_favorites
-- Los usuarios pueden ver sus propios favoritos
CREATE POLICY "Users can view their favorites" ON public.user_favorites
  FOR SELECT
  USING (user_id = auth.uid());

-- Los usuarios pueden añadir favoritos
CREATE POLICY "Users can add favorites" ON public.user_favorites
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Los usuarios pueden eliminar sus favoritos
CREATE POLICY "Users can delete favorites" ON public.user_favorites
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Lectura pública de fotos
CREATE POLICY "Public read place photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'place-photos');

-- Solo admins pueden subir fotos
CREATE POLICY "Admins can upload place photos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'place-photos'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Solo admins pueden eliminar fotos
CREATE POLICY "Admins can delete place photos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'place-photos'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para buscar lugares cercanos (radio en metros)
CREATE OR REPLACE FUNCTION public.find_nearby_places(
  lat DECIMAL,
  lng DECIMAL,
  radius_meters INTEGER DEFAULT 5000,
  min_rating DECIMAL DEFAULT 4.7
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  category VARCHAR,
  rating DECIMAL,
  review_count INTEGER,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.category,
    p.rating,
    p.review_count,
    ST_Distance(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(p.longitude, p.latitude)::geography
    ) AS distance_meters
  FROM public.places p
  WHERE
    p.published = true
    AND p.rating >= min_rating
    AND ST_DWithin(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(p.longitude, p.latitude)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en places
CREATE TRIGGER update_places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Insertar un usuario admin de ejemplo (cambiar email y contraseña)
-- NOTA: Esto debe hacerse desde el panel de Supabase Auth
-- El campo role debe añadirse en raw_user_meta_data como {"role": "admin"}

-- Insertar lugares de ejemplo
INSERT INTO public.places (
  google_place_id,
  slug,
  name,
  category,
  rating,
  review_count,
  country,
  region,
  province,
  city,
  address,
  latitude,
  longitude,
  ai_description,
  published
) VALUES
(
  'ChIJ_example_1',
  'restaurante-el-pimpi-malaga',
  'Restaurante El Pimpi',
  'restaurante',
  4.8,
  12300,
  'España',
  'Andalucía',
  'Málaga',
  'Málaga',
  'Calle Granada, 62, 29015 Málaga',
  36.7213,
  -4.4214,
  'El Pimpi es un icónico restaurante ubicado en el corazón de Málaga, conocido por su auténtico ambiente andaluz y su excelente cocina tradicional.',
  true
),
(
  'ChIJ_example_2',
  'hotel-gran-melia-don-pepe-marbella',
  'Hotel Gran Meliá Don Pepe',
  'hotel',
  4.7,
  5400,
  'España',
  'Andalucía',
  'Málaga',
  'Marbella',
  'Calle José Meliá, s/n, 29602 Marbella',
  36.5087,
  -4.8844,
  'Hotel de lujo frente al mar en Marbella con servicios excepcionales y vistas espectaculares.',
  true
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que todo se ha creado correctamente
SELECT 'Tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

SELECT 'Indexes created:' as status;
SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

SELECT 'Storage buckets:' as status;
SELECT id, name FROM storage.buckets;

SELECT '✅ Setup completado correctamente!' as status;
