-- Cancelar trabajo atascado b4e51f24
UPDATE indexation_jobs
SET status = 'failed',
    completed_at = NOW(),
    error_log = jsonb_build_object(
      'cancelled', true,
      'reason', 'Cancelado - esperando deploy de nuevo sistema'
    )
WHERE id = 'b4e51f24-e40a-415c-8865-b2bf5bea823e'
  AND status = 'running';

-- Verificar
SELECT id, status, total_places, processed_places, successful_places
FROM indexation_jobs
WHERE id = 'b4e51f24-e40a-415c-8865-b2bf5bea823e';

