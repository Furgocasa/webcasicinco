# 💰 Sistema de Monetización - Casi Cinco

**Versión:** 5.0.0  
**Fecha:** 21 de Octubre de 2025  
**Estado:** ✅ Implementado y Testeado

---

## 🎯 Modelo de Negocio

Casi Cinco utiliza un modelo **freemium con trial de 30 días SIN TARJETA**.

---

## 👥 3 Tipos de Usuarios

### 1. 👑 **Admin**
- **Acceso:** Total y perpetuo
- **Funciones:**
  - Panel de administración completo
  - Indexar lugares ilimitados
  - Gestionar usuarios (marcar como gratis)
  - Ver analytics y estadísticas
  - API access
- **Precio:** N/A (cuenta especial)

### 2. 🎁 **Usuarios Gratis** (Marcados por Admin)
- **Acceso:** Total y perpetuo (sin pagar)
- **Funciones:**
  - Acceso completo a mapa
  - Chatbot IA ilimitado
  - Planificador de rutas
  - Favoritos ilimitados
  - Todos los filtros
- **Precio:** Gratis (marcado por admin)
- **Uso:** Para colaboradores, testers, amigos, familia, etc.

### 3. 👤 **Usuarios Regulares**

#### Fase 1: Trial de 30 días (SIN TARJETA) ✨
- ✅ **Todos los nuevos usuarios** obtienen 30 días gratis automáticamente
- ✅ Acceso completo a todas las funciones desde el día 1
- ✨ **NO requiere tarjeta de crédito** para activar el trial
- 🎉 **WelcomeModal en primer login** con explicación clara del trial
- ✅ Banner informativo con días restantes (cambia de color según urgencia)
- 💡 **Opción de suscribirse durante el trial** (respeta días restantes, no cobra hasta expiración)

#### Fase 2: Trial en Curso (Días 1-30)
- 🟢 **Banner verde** (días 30-21): "Te quedan X días de trial"
- 🟡 **Banner amarillo** (días 20-11): Más visible
- 🟠 **Banner naranja** (días 10-6): Urgencia media
- 🔴 **Banner rojo** (días 5-1): Urgencia alta con CTA destacado
- 💬 Usuario puede suscribirse en cualquier momento desde:
  - WelcomeModal (primer login)
  - Banner superior
  - Página de perfil (tab "Suscripción")
  - Página `/pricing`

#### Fase 3: Trial Expirado (Día 31+)
- 🔒 **PaywallModal aparece** bloqueando acceso a páginas premium
- 🌫️ Contenido aparece borroso/grisáceo
- 📢 Mensaje: "⏰ Tu Trial Ha Finalizado - Para seguir usando las herramientas..."
- 🎯 **Conversión forzosa**: Usuario debe elegir plan o perder acceso

#### Planes de Suscripción

**Opción A - Premium Mensual:**
- 💳 **2,99€/mes**
- Cancela cuando quieras
- Facturado mensualmente
- Acceso total a todas las funciones
- Renovación automática

**Opción B - Premium Anual (⭐ Recomendado):**
- 💳 **24,99€/año**
- ✅ **Ahorra 40%** (2,08€/mes vs 2,99€)
- ✅ Equivale a **10 meses al precio de 12**
- Facturado anualmente
- Acceso total + todas las funciones
- Badge especial "Plan Anual" en perfil

---

## 💳 Precios

| Plan | Precio | Trial | Características |
|------|--------|-------|-----------------|
| **Gratis** (admin) | 0€ | - | Acceso perpetuo (marcado por admin), badge verde especial |
| **Trial** | 0€ | 30 días | SIN tarjeta, acceso completo, automático al registrarse |
| **Mensual** | 2,99€/mes | - | Renovación automática, cancela cuando quieras |
| **Anual** | 24,99€/año | - | 2,08€/mes, ahorra 40% (10,68€/año), badge especial |

---

## 🔒 Control de Acceso

