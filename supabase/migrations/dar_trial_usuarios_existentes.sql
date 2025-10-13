-- ============================================================================
-- DAR TRIAL DE 30 DÍAS A USUARIOS EXISTENTES
-- ============================================================================
-- IMPORTANTE: Este SQL debe ejecutarse desde el DASHBOARD de Supabase
-- con privilegios de service_role
-- ============================================================================

-- Ver usuarios actuales y su estado
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at,
  raw_user_meta_data->>'is_free_user' as is_free_user,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- EJECUTA ESTE UPDATE para dar trial a usuarios que no lo tienen:
-- ============================================================================
-- NOTA: Esto lo ejecutas MANUALMENTE desde Supabase Dashboard
--       Ve a: Settings → API → service_role key
--       Luego usa ese key en una query privilegiada
-- ============================================================================

-- Por ahora, usa la API de admin desde el código para asignar trial
-- O contacta con soporte de Supabase para ejecutar este UPDATE:

/*
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{trial_ends_at}',
  to_jsonb((NOW() + INTERVAL '30 days')::text)
)
WHERE 
  -- No tienen trial_ends_at
  (raw_user_meta_data->>'trial_ends_at') IS NULL
  -- No son admin
  AND COALESCE(raw_user_meta_data->>'role', 'user') != 'admin'
  -- No son free users
  AND COALESCE(raw_user_meta_data->>'is_free_user', 'false') != 'true';
*/

-- ============================================================================
-- ALTERNATIVA: Usar función assign_trial_to_user() que creamos
-- ============================================================================

-- Para cada usuario sin trial (copia sus IDs de la query anterior):

-- SELECT public.assign_trial_to_user('USUARIO_ID_1', 30);
-- SELECT public.assign_trial_to_user('USUARIO_ID_2', 30);
-- SELECT public.assign_trial_to_user('USUARIO_ID_3', 30);

-- ============================================================================
-- Verificar que funcionó:
-- ============================================================================

SELECT 
  email,
  raw_user_meta_data->>'trial_ends_at' as trial_termina,
  CASE
    WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp > NOW() 
    THEN 'Trial activo ✅'
    ELSE 'Trial expirado o sin trial ❌'
  END as estado
FROM auth.users
WHERE COALESCE(raw_user_meta_data->>'role', 'user') != 'admin'
ORDER BY created_at DESC;

