# 🌐 Configurar Dominio casicinco.com en AWS Amplify

## Paso 1: Agregar el dominio en AWS Amplify

1. Ve a tu aplicación en **AWS Amplify Console**
2. En el menú lateral, haz clic en **Domain Management**
3. Haz clic en **Add domain**
4. Escribe: `casicinco.com`
5. Amplify te mostrará los registros DNS que necesitas crear

## Paso 2: Configurar DNS en tu proveedor de dominio

Donde compraste `casicinco.com` (GoDaddy, Namecheap, etc.), agrega estos registros:

### Registros CNAME (Amplify te dará los valores exactos):

```
Tipo: CNAME
Nombre: www
Valor: [el que te da Amplify, algo como: xxxxx.cloudfront.net]

Tipo: CNAME  
Nombre: @
Valor: [el que te da Amplify]
```

### O registro A + AAAA (alternativa):
```
Tipo: A
Nombre: @
Valor: [IP que te da Amplify]

Tipo: AAAA
Nombre: @
Valor: [IPv6 que te da Amplify]
```

## Paso 3: Configurar SSL/HTTPS automático

AWS Amplify configurará automáticamente un certificado SSL gratuito de **AWS Certificate Manager**.

Esto puede tardar **hasta 24-48 horas** mientras:
- Se propagan los registros DNS
- Se valida el dominio
- Se emite el certificado SSL

## Paso 4: Configurar subdominios (opcional)

Si quieres que tanto `casicinco.com` como `www.casicinco.com` funcionen:

1. En Amplify, marca la opción **"Set up automatic subdomain"**
2. Esto redirigirá `www.casicinco.com` → `casicinco.com` automáticamente

## Paso 5: Verificar configuración

Una vez configurado, verifica:
- ✅ `https://casicinco.com` funciona
- ✅ `https://www.casicinco.com` redirige a casicinco.com
- ✅ Certificado SSL válido (candado verde en navegador)

## 🔧 Variables de entorno para Google Maps

**IMPORTANTE**: Para que el mapa funcione correctamente, necesitas configurar esta variable de entorno en AWS Amplify:

### En AWS Amplify Console:

1. Ve a **App Settings** → **Environment variables**
2. Agrega:
   ```
   Key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   Value: [tu clave de API de Google Maps]
   ```

3. **Redeploy** la aplicación para que tome efecto

### Cómo obtener tu Google Maps API Key:

1. Ve a: https://console.cloud.google.com/
2. Crea un proyecto (si no tienes uno)
3. Habilita estas APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
4. Ve a **Credentials** → **Create Credentials** → **API Key**
5. **IMPORTANTE**: Restringe la clave por dominio:
   - En la configuración de la API Key, en **Application restrictions**
   - Selecciona **HTTP referrers**
   - Agrega: 
     - `https://casicinco.com/*`
     - `https://www.casicinco.com/*`
     - `https://*.amplifyapp.com/*` (para testing)

## ⚙️ Todas las variables de entorno necesarias

Asegúrate de tener configuradas en AWS Amplify:

```bash
# Google Maps (CLIENTE - debe llevar NEXT_PUBLIC_)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave_aqui
NEXT_PUBLIC_APP_URL=https://casicinco.com

# Supabase (CLIENTE - debe llevar NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Servidor (sin NEXT_PUBLIC_)
GOOGLE_PLACES_API_KEY=tu_clave_de_places
OPENAI_API_KEY=tu_openai_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
STRIPE_SECRET_KEY=tu_stripe_secret
STRIPE_WEBHOOK_SECRET=tu_webhook_secret

# Stripe (CLIENTE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
```

## 🚀 Después de configurar

1. Haz un **Redeploy** en Amplify
2. Espera a que el deploy termine
3. Prueba:
   - Página de inicio: `https://casicinco.com`
   - Mapa: `https://casicinco.com/mapa`
4. Abre la consola del navegador (F12) y verifica que no haya errores de Google Maps

## 📱 Actualizar metadatos SEO

Una vez que el dominio esté activo, actualiza:

1. En `app/layout.tsx`:
   ```typescript
   metadataBase: new URL('https://casicinco.com'),
   ```

2. En Google Search Console:
   - Agrega `casicinco.com` como propiedad
   - Verifica la propiedad con método DNS
   - Envía el sitemap: `https://casicinco.com/sitemap.xml`

3. En Google Analytics (si usas):
   - Actualiza el dominio rastreado

## ❓ Problemas comunes

### "DNS no se propaga"
- Espera 24-48h
- Verifica con: https://dnschecker.org/

### "Error SSL: NET::ERR_CERT_AUTHORITY_INVALID"
- Espera a que AWS Certificate Manager emita el certificado
- Puede tardar hasta 48h

### "El mapa no carga"
- Verifica que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` esté configurada
- Verifica que la API Key tenga el dominio `casicinco.com` en restricciones
- Redeploy después de cambiar variables

### "404 en manifest.json"
- Ya está solucionado (creamos el archivo)
- Se arreglará en el próximo deploy

## 🎯 Checklist final

- [ ] Dominio agregado en Amplify
- [ ] DNS configurado en proveedor
- [ ] Variables de entorno configuradas
- [ ] SSL/HTTPS funcionando
- [ ] Redirección www → dominio principal
- [ ] Google Maps cargando correctamente
- [ ] Todas las páginas funcionan
- [ ] Sin errores en consola del navegador

