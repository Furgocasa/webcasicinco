-- ============================================================================
-- SCRIPT DE CORRECCIÓN: Asignar trial a usuarios que no lo tienen
-- ============================================================================
-- Este script corrige el problema de usuarios que se registraron sin
-- que el trigger les asignara correctamente el periodo de trial de 30 días
-- ============================================================================

-- PASO 1: Ver usuarios afectados (sin trial en últimos 30 días)
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
  AND (raw_user_meta_data->>'trial_ends_at') IS NULL
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin'
  AND id NOT IN (
    SELECT user_id FROM public.subscriptions 
    WHERE status IN ('trialing', 'active')
  )
ORDER BY created_at DESC;

-- ============================================================================
-- PASO 2: APLICAR CORRECCIÓN
-- ============================================================================
-- IMPORTANTE: Revisa primero los resultados del PASO 1
-- Solo ejecuta esto si confirmas que esos usuarios deben tener trial

UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'trial_ends_at', (NOW() + INTERVAL '30 days')::text,
    'trial_started_at', NOW()::text,
    'is_trial_active', true
  )
WHERE 
  -- Solo usuarios recientes (últimos 30 días)
  created_at > NOW() - INTERVAL '30 days'
  -- Que NO tienen trial asignado
  AND (raw_user_meta_data->>'trial_ends_at') IS NULL
  -- Y NO tienen suscripción activa
  AND id NOT IN (
    SELECT user_id FROM public.subscriptions 
    WHERE status IN ('trialing', 'active')
  )
  -- Y NO son admins
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin';

-- ============================================================================
-- PASO 3: VERIFICAR RESULTADO
-- ============================================================================
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at,
  raw_user_meta_data->>'trial_started_at' as trial_started_at,
  -- Calcular días restantes
  CASE 
    WHEN (raw_user_meta_data->>'trial_ends_at') IS NULL THEN -1
    WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp < NOW() THEN 0
    ELSE CEIL(EXTRACT(EPOCH FROM ((raw_user_meta_data->>'trial_ends_at')::timestamp - NOW())) / 86400)
  END as dias_restantes
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin'
ORDER BY created_at DESC;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Todos los usuarios creados en los últimos 30 días (excepto admins)
-- deberían tener ahora:
-- - trial_ends_at: fecha 30 días desde ahora
-- - trial_started_at: fecha actual
-- - dias_restantes: 30 (aproximadamente)
-- ============================================================================

SELECT 
  '✅ Corrección aplicada. Usuarios afectados actualizados con 30 días de trial.' as mensaje;

