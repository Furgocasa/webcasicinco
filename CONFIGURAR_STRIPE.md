# 💳 Configurar Stripe - Guía Paso a Paso

**Fecha:** 21 Octubre 2025  
**Tiempo estimado:** 30-40 minutos  
**Entorno:** AWS Amplify (Producción) + Local (Desarrollo)

---

## 🎯 Objetivo

Configurar Stripe para aceptar pagos de suscripciones mensuales (2,99€/mes) y anuales (24,99€/año) con sistema de trial de 30 días.

---

## 📋 Pre-requisitos

- [ ] Cuenta de Stripe (https://dashboard.stripe.com/register)
- [ ] Acceso a AWS Amplify Console
- [ ] (Opcional) Desarrollo local: Archivo `.env.local`

---

## 🏗️ Entornos de Configuración

Esta guía cubre **dos entornos**:

### **🌍 PRODUCCIÓN (AWS Amplify)** - ⭐ PRINCIPAL
- **Variables:** Se configuran en AWS Amplify Console → Environment variables
- **Requiere:** Redeploy después de cada cambio
- **URL:** https://casicinco.com
- **Stripe:** Usa keys de **producción** (`sk_live_...`)

### **💻 DESARROLLO LOCAL** - Opcional
- **Variables:** Se configuran en archivo `.env.local` (no se sube a Git)
- **Requiere:** Reiniciar servidor (`npm run dev`)
- **URL:** http://localhost:3000
- **Stripe:** Usa keys de **test** (`sk_test_...`)

**💡 IMPORTANTE:** 
- Para que la app en **producción** funcione, debes configurar las variables en **AWS Amplify**
- El archivo `.env.local` es solo para desarrollo local

---

## 🚀 PASO 1: Crear Cuenta y Activar Modo Test

### 1.1 Registrarse en Stripe

1. Ve a: https://dashboard.stripe.com/register
2. Completa el registro con tu email
3. Verifica tu cuenta

### 1.2 Activar Modo Test

1. En el dashboard, asegúrate de que estás en **Modo Test** (esquina superior derecha)
2. Verás un toggle "Test mode" activado
3. **IMPORTANTE:** Siempre usa modo test para desarrollo

---

## 🔑 PASO 2: Obtener API Keys

### 2.1 Ir a la sección de API Keys

1. Dashboard → **Developers** → **API keys**
2. O directo: https://dashboard.stripe.com/test/apikeys

### 2.2 Copiar las Keys

Verás dos tipos de keys:

**Publishable key (pk_test_...):**
```
pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Secret key (sk_test_...):**
```
sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:** Nunca compartas tu Secret Key públicamente

### 2.3 Añadir Variables de Entorno

#### **🌍 PRODUCCIÓN (AWS Amplify):**

1. Ve a: **AWS Amplify Console** → Tu App → **Environment variables**
2. Añade estas variables:

| Key | Value |
|-----|-------|
| `STRIPE_SECRET_KEY` | `sk_test_tu_clave_secreta_aqui` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_tu_clave_publica_aqui` |

3. Click **Save**
4. **Redeploy** la app para que tome las nuevas variables

#### **💻 DESARROLLO LOCAL (Opcional):**

Si quieres probar en local, crea `.env.local` en la raíz del proyecto:

```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
```

---

## 📦 PASO 3: Crear Productos en Stripe

### 3.1 Ir a Productos

1. Dashboard → **Products** → **Add product**
2. O directo: https://dashboard.stripe.com/test/products

### 3.2 Crear Producto: "Casi Cinco Premium"

1. **Product name:** `Casi Cinco Premium`
2. **Description:** `Acceso completo a mapa, chatbot y planificador de rutas`
3. Click **Add product**

### 3.3 Crear Precio Mensual

Dentro del producto recién creado:

1. Click **Add another price**
2. Configuración:
   - **Price:** `2.99`
   - **Currency:** `EUR (€)`
   - **Recurring:** `Monthly`
   - **Billing period:** `Month`
3. Click **Add price**

4. **Copiar el Price ID:**
   - Verás algo como: `price_1A2B3C4D5E6F7G8H9I0J`
   - Este es tu `STRIPE_PREMIUM_MONTHLY_PRICE_ID`

### 3.4 Crear Precio Anual

1. Click **Add another price** nuevamente
2. Configuración:
   - **Price:** `24.99`
   - **Currency:** `EUR (€)`
   - **Recurring:** `Yearly`
   - **Billing period:** `Year`
3. Click **Add price**

4. **Copiar el Price ID:**
   - Verás algo como: `price_9J8I7H6G5F4E3D2C1B0A`
   - Este es tu `STRIPE_PREMIUM_YEARLY_PRICE_ID`

### 3.5 Añadir Price IDs a Variables de Entorno

#### **🌍 PRODUCCIÓN (AWS Amplify):**

1. **AWS Amplify Console** → Tu App → **Environment variables**
2. Añade estas variables:

| Key | Value |
|-----|-------|
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | `price_1A2B3C4D5E6F7G8H9I0J` |
| `STRIPE_PREMIUM_YEARLY_PRICE_ID` | `price_9J8I7H6G5F4E3D2C1B0A` |

3. Click **Save**
4. **Redeploy** la app

#### **💻 DESARROLLO LOCAL (Opcional):**

Añade al archivo `.env.local`:

```bash
# IDs de Productos Stripe
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1A2B3C4D5E6F7G8H9I0J
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_9J8I7H6G5F4E3D2C1B0A
```

---

## 🪝 PASO 4: Configurar Webhook (Para Producción)

### 4.1 ¿Qué es un Webhook?

Un webhook permite que Stripe notifique a tu aplicación cuando ocurren eventos (pagos exitosos, cancelaciones, etc.).

### 4.2 Crear Webhook en Stripe

1. Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://tudominio.com/api/stripe/webhook`
   - Para local: Usa Stripe CLI (ver 4.3)
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**

### 4.3 Añadir Webhook Secret

1. Dentro del webhook creado, verás: **Signing secret**
2. Click **Reveal** y copia el secret

#### **🌍 PRODUCCIÓN (AWS Amplify):**

3. **AWS Amplify Console** → Tu App → **Environment variables**
4. Añade:

| Key | Value |
|-----|-------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

5. Click **Save** y **Redeploy**

#### **💻 DESARROLLO LOCAL (Opcional):**

Añade a `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4.4 Testing Local con Stripe CLI (Opcional)

Para probar webhooks en local:

```bash
# Instalar Stripe CLI
# Windows: https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Forward eventos a tu local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Obtendrás un webhook secret temporal, úsalo en .env.local
```

---

## ✅ PASO 5: Verificar Configuración

### 5.1 Variables de Entorno Completas

#### **🌍 PRODUCCIÓN (AWS Amplify):**

Verifica que tienes **todas** estas variables en AWS Amplify:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Clave secreta Stripe | `sk_test_51A2B3C4D...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública Stripe | `pk_test_51A2B3C4D...` |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | ID precio mensual | `price_1A2B3C4D...` |
| `STRIPE_PREMIUM_YEARLY_PRICE_ID` | ID precio anual | `price_9J8I7H6G...` |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook | `whsec_xxxxxxxxx` |

**Después de añadir/modificar variables → REDEPLOY obligatorio**

#### **💻 DESARROLLO LOCAL:**

Tu `.env.local` debe tener:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51A2B3C4D...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51A2B3C4D...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1A2B3C4D...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_9J8I7H6G...
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

Reinicia el servidor:
```bash
# Ctrl+C para detener
npm run dev
```

### 5.3 Probar el Flujo

1. Registra un nuevo usuario
2. Ve a `/pricing`
3. Click en "Suscribirme" (Mensual o Anual)
4. Deberías ser redirigido a Stripe Checkout

### 5.4 Tarjetas de Prueba

Stripe proporciona tarjetas de test:

**Tarjeta exitosa:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier fecha futura
- CVC: Cualquier 3 dígitos
- ZIP: Cualquier código

**Tarjeta rechazada:**
- Número: `4000 0000 0000 0002`

Más tarjetas: https://stripe.com/docs/testing#cards

---

## 🌍 PASO 6: Migrar a Producción

### 6.1 Activar Cuenta

1. Dashboard → **Activate your account**
2. Completa información de negocio
3. Stripe revisará tu cuenta (puede tardar 1-2 días)

### 6.2 Obtener Production Keys

1. Dashboard → **Developers** → **API keys**
2. **Desactiva "Test mode"** (toggle arriba a la derecha)
3. Copia las nuevas keys (sin `_test_`)

### 6.3 Recrear Productos en Producción

1. Los productos del modo test NO se migran
2. Repite el PASO 3 pero en modo producción
3. Obtén nuevos Price IDs

### 6.4 Actualizar Variables de Entorno en AWS Amplify

1. AWS Amplify → Tu App → **Environment variables**
2. Añade las production keys:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
   - `STRIPE_PREMIUM_YEARLY_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`

### 6.5 Webhook de Producción

1. Stripe Dashboard (production mode) → **Webhooks**
2. **Endpoint URL:** `https://casicinco.com/api/stripe/webhook`
3. Mismo evento que en test
4. Copia el nuevo webhook secret
5. Actualiza en AWS Amplify

---

## 🧪 PASO 7: Testing Completo

### 7.1 Flujo de Suscripción

1. [ ] Usuario se registra
2. [ ] WelcomeModal aparece
3. [ ] Click en "Suscribirse Ahora"
4. [ ] Redirige a Stripe Checkout
5. [ ] Introduce tarjeta de test
6. [ ] Completa pago
7. [ ] Redirige de vuelta a la app
8. [ ] Estado en perfil muestra "Premium"

### 7.2 Verificar en Stripe Dashboard

1. Dashboard → **Customers**
2. Verifica que se creó el customer
3. Dashboard → **Subscriptions**
4. Verifica que se creó la suscripción con trial de 30 días

### 7.3 Verificar en Supabase

```sql
-- Verificar customer creado
SELECT * FROM customers WHERE email = 'test@example.com';

-- Verificar suscripción creada
SELECT * FROM subscriptions WHERE user_id = 'uuid-del-usuario';
```

---

## 🐛 Troubleshooting

### Error: "Plan no disponible"

**Causa:** Falta `STRIPE_PREMIUM_MONTHLY_PRICE_ID` o `STRIPE_PREMIUM_YEARLY_PRICE_ID`

**Solución:**

**En Producción (AWS Amplify):**
1. Verifica que creaste los precios en Stripe
2. Copia los Price IDs correctos
3. AWS Amplify Console → Environment variables → Añade las variables
4. **Redeploy** la aplicación
5. Espera 5-10 minutos a que complete el deploy

**En Local:**
1. Añade las variables a `.env.local`
2. Reinicia el servidor (`npm run dev`)

---

### Error: "No autenticado"

**Causa:** Usuario no está logueado

**Solución:**
1. Inicia sesión primero
2. Luego intenta suscribirte

---

### Error: "Error al crear sesión de pago"

**Causa:** Puede ser que falte `STRIPE_SECRET_KEY` o esté mal configurada

**Solución:**

**En Producción (AWS Amplify):**
1. AWS Amplify Console → Environment variables
2. Verifica que `STRIPE_SECRET_KEY` existe
3. Verifica que empieza con `sk_test_` (test) o `sk_live_` (producción)
4. Si la modificaste, haz **Redeploy**
5. Revisa logs: AWS Amplify → Tu App → Build logs

**En Local:**
1. Verifica que `STRIPE_SECRET_KEY` existe en `.env.local`
2. Verifica el formato de la key
3. Reinicia el servidor
4. Revisa la consola del servidor para más detalles

---

### Webhook no funciona

**Causa:** Webhook secret incorrecto o endpoint no accesible

**Solución:**
1. En local: Usa Stripe CLI para forward eventos
2. En producción: Verifica que la URL del webhook es correcta
3. Verifica que `STRIPE_WEBHOOK_SECRET` está configurado
4. Revisa logs en Stripe Dashboard → Webhooks → [tu webhook] → Attempted events

---

## 📚 Recursos

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Documentación Stripe:** https://stripe.com/docs
- **Tarjetas de prueba:** https://stripe.com/docs/testing#cards
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Webhooks:** https://stripe.com/docs/webhooks

---

## ✅ Checklist Final

- [ ] Cuenta de Stripe creada
- [ ] API Keys copiadas a `.env.local`
- [ ] Producto "Casi Cinco Premium" creado
- [ ] Precio mensual (2,99€) creado → Price ID copiado
- [ ] Precio anual (24,99€) creado → Price ID copiado
- [ ] Webhook configurado (producción)
- [ ] Variables de entorno actualizadas
- [ ] Servidor reiniciado
- [ ] Flujo de suscripción probado con tarjeta de test
- [ ] Verificado en Stripe Dashboard
- [ ] Verificado en Supabase

---

**¡Listo para aceptar pagos!** 💰


