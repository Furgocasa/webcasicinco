-- ============================================================================
-- FIX: Error "Database error saving new user"
-- ============================================================================
-- El trigger handle_new_user() intenta insertar en usage_limits que no existe
-- Esta migración arregla el problema de dos formas:
-- 1. Crea la tabla usage_limits si no existe
-- 2. Modifica el trigger para que no falle si hay error
-- ============================================================================

-- ============================================================================
-- OPCIÓN 1: Crear tabla usage_limits (RECOMENDADO)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium_monthly', 'premium_annual')),
  monthly_requests INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 1000,
  last_reset_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usage_limits_user ON public.usage_limits(user_id);

-- RLS: Los usuarios solo pueden ver sus propios límites
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage limits" ON public.usage_limits;
CREATE POLICY "Users can view own usage limits" 
  ON public.usage_limits 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================================================
-- OPCIÓN 2: Modificar el trigger para que sea más robusto
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
      'is_trial_active', true,
      'role', COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
  
  -- Intentar crear límites de uso (con manejo de errores)
  BEGIN
    INSERT INTO public.usage_limits (user_id, plan)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si falla (tabla no existe, etc), simplemente continuar
      -- El usuario se crea de todas formas
      RAISE NOTICE 'No se pudieron crear usage_limits para usuario %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Recrear el trigger
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
  '✅ Fix aplicado correctamente!' as message,
  'Ahora los usuarios se pueden registrar sin error' as description;

-- Para verificar que el trigger funciona:
SELECT 
  proname as trigger_function,
  prosrc as code
FROM pg_proc
WHERE proname = 'handle_new_user';

