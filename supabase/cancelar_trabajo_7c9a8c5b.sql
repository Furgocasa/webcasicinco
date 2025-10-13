-- Cancelar el trabajo específico que está corriendo
UPDATE indexation_jobs
SET status = 'failed',
    completed_at = NOW(),
    error_log = jsonb_build_object(
      'cancelled', true,
      'reason', 'Cancelado manualmente por el administrador',
      'processed', processed_places,
      'successful', successful_places,
      'at_cancellation', NOW()
    )
WHERE id = '7c9a8c5b-02b8-4b77-abef-d6a0b8c21746'
  AND status = 'running';

-- Verificar
SELECT id, status, total_places, processed_places, successful_places, error_log
FROM indexation_jobs
WHERE id = '7c9a8c5b-02b8-4b77-abef-d6a0b8c21746';