### Páginas Protegidas:
1. **`/mapa`** - Mapa interactivo
2. **`/chatbot`** - Chatbot IA (Tío Viajero)
3. **`/ruta`** - Planificador de rutas

### Páginas Públicas:
- **`/`** - Home
- **`/metodologia`** - Metodología
- **`/pricing`** - Pricing
- **`/login`** - Login
- **`/registro`** - Registro
- **`/[category]/[province]/[slug]`** - Detalle de lugar

---

## 🛠️ Implementación Técnica

### 1. Base de Datos

#### Tabla: `auth.users` (metadata)
```sql
raw_user_meta_data: {
  role: 'admin' | 'user',
  is_free_user: boolean,
  trial_ends_at: timestamp
}
```

#### Funciones SQL:
- `handle_new_user()` - Trigger que añade trial de 30 días automáticamente
- `user_has_access(user_id)` - Verifica si un usuario tiene acceso
- `get_trial_days_remaining(user_id)` - Retorna días restantes de trial
- `set_user_as_free(user_id, is_free)` - Marca usuario como gratis (solo admin)

#### Vista: `user_access_info`
Vista práctica para ver el estado de acceso de todos los usuarios.

### 2. Hooks de React

#### `useUserAccess()`
```tsx
const {
  hasAccess,           // boolean - ¿Tiene acceso?
  isAdmin,             // boolean - ¿Es admin?
  isFreeUser,          // boolean - ¿Marcado como gratis?
  isInTrial,           // boolean - ¿En trial de 30 días?
  trialDaysRemaining,  // number - Días restantes
  trialEndsAt,         // Date - Cuándo termina trial
  subscriptionPlan,    // string - Plan actual
  subscriptionStatus,  // string - Estado suscripción
  needsSubscription,   // boolean - ¿Necesita suscribirse?
} = useUserAccess();
```

#### `useHasAccess()`
Hook simple que retorna solo `boolean` si tiene acceso.

#### `useUserAccessMessage()`
Retorna mensaje descriptivo del estado del usuario.

### 3. Componentes

#### `<AccessGuard>`
```tsx
<AccessGuard feature="mapa" requireAuth={true}>
  <MapPage />
</AccessGuard>
```

Protege contenido premium. Verifica acceso y muestra paywall si necesario.

#### `<PaywallModal>`
Modal elegante que muestra planes de suscripción cuando el usuario no tiene acceso.

#### `<TrialBanner>`
Banner superior que muestra días restantes de trial y botón de suscripción.

### 4. APIs

#### `GET /api/user/access`
Retorna el estado de acceso del usuario actual.

#### `POST /api/admin/users/set-free`
Marca un usuario como gratis (solo admin).

---

## 📊 Flujo de Usuario

### Nuevo Usuario (Experiencia Completa):
```
1. Registro → Email/contraseña o Google OAuth
2. ✨ Trial de 30 días comienza AUTOMÁTICAMENTE (sin tarjeta)
3. Primer Login → WelcomeModal aparece:
   "🎉 ¡Acabas de Iniciar tu Trial Gratuito!"
   - Explica 30 días sin tarjeta
   - Muestra opciones de planes (opcional suscribirse ya)
   - Botón "Empezar a Explorar" para cerrar modal
4. Días 1-30 → Usa mapa/chatbot/rutas gratis
5. Banner superior muestra días restantes (color según urgencia)
6. Puede suscribirse en cualquier momento:
   - Si se suscribe en día 10 → Trial respetado, cobra en día 31
   - Introduce tarjeta en Stripe
   - Estado cambia a "Premium en Trial"
7. Día 31 → Si NO se suscribió:
   - PaywallModal aparece (no se puede cerrar)
   - Contenido bloqueado/borroso
   - Debe elegir plan para continuar
8. Después de suscribirse → Acceso total permanente
```

