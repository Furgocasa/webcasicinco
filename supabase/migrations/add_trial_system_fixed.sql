-- Migración: Sistema de Trial de 30 días (SIN trigger en auth.users)
-- Fecha: 2025-10-13
-- Descripción: Funciones para trial + asignar trial a usuarios existentes

-- ============================================================================
-- 0. ELIMINAR FUNCIONES EXISTENTES (si existen)
-- ============================================================================

DROP FUNCTION IF EXISTS public.user_has_access(UUID);
DROP FUNCTION IF EXISTS public.get_trial_days_remaining(UUID);
DROP FUNCTION IF EXISTS public.set_user_as_free(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.assign_trial_to_user(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.assign_trial_to_user(UUID);

-- ============================================================================
-- 1. FUNCIÓN: Verificar si usuario tiene acceso
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  has_active_subscription BOOLEAN;
BEGIN
  -- Obtener info del usuario desde auth.users
  SELECT 
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'is_free_user' as is_free_user,
    raw_user_meta_data->>'trial_ends_at' as trial_ends_at
  INTO user_record
  FROM auth.users
  WHERE id = user_id;
  
  -- 1. Es admin?
  IF user_record.role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- 2. Marcado como free user?
  IF user_record.is_free_user = 'true' THEN
    RETURN TRUE;
  END IF;
  
  -- 3. Trial activo?
  IF user_record.trial_ends_at IS NOT NULL THEN
    IF (user_record.trial_ends_at::timestamp > NOW()) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- 4. Suscripción activa?
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions
    WHERE subscriptions.user_id = user_has_access.user_id
    AND status = 'active'
  ) INTO has_active_subscription;
  
  RETURN has_active_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.user_has_access IS 'Verifica si un usuario tiene acceso a funciones premium';

-- ============================================================================
-- 2. FUNCIÓN: Obtener días restantes de trial
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  trial_end_date TIMESTAMP;
  days_remaining INTEGER;
BEGIN
  SELECT (raw_user_meta_data->>'trial_ends_at')::timestamp
  INTO trial_end_date
  FROM auth.users
  WHERE id = user_id;
  
  IF trial_end_date IS NULL THEN
    RETURN 0;
  END IF;
  
  days_remaining := CEIL(EXTRACT(EPOCH FROM (trial_end_date - NOW())) / 86400);
  
  RETURN GREATEST(days_remaining, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_trial_days_remaining IS 'Calcula días restantes de trial para un usuario';

-- ============================================================================
-- 3. FUNCIÓN: Marcar usuario como gratis (admin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_user_as_free(
  target_user_id UUID,
  is_free BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Actualizar metadata del usuario
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_free_user}',
    to_jsonb(is_free)
  )
  WHERE id = target_user_id;
  
  RAISE NOTICE 'Usuario % marcado como free: %', target_user_id, is_free;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_user_as_free IS 'Marca un usuario como gratis (acceso perpetuo). Solo admin puede ejecutar.';

-- ============================================================================
-- 4. FUNCIÓN: Asignar trial a un usuario específico
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_trial_to_user(
  target_user_id UUID,
  days INTEGER DEFAULT 30
)
RETURNS VOID AS $$
BEGIN
  -- Asignar trial_ends_at al usuario
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{trial_ends_at}',
    to_jsonb((NOW() + (days || ' days')::INTERVAL)::text)
  )
  WHERE id = target_user_id;
  
  RAISE NOTICE 'Trial de % días asignado a usuario %', days, target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.assign_trial_to_user IS 'Asigna trial de N días a un usuario específico. Por defecto 30 días.';

-- ============================================================================
-- ✅ FUNCIONES CREADAS
-- ============================================================================

SELECT 
  '✅ Funciones de trial creadas correctamente' as mensaje,
  'Ahora ejecuta el siguiente bloque para dar trial a usuarios existentes' as siguiente_paso;

