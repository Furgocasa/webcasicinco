// Types for Stripe integration

export type SubscriptionStatus = 
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type SubscriptionPlan = 
  | 'free'
  | 'premium_monthly'
  | 'premium_yearly'
  | 'admin_monthly';

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  limits: {
    routes: number | 'unlimited';
    favorites: number | 'unlimited';
    aiRequests: number | 'unlimited';
  };
}

export interface Customer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  stripe_customer_id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UsageLimits {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  routes_created_this_month: number;
  routes_limit: number;
  favorites_count: number;
  favorites_limit: number;
  ai_requests_this_month: number;
  ai_requests_limit: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  created_at: string;
}

export interface UserSubscriptionInfo {
  user_id: string;
  email: string;
  stripe_customer_id?: string;
  plan: SubscriptionPlan;
  status?: SubscriptionStatus;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  routes_created_this_month: number;
  routes_limit: number;
  favorites_count: number;
  favorites_limit: number;
  ai_requests_this_month: number;
  ai_requests_limit: number;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface BillingPortalSession {
  url: string;
}
