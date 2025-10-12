import { PlanConfig, SubscriptionPlan } from '@/types/stripe';

/**
 * Configuración de planes de suscripción
 * 
 * IMPORTANTE: Actualizar stripePriceId después de crear los productos en Stripe
 */
export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Gratis',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Ver lugares publicados',
      'Búsqueda y filtros básicos',
      'Hasta 3 rutas por mes',
      'Hasta 10 favoritos',
      'Ver en mapa',
    ],
    limits: {
      routes: 3,
      favorites: 10,
      aiRequests: 5,
    },
  },
  
  premium_monthly: {
    id: 'premium_monthly',
    name: 'Premium Mensual',
    price: 4.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    features: [
      'Todo de Plan Gratis +',
      'Rutas ilimitadas',
      'Favoritos ilimitados',
      'Recomendaciones IA personalizadas',
      'Listas curadas premium',
      'Planificador avanzado',
      'Mapas offline (PWA)',
      'Sin anuncios',
      'Descuentos exclusivos',
    ],
    limits: {
      routes: 'unlimited',
      favorites: 'unlimited',
      aiRequests: 'unlimited',
    },
  },
  
  premium_yearly: {
    id: 'premium_yearly',
    name: 'Premium Anual',
    price: 49.99,
    currency: 'EUR',
    interval: 'year',
    stripePriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    features: [
      'Todo de Premium Mensual +',
      'Ahorra 17% (2 meses gratis)',
      'Acceso anticipado a features',
      'Soporte prioritario',
    ],
    limits: {
      routes: 'unlimited',
      favorites: 'unlimited',
      aiRequests: 'unlimited',
    },
  },
  
  admin_monthly: {
    id: 'admin_monthly',
    name: 'Admin',
    price: 99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: process.env.STRIPE_ADMIN_MONTHLY_PRICE_ID,
    features: [
      'Todo de Premium +',
      'Indexar lugares ilimitados',
      'Panel de administración',
      'Analytics y estadísticas',
      'API access',
      'Gestión de contenido',
      'Soporte prioritario 24/7',
    ],
    limits: {
      routes: 'unlimited',
      favorites: 'unlimited',
      aiRequests: 'unlimited',
    },
  },
};

/**
 * Obtiene la configuración de un plan
 */
export function getPlan(planId: SubscriptionPlan): PlanConfig {
  return PLANS[planId];
}

/**
 * Verifica si un plan es premium o superior
 */
export function isPremiumPlan(planId: SubscriptionPlan): boolean {
  return planId !== 'free';
}

/**
 * Verifica si un plan es admin
 */
export function isAdminPlan(planId: SubscriptionPlan): boolean {
  return planId === 'admin_monthly';
}

/**
 * Calcula el ahorro del plan anual vs mensual
 */
export function getYearlySavings(): number {
  const monthlyPrice = PLANS.premium_monthly.price;
  const yearlyPrice = PLANS.premium_yearly.price;
  const yearlyMonthly = yearlyPrice / 12;
  const savings = (monthlyPrice - yearlyMonthly) * 12;
  return Math.round(savings * 100) / 100;
}

/**
 * Formatea el precio para mostrar
 */
export function formatPrice(price: number, currency: string = 'EUR'): string {
  if (price === 0) return 'Gratis';
  
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Obtiene el texto del intervalo
 */
export function getIntervalText(interval: 'month' | 'year'): string {
  return interval === 'month' ? 'mes' : 'año';
}
