-- ============================================================================
-- CASI CINCO - SISTEMA DE TRIAL SIN TARJETA (30 DÍAS)
-- ============================================================================
-- Este script añade el sistema de trial de 30 días sin tarjeta
-- El trial se registra en raw_user_meta_data de auth.users
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: handle_new_user
-- Trigger que se ejecuta cuando un usuario se registra
-- Asigna automáticamente 30 días de trial sin tarjeta
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular fecha de fin del trial (30 días desde ahora)
  NEW.raw_user_meta_data = 
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'trial_ends_at', (NOW() + INTERVAL '30 days')::text,
      'trial_started_at', NOW()::text,
      'is_trial_active', true
    );
  
  -- Crear límites de uso iniciales para el usuario
  INSERT INTO public.usage_limits (user_id, plan)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: on_auth_user_created
-- Se ejecuta ANTES de que se cree un usuario en auth.users
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCIÓN: check_trial_expired
-- Verifica si el trial del usuario ha expirado
-- ============================================================================
DROP FUNCTION IF EXISTS public.check_trial_expired(UUID);

CREATE OR REPLACE FUNCTION public.check_trial_expired(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_end_date TIMESTAMP;
  has_subscription BOOLEAN;
  is_free_user BOOLEAN;
BEGIN
  -- Verificar si tiene suscripción activa
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND status IN ('trialing', 'active')
  ) INTO has_subscription;
  
  -- Si tiene suscripción, no está expirado
  IF has_subscription THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si es usuario free (sin trial)
  SELECT (raw_user_meta_data->>'is_free_user')::boolean
  INTO is_free_user
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Si es usuario free, no tiene trial
  IF is_free_user THEN
    RETURN FALSE;
  END IF;
  
  -- Obtener fecha de fin del trial
  SELECT (raw_user_meta_data->>'trial_ends_at')::timestamp
  INTO trial_end_date
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Si no hay fecha de trial, asumimos que no está expirado (usuario antiguo)
  IF trial_end_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si el trial ha expirado
  RETURN trial_end_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: get_trial_days_remaining
-- Obtiene los días restantes del trial del usuario
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_trial_days_remaining(UUID);

CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  trial_end_date TIMESTAMP;
  days_remaining INTEGER;
BEGIN
  -- Obtener fecha de fin del trial
  SELECT (raw_user_meta_data->>'trial_ends_at')::timestamp
  INTO trial_end_date
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Si no hay trial, devolver -1
  IF trial_end_date IS NULL THEN
    RETURN -1;
  END IF;
  
  -- Si ya expiró, devolver 0
  IF trial_end_date < NOW() THEN
    RETURN 0;
  END IF;
  
  -- Calcular días restantes (usar EPOCH para obtener segundos totales)
  days_remaining := CEIL(EXTRACT(EPOCH FROM (trial_end_date - NOW())) / 86400)::INTEGER;
  
  RETURN days_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ACTUALIZACIÓN: Actualizar función get_user_plan
-- Incluir verificación de trial
-- ============================================================================
DROP FUNCTION IF EXISTS get_user_plan(UUID);

CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS subscription_plan AS $$
DECLARE
  user_plan subscription_plan;
  trial_expired BOOLEAN;
BEGIN
  -- Verificar si tiene suscripción activa
  SELECT plan INTO user_plan
  FROM subscriptions
  WHERE user_id = user_uuid
    AND status IN ('trialing', 'active')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si tiene suscripción, devolverla
  IF user_plan IS NOT NULL THEN
    RETURN user_plan;
  END IF;
  
  -- Verificar si el trial ha expirado
  trial_expired := public.check_trial_expired(user_uuid);
  
  -- Si el trial no ha expirado, considerar como premium_monthly
  -- (acceso completo durante el trial)
  IF NOT trial_expired THEN
    RETURN 'premium_monthly'::subscription_plan;
  END IF;
  
  -- Si llegamos aquí, el trial expiró y no tiene suscripción
  RETURN 'free'::subscription_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISOS
-- ============================================================================

-- Permitir a usuarios autenticados verificar su propio trial
GRANT EXECUTE ON FUNCTION public.check_trial_expired(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trial_days_remaining(UUID) TO authenticated;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger que asigna 30 días de trial sin tarjeta a nuevos usuarios';

COMMENT ON FUNCTION public.check_trial_expired(UUID) IS 
  'Verifica si el trial del usuario ha expirado';

COMMENT ON FUNCTION public.get_trial_days_remaining(UUID) IS 
  'Obtiene los días restantes del trial (0 si expiró, -1 si no tiene trial)';

-- ============================================================================
-- APLICAR TRIAL A USUARIOS EXISTENTES (OPCIONAL)
-- ============================================================================
-- Descomentar si quieres aplicar el trial a usuarios que ya existen:

/*
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'trial_ends_at', (NOW() + INTERVAL '30 days')::text,
    'trial_started_at', NOW()::text,
    'is_trial_active', true
  )
WHERE 
  -- Solo usuarios que NO tienen suscripción activa
  id NOT IN (
    SELECT user_id FROM public.subscriptions 
    WHERE status IN ('trialing', 'active')
  )
  -- Y que NO tienen trial ya asignado
  AND (raw_user_meta_data->>'trial_ends_at') IS NULL;
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

SELECT '✅ Sistema de trial sin tarjeta configurado correctamente!' as message;

