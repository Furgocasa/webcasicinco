-- ========================================
-- LIMPIAR TRABAJOS ZOMBIES (atascados en "running")
-- ========================================

-- PASO 1: Ver TODOS los trabajos "running"
SELECT id, status, total_places, processed_places, successful_places, 
       created_at, started_at,
       EXTRACT(EPOCH FROM (NOW() - started_at))/60 as minutos_corriendo
FROM indexation_jobs
WHERE status = 'running'
ORDER BY created_at DESC;

-- PASO 2: Marcar TODOS los "running" como "failed" (son zombies)
-- ⚠️ Esto cancelará TODOS los trabajos que digan "En proceso"
UPDATE indexation_jobs
SET status = 'failed',
    completed_at = NOW(),
    error_log = jsonb_build_object(
      'cancelled', true,
      'reason', 'Trabajo zombie - cancelado automáticamente al implementar nuevo sistema',
      'was_at', jsonb_build_object(
        'total', total_places,
        'processed', processed_places,
        'successful', successful_places
      )
    )
WHERE status = 'running';

-- PASO 3: Verificar que NO queda ninguno en "running"
SELECT COUNT(*) as trabajos_running
FROM indexation_jobs
WHERE status = 'running';

-- Debe retornar 0

-- PASO 4: Ver resumen de todos los trabajos
SELECT 
  status,
  COUNT(*) as total,
  SUM(successful_places) as total_lugares_guardados
FROM indexation_jobs
GROUP BY status
ORDER BY status;

-- PASO 5 (OPCIONAL): Borrar trabajos fallidos/cancelados viejos
-- Descomenta si quieres limpiar el historial:
-- DELETE FROM indexation_jobs
-- WHERE status IN ('failed', 'pending')
--   AND created_at < NOW() - INTERVAL '1 day';

