-- ============================================================================
-- ACTUALIZACIÓN: Sistema de Indexación Profesional
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Abre Supabase Dashboard → SQL Editor
-- 2. Copia y pega este script completo
-- 3. Ejecuta (Run)
-- 4. Verifica que aparezca el mensaje de éxito al final
-- ============================================================================

-- PASO 1: Actualizar enum de status
ALTER TABLE indexation_jobs DROP CONSTRAINT IF EXISTS indexation_jobs_status_check;
ALTER TABLE indexation_jobs ADD CONSTRAINT indexation_jobs_status_check 
CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled'));

-- PASO 2: Añadir campos de control
ALTER TABLE indexation_jobs ADD COLUMN IF NOT EXISTS should_continue BOOLEAN DEFAULT true;
ALTER TABLE indexation_jobs ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP;
ALTER TABLE indexation_jobs ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]';

-- PASO 3: Añadir índices
CREATE INDEX IF NOT EXISTS idx_jobs_admin_status ON indexation_jobs(admin_user_id, status) WHERE status IN ('running', 'paused');
CREATE INDEX IF NOT EXISTS idx_jobs_zombie_detection ON indexation_jobs(status, started_at) WHERE status = 'running';

-- PASO 4: Función para cancelar zombies
CREATE OR REPLACE FUNCTION cancel_zombie_jobs()
RETURNS TABLE(cancelled_count INTEGER) AS $$
DECLARE
  zombie_count INTEGER;
BEGIN
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

-- PASO 5: Función para cancelar trabajos previos
CREATE OR REPLACE FUNCTION cancel_previous_admin_jobs(admin_id UUID)
RETURNS TABLE(cancelled_count INTEGER) AS $$
DECLARE
  cancelled INTEGER;
BEGIN
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

-- PASO 6: Función para añadir logs
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

-- PASO 7: Crear vista de trabajos activos
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

-- PASO 8: Limpiar zombies existentes
SELECT cancel_zombie_jobs();

-- PASO 9: Marcar trabajos "running" como zombies
UPDATE indexation_jobs
SET 
  status = 'failed',
  completed_at = NOW(),
  should_continue = false,
  error_log = COALESCE(error_log, '{}'::jsonb) || jsonb_build_object(
    'zombie', true,
    'reason', 'Trabajo interrumpido por actualización del sistema',
    'migration_date', NOW()
  )
WHERE status = 'running';

-- PASO 10: Habilitar RLS
ALTER TABLE indexation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view own jobs" ON indexation_jobs;
CREATE POLICY "Admins can view own jobs" ON indexation_jobs FOR SELECT USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "Admins can update own jobs" ON indexation_jobs;
CREATE POLICY "Admins can update own jobs" ON indexation_jobs FOR UPDATE USING (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "Admins can create jobs" ON indexation_jobs;
CREATE POLICY "Admins can create jobs" ON indexation_jobs FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

DROP POLICY IF EXISTS "Admins can delete own jobs" ON indexation_jobs;
CREATE POLICY "Admins can delete own jobs" ON indexation_jobs FOR DELETE USING (auth.uid() = admin_user_id);

-- ============================================================================
-- VERIFICACIÓN Y RESUMEN
-- ============================================================================

DO $$
DECLARE
  total_jobs INTEGER;
  active_jobs INTEGER;
  zombie_jobs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_jobs FROM indexation_jobs;
  SELECT COUNT(*) INTO active_jobs FROM indexation_jobs WHERE status IN ('running', 'paused');
  SELECT COUNT(*) INTO zombie_jobs FROM indexation_jobs WHERE error_log->>'zombie' = 'true';
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMEN:';
  RAISE NOTICE '  ✓ Total de trabajos: %', total_jobs;
  RAISE NOTICE '  ✓ Trabajos activos: %', active_jobs;
  RAISE NOTICE '  ✓ Zombies limpiados: %', zombie_jobs;
  RAISE NOTICE '';
  RAISE NOTICE '🆕 NUEVAS FUNCIONALIDADES:';
  RAISE NOTICE '  ✓ should_continue - Control de ejecución';
  RAISE NOTICE '  ✓ paused_at - Timestamp de pausa';
  RAISE NOTICE '  ✓ logs - Logs en tiempo real (JSONB)';
  RAISE NOTICE '  ✓ Estados: paused, cancelled';
  RAISE NOTICE '  ✓ Funciones: cancel_zombie_jobs()';
  RAISE NOTICE '  ✓ Funciones: cancel_previous_admin_jobs()';
  RAISE NOTICE '  ✓ Funciones: add_job_log()';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 PUEDES CONTINUAR CON EL DESARROLLO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

