# 💰 Sistema de Monetización - Casi Cinco

**Versión:** 4.0.0  
**Fecha:** 12 de Octubre de 2025  
**Estado:** ✅ Implementado

---

## 🎯 Modelo de Negocio

Casi Cinco utiliza un modelo **freemium con trial de 30 días**.

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

#### Fase 1: Trial de 30 días (REQUIERE TARJETA)
- ✅ **Todos los nuevos usuarios** obtienen 30 días gratis
- ✅ Acceso completo a todas las funciones
- ⚠️ **Requiere tarjeta de crédito** para activar el trial
- ✅ **No se cobra hasta el día 31** - puedes cancelar antes sin cargos
- ✅ Banner informativo con días restantes
- ✅ **Conversión automática** a plan seleccionado al terminar trial

#### Fase 2: Después del Trial (Día 31)
**Opción A - Premium Mensual:**
- 💳 **2,99€/mes**
- Cancela cuando quieras
- Facturado mensualmente
- Acceso total a todas las funciones

**Opción B - Premium Anual (Recomendado):**
- 💳 **24,99€/año**
- ✅ **Ahorra 30%** (2.08€/mes)
- ✅ Equivale a **10 meses al precio de 12**
- Facturado anualmente
- Acceso total + soporte prioritario

---

## 💳 Precios

| Plan | Precio | Trial | Características |
|------|--------|-------|-----------------|
| **Gratis** (admin) | 0€ | - | Acceso perpetuo (marcado por admin) |
| **Mensual** | 2,99€/mes | 30 días | Requiere tarjeta, cobra desde día 31 |
| **Anual** | 24,99€/año | 30 días | 2,08€/mes, ahorra 10,89€, soporte prioritario |

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

### Nuevo Usuario:
```
1. Registro → Selecciona plan (Mensual o Anual)
2. Introduce tarjeta en Stripe Checkout
3. Trial de 30 días comienza (sin cobro)
4. Usa mapa/chatbot/rutas gratis por 30 días
5. Banner muestra días restantes
6. Día 7 → Advertencia "quedan 23 días de trial"
7. Día 31 → Stripe cobra automáticamente 2,99€ o 24,99€
8. Si cancela antes del día 31 → No se cobra nada
```

### Usuario Existente (sin trial):
```
1. Login → Verificar suscripción
2. Si no tiene → Paywall modal
3. Suscribirse o quedarse sin acceso
```

### Usuario Gratis (marcado por admin):
```
1. Login → Acceso total
2. Sin límites de tiempo
3. Sin paywall nunca
```

---

## 🎨 UX del Paywall

### Banner de Trial:
- 🟢 **30-8 días:** Banner azul/púrpura
- 🟠 **7-1 días:** Banner naranja/rojo (advertencia)
- ⚪ **0 días:** Banner oculto, solo paywall modal

### Paywall Modal:
- **Diseño elegante** con gradientes
- **2 planes** lado a lado
- **Plan anual destacado** con badge "Ahorra 30%"
- **Botón "Seguir explorando"** si está en trial
- **Redirección a /pricing** si no tiene acceso

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
- `supabase/migrations/add_trial_and_free_users.sql` - Migración completa

### Hooks:
- `lib/hooks/useUserAccess.ts` - Hook principal de acceso

### Componentes:
- `components/auth/AccessGuard.tsx` - Guardia de acceso
- `components/auth/PaywallModal.tsx` - Modal de suscripción
- `components/layout/TrialBanner.tsx` - Banner de trial

### APIs:
- `app/api/user/access/route.ts` - Verificar acceso
- `app/api/admin/users/set-free/route.ts` - Marcar como gratis

### Configuración:
- `lib/stripe/plans.ts` - Planes y precios

---

## ✅ Checklist de Implementación

- [x] Migración SQL de base de datos
- [x] Funciones SQL (trial, acceso, marcar gratis)
- [x] Hook useUserAccess
- [x] AccessGuard component
- [x] PaywallModal component
- [x] TrialBanner component
- [x] API de verificación de acceso
- [x] API para marcar usuarios gratis
- [x] Actualizar precios (2.99€/24.99€)
- [ ] Integrar AccessGuard en /mapa
- [ ] Integrar AccessGuard en /ruta  
- [ ] Integrar TrialBanner en layout
- [ ] Actualizar página de usuarios (botón marcar gratis)
- [ ] Testing completo del flujo

---

## 🚀 Próximos Pasos

1. Ejecutar migración SQL en Supabase
2. Integrar AccessGuard en páginas protegidas
3. Añadir TrialBanner al layout principal
4. Actualizar panel de admin de usuarios
5. Crear página de pricing mejorada
6. Configurar Stripe con nuevos precios
7. Testing end-to-end del flujo completo

---

**Sistema de monetización listo para implementar** ✅

