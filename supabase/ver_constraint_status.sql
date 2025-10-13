-- Ver la constraint de status en indexation_jobs
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'indexation_jobs'::regclass 
  AND conname LIKE '%status%';

-- Ver todos los status actuales en uso
SELECT DISTINCT status 
FROM indexation_jobs 
ORDER BY status;

-- Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'indexation_jobs'
  AND column_name = 'status';

