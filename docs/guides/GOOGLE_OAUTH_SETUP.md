# 🔐 Configurar Google OAuth en Casi Cinco

**Fecha:** 12 de Octubre de 2025  
**Feature:** Login con Google  
**Estado:** ⏳ Pendiente Configuración

---

## ✅ Código Ya Implementado

- ✅ Botón "Continuar con Google" en Login
- ✅ Botón "Continuar con Google" en Registro  
- ✅ Callback handler (`/auth/callback`)
- ✅ Integración con Supabase Auth

---

## 🔧 Configuración Requerida

### **Paso 1: Google Cloud Console**

1. **Ve a:** https://console.cloud.google.com
2. **Crea un proyecto** (o usa el existente de Maps)
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth 2.0 Client ID**

**Configuración:**
```
Application type: Web application
Name: Casi Cinco OAuth
Authorized JavaScript origins:
  - http://localhost:3000
  - https://main.d2nzzzmoajf631.amplifyapp.com
  
Authorized redirect URIs:
  - http://localhost:3000/auth/callback
  - https://main.d2nzzzmoajf631.amplifyapp.com/auth/callback
  - https://zzycxijexoxrjpijslsb.supabase.co/auth/v1/callback
```

5. **Copia:**
   - Client ID
   - Client Secret

---

### **Paso 2: Supabase Dashboard**

1. **Ve a:** https://supabase.com/dashboard
2. **Tu proyecto:** zzycxijexoxrjpijslsb
3. **Authentication** → **Providers**
4. **Google**:
   - Enable: ✅ ON
   - Client ID: (pega de Google Cloud)
   - Client Secret: (pega de Google Cloud)
   - **Save**

---

### **Paso 3: Actualizar Redirect URLs**

En Supabase → Authentication → URL Configuration:

**Site URL:**
```
https://main.d2nzzzmoajf631.amplifyapp.com
```

**Redirect URLs (añadir):**
```
http://localhost:3000/auth/callback
https://main.d2nzzzmoajf631.amplifyapp.com/auth/callback
```

---

## 🧪 Probar

### **Local:**
1. Ir a: http://localhost:3000/login
2. Click "Continuar con Google"
3. Seleccionar cuenta Google
4. Debería redirigir a home (logged in)

### **Producción:**
1. Ir a: https://main.d2nzzzmoajf631.amplifyapp.com/login
2. Click "Continuar con Google"
3. Login → Redirige a home

---

## 📝 Notas Importantes

**Usuarios Google:**
- Se crean automáticamente en `auth.users`
- Email verificado automáticamente
- Foto de perfil disponible en `user.user_metadata.avatar_url`
- Rol por defecto: 'user'

**Para hacer admin:**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'usuario@gmail.com';
```

---

## 🎯 Ventajas

✅ **Login más rápido** - 1 click vs formulario  
✅ **No necesita password** - Más seguro  
✅ **Email verificado** - Automático  
✅ **Foto de perfil** - Incluida  
✅ **Mejor conversión** - Menos fricción  

---

## 🚀 Después de Configurar

**Funcionalidades disponibles:**
- Login con Google
- Registro con Google
- Auto-creación de perfil
- Sesión persistente
- Foto de perfil de Google

**Sin configurar:**
- Botón aparece pero dará error
- Mensaje: "Provider not configured"

---

**⏰ Tiempo de configuración:** ~10 minutos  
**📖 Docs oficiales:** https://supabase.com/docs/guides/auth/social-login/auth-google


