# 🔧 INSTRUCCIONES: Fix Usuarios OAuth

**Fecha:** 20 Octubre 2025  
**Problema:** Usuarios OAuth con Google tienen logouts múltiples y error 406

---

## 📋 RESUMEN DEL PROBLEMA

### **Síntomas:**
- ✅ Admin con email/password funciona perfectamente
- ❌ Usuarios con Google OAuth se desloguean automáticamente
- ❌ Error 406 en subscriptions
- ❌ Logout múltiple (5 veces consecutivas)
- ❌ Header no muestra usuario logueado

### **Root Cause:**
1. **Usuarios OAuth sin subscription** → Query con `.single()` falla con error 406
2. **Error 406** → Supabase invalida sesión automáticamente
3. **Sesión inválida** → Logout múltiple en cliente

---

## ✅ FIXES APLICADOS

### **1. Fix en Código (✅ Hecho - Commit 2c18fc2)**

**Archivos modificados:**
- `lib/hooks/useUserAccess.ts`
- `app/api/user/access/route.ts`

**Cambio:**
```typescript
// ❌ ANTES:
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('plan, status')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single();  // Falla con error 406 si no hay registro

// ✅ AHORA:
const { data: subscription, error: subError } = await supabase
  .from('subscriptions')
  .select('plan, status')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .maybeSingle();  // Retorna null si no hay registro

// Silenciar error PGRST116 (normal para nuevos usuarios)
if (subError && subError.code !== 'PGRST116') {
  console.error('Error fetching subscription:', subError);
}
```

**Estado:** ✅ Pusheado a producción (esperando deploy de AWS Amplify)

---

### **2. Fix en Base de Datos (⏳ Por ejecutar)**

**Archivo:** `supabase/fix_oauth_users_metadata.sql`

**Qué hace:**
1. ✅ Asegura que todos los usuarios OAuth tengan `role: 'user'`
2. ✅ Asigna trial de 30 días a usuarios OAuth sin trial
3. ✅ Crea `usage_limits` para usuarios OAuth que no lo tengan
4. ✅ Muestra estadísticas de usuarios procesados

---

## 🚀 INSTRUCCIONES DE EJECUCIÓN

### **Paso 1: Esperar Deploy de Código**

1. Ve a **AWS Amplify Console**: https://console.aws.amazon.com/amplify
2. Verifica que el build del commit `2c18fc2` haya terminado
3. Estado debe ser: **"Deploy Successful"** ✅
4. **Espera ~3-5 minutos** desde el último push

---

### **Paso 2: Ejecutar Script SQL en Supabase**

1. **Abre Supabase Dashboard**: https://zzycxijexoxrjpijslsb.supabase.co
2. Ve a **"SQL Editor"** (menú lateral izquierdo)
3. **Abre el archivo** `supabase/fix_oauth_users_metadata.sql`
4. **Copia TODO el contenido** del script
5. **Pégalo** en el editor SQL de Supabase
6. Click **"Run"** (botón verde arriba a la derecha)

---

### **Paso 3: Verificar Resultados**

**Deberías ver:**

```
✅ Fix completado para usuarios OAuth!

Usuarios OAuth procesados: X
Usuarios con trial configurado: X
Usuarios con usage_limits: X
```

**Y una tabla con:**
- Lista de usuarios OAuth
- Su rol (debería ser 'user')
- Trial activo/expirado
- Si tienen usage_limits

---

### **Paso 4: Probar en Producción**

#### **A. Limpiar Cookies (Importante)**

1. **Abre la web**: https://www.casicinco.com
2. **F12** → Application → Storage
3. **Click "Clear site data"**
4. **Cerrar TODAS las pestañas** de casicinco.com

#### **B. Test con Ventana de Incógnito**

