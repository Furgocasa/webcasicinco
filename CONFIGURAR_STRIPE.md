# 💳 Configurar Stripe - Guía Paso a Paso

**Fecha:** 21 Octubre 2025  
**Tiempo estimado:** 30-40 minutos

---

## 🎯 Objetivo

Configurar Stripe para aceptar pagos de suscripciones mensuales (2,99€/mes) y anuales (24,99€/año) con sistema de trial de 30 días.

---

## 📋 Pre-requisitos

- [ ] Cuenta de Stripe (https://dashboard.stripe.com/register)
- [ ] Acceso al proyecto en local
- [ ] Archivo `.env.local` creado

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

### 2.3 Añadir a .env.local

Crea o edita el archivo `.env.local` en la raíz del proyecto:

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

### 3.5 Actualizar .env.local

Añade los Price IDs al archivo `.env.local`:

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

### 4.3 Copiar Webhook Secret

1. Dentro del webhook creado, verás: **Signing secret**
2. Click **Reveal** y copia el secret
3. Añade a `.env.local`:

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

### 5.1 Archivo .env.local Completo

Tu `.env.local` debe tener estas variables Stripe:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51A2B3C4D...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51A2B3C4D...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1A2B3C4D...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_9J8I7H6G...
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

### 5.2 Reiniciar Servidor de Desarrollo

```bash
# Detener el servidor (Ctrl+C)
# Iniciar nuevamente
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
1. Verifica que creaste los precios en Stripe
2. Copia los Price IDs correctos
3. Añádelos a `.env.local`
4. Reinicia el servidor

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
1. Verifica que `STRIPE_SECRET_KEY` existe en `.env.local`
2. Verifica que empieza con `sk_test_` (modo test) o `sk_live_` (producción)
3. Revisa la consola del servidor para más detalles

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


