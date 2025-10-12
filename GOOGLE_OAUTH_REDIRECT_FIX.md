# 🔧 Solución: Problemas con Google OAuth

## Problemas Corregidos ✅

### 1. **Confirmación de Autorización Repetida**
**Problema:** Google pedía confirmación de autorización cada vez, incluso para usuarios que ya habían autorizado la app.

**Causa:** El parámetro `prompt: 'select_account'` o `prompt: 'consent'` forzaba la pantalla de autorización.

**Solución:** Eliminamos el parámetro `prompt` completamente. Ahora:
- Si el usuario ya autorizó la app → Login automático sin confirmación
- Si es la primera vez → Google pide autorización solo una vez
- Si el usuario no está logueado en Google → Pide seleccionar cuenta

### 2. **Redirección a localhost:3000 en Producción**
**Problema:** Después de autenticarse, la app redirigía a `localhost:3000` en lugar de la URL de producción.

**Causa:** Se usaba `window.location.origin` o `requestUrl.origin` que tomaba el origen de la petición actual.

**Solución:** Implementamos una variable de entorno `NEXT_PUBLIC_APP_URL` que:
- En **desarrollo**: Usa `window.location.origin` (localhost:3000)
- En **producción**: Usa `NEXT_PUBLIC_APP_URL` (tu dominio real)

---

## 🚀 Configuración Necesaria

### Para Desarrollo Local (opcional)

En desarrollo, funciona automáticamente con localhost. Si quieres especificarlo explícitamente, crea `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Para Producción (REQUERIDO)

Debes configurar la variable de entorno en tu plataforma de despliegue:

#### **Vercel**
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://tu-dominio.com` (sin barra final)
   - **Environments:** Production, Preview, Development

#### **AWS Amplify**
1. Ve a tu app en AWS Amplify Console
2. App settings → Environment variables
3. Agrega:
   - **Variable:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://tu-dominio.com`

#### **Netlify**
1. Site settings → Build & deploy → Environment
2. Environment variables → Add variable:
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://tu-dominio.com`

---

## 🔐 Configuración en Google Cloud Console

También necesitas actualizar las URLs autorizadas en Google Cloud:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. APIs & Services → Credentials
4. Edita tu OAuth 2.0 Client ID
5. En **Authorized redirect URIs**, agrega:
   ```
   https://tu-dominio.com/auth/callback
   https://tu-supabase-project.supabase.co/auth/v1/callback
   ```
6. Guarda los cambios

---

## 📋 Verificación

Para verificar que todo funciona correctamente:

### ✅ En Desarrollo:
```bash
npm run dev
```
1. Ve a `/login`
2. Click en "Continuar con Google"
3. Debería redirigir a Google OAuth
4. Después de autorizar, volver a `http://localhost:3000`

### ✅ En Producción:
1. Despliega la app con la variable de entorno configurada
2. Ve a `https://tu-dominio.com/login`
3. Click en "Continuar con Google"
4. Debería redirigir a Google OAuth
5. Después de autorizar, volver a `https://tu-dominio.com`
6. Para usuarios existentes, **no debería pedir confirmación de nuevo**

---

## 🐛 Solución de Problemas

### Sigue redirigiendo a localhost en producción
- Verifica que `NEXT_PUBLIC_APP_URL` esté configurada correctamente
- Asegúrate de **redeployar** después de añadir la variable
- En Vercel/Amplify, verifica que la variable está en el entorno correcto

### Sigue pidiendo confirmación cada vez
- Verifica que el código NO tenga `prompt: 'consent'` o `prompt: 'select_account'`
- Comprueba que estás usando la misma cuenta de Google
- Revoca el acceso en [Google Accounts](https://myaccount.google.com/permissions) y vuelve a intentarlo

### Error "Redirect URI mismatch"
- Verifica que la URL de callback esté configurada en Google Cloud Console
- Asegúrate de que coincida exactamente: `https://tu-dominio.com/auth/callback`
- No olvides también agregar la URL de Supabase

---

## 📝 Cambios Realizados en el Código

### `app/(auth)/login/page.tsx`
```typescript
// Antes
redirectTo: `${window.location.origin}/auth/callback`,
queryParams: {
  prompt: 'select_account', // ❌ Forzaba confirmación
}

// Después
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
redirectTo: `${baseUrl}/auth/callback`,
// ✅ Sin queryParams.prompt - Google decide automáticamente
```

### `app/(auth)/registro/page.tsx`
Mismos cambios que en login.

### `app/auth/callback/route.ts`
```typescript
// Antes
return NextResponse.redirect(new URL('/', requestUrl.origin));

// Después
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
return NextResponse.redirect(new URL('/', baseUrl));
```

---

## 🎉 Resultado

Ahora el flujo de autenticación funciona correctamente:

1. **Primera vez:** Usuario autoriza la app (solo una vez)
2. **Siguientes veces:** Login automático sin confirmación
3. **Redirección:** Siempre vuelve a la URL correcta (producción o desarrollo)
4. **Sesión:** Se mantiene persistente entre recargas

---

**Fecha:** 12 de octubre de 2025  
**Versión:** Beta 3.0

