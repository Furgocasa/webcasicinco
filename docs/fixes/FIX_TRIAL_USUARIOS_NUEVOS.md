# 🔧 FIX: Usuarios Nuevos Sin Trial (30 Oct 2025)

## 📋 PROBLEMA DETECTADO

Usuarios que se registraban recientemente aparecía el mensaje de que su periodo de trial había finalizado, cuando deberían tener 30 días completos.

## 🔍 DIAGNÓSTICO

### Causas Identificadas:

1. **Lógica defectuosa en WelcomeModal.tsx** (líneas 57-62):
   - El código verificaba si el usuario tenía menos de 20 días de trial
   - Si tenía menos de 20 días, asumía que era "usuario antiguo" y marcaba `hasSeenWelcome = true`
   - Esto causaba que usuarios nuevos con problemas en el trigger se quedaran sin acceso

2. **Trigger de base de datos no funcionó para 14 usuarios**:
   - El trigger `on_auth_user_created` debería asignar automáticamente 30 días de trial
   - Por alguna razón, 14 usuarios se registraron sin que se les asignara `trial_ends_at`
   - Sin esta fecha, el sistema los trataba como "trial expirado"

3. **Sin fallback de cliente**:
   - No había código de respaldo en el frontend para detectar usuarios sin trial asignado
   - El sistema no alertaba de este problema

## ✅ SOLUCIONES APLICADAS

### 1. Corrección de WelcomeModal.tsx

**Antes:**
```typescript
// Si tiene menos de 20 días, probablemente ya vio el modal
if (days < 20) {
  console.log('❌ WelcomeModal: Usuario antiguo (< 20 días), no mostrar');
  localStorage.setItem('hasSeenWelcome', 'true');
  return;
}
```

**Después:**
```typescript
// Si el trial expiró (0 días), no mostrar este modal
// El PaywallModal se encargará de mostrar el mensaje apropiado
if (days === 0) {
  console.log('❌ WelcomeModal: Trial expirado, PaywallModal se encargará');
  localStorage.setItem('hasSeenWelcome', 'true');
  return;
}

// Si tiene días válidos (1-30), continuar para mostrar modal
// La verificación de si ya lo vio está en localStorage al inicio
```

**Además:**
```typescript
} else {
  // Si NO tiene trial_ends_at, el trigger de base de datos falló
  // No mostrar modal pero tampoco marcar como visto (puede que se corrija)
  console.log('⚠️ WelcomeModal: Usuario sin trial_ends_at - posible error en trigger de BD');
  return;
}
```

### 2. Scripts SQL de Corrección

Creados dos scripts en `supabase/diagnostics/`:

#### `fix_usuarios_sin_trial.sql`
- Identifica usuarios sin trial asignado (últimos 30 días)
- Asigna 30 días de trial a usuarios afectados
- Verifica el resultado

#### `verificar_trigger_funcionando.sql`
- Verifica que el trigger `on_auth_user_created` está activo
- Muestra estadísticas de usuarios por estado de trial
- Identifica usuarios recientes sin trial

### 3. Corrección en Base de Datos

**Ejecutar este script** en Supabase SQL Editor:

```sql
-- Ver usuarios afectados
SELECT 
  id, email, created_at,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
  AND (raw_user_meta_data->>'trial_ends_at') IS NULL
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin';

-- Aplicar corrección (asignar 30 días de trial)
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'trial_ends_at', (NOW() + INTERVAL '30 days')::text,
    'trial_started_at', NOW()::text,
    'is_trial_active', true
  )
WHERE 
  created_at > NOW() - INTERVAL '30 days'
  AND (raw_user_meta_data->>'trial_ends_at') IS NULL
  AND id NOT IN (
    SELECT user_id FROM public.subscriptions 
    WHERE status IN ('trialing', 'active')
  )
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin';

-- Verificar resultado
SELECT 
  email,
  raw_user_meta_data->>'trial_ends_at' as trial_ends_at,
  CEIL(EXTRACT(EPOCH FROM ((raw_user_meta_data->>'trial_ends_at')::timestamp - NOW())) / 86400) as dias_restantes
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

## 📝 PASOS PARA USUARIOS AFECTADOS

Si un usuario ya registrado tiene el problema:

1. **Ejecutar el script de corrección** en Supabase (arriba)
2. **Usuario debe hacer logout y login** para recargar su metadata
3. **Limpiar localStorage del navegador** (opcional):
   ```javascript
   localStorage.removeItem('hasSeenWelcome');
   ```

## 🔒 PREVENCIÓN FUTURA

### Verificaciones Implementadas:

1. **WelcomeModal** ahora detecta usuarios sin `trial_ends_at` y no los marca como "vistos"
2. **Logs de consola** más descriptivos para diagnosticar problemas
3. **Scripts SQL de diagnóstico** disponibles para monitorizar el sistema

### Monitorización Recomendada:

Ejecutar periódicamente (cada semana):

```sql
-- Ver usuarios sin trial (deberían ser 0)
SELECT COUNT(*) as usuarios_sin_trial
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
  AND (raw_user_meta_data->>'trial_ends_at') IS NULL
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin';
```

Si el resultado es > 0, investigar por qué el trigger no está funcionando.

## 🎯 RESULTADO ESPERADO

Después de aplicar el fix:

- ✅ Usuarios nuevos reciben automáticamente 30 días de trial
- ✅ WelcomeModal se muestra correctamente a usuarios con trial activo
- ✅ PaywallModal solo aparece cuando el trial realmente expiró (0 días)
- ✅ Usuarios sin `trial_ends_at` son detectados y no se marcan como "vistos"
- ✅ Logs claros para diagnosticar problemas

## 📊 IMPACTO

- **Usuarios afectados**: 14 (identificados en diagnóstico inicial)
- **Periodo afectado**: Usuarios registrados en últimos 30 días
- **Severidad**: Alta (usuarios nuevos sin acceso)
- **Estado**: Corregido ✅

## 🔗 ARCHIVOS MODIFICADOS

- `components/auth/WelcomeModal.tsx` - Lógica corregida
- `supabase/diagnostics/fix_usuarios_sin_trial.sql` - Script de corrección
- `supabase/diagnostics/verificar_trigger_funcionando.sql` - Script de diagnóstico

## 📞 SOPORTE

Si un usuario reporta este problema:

1. Verificar su `trial_ends_at` en Supabase:
   ```sql
   SELECT 
     email,
     raw_user_meta_data->>'trial_ends_at',
     created_at
   FROM auth.users 
   WHERE email = 'usuario@example.com';
   ```

2. Si es NULL, ejecutar corrección para ese usuario específico:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = 
     COALESCE(raw_user_meta_data, '{}'::jsonb) || 
     jsonb_build_object(
       'trial_ends_at', (NOW() + INTERVAL '30 days')::text,
       'trial_started_at', NOW()::text,
       'is_trial_active', true
     )
   WHERE email = 'usuario@example.com';
   ```

3. Pedirle que haga logout/login

---

**Fecha del Fix**: 30 de Octubre de 2025  
**Reportado por**: Usuario nuevo (registro con Google)  
**Resuelto por**: Sistema automatizado + corrección manual

