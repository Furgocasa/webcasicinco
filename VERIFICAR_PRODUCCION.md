# ✅ Checklist de Verificación - Producción

## 🔍 Verificar que todo funciona en https://main.d2nzzzmoajf631.amplifyapp.com

### 1. Variables de Entorno CRÍTICAS

Verifica en **AWS Amplify Console** → **App Settings** → **Environment variables**:

#### Variables PÚBLICAS (deben tener NEXT_PUBLIC_):
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - **CRÍTICO para el mapa**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (debe ser `https://casicinco.com` cuando esté listo)

#### Variables PRIVADAS (servidor):
- [ ] `GOOGLE_PLACES_API_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### 2. Errores actuales a solucionar

#### ❌ Error: "google is not defined"
**Causa**: Falta `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` o está mal configurada

**Solución**:
1. Ve a AWS Amplify → Environment variables
2. Agrega: 
   - Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: Tu API Key de Google Maps
3. **IMPORTANTE**: Haz **Redeploy** después de agregar

#### ❌ Error: "manifest.json 404"
**Causa**: Archivo faltaba

**Solución**: ✅ YA SOLUCIONADO - creado en `public/manifest.json`
- Se arreglará en el próximo deploy

#### ❌ Errores: "/restaurante, /hotel, /spa 404"
**Causa**: Son rutas dinámicas que Next.js intenta precargar

**Solución**: ✅ NORMAL - No es un error real, son precarga de rutas

### 3. Verificar Google Maps API Key

En https://console.cloud.google.com/apis/credentials:

1. **APIs habilitadas**:
   - [ ] Maps JavaScript API
   - [ ] Places API  
   - [ ] Geocoding API
   - [ ] Directions API

2. **Restricciones de la API Key**:
   - Tipo: HTTP referrers (websites)
   - Dominios permitidos:
     - `https://*.amplifyapp.com/*`
     - `https://casicinco.com/*` (cuando esté listo)
     - `http://localhost:3000/*` (para desarrollo)

3. **Cuota/Billing**:
   - [ ] Billing habilitado en el proyecto de Google Cloud
   - [ ] Cuota suficiente (Google Maps es de pago después del free tier)

### 4. Pasos para desplegar los cambios

```bash
# Los cambios ya están listos en tu repositorio local
# Solo necesitas hacer commit y push

git add .
git commit -m "Fix: Arreglado error Google Maps + simplificada homepage + manifest.json"
git push origin main
```

Amplify detectará el push automáticamente y empezará a desplegar.

### 5. Verificar después del deploy

Una vez que Amplify termine de desplegar:

#### En la consola del navegador (F12):
- [ ] No debe aparecer: "google is not defined"
- [ ] No debe aparecer: "manifest.json 404"
- [ ] El mapa debe cargar correctamente

#### En la página:
- [ ] Homepage se ve limpia (sin tanto colorín)
- [ ] Sección de pricing está después de "Por qué Casi Cinco es diferente"
- [ ] Mapa en `/mapa` carga correctamente
- [ ] Se ven los marcadores en el mapa
- [ ] Los filtros funcionan
- [ ] Chatbot funciona

### 6. Si el mapa sigue sin funcionar

Abre la consola del navegador (F12) y busca:

```javascript
// Si ves esto:
"Failed to load Google Maps API"
"InvalidKeyMapError"
→ La API Key es incorrecta o no tiene permisos

// Si ves esto:
"google is not defined"
→ La variable NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada

// Si ves esto:
"RefererNotAllowedMapError"  
→ El dominio no está en la lista de restricciones de la API Key
```

### 7. Testing completo

- [ ] **Homepage** (`/`): Se carga, no hay errores, diseño limpio
- [ ] **Mapa** (`/mapa`): Carga Google Maps, muestra marcadores
- [ ] **Filtros**: Funcionan correctamente
- [ ] **Lugares**: Cards se ven bien
- [ ] **Chatbot**: Botón flotante aparece y funciona
- [ ] **Login** (`/login`): Formulario funciona
- [ ] **Registro** (`/registro`): Formulario funciona
- [ ] **Pricing** (`/pricing`): Planes se ven correctamente

### 8. Próximos pasos (cuando esté todo funcionando)

1. **Configurar dominio casicinco.com** (ver `CONFIGURAR_DOMINIO.md`)
2. **Actualizar metadatos** para SEO con el dominio real
3. **Configurar Google Analytics** (opcional)
4. **Configurar Google Search Console**
5. **Crear sitemap.xml**

### 9. Monitoreo

Verifica regularmente en AWS Amplify:
- **Logs** de build: Que no haya errores
- **Logs** de runtime: Que no haya errores en producción
- **CloudWatch**: Métricas de uso

### 10. Comandos útiles

```bash
# Ver logs de Amplify
# Ve a AWS Amplify Console → Tu app → Logs

# Forzar redeploy sin cambios
# En AWS Amplify → Redeploy → Choose "Redeploy this version"

# Ver variables de entorno configuradas
# AWS Amplify → App Settings → Environment variables
```

## 🆘 Contacto de emergencia

Si algo no funciona:

1. **Revisa logs en AWS Amplify Console**
2. **Abre la consola del navegador (F12)** y busca errores
3. **Verifica que todas las variables de entorno estén configuradas**
4. **Haz redeploy** después de cambiar variables

## 📊 Estado actual

- ✅ Código arreglado localmente
- ✅ Manifest.json creado
- ✅ Homepage simplificada
- ✅ Pricing reubicado
- ⏳ Pendiente: Deploy a producción
- ⏳ Pendiente: Configurar variables de entorno en Amplify
- ⏳ Pendiente: Configurar dominio casicinco.com

