-- ============================================================================
-- CASI CINCO - ESTRUCTURA DE BASE DE DATOS PARA SUPABASE
-- ============================================================================
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA: places
-- ============================================================================
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_place_id VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  
  rating DECIMAL(2,1) NOT NULL,
  review_count INTEGER NOT NULL,
  
  country VARCHAR(100) NOT NULL DEFAULT 'España',
  region VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR(10),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  
  phone VARCHAR(50),
  website VARCHAR(500),
  price_level INTEGER,
  
  ai_description TEXT,
  ai_review_summary TEXT,
  ai_highlights JSONB,
  photos JSONB,
  google_maps_url VARCHAR(500),
  
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  
  indexed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_places_rating ON places(rating DESC);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_province ON places(province);
CREATE INDEX idx_places_published ON places(published);

-- ============================================================================
-- TABLA: indexation_jobs
-- ============================================================================
CREATE TABLE IF NOT EXISTS indexation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  search_params JSONB NOT NULL,
  total_places INTEGER DEFAULT 0,
  processed_places INTEGER DEFAULT 0,
  successful_places INTEGER DEFAULT 0,
  failed_places INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  error_log JSONB
);

CREATE INDEX idx_jobs_status ON indexation_jobs(status);
CREATE INDEX idx_jobs_admin ON indexation_jobs(admin_user_id);

-- ============================================================================
-- TABLA: user_favorites
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);

-- ============================================================================
-- FUNCIÓN: is_admin
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para places
CREATE POLICY "Anyone can view published places"
  ON places FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can view all places"
  ON places FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert places"
  ON places FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update places"
  ON places FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete places"
  ON places FOR DELETE
  USING (is_admin());

-- Políticas para indexation_jobs
CREATE POLICY "Admins can manage jobs"
  ON indexation_jobs FOR ALL
  USING (is_admin());

-- Políticas para user_favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);
