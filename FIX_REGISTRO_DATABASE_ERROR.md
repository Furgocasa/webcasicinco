# 🔧 FIX: Error "Database error saving new user"

**Fecha:** 19 de Octubre de 2025  
**Problema:** Los usuarios no pueden registrarse por email  
**Error:** "Database error saving new user"  
**Estado:** ✅ **SOLUCIÓN IDENTIFICADA**

---

## 🐛 **Causa del Problema**

El trigger `handle_new_user()` en Supabase intenta insertar en la tabla `usage_limits` que **NO EXISTE**, causando que el registro falle.

### **Código Problemático:**
```sql
-- En supabase/migrations/001_add_trial_system.sql línea 26-28
INSERT INTO public.usage_limits (user_id, plan)
VALUES (NEW.id, 'free')
ON CONFLICT (user_id) DO NOTHING;
```

Si la tabla no existe, el trigger falla y **Supabase no puede crear el usuario**.

---

## ✅ **Solución**

### **Paso 1: Ir a Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **zzycxijexoxrjpijslsb**
3. En el menú lateral: **SQL Editor**
4. Click en **"New query"**

### **Paso 2: Ejecutar el Script de Fix**

Copia y pega el contenido del archivo:
```
supabase/fix_registro_error.sql
```

O copia directamente este SQL:

```sql
-- Crear tabla usage_limits
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

-- Modificar el trigger para que sea más robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.raw_user_meta_data = 
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'trial_ends_at', (NOW() + INTERVAL '30 days')::text,
      'trial_started_at', NOW()::text,
      'is_trial_active', true,
      'role', COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
  
  BEGIN
    INSERT INTO public.usage_limits (user_id, plan)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'No se pudieron crear usage_limits para usuario %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ Fix aplicado correctamente!' as message;
```

### **Paso 3: Ejecutar**

1. Click en **"RUN"** (botón inferior derecho)
2. Deberías ver: `✅ Fix aplicado correctamente!`

---

## 🧪 **Probar el Registro**

### **Después de Ejecutar el Script:**

1. Ve a: https://casicinco.com/registro
2. Introduce un email nuevo: `test@example.com`
3. Contraseña: `test1234`
4. Click en "Crear cuenta"

**Resultado Esperado:**
- ✅ Usuario se crea correctamente
- ✅ Se muestra mensaje: "¡Cuenta creada! Verifica tu correo electrónico"
- ✅ Recibes email de confirmación de Supabase

---

## 🔍 **Verificar en Supabase**

Para confirmar que el trigger funciona:

1. **SQL Editor** en Supabase
2. Ejecuta:
```sql
-- Ver trigger actual
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Ver tabla usage_limits
SELECT * FROM public.usage_limits LIMIT 5;

-- Ver usuarios creados recientemente
SELECT 
  id,
  email,
  raw_user_meta_data->>'trial_ends_at' as trial_ends,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🚨 **Si Sigue Fallando**

### **Opción Alternativa: Deshabilitar el INSERT a usage_limits**

Si prefieres que el registro funcione SIN la tabla usage_limits:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo asignar trial, sin crear usage_limits
  NEW.raw_user_meta_data = 
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'trial_ends_at', (NOW() + INTERVAL '30 days')::text,
      'trial_started_at', NOW()::text,
      'is_trial_active', true,
      'role', COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
  
  -- NO intentar crear usage_limits (comentado)
  -- INSERT INTO public.usage_limits...
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 **Qué Hace el Fix**

1. **Crea la tabla `usage_limits`** que faltaba
2. **Modifica el trigger** para que no falle si hay error
3. **Añade manejo de excepciones** con `BEGIN...EXCEPTION...END`
4. **El registro funcionará** incluso si algo falla

---

## ✅ **Después del Fix**

### **Funcionalidades Habilitadas:**
- ✅ Registro por email
- ✅ Trial de 30 días automático
- ✅ Confirmación por email
- ✅ Límites de uso tracking
- ✅ Google OAuth (si está configurado)

### **Para Google OAuth:**
Ver archivo: `GOOGLE_OAUTH_SETUP.md` para configurar login con Google.

---

**Tiempo de aplicación:** ~2 minutos  
**Dificultad:** Fácil (copiar y pegar SQL)  
**Impacto:** Crítico (habilita registro de usuarios) 🚨

