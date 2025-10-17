-- ============================================
-- TABLA PARA ANALYTICS DE USUARIOS
-- ============================================
-- Propósito: Trackear interacciones para dashboard de estadísticas
-- Fecha: 17 de Octubre 2025

CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación (usuario autenticado o sesión anónima)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  
  -- Tipo de evento
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  
  -- Relación con lugar (si aplica)
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  place_name TEXT,
  place_category TEXT,
  
  -- Detalles del evento
  page_url TEXT,
  event_data JSONB, -- Datos específicos del evento
  
  -- Contexto técnico
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  user_agent TEXT,
  referrer TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_user_analytics_user 
ON user_analytics(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_analytics_session 
ON user_analytics(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type 
ON user_analytics(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_analytics_place 
ON user_analytics(place_id, created_at DESC) 
WHERE place_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_analytics_created 
ON user_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_analytics_device 
ON user_analytics(device_type, created_at DESC);

-- Índice GIN para búsquedas en event_data JSONB
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_data 
ON user_analytics USING gin(event_data);

-- Comentarios
COMMENT ON TABLE user_analytics IS 'Eventos de usuarios para analytics: clicks, búsquedas, interacciones';
COMMENT ON COLUMN user_analytics.event_type IS 'Tipos: page_view, map_marker_click, place_detail_click, place_phone_click, mobile_filter_close, etc.';
COMMENT ON COLUMN user_analytics.event_data IS 'Datos específicos del evento en formato JSON flexible: filters, results_count, position, etc.';
COMMENT ON COLUMN user_analytics.session_id IS 'ID de sesión único generado en el cliente (localStorage)';
COMMENT ON COLUMN user_analytics.device_type IS 'Tipo de dispositivo: mobile, desktop o tablet';

