-- ============================================================================
-- MIGRACIÓN: Sistema de Indexación Profesional
-- Fecha: 2025-10-14
-- Descripción: Añade control de procesos, logs en tiempo real, y sistema
--              de pausar/reanudar para hacer la indexación 100% profesional
-- ============================================================================

-- ============================================================================
-- PASO 1: Añadir nuevos estados al enum de status
-- ============================================================================

-- Primero eliminamos la constraint existente
ALTER TABLE indexation_jobs 
DROP CONSTRAINT IF EXISTS indexation_jobs_status_check;

-- Añadimos la nueva constraint con los estados adicionales: 'paused' y 'cancelled'
ALTER TABLE indexation_jobs
ADD CONSTRAINT indexation_jobs_status_check 
CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled'));

-- ============================================================================
-- PASO 2: Añadir nuevos campos para control de procesos
-- ============================================================================

-- Campo de control: indica si el proceso debe continuar ejecutándose
ALTER TABLE indexation_jobs 
ADD COLUMN IF NOT EXISTS should_continue BOOLEAN DEFAULT true;

-- Timestamp de cuándo se pausó el trabajo
ALTER TABLE indexation_jobs 
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP;

-- Array de logs en tiempo real (formato JSONB)
ALTER TABLE indexation_jobs 
ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]';

-- Comentarios en los nuevos campos
COMMENT ON COLUMN indexation_jobs.should_continue IS 'Control de ejecución: false detiene el proceso en la próxima iteración';
COMMENT ON COLUMN indexation_jobs.paused_at IS 'Timestamp de cuándo se pausó el trabajo (para poder reanudarlo)';
COMMENT ON COLUMN indexation_jobs.logs IS 'Array de logs en tiempo real: [{timestamp, level, message, details}]';

-- ============================================================================
-- PASO 3: Crear índices para mejorar el rendimiento
-- ============================================================================

-- Índice para buscar trabajos activos de un admin rápidamente
CREATE INDEX IF NOT EXISTS idx_jobs_admin_status 
ON indexation_jobs(admin_user_id, status) 
WHERE status IN ('running', 'paused');

-- Índice para buscar trabajos zombies
CREATE INDEX IF NOT EXISTS idx_jobs_zombie_detection
ON indexation_jobs(status, started_at)
WHERE status = 'running';

-- ============================================================================
-- PASO 4: Función para detectar y cancelar trabajos zombies
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_zombie_jobs()
RETURNS TABLE(cancelled_count INTEGER) AS $$
DECLARE
  zombie_count INTEGER;
BEGIN
  -- Actualizar trabajos que llevan más de 2 horas en "running" como zombies
  UPDATE indexation_jobs
  SET 
    status = 'failed',
    completed_at = NOW(),
    should_continue = false,
    error_log = COALESCE(error_log, '{}'::jsonb) || jsonb_build_object(
      'zombie', true,
      'reason', 'Trabajo zombie detectado - llevaba más de 2 horas ejecutándose',
      'cancelled_at', NOW()
    )
  WHERE status = 'running'
    AND started_at < NOW() - INTERVAL '2 hours';
  
  GET DIAGNOSTICS zombie_count = ROW_COUNT;
  
  RETURN QUERY SELECT zombie_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_zombie_jobs() IS 
'Detecta y cancela trabajos zombies (que llevan >2h en running). 
Retorna el número de trabajos cancelados.';

-- ============================================================================
-- PASO 5: Función para cancelar trabajos activos previos de un admin
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_previous_admin_jobs(admin_id UUID)
RETURNS TABLE(cancelled_count INTEGER) AS $$
DECLARE
  cancelled INTEGER;
BEGIN
  -- Cancelar trabajos en "running" o "pending" del admin
  UPDATE indexation_jobs
  SET 
    status = 'cancelled',
    completed_at = NOW(),
    should_continue = false,
    error_log = COALESCE(error_log, '{}'::jsonb) || jsonb_build_object(
      'cancelled', true,
      'reason', 'Nueva indexación iniciada por el administrador',
      'cancelled_at', NOW()
    )
  WHERE admin_user_id = admin_id
    AND status IN ('running', 'pending');
  
  GET DIAGNOSTICS cancelled = ROW_COUNT;
  
  RETURN QUERY SELECT cancelled;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_previous_admin_jobs(UUID) IS 
'Cancela todos los trabajos activos (running/pending) de un admin específico.
Se usa antes de iniciar una nueva indexación.';

-- ============================================================================
-- PASO 6: Función para añadir logs a un trabajo (más eficiente que desde Node)
-- ============================================================================

