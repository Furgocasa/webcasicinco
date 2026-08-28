-- Voto del usuario (👍 / 👎) sobre cada respuesta del Tío Viajero.
-- Independiente de la valoración IA. Aplicado en vivo 28 ago (MCP Casi 5).

ALTER TABLE public.chatbot_analytics
  ADD COLUMN IF NOT EXISTS voto_usuario text CHECK (voto_usuario IN ('up', 'down')),
  ADD COLUMN IF NOT EXISTS votado_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_chatbot_analytics_voto
  ON public.chatbot_analytics (voto_usuario)
  WHERE voto_usuario IS NOT NULL;
