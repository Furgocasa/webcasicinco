-- ========================================
-- MIGRACIÓN ESENCIAL: Campo progress_state
-- ========================================
-- Ejecutar SOLO esta parte en Supabase Dashboard > SQL Editor

-- Agregar campo progress_state para guardar el progreso de indexación
ALTER TABLE indexation_jobs 
ADD COLUMN IF NOT EXISTS progress_state JSONB DEFAULT '{}';

-- Comentario explicativo
COMMENT ON COLUMN indexation_jobs.progress_state IS 'Estado del progreso de indexación para permitir reanudación desde donde se quedó';

-- Índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_indexation_jobs_progress_state 
ON indexation_jobs USING GIN (progress_state);

-- Verificar que se aplicó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'indexation_jobs' 
  AND column_name = 'progress_state';