1. **Abre ventana de incógnito** (Ctrl+Shift+N)
2. Ve a https://www.casicinco.com/login
3. **Inicia sesión con Google OAuth**
4. **Verifica:**
   - ✅ No hay error 406 en consola
   - ✅ No hay logouts múltiples
   - ✅ Header muestra usuario correctamente
   - ✅ Puedes acceder a `/mapa` y `/ruta`
   - ✅ Puedes usar el chatbot

#### **C. Revisar Consola del Navegador**

Deberías ver:
```
✅ useAuth: Usuario detectado: tu@email.com (User)
Auth state changed: SIGNED_IN tu@email.com
Sesión iniciada correctamente
```

**NO deberías ver:**
```
❌ Failed to load resource: 406
❌ Auth state changed: SIGNED_OUT
❌ 🔓 Evento SIGNED_OUT recibido (múltiples veces)
```

---

## 📊 VERIFICACIÓN COMPLETA

### **Checklist Post-Fix:**

- [ ] Deploy de AWS Amplify completado (commit `2c18fc2`)
- [ ] Script SQL ejecutado en Supabase
- [ ] Usuarios OAuth tienen metadata completa
- [ ] Test con usuario OAuth nuevo funciona
- [ ] No hay errores 406 en consola
- [ ] No hay logouts múltiples
- [ ] Header muestra usuario correctamente
- [ ] Admin sigue funcionando (no romper lo que funciona)

---

## 🔍 DIAGNÓSTICO ADICIONAL

### **Si el problema persiste:**

#### **1. Verificar logs del navegador:**
```javascript
// Abre consola (F12) y busca:
"Error fetching subscription"  // ❌ Mal - aún hay error
"✅ useAuth: Usuario detectado"  // ✅ Bien
"Auth state changed: SIGNED_OUT" // ❌ Mal - aún se desloguea
```

#### **2. Verificar metadata en Supabase:**
```sql
-- Ejecutar en SQL Editor:
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'trial_ends_at' as trial,
  raw_user_meta_data->>'provider' as provider
FROM auth.users
WHERE email = 'TU_EMAIL_OAUTH@gmail.com';
```

Debería mostrar:
- `role`: "user"
- `trial`: fecha futura
- `provider`: "google"

#### **3. Verificar sesiones:**
```sql
SELECT 
  u.email,
  s.created_at,
  s.updated_at,
  s.expires_at
FROM auth.sessions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email = 'TU_EMAIL_OAUTH@gmail.com'
ORDER BY s.updated_at DESC;
```

Debería tener sesión válida con `expires_at` en el futuro.

---

## 🚨 ROLLBACK (Si algo sale mal)

**El script SQL es seguro**, pero si necesitas revertir:

```sql
-- Ver cambios antes de ejecutar fix
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE 
  (raw_user_meta_data->>'provider' = 'google' 
   OR raw_user_meta_data->>'iss' LIKE '%google%')
LIMIT 5;
```

El script **NO borra datos**, solo **añade metadata faltante**.

---

## 💡 PREVENCIÓN FUTURA

### **El trigger `handle_new_user()` ya está configurado para:**

✅ Asignar `role: 'user'` automáticamente  
✅ Crear trial de 30 días  
✅ Inicializar usage_limits  

**Nuevos usuarios OAuth NO tendrán este problema.**

---

## 📞 SOPORTE

Si el problema persiste después de seguir todos los pasos:

1. **Captura de pantalla** de la consola del navegador (F12)
2. **Email del usuario** que tiene problemas
3. **Timestamp** exacto del intento de login
4. **Logs de servidor** (si los tienes)

---

## ✅ RESUMEN EJECUTIVO

**Problema:** Error 406 causaba logout automático en usuarios OAuth  
**Causa:** Query con `.single()` fallaba para usuarios sin subscription  
**Solución:** 
1. Cambio de `.single()` a `.maybeSingle()` en código ✅
2. Script SQL para arreglar usuarios existentes ⏳

**Tiempo estimado:** 10 minutos  
**Impacto:** Bajo (solo añade metadata faltante)  
**Riesgo:** Muy bajo (no borra datos)

---

*Documento creado: 20 Octubre 2025*

