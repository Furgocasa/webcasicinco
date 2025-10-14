-- ========================================
-- TABLA: enrichment_jobs
-- ========================================
-- Tabla para hacer tracking del proceso de enriquecimiento con IA (FASE 2)

CREATE TABLE IF NOT EXISTS public.enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Estado del job
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  paused_at TIMESTAMP,
  
  -- Progreso
  total_places INTEGER DEFAULT 0,      -- Total de lugares a enriquecer
  processed_places INTEGER DEFAULT 0,   -- Lugares ya procesados
  successful_places INTEGER DEFAULT 0,  -- Enriquecidos correctamente
  failed_places INTEGER DEFAULT 0,      -- Errores técnicos
  discarded_by_ai INTEGER DEFAULT 0,    -- Descartados por IA (categoría incorrecta)
  
  -- Desglose de descartados por IA
  ai_discarded_reasons JSONB DEFAULT '{}'::jsonb,
  
  -- Log de errores
  error_log JSONB DEFAULT '{}'::jsonb,
  
  -- Configuración del job
  batch_size INTEGER DEFAULT 100,
  current_batch INTEGER DEFAULT 0,
  
  -- IDs procesados (para reanudar)
  processed_ids TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_admin ON enrichment_jobs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_status ON enrichment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_created ON enrichment_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver sus propios jobs
CREATE POLICY "Admins can view own enrichment jobs" ON enrichment_jobs
  FOR SELECT
  USING (auth.uid() = admin_user_id);

-- Admins pueden crear jobs
CREATE POLICY "Admins can create enrichment jobs" ON enrichment_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = admin_user_id);

-- Admins pueden actualizar sus jobs
CREATE POLICY "Admins can update own enrichment jobs" ON enrichment_jobs
  FOR UPDATE
  USING (auth.uid() = admin_user_id);

-- Admins pueden eliminar sus jobs
CREATE POLICY "Admins can delete own enrichment jobs" ON enrichment_jobs
  FOR DELETE
  USING (auth.uid() = admin_user_id);

-- ========================================
-- FUNCIÓN: get_enrichment_stats
-- ========================================
-- Obtiene estadísticas de enriquecimiento

CREATE OR REPLACE FUNCTION get_enrichment_stats()
RETURNS TABLE (
  total_pending BIGINT,
  total_processing BIGINT,
  total_completed BIGINT,
  total_failed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE enrichment_status = 'pending') as total_pending,
    COUNT(*) FILTER (WHERE enrichment_status = 'processing') as total_processing,
    COUNT(*) FILTER (WHERE enrichment_status = 'completed') as total_completed,
    COUNT(*) FILTER (WHERE enrichment_status = 'failed') as total_failed
  FROM places
  WHERE needs_enrichment = true OR enrichment_status != 'pending';
END;
$$ LANGUAGE plpgsql STABLE;

