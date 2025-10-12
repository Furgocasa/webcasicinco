# 🔧 Fix Google OAuth Redirigiendo a Localhost

## ❌ Problema:
Después de autorizar con Google, redirige a `localhost:3000` en vez de a la URL de AWS.

---

## ✅ Solución Paso a Paso:

### **1. Supabase → Authentication → URL Configuration**

**Site URL (MUY IMPORTANTE):**
```
https://main.d2nzzzmoajf631.amplifyapp.com
```

**Redirect URLs (añadir):**
```
https://main.d2nzzzmoajf631.amplifyapp.com/**
https://main.d2nzzzmoajf631.amplifyapp.com/auth/callback
```

**❌ NO debe haber:**
```
http://localhost:3000
```

---

### **2. Google Cloud Console → Credentials**

**Authorized JavaScript origins:**
```
https://main.d2nzzzmoajf631.amplifyapp.com
```

**Authorized redirect URIs:**
```
https://zzycxijexoxrjpijslsb.supabase.co/auth/v1/callback
```

**❌ NO debe haber:**
```
http://localhost:3000
```

---

### **3. Limpiar Caché**

En tu iPhone:
1. Safari → Configuración
2. Limpiar historial y datos
3. O usar modo incógnito

---

### **4. Verificar Variables AWS**

En AWS Amplify, asegúrate de tener:
```
NEXT_PUBLIC_SUPABASE_URL=https://zzycxijexoxrjpijslsb.supabase.co
```

(Sin localhost)

---

## 🧪 Probar:

1. **Modo incógnito** en iPhone
2. https://main.d2nzzzmoajf631.amplifyapp.com/login
3. "Continuar con Google"
4. Debería redirigir a AWS (no localhost)

---

Si sigue fallando, el problema puede ser que Supabase tiene cacheado localhost en algún sitio.