### Usuario con Trial Activo:
```
1. Login → Banner muestra días restantes
2. Acceso completo a todo
3. En perfil → Tab "Suscripción":
   - Ver días restantes
   - Fecha de expiración
   - Botón "Suscribirse Ahora"
   - Info sobre planes
4. Puede explorar libremente sin presión
```

### Usuario con Trial Expirado (sin suscripción):
```
1. Login → PaywallModal aparece inmediatamente
2. No puede cerrar el modal
3. Contenido detrás aparece borroso
4. Debe elegir plan:
   - Mensual 2,99€/mes
   - Anual 24,99€/año
5. Al suscribirse → Modal desaparece, acceso restaurado
```

### Usuario Premium (Suscrito):
```
1. Login → Acceso total sin restricciones
2. Sin banners de trial
3. En perfil → Tab "Suscripción":
   - Ver plan actual (Mensual/Anual)
   - Fecha próxima renovación
   - Monto a cobrar
   - Botón "Gestionar Suscripción" (abre Stripe Portal)
   - Botón "Cambiar de Plan" (Mensual ↔ Anual)
   - Info: "Al cancelar: No se devuelve dinero, no nuevos cargos"
4. Puede cancelar desde Stripe Portal:
   - Acceso hasta fin del período pagado
   - Luego vuelve a paywall
```

### Usuario Gratis (marcado por admin):
```
1. Login → Acceso total perpetuo
2. En perfil → Tarjeta verde brillante:
   "🎁 Usuario Gratis (Cortesía)"
   Badge: "⭐ GRATIS PARA SIEMPRE"
   "✨ Acceso gratuito permanente otorgado por el administrador"
3. Sin banners, sin paywall, nunca
4. Sin límites de tiempo
```

---

## 🎨 UX del Paywall

### WelcomeModal (Primer Login):
- 🎉 **Aparece automáticamente** en primer login tras registro
- 🎨 **Diseño elegante** con gradiente indigo-purple
- 📝 **Mensaje claro:**
  - "¡Acabas de Iniciar tu Trial Gratuito!"
  - "30 días sin tarjeta de crédito"
  - Explica qué puede hacer
- 📦 **3 opciones presentadas:**
  - Trial Gratuito (30 días) → Botón: "Empezar a Explorar"
  - Plan Mensual (2,99€/mes)
  - Plan Anual (24,99€/año - Ahorra 40%)
- ✅ **Suscripción opcional** inmediata (respeta trial)
- 🚪 **Se puede cerrar** fácilmente
- 💾 **No vuelve a aparecer** (localStorage)

### TrialBanner (Durante Trial):
- 📍 **Posición:** Fixed top, debajo del header
- 🎨 **Color dinámico según días:**
  - 🟢 Verde (30-21 días): Tranquilo
  - 🟡 Amarillo (20-11 días): Atención
  - 🟠 Naranja (10-6 días): Advertencia
  - 🔴 Rojo (5-1 días): Urgencia
- 📝 **Texto:** "⏰ Te quedan X días de trial"
- 🔘 **Botón CTA:** "Suscríbete Ahora" (visible siempre)
- 📱 **Responsive:** Se adapta a móvil

### PaywallModal (Trial Expirado):
- 🔒 **Aparece automáticamente** al expirar trial
- ❌ **No se puede cerrar** (fuerza conversión)
- 🌫️ **Backdrop oscuro** con blur del contenido
- 📢 **Mensaje claro:**
  - "⏰ Tu Trial Ha Finalizado"
  - "Para poder seguir usando las herramientas, debes elegir uno de estos planes de suscripción:"
- 📦 **2 planes lado a lado:**
  - Mensual: 2,99€/mes
  - Anual: 24,99€/año (Badge: "Ahorra 40%")
- 🎨 **Diseño elegante** con gradientes indigo-purple
- 🔘 **Botones grandes** de suscripción
- 💳 **Redirige a Stripe** al hacer click

---

## 💡 Lógica de Acceso

