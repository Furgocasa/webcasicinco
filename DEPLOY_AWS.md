# 🚀 Guía de Despliegue en AWS Amplify

**Aplicación:** CasiCinco  
**Región:** eu-north-1 (Estocolmo)  
**Fecha:** 12 de Octubre de 2025

---

## ✅ Checklist Pre-Deploy

Antes de desplegar, asegúrate de tener:

- [x] Repositorio GitHub creado y actualizado
- [x] Aplicación AWS Amplify creada
- [ ] Variables de entorno configuradas
- [ ] Build exitoso en local
- [ ] Todas las API keys preparadas

---

## 📋 Variables de Entorno Requeridas

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[tu-service-role-key]
```

### Google Maps & Places
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[tu-google-maps-key]
GOOGLE_PLACES_API_KEY=[tu-google-places-key]
```

### OpenAI
```
OPENAI_API_KEY=[tu-openai-key]
```

### Stripe
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[tu-stripe-publishable-key]
STRIPE_SECRET_KEY=[tu-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=[tu-stripe-webhook-secret]
```

---

## 🔧 Configuración AWS Amplify

### 1. Conectar Repositorio

1. **AWS Console** → Amplify → CasiCinco
2. **Hosting** → **Get Started**
3. **GitHub** → Autorizar
4. **Repositorio:** `ActtaxIA/Casi_cinco_app`
5. **Branch:** `main`

### 2. Build Settings

El archivo `amplify.yml` en la raíz ya tiene la configuración:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 3. Variables de Entorno

En AWS Amplify Console:

1. **App settings** → **Environment variables**
2. **Manage variables**
3. Añade TODAS las variables de arriba
4. **Save**

### 4. Desplegar

1. **Save and Deploy**
2. Espera el build (5-10 minutos)
3. Verifica la URL: `https://main.[id].amplifyapp.com`

---

## 🔄 Auto-Deploy

Cada vez que hagas `git push` a la rama `main`, AWS Amplify:

1. ✅ Detecta el cambio automáticamente
2. ✅ Hace pull del código
3. ✅ Ejecuta `npm ci --legacy-peer-deps`
4. ✅ Ejecuta `npm run build`
5. ✅ Despliega automáticamente
6. ✅ Actualiza la URL en vivo

---

## 🌐 Dominio Personalizado

### Configurar dominio propio

1. **App settings** → **Domain management**
2. **Add domain**
3. Ingresa tu dominio (ej: `casicinco.com`)
4. Sigue las instrucciones DNS:
   - CNAME para `www`
   - ALIAS/ANAME para root

### Ejemplo configuración DNS:
```
Type: CNAME
Host: www
Value: [tu-id].amplifyapp.com

Type: ALIAS (o ANAME)
Host: @
Value: [tu-id].amplifyapp.com
```

---

## 🔒 Configurar Webhooks de Stripe

Una vez desplegado, actualiza Stripe:

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**
3. **URL:** `https://tu-dominio.amplifyapp.com/api/stripe/webhook`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Copia el Signing Secret**
6. **Actualiza en AWS Amplify** → `STRIPE_WEBHOOK_SECRET`

---

## 🐛 Troubleshooting

### Build falla con error de dependencias

**Solución:** Verifica que `amplify.yml` tenga `--legacy-peer-deps`

### Variables de entorno no funcionan

**Solución:** 
1. Verifica que empiecen con `NEXT_PUBLIC_` las públicas
2. Redeploy completo: **Amplify Console** → **Redeploy this version**

### Error 500 en producción

**Solución:**
1. Verifica logs: **Amplify Console** → **Build logs**
2. Verifica que todas las API keys estén configuradas
3. Verifica conexión con Supabase

### Página en blanco

**Solución:**
1. Verifica en **Browser DevTools** → Console
2. Probablemente falta una API key pública
3. Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté configurada

---

## 📊 Monitoreo

### Ver logs en tiempo real

1. **AWS Amplify Console**
2. **Build settings** → **Build history**
3. Click en el build activo
4. **Build logs** (en tiempo real)

### Ver métricas

1. **CloudWatch** (desde Amplify Console)
2. **Monitoring**
   - Requests
   - Latency
   - Errors

---

## 💰 Costos Estimados

### AWS Amplify Pricing

**Build:**
- Primeros 1,000 minutos/mes: GRATIS
- Después: $0.01/minuto

**Hosting:**
- Primeros 15 GB almacenados/mes: GRATIS
- Primeros 15 GB transferidos/mes: GRATIS
- Después: $0.15/GB

**Estimación mensual (tráfico bajo):**
- ~0-5€/mes en fase inicial
- ~10-20€/mes con tráfico medio

---

## 🚀 Siguiente Paso: Deploy

Ahora ejecuta:

```bash
git add .
git commit -m "Add AWS Amplify configuration"
git push
```

Luego en AWS Amplify Console:
1. Ve a tu app CasiCinco
2. Conecta con GitHub
3. Configura variables de entorno
4. ¡Deploy! 🎉

---

## 📞 Soporte AWS

- **Documentación:** https://docs.amplify.aws/
- **Foro:** https://github.com/aws-amplify/amplify-js/discussions
- **Discord:** https://discord.gg/amplify

---

**¡Listo para despegar! 🚀**

