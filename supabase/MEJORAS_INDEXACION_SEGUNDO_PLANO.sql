-- ========================================
-- MEJORAS PARA INDEXACIÓN EN SEGUNDO PLANO
-- ========================================
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Agregar campo progress_state para guardar el progreso de indexación
-- Esto permite reanudar trabajos desde donde se quedaron
ALTER TABLE indexation_jobs 
ADD COLUMN IF NOT EXISTS progress_state JSONB DEFAULT '{}';

-- Comentario explicativo
COMMENT ON COLUMN indexation_jobs.progress_state IS 'Estado del progreso de indexación para permitir reanudación desde donde se quedó. Formato: {"province_Almería": "completed", "province_Almería_restaurante": "completed", "province_Almería_restaurante_city_Almería": "completed"}';

-- Índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_indexation_jobs_progress_state 
ON indexation_jobs USING GIN (progress_state);

-- 2. Verificar que la migración se aplicó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'indexation_jobs' 
  AND column_name = 'progress_state';

-- 3. Mostrar estructura actualizada de la tabla
\d indexation_jobs;
