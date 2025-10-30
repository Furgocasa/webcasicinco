-- ============================================================================
-- SCRIPT RÁPIDO: Verificar y arreglar MI usuario
-- ============================================================================
-- Ejecuta esto en Supabase SQL Editor
-- ============================================================================

-- PASO 1: Ver tu estado actual
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at,
  raw_user_meta_data->>'is_free_user' as is_free_user,
  raw_user_meta_data->>'role' as role,
  -- Calcular días restantes
  CASE 
    WHEN (raw_user_meta_data->>'trial_ends_at') IS NULL THEN -999
    WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp < NOW() THEN 0
    ELSE CEIL(EXTRACT(EPOCH FROM ((raw_user_meta_data->>'trial_ends_at')::timestamp - NOW())) / 86400)
  END as dias_restantes
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- PASO 2: ARREGLAR (cambia 'TU_EMAIL@ejemplo.com' por tu email real)
-- ============================================================================

UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'trial_ends_at', (NOW() + INTERVAL '30 days')::text,
    'trial_started_at', NOW()::text,
    'is_trial_active', true
  )
WHERE 
  email = 'TU_EMAIL@ejemplo.com'  -- ⚠️ CAMBIAR ESTO
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin';

-- ============================================================================
-- PASO 3: VERIFICAR que se arregló
-- ============================================================================

SELECT 
  email,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at,
  CEIL(EXTRACT(EPOCH FROM ((raw_user_meta_data->>'trial_ends_at')::timestamp - NOW())) / 86400) as dias_restantes
FROM auth.users
WHERE email = 'TU_EMAIL@ejemplo.com';  -- ⚠️ CAMBIAR ESTO

-- Debería mostrar ~30 días restantes

