-- ============================================
-- TABLA PARA CACHEAR BÚSQUEDAS DE GOOGLE PLACES
-- ============================================
-- Propósito: Evitar llamadas duplicadas a Google Places API
-- Ahorro estimado: ~90% en re-indexaciones
-- Fecha: 17 de Octubre 2025

-- Crear tabla de caché
CREATE TABLE IF NOT EXISTS search_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Query de búsqueda (key única para caché)
  search_query TEXT NOT NULL,
  province TEXT,
  city TEXT,
  category TEXT,
  
  -- Resultados cacheados
  place_ids JSONB NOT NULL, -- Array de place_ids encontrados
  result_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice único para evitar duplicados
  UNIQUE(search_query)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_province ON search_cache(province);
CREATE INDEX IF NOT EXISTS idx_search_cache_category ON search_cache(category);
CREATE INDEX IF NOT EXISTS idx_search_cache_last_used ON search_cache(last_used_at DESC);

-- Función para limpiar caché expirado (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION clean_expired_search_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM search_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar last_used_at automáticamente
CREATE OR REPLACE FUNCTION update_search_cache_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_used_at en cada lectura
CREATE TRIGGER trigger_update_search_cache_last_used
  BEFORE UPDATE ON search_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_search_cache_last_used();

-- Comentarios
COMMENT ON TABLE search_cache IS 'Caché de resultados de búsquedas de Google Places API para reducir costes';
COMMENT ON COLUMN search_cache.search_query IS 'Key única formada por: query|lat|lng|radius|type';
COMMENT ON COLUMN search_cache.place_ids IS 'Array JSON de place_ids retornados por Google';
COMMENT ON COLUMN search_cache.expires_at IS 'Fecha de expiración (30 días por defecto)';
COMMENT ON COLUMN search_cache.last_used_at IS 'Última vez que se usó este caché (para estadísticas)';