```typescript
function hasAccess(user) {
  // 1. ¿Es admin?
  if (user.role === 'admin') return true;
  
  // 2. ¿Marcado como gratis por admin?
  if (user.is_free_user === true) return true;
  
  // 3. ¿En período de trial?
  if (user.trial_ends_at > NOW()) return true;
  
  // 4. ¿Suscripción activa?
  if (user.subscription.status === 'active') return true;
  
  // 5. No tiene acceso
  return false;
}
```

---

## 🚀 Integración con Stripe

### Productos en Stripe:
1. **Premium Mensual** - 2,99€/mes
   - Price ID: `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
   
2. **Premium Anual** - 24,99€/año
   - Price ID: `STRIPE_PREMIUM_YEARLY_PRICE_ID`

### Webhooks:
- `checkout.session.completed` - Crear/actualizar suscripción
- `customer.subscription.updated` - Actualizar estado
- `customer.subscription.deleted` - Cancelar suscripción
- `invoice.payment_succeeded` - Renovación exitosa
- `invoice.payment_failed` - Renovación fallida

---

## 📱 Experiencia Móvil

### Banner de Trial:
- Responsive y no intrusivo
- Se puede cerrar temporalmente
- Botón CTA en últimos 7 días

### Paywall Modal:
- Full screen en móvil
- Cards de planes apiladas verticalmente
- Touch-friendly buttons (48px+ altura)
- Fácil comparación de planes

---

## 🔐 Seguridad

### Protecciones:
- ✅ Verificación en **servidor** (API routes)
- ✅ Verificación en **cliente** (AccessGuard)
- ✅ Middleware para rutas protegidas
- ✅ RLS (Row Level Security) en Supabase
- ✅ Solo admin puede marcar usuarios gratis

### Prevención de Fraudes:
- Verificación de email en registro
- Límite de 1 trial por email
- Stripe maneja pagos seguros (PCI compliant)
- Webhooks verificados con firma

---

## 📈 Métricas a Trackear

### KPIs de Conversión:
- **Trial Start Rate:** % de visitantes que se registran
- **Trial-to-Paid Rate:** % de trials que se convierten a pago
- **Monthly vs Yearly:** % que elige cada plan
- **Churn Rate:** % de cancelaciones por mes
- **LTV (Lifetime Value):** Valor promedio por usuario

### Analytics Sugeridos:
- Dashboard con conversión de trials
- Gráfico de días en trial antes de suscribirse
- Comparativa mensual vs anual
- Razones de cancelación

---

## 🎯 Estrategias de Conversión

### Durante el Trial:
1. **Día 1:** Email de bienvenida con guía de uso
2. **Día 7:** Email con tips avanzados
3. **Día 14:** Email medio trial con oferta
4. **Día 23:** Banner naranja "Quedan 7 días"
5. **Día 27:** Email recordatorio + descuento
6. **Día 30:** Paywall modal + email de upgrade

### Incentivos:
- 🎁 **Anual:** Destac

ado con "Ahorra 30%"
- 🏆 **Descuento primer mes:** 50% OFF primer mes (opcional)
- 👥 **Referidos:** 1 mes gratis por referido
- 📅 **Black Friday:** Descuentos especiales

---

## 🛠️ Comandos Útiles

### Marcar usuario como gratis (desde SQL):
```sql
SELECT set_user_as_free('user-uuid-here', true);
```

### Ver estado de todos los usuarios:
```sql
SELECT * FROM user_access_info;
```

### Ver trial de un usuario:
```sql
SELECT 
  email,
  trial_ends_at,
  get_trial_days_remaining(id) as days_remaining
