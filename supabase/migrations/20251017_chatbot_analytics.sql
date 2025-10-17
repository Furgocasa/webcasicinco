-- ============================================
-- TABLA PARA ANÁLISIS DE CONVERSACIONES DEL CHATBOT
-- ============================================
-- Propósito: Guardar y analizar todas las conversaciones con el Tío Viajero IA
-- Fecha: 17 de Octubre 2025

CREATE TABLE IF NOT EXISTS chatbot_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Info del usuario
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  session_id TEXT,
  
  -- Conversación
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  conversation_context JSONB, -- Historial previo (últimos 3 mensajes)
  
  -- Metadata de la búsqueda
  detected_intent JSONB, -- {category, city, province, textSearch, topN}
  places_found INTEGER DEFAULT 0, -- Cuántos lugares encontró
  query_time_ms INTEGER, -- Tiempo de respuesta en ms
  
  -- Análisis IA
  ai_summary TEXT, -- Resumen de qué se preguntó
  quality_assessment TEXT CHECK (quality_assessment IN ('correcta', 'mejorable', 'incorrecta', NULL)),
  quality_reasoning TEXT, -- Por qué se clasificó así
  suggested_improvements TEXT, -- Sugerencias de mejora
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ -- Cuándo se analizó con IA
);

-- Crear índices después de la tabla
CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_created_at 
ON chatbot_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_quality 
ON chatbot_analytics(quality_assessment) 
WHERE quality_assessment IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_user 
ON chatbot_analytics(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_session 
ON chatbot_analytics(session_id) 
WHERE session_id IS NOT NULL;

-- Comentarios
COMMENT ON TABLE chatbot_analytics IS 'Análisis de conversaciones del chatbot Tío Viajero para mejora continua';
COMMENT ON COLUMN chatbot_analytics.detected_intent IS 'Intención detectada: {category, city, province, textSearch, topN}';
COMMENT ON COLUMN chatbot_analytics.quality_assessment IS 'Clasificación IA: correcta, mejorable o incorrecta';
COMMENT ON COLUMN chatbot_analytics.conversation_context IS 'Historial previo de la conversación (últimos 3 mensajes)';

