-- ============================================================================
-- FIX: Usuarios OAuth sin metadata correcta
-- ============================================================================
-- Este script arregla usuarios que se registraron con Google OAuth y
-- pueden tener metadata incompleta o problemas de autenticación
-- ============================================================================

-- ============================================================================
-- 1. DIAGNÓSTICO: Ver usuarios con problemas potenciales
-- ============================================================================

-- Ver todos los usuarios OAuth (Google)
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'provider' as provider,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at,
  raw_user_meta_data->>'is_trial_active' as is_trial_active,
  raw_user_meta_data->>'is_free_user' as is_free_user
FROM auth.users
WHERE 
  -- Usuarios OAuth (Google)
  (raw_user_meta_data->>'provider' = 'google' 
   OR raw_user_meta_data->>'iss' LIKE '%google%')
ORDER BY created_at DESC;

-- ============================================================================
-- 2. FIX: Asegurar que TODOS los usuarios OAuth tengan metadata completa
-- ============================================================================

-- Actualizar usuarios OAuth sin trial configurado
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'role', COALESCE(raw_user_meta_data->>'role', 'user'),
    'trial_ends_at', COALESCE(
      raw_user_meta_data->>'trial_ends_at',
      (NOW() + INTERVAL '30 days')::text
    ),
    'trial_started_at', COALESCE(
      raw_user_meta_data->>'trial_started_at',
      NOW()::text
    ),
    'is_trial_active', COALESCE(
      (raw_user_meta_data->>'is_trial_active')::boolean,
      true
    ),
    'is_free_user', COALESCE(
      (raw_user_meta_data->>'is_free_user')::boolean,
      false
    )
  )
WHERE 
  -- Solo usuarios OAuth
  (raw_user_meta_data->>'provider' = 'google' 
   OR raw_user_meta_data->>'iss' LIKE '%google%')
  AND (
    -- Sin trial configurado
    (raw_user_meta_data->>'trial_ends_at') IS NULL
    OR
    -- Sin role configurado
    (raw_user_meta_data->>'role') IS NULL
    OR
    -- Sin is_trial_active configurado
    (raw_user_meta_data->>'is_trial_active') IS NULL
  );

-- ============================================================================
-- 3. FIX: Crear usage_limits para usuarios OAuth que no lo tengan
-- ============================================================================

INSERT INTO public.usage_limits (user_id, plan, monthly_requests, monthly_limit)
SELECT 
  u.id,
  'free',
  0,
  1000
FROM auth.users u
WHERE 
  -- Solo usuarios OAuth
  (u.raw_user_meta_data->>'provider' = 'google' 
   OR u.raw_user_meta_data->>'iss' LIKE '%google%')
  AND
  -- Que NO tengan usage_limits
  u.id NOT IN (SELECT user_id FROM public.usage_limits)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 4. FIX: Limpiar usuarios con sesiones corruptas (opcional)
-- ============================================================================

-- Si hay usuarios con múltiples sesiones o sesiones viejas problemáticas,
-- este comando las limpia (el usuario tendrá que hacer login de nuevo)

-- DESCOMENTAR SOLO SI ES NECESARIO:
/*
-- Ver sesiones actuales
SELECT 
  u.id,
  u.email,
  s.created_at,
  s.updated_at,
  s.expires_at,
  s.user_agent
FROM auth.users u
LEFT JOIN auth.sessions s ON s.user_id = u.id
WHERE 
  (u.raw_user_meta_data->>'provider' = 'google' 
   OR u.raw_user_meta_data->>'iss' LIKE '%google%')
ORDER BY s.updated_at DESC;

-- Eliminar sesiones expiradas o viejas (más de 7 días sin actualizar)
DELETE FROM auth.sessions
WHERE 
  expires_at < NOW()
  OR
  updated_at < (NOW() - INTERVAL '7 days');
*/

-- ============================================================================
-- 5. VERIFICACIÓN FINAL
-- ============================================================================

-- Contar usuarios OAuth con metadata correcta
SELECT 
  COUNT(*) as total_oauth_users,
  COUNT(CASE WHEN raw_user_meta_data->>'trial_ends_at' IS NOT NULL THEN 1 END) as with_trial,
  COUNT(CASE WHEN raw_user_meta_data->>'role' IS NOT NULL THEN 1 END) as with_role,
  COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM public.usage_limits ul WHERE ul.user_id = auth.users.id
  ) THEN 1 END) as with_usage_limits
FROM auth.users
WHERE 
  (raw_user_meta_data->>'provider' = 'google' 
   OR raw_user_meta_data->>'iss' LIKE '%google%');

-- Ver usuarios OAuth con metadata completa
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at,
  raw_user_meta_data->>'is_trial_active' as is_trial_active,
  CASE 
    WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp > NOW() THEN 'Trial Activo'
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.user_id = auth.users.id AND s.status = 'active'
    ) THEN 'Suscripción Activa'
    ELSE 'Trial Expirado'
  END as status,
  EXISTS (
    SELECT 1 FROM public.usage_limits ul WHERE ul.user_id = auth.users.id
  ) as has_usage_limits
FROM auth.users
WHERE 
  (raw_user_meta_data->>'provider' = 'google' 
   OR raw_user_meta_data->>'iss' LIKE '%google%')
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- 6. ESTADÍSTICAS FINALES
-- ============================================================================

SELECT '✅ Fix completado para usuarios OAuth!' as message;

SELECT 
  'Usuarios OAuth procesados' as description,
  COUNT(*) as count
FROM auth.users
WHERE 
  (raw_user_meta_data->>'provider' = 'google' 
   OR raw_user_meta_data->>'iss' LIKE '%google%');

SELECT 
  'Usuarios con trial configurado' as description,
  COUNT(*) as count
FROM auth.users
WHERE 
  (raw_user_meta_data->>'provider' = 'google' 
   OR raw_user_meta_data->>'iss' LIKE '%google%')
  AND raw_user_meta_data->>'trial_ends_at' IS NOT NULL;

SELECT 
  'Usuarios con usage_limits' as description,
  COUNT(*) as count
FROM auth.users u
WHERE 
  (u.raw_user_meta_data->>'provider' = 'google' 
   OR u.raw_user_meta_data->>'iss' LIKE '%google%')
  AND EXISTS (
    SELECT 1 FROM public.usage_limits ul WHERE ul.user_id = u.id
  );

-- ============================================================================
-- NOTA IMPORTANTE
-- ============================================================================
-- Después de ejecutar este script:
-- 1. Los usuarios OAuth existentes tendrán metadata correcta
-- 2. Los nuevos usuarios OAuth se crearán con metadata correcta (trigger)
-- 3. El fix de .maybeSingle() evitará el error 406
-- 4. No más logouts automáticos
-- ============================================================================

