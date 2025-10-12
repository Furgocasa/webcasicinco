-- ============================================================================
-- CASI CINCO - SISTEMA DE MONETIZACIÓN CON STRIPE
-- ============================================================================
-- Ejecuta este SQL DESPUÉS de supabase_setup.sql
-- ============================================================================

-- ============================================================================
-- ENUM: subscription_status
-- ============================================================================
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid'
);

-- ============================================================================
-- ENUM: subscription_plan
-- ============================================================================
CREATE TYPE subscription_plan AS ENUM (
  'free',
  'premium_monthly',
  'premium_yearly',
  'admin_monthly'
);

-- ============================================================================
-- TABLA: customers
-- Almacena la relación entre usuarios y Stripe customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_user ON public.customers(user_id);
CREATE INDEX idx_customers_stripe ON public.customers(stripe_customer_id);

-- ============================================================================
-- TABLA: subscriptions
-- Almacena las suscripciones activas y su estado
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================================
-- TABLA: payments
-- Historial de todos los pagos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- en céntimos
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_stripe ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created ON public.payments(created_at DESC);

-- ============================================================================
-- TABLA: usage_limits
-- Límites de uso según el plan del usuario
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  routes_created_this_month INTEGER DEFAULT 0,
  routes_limit INTEGER DEFAULT 3,
  favorites_count INTEGER DEFAULT 0,
  favorites_limit INTEGER DEFAULT 10,
  ai_requests_this_month INTEGER DEFAULT 0,
  ai_requests_limit INTEGER DEFAULT 5,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_limits_user ON public.usage_limits(user_id);

-- ============================================================================
-- TABLA: invoices
-- Facturas generadas por Stripe
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  amount_paid INTEGER NOT NULL,
  amount_due INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) NOT NULL,
  invoice_pdf VARCHAR(500),
  hosted_invoice_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON public.invoices(user_id);
CREATE INDEX idx_invoices_stripe ON public.invoices(stripe_invoice_id);

-- ============================================================================
-- FUNCIÓN: get_user_plan
-- Obtiene el plan actual del usuario
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS subscription_plan AS $$
DECLARE
  user_plan subscription_plan;
BEGIN
  SELECT plan INTO user_plan
  FROM subscriptions
  WHERE user_id = user_uuid
    AND status IN ('trialing', 'active')
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(user_plan, 'free'::subscription_plan);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: check_usage_limit
-- Verifica si el usuario puede realizar una acción según sus límites
-- ============================================================================
CREATE OR REPLACE FUNCTION check_usage_limit(
  user_uuid UUID,
  limit_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  max_limit INTEGER;
  user_plan subscription_plan;
BEGIN
  -- Obtener plan del usuario
  user_plan := get_user_plan(user_uuid);
  
  -- Si es premium o admin, sin límites
  IF user_plan IN ('premium_monthly', 'premium_yearly', 'admin_monthly') THEN
    RETURN TRUE;
  END IF;
  
  -- Para usuarios free, verificar límites
  SELECT 
    CASE limit_type
      WHEN 'routes' THEN routes_created_this_month
      WHEN 'favorites' THEN favorites_count
      WHEN 'ai' THEN ai_requests_this_month
    END,
    CASE limit_type
      WHEN 'routes' THEN routes_limit
      WHEN 'favorites' THEN favorites_limit
      WHEN 'ai' THEN ai_requests_limit
    END
  INTO current_usage, max_limit
  FROM usage_limits
  WHERE user_id = user_uuid;
  
  -- Si no existe registro, crearlo
  IF NOT FOUND THEN
    INSERT INTO usage_limits (user_id, plan) VALUES (user_uuid, 'free');
    RETURN TRUE;
  END IF;
  
  -- Verificar si está dentro del límite
  RETURN current_usage < max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: increment_usage
-- Incrementa el contador de uso
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_usage(
  user_uuid UUID,
  limit_type VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
  UPDATE usage_limits
  SET 
    routes_created_this_month = CASE WHEN limit_type = 'routes' 
      THEN routes_created_this_month + 1 ELSE routes_created_this_month END,
    favorites_count = CASE WHEN limit_type = 'favorites' 
      THEN favorites_count + 1 ELSE favorites_count END,
    ai_requests_this_month = CASE WHEN limit_type = 'ai' 
      THEN ai_requests_this_month + 1 ELSE ai_requests_this_month END,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Si no existe, crear
  IF NOT FOUND THEN
    INSERT INTO usage_limits (user_id, plan) VALUES (user_uuid, 'free');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: reset_monthly_limits
-- Resetea los límites mensuales (ejecutar con cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_monthly_limits()
RETURNS VOID AS $$
BEGIN
  UPDATE usage_limits
  SET 
    routes_created_this_month = 0,
    ai_requests_this_month = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_reset_date < CURRENT_DATE - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para customers
CREATE POLICY "Users can view own customer data"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customers"
  ON public.customers FOR SELECT
  USING (is_admin());

-- Políticas para subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (is_admin());

-- Políticas para payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (is_admin());

-- Políticas para usage_limits
CREATE POLICY "Users can view own usage limits"
  ON public.usage_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage limits"
  ON public.usage_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all usage limits"
  ON public.usage_limits FOR ALL
  USING (is_admin());

-- Políticas para invoices
CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (is_admin());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Actualizar updated_at automáticamente
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON public.usage_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VISTA: user_subscription_info
-- Vista consolidada de información de suscripción
-- ============================================================================
CREATE OR REPLACE VIEW user_subscription_info AS
SELECT 
  u.id as user_id,
  u.email,
  c.stripe_customer_id,
  s.plan,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end,
  ul.routes_created_this_month,
  ul.routes_limit,
  ul.favorites_count,
  ul.favorites_limit,
  ul.ai_requests_this_month,
  ul.ai_requests_limit
FROM auth.users u
LEFT JOIN customers c ON c.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('trialing', 'active')
LEFT JOIN usage_limits ul ON ul.user_id = u.id;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Crear límites por defecto para usuarios existentes
INSERT INTO usage_limits (user_id, plan)
SELECT id, 'free'::subscription_plan
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM usage_limits)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.customers IS 'Relación entre usuarios de Supabase y customers de Stripe';
COMMENT ON TABLE public.subscriptions IS 'Suscripciones activas y su estado en Stripe';
COMMENT ON TABLE public.payments IS 'Historial completo de pagos procesados';
COMMENT ON TABLE public.usage_limits IS 'Límites de uso según el plan del usuario';
COMMENT ON TABLE public.invoices IS 'Facturas generadas por Stripe';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

SELECT '✅ Setup de Stripe completado correctamente!' as message;
