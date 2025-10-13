-- ============================================================================
-- CASI CINCO - MIGRACIÓN: Sistema de Trial de 30 días y Usuarios Gratis
-- ============================================================================
-- Fecha: 12 de Octubre de 2025
-- Versión: BETA 4.0
-- ============================================================================

-- ============================================================================
-- 1. AÑADIR COLUMNAS A AUTH.USERS (via metadata)
-- ============================================================================
-- Los usuarios tendrán en su raw_user_meta_data:
-- - role: 'admin' | 'user'
-- - is_free_user: true/false (marcado por admin para acceso gratis perpetuo)
-- - trial_ends_at: timestamp (30 días desde registro para nuevos usuarios)

-- ============================================================================
-- 2. FUNCIÓN: Inicializar Trial de 30 días al registrarse
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular fecha de fin del trial (30 días desde hoy)
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{trial_ends_at}',
    to_jsonb(NOW() + INTERVAL '30 days')
  );
  
  -- Establecer is_free_user como false por defecto
  NEW.raw_user_meta_data = jsonb_set(
    NEW.raw_user_meta_data,
    '{is_free_user}',
    'false'::jsonb
  );
  
  -- Role por defecto: 'user'
  NEW.raw_user_meta_data = jsonb_set(
    NEW.raw_user_meta_data,
    '{role}',
    '"user"'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. TRIGGER: Aplicar trial automáticamente al crear usuario
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. FUNCIÓN: Verificar si usuario tiene acceso (admin, free o suscripción activa)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_has_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_free BOOLEAN;
  trial_end TIMESTAMP;
  has_active_subscription BOOLEAN;
BEGIN
  -- Obtener datos del usuario
  SELECT 
    raw_user_meta_data->>'role',
    COALESCE((raw_user_meta_data->>'is_free_user')::boolean, false),
    (raw_user_meta_data->>'trial_ends_at')::timestamp
  INTO user_role, is_free, trial_end
  FROM auth.users
  WHERE id = user_uuid;
  
  -- 1. Si es admin, acceso total
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- 2. Si está marcado como usuario gratis, acceso total
  IF is_free = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- 3. Si está en período de trial (30 días), acceso total
  IF trial_end IS NOT NULL AND NOW() < trial_end THEN
    RETURN TRUE;
  END IF;
  
  -- 4. Si tiene suscripción activa, acceso total
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND plan IN ('premium_monthly', 'premium_yearly', 'admin_monthly')
  ) INTO has_active_subscription;
  
  IF has_active_subscription THEN
    RETURN TRUE;
  END IF;
  
  -- 5. En cualquier otro caso, NO tiene acceso
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FUNCIÓN: Verificar días restantes de trial
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  trial_end TIMESTAMP;
  days_remaining INTEGER;
BEGIN
  SELECT (raw_user_meta_data->>'trial_ends_at')::timestamp
  INTO trial_end
  FROM auth.users
  WHERE id = user_uuid;
  
  IF trial_end IS NULL THEN
    RETURN 0;
  END IF;
  
  days_remaining := EXTRACT(DAY FROM (trial_end - NOW()));
  
  IF days_remaining < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN days_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FUNCIÓN: Marcar usuario como gratis (solo admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_user_as_free(target_user_id UUID, is_free BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Verificar que quien ejecuta es admin
  SELECT raw_user_meta_data->>'role'
  INTO admin_role
  FROM auth.users
  WHERE id = auth.uid();
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Solo administradores pueden marcar usuarios como gratis';
  END IF;
  
  -- Actualizar el usuario
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_free_user}',
    to_jsonb(is_free)
  )
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. VISTA: user_access_info
-- Vista práctica para ver el estado de acceso de cada usuario
-- ============================================================================
CREATE OR REPLACE VIEW public.user_access_info AS
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as role,
  COALESCE((u.raw_user_meta_data->>'is_free_user')::boolean, false) as is_free_user,
  (u.raw_user_meta_data->>'trial_ends_at')::timestamp as trial_ends_at,
  CASE 
    WHEN (u.raw_user_meta_data->>'trial_ends_at')::timestamp > NOW() 
    THEN EXTRACT(DAY FROM ((u.raw_user_meta_data->>'trial_ends_at')::timestamp - NOW()))::integer
    ELSE 0
  END as trial_days_remaining,
  s.plan as subscription_plan,
  s.status as subscription_status,
  s.current_period_end as subscription_ends_at,
  public.user_has_access(u.id) as has_access,
  u.created_at as registered_at
FROM auth.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status = 'active';

-- ============================================================================
-- 8. ACTUALIZAR USUARIOS EXISTENTES
-- ============================================================================
-- Añadir trial de 30 días a usuarios existentes que no lo tengan
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{trial_ends_at}',
  to_jsonb(NOW() + INTERVAL '30 days')
)
WHERE raw_user_meta_data->>'trial_ends_at' IS NULL
AND raw_user_meta_data->>'role' != 'admin';

-- Establecer is_free_user como false para usuarios existentes
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_free_user}',
  'false'::jsonb
)
WHERE raw_user_meta_data->>'is_free_user' IS NULL;

-- ============================================================================
-- LISTO: Ahora el sistema tiene:
-- ============================================================================
-- ✅ Trial de 30 días automático para nuevos usuarios
-- ✅ Función para marcar usuarios como gratis (solo admin)
-- ✅ Función para verificar si un usuario tiene acceso
-- ✅ Función para obtener días restantes de trial
-- ✅ Vista práctica para ver estado de todos los usuarios
-- ============================================================================