CREATE OR REPLACE FUNCTION add_job_log(
  job_id UUID,
  log_level TEXT,
  log_message TEXT,
  log_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE indexation_jobs
  SET logs = (
    -- Mantener solo los últimos 500 logs para no saturar la BD
    SELECT jsonb_agg(log_entry)
    FROM (
      SELECT log_entry
      FROM jsonb_array_elements(
        logs || jsonb_build_array(
          jsonb_build_object(
            'timestamp', NOW(),
            'level', log_level,
            'message', log_message,
            'details', log_details
          )
        )
      ) AS log_entry
      ORDER BY (log_entry->>'timestamp') DESC
      LIMIT 500
    ) AS limited_logs
  )
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_job_log(UUID, TEXT, TEXT, JSONB) IS 
'Añade un log a un trabajo de indexación. Mantiene solo los últimos 500 logs.
Niveles: info, success, warning, error';

-- ============================================================================
-- PASO 7: Vista para obtener trabajos activos con información detallada
-- ============================================================================

CREATE OR REPLACE VIEW active_indexation_jobs AS
SELECT 
  id,
  admin_user_id,
  status,
  search_params,
  total_places,
  processed_places,
  successful_places,
  failed_places,
  should_continue,
  ROUND((processed_places::NUMERIC / NULLIF(total_places, 0)) * 100, 1) as progress_percentage,
  EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER as seconds_running,
  CASE 
    WHEN total_places > 0 AND processed_places > 0 THEN
      ROUND(EXTRACT(EPOCH FROM (NOW() - started_at)) / processed_places * (total_places - processed_places))::INTEGER
    ELSE NULL
  END as estimated_seconds_remaining,
  started_at,
  paused_at,
  error_log,
  jsonb_array_length(logs) as log_count,
  created_at
FROM indexation_jobs
WHERE status IN ('running', 'paused')
ORDER BY started_at DESC;

COMMENT ON VIEW active_indexation_jobs IS 
'Vista con información detallada de trabajos activos, incluyendo progreso estimado';

-- ============================================================================
-- PASO 8: Limpiar trabajos zombies existentes (ejecutar ahora)
-- ============================================================================

-- Ejecutar la función para limpiar zombies actuales
SELECT cancel_zombie_jobs();

-- ============================================================================
-- PASO 9: Actualizar trabajos "running" existentes como zombies
-- ============================================================================

-- Marcar cualquier trabajo "running" actual como zombie
-- (asumimos que si se está ejecutando esta migración, no hay trabajos activos reales)
UPDATE indexation_jobs
SET 
  status = 'failed',
  completed_at = NOW(),
  should_continue = false,
  error_log = COALESCE(error_log, '{}'::jsonb) || jsonb_build_object(
    'zombie', true,
    'reason', 'Trabajo interrumpido por migración del sistema',
    'migration_date', NOW()
  )
WHERE status = 'running';

-- ============================================================================
-- PASO 10: Crear políticas RLS (Row Level Security) si no existen
-- ============================================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE indexation_jobs ENABLE ROW LEVEL SECURITY;

-- Política para que los admins solo vean sus propios trabajos
DROP POLICY IF EXISTS "Admins can view own jobs" ON indexation_jobs;
CREATE POLICY "Admins can view own jobs" 
ON indexation_jobs FOR SELECT 
USING (auth.uid() = admin_user_id);

-- Política para que los admins solo puedan actualizar sus propios trabajos
DROP POLICY IF EXISTS "Admins can update own jobs" ON indexation_jobs;
CREATE POLICY "Admins can update own jobs" 
ON indexation_jobs FOR UPDATE 
USING (auth.uid() = admin_user_id);

-- Política para que los admins puedan crear trabajos
DROP POLICY IF EXISTS "Admins can create jobs" ON indexation_jobs;
CREATE POLICY "Admins can create jobs" 
ON indexation_jobs FOR INSERT 
WITH CHECK (auth.uid() = admin_user_id);

-- Política para que los admins puedan eliminar sus propios trabajos
DROP POLICY IF EXISTS "Admins can delete own jobs" ON indexation_jobs;
CREATE POLICY "Admins can delete own jobs" 
ON indexation_jobs FOR DELETE 
USING (auth.uid() = admin_user_id);

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Mostrar resumen de la migración
DO $$
DECLARE
  zombie_count INTEGER;
  active_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM indexation_jobs;
  SELECT COUNT(*) INTO active_count FROM indexation_jobs WHERE status IN ('running', 'paused');
  SELECT COUNT(*) INTO zombie_count FROM indexation_jobs WHERE error_log->>'zombie' = 'true';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total de trabajos: %', total_count;
  RAISE NOTICE 'Trabajos activos: %', active_count;
  RAISE NOTICE 'Zombies limpiados: %', zombie_count;
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Nuevos campos añadidos:';
  RAISE NOTICE '  ✓ should_continue (control de ejecución)';
  RAISE NOTICE '  ✓ paused_at (timestamp de pausa)';
  RAISE NOTICE '  ✓ logs (logs en tiempo real)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Nuevos estados disponibles:';
  RAISE NOTICE '  ✓ paused (trabajo pausado)';
  RAISE NOTICE '  ✓ cancelled (trabajo cancelado)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✓ cancel_zombie_jobs()';
  RAISE NOTICE '  ✓ cancel_previous_admin_jobs(admin_id)';
  RAISE NOTICE '  ✓ add_job_log(job_id, level, message, details)';
  RAISE NOTICE '============================================';
END $$;