FROM auth.users
WHERE id = 'user-uuid';
```

---

## 📚 Archivos del Sistema

### Base de Datos:
- `supabase/migrations/001_add_trial_system.sql` - Migración completa con trial automático

### Hooks:
- `lib/hooks/useUserAccess.ts` - Hook principal de acceso (hasAccess, isInTrial, etc.)
- `lib/hooks/useAuth.ts` - Hook de autenticación

### Componentes (✅ Actualizados Oct 2025):
- `components/auth/WelcomeModal.tsx` - ✨ Modal de bienvenida (primer login)
- `components/auth/PaywallModal.tsx` - 🔒 Modal al expirar trial
- `components/auth/AccessGuard.tsx` - 🛡️ Guardia de acceso a páginas premium
- `components/layout/TrialBanner.tsx` - ⏰ Banner con días restantes

### Páginas (✅ Actualizadas):
- `app/(public)/registro/page.tsx` - Página de registro (NO modificada)
- `app/(public)/perfil/page.tsx` - ✅ Perfil con tab "Suscripción" mejorado
- `app/(public)/pricing/page.tsx` - Página de planes

### APIs:
- `app/api/user/access/route.ts` - Verificar acceso del usuario
- `app/api/stripe/create-checkout/route.ts` - Crear sesión de Stripe (respeta trial)
- `app/api/stripe/create-portal/route.ts` - Portal de gestión de Stripe
- `app/api/stripe/webhook/route.ts` - Webhooks de Stripe

### Configuración:
- `lib/stripe/client.ts` - Cliente de Stripe con soporte trial
- `.env.local` - Variables de entorno (Stripe keys)

---

## ✅ Checklist de Implementación

### Backend y Base de Datos:
- [x] Migración SQL de base de datos
- [x] Funciones SQL (trial automático, acceso, marcar gratis)
- [x] Trigger `handle_new_user()` (asigna trial al registrarse)
- [x] Función `check_trial_expired()`
- [x] Función `get_trial_days_remaining()`

### Hooks y Utilidades:
- [x] Hook `useUserAccess` (completo)
- [x] Hook `useAuth` (integrado)

### Componentes UI:
- [x] `WelcomeModal` - Modal de bienvenida mejorado
- [x] `PaywallModal` - Modal al expirar trial actualizado
- [x] `TrialBanner` - Banner con colores dinámicos
- [x] `AccessGuard` - Protección de páginas

### Páginas:
- [x] `app/(public)/perfil/page.tsx` - Tab suscripción mejorado
- [x] Usuario FREE visible con badge verde especial
- [x] Info de cancelación clara
- [x] Botón "Cambiar de Plan"
- [x] Página de pricing (`/pricing`)

### APIs y Stripe:
- [x] API `/api/user/access`
- [x] API `/api/stripe/create-checkout` (respeta trial)
- [x] API `/api/stripe/create-portal`
- [x] API `/api/stripe/webhook`
- [x] Actualizar precios (2.99€/24.99€)
- [x] Lógica trial en Stripe

### Integración:
- [x] AccessGuard en `/mapa`
- [x] AccessGuard en `/ruta`
- [x] AccessGuard en `/chatbot`
- [x] TrialBanner en layout principal
- [x] WelcomeModal en layout

### Testing y Deploy:
- [x] Testing local del flujo completo
- [x] Commit y push a repositorio
- [ ] **Deploy a producción** (pendiente)
- [ ] **Configurar Stripe producción** (pendiente)
- [ ] Testing en producción

---

## 🚀 Próximos Pasos

### INMEDIATO (Hoy):
1. ✅ **Deploy a producción** (AWS Amplify)
2. 🔧 **Configurar Stripe en producción:**
   - Crear productos (Mensual 2,99€ / Anual 24,99€)
   - Configurar webhook
   - Añadir API keys a variables de entorno
3. 🧪 **Testing end-to-end en producción:**
   - Registrar usuario de prueba
   - Verificar WelcomeModal
   - Probar trial de 30 días
   - Simular expiración de trial
   - Verificar PaywallModal
   - Probar suscripción completa

### CORTO PLAZO (Esta semana):
4. 📊 **Monitorear métricas:**
   - Tasa de registro
   - Conversión trial → pago
   - Tiempo promedio hasta suscripción
5. 🎨 **Ajustes UX** según feedback inicial

---

**Sistema de monetización listo para implementar** ✅

