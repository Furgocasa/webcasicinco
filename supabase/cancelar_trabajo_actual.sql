-- ========================================
-- CANCELAR TRABAJO DE INDEXACIÓN ACTUAL
-- ========================================

-- 1. Ver trabajos en ejecución
SELECT id, status, total_places, processed_places, successful_places, failed_places, created_at
FROM indexation_jobs
WHERE status = 'running'
ORDER BY created_at DESC;

-- 2. Cancelar TODOS los trabajos en ejecución
UPDATE indexation_jobs
SET status = 'cancelled',
    completed_at = NOW()
WHERE status = 'running';

-- 3. Verificar que se cancelaron
SELECT COUNT(*) as trabajos_running FROM indexation_jobs WHERE status = 'running';

-- Debe retornar 0

