-- ============================================================================
-- VERIFICACIÓN: ¿Está funcionando el trigger de trial?
-- ============================================================================
-- Este script verifica si el trigger on_auth_user_created está funcionando
-- correctamente y asignando trial a nuevos usuarios
-- ============================================================================

-- PASO 1: Verificar que el trigger existe y está habilitado
SELECT 
  t.tgname as nombre_trigger,
  CASE 
    WHEN t.tgenabled = 'O' THEN '✅ Activo'
    WHEN t.tgenabled = 'D' THEN '❌ Deshabilitado'
    ELSE '⚠️ Estado desconocido'
  END as estado,
  p.proname as funcion_asociada,
  pg_get_triggerdef(t.oid) as definicion
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- PASO 2: Ver código de la función
SELECT 
  p.proname as nombre_funcion,
  pg_get_functiondef(p.oid) as codigo_funcion
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- PASO 3: Estadísticas de usuarios por estado de trial
SELECT 
  CASE 
    WHEN raw_user_meta_data->>'role' = 'admin' THEN '🔧 Admin'
    WHEN (raw_user_meta_data->>'trial_ends_at') IS NULL THEN '❌ Sin trial asignado'
    WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp < NOW() THEN '⏰ Trial expirado'
    WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp >= NOW() THEN '✅ Trial activo'
  END as estado_trial,
  COUNT(*) as cantidad_usuarios
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY estado_trial
ORDER BY 
  CASE 
    WHEN CASE 
      WHEN raw_user_meta_data->>'role' = 'admin' THEN '🔧 Admin'
      WHEN (raw_user_meta_data->>'trial_ends_at') IS NULL THEN '❌ Sin trial asignado'
      WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp < NOW() THEN '⏰ Trial expirado'
      WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp >= NOW() THEN '✅ Trial activo'
    END = '❌ Sin trial asignado' THEN 1
    WHEN CASE 
      WHEN raw_user_meta_data->>'role' = 'admin' THEN '🔧 Admin'
      WHEN (raw_user_meta_data->>'trial_ends_at') IS NULL THEN '❌ Sin trial asignado'
      WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp < NOW() THEN '⏰ Trial expirado'
      WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp >= NOW() THEN '✅ Trial activo'
    END = '⏰ Trial expirado' THEN 2
    WHEN CASE 
      WHEN raw_user_meta_data->>'role' = 'admin' THEN '🔧 Admin'
      WHEN (raw_user_meta_data->>'trial_ends_at') IS NULL THEN '❌ Sin trial asignado'
      WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp < NOW() THEN '⏰ Trial expirado'
      WHEN (raw_user_meta_data->>'trial_ends_at')::timestamp >= NOW() THEN '✅ Trial activo'
    END = '✅ Trial activo' THEN 3
    ELSE 4
  END;

-- PASO 4: Detalles de usuarios sin trial (últimos 7 días)
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at,
  raw_user_meta_data->>'provider' as proveedor_auth,
  raw_user_meta_data->>'role' as rol
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
  AND (raw_user_meta_data->>'trial_ends_at') IS NULL
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin'
ORDER BY created_at DESC;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================================================
-- Si el trigger está funcionando correctamente:
-- - Estado debe ser "✅ Activo"
-- - Usuarios nuevos (últimos días) deben tener "✅ Trial activo"
-- - NO debería haber usuarios en "❌ Sin trial asignado" (salvo admins)
--
-- Si hay usuarios sin trial:
-- - El trigger puede estar deshabilitado
-- - La función handle_new_user puede tener errores
-- - Puede haber problemas de permisos en la BD
-- ============================================================================












