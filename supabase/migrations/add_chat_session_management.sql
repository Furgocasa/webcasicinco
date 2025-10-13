-- Migración: Sistema de sesiones de chat con soft delete
-- Fecha: 2025-10-13
-- Descripción: Agregar campo is_active para marcar conversaciones obsoletas en lugar de borrar

-- 1. Agregar columna is_active a chat_history (por defecto true = activa)
ALTER TABLE chat_history 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Agregar columna session_ended_at para saber cuándo terminó la sesión
ALTER TABLE chat_history 
ADD COLUMN IF NOT EXISTS session_ended_at TIMESTAMP WITH TIME ZONE;

-- 3. Crear índice para consultas eficientes por is_active
CREATE INDEX IF NOT EXISTS idx_chat_history_active 
ON chat_history(user_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_session_active 
ON chat_history(session_id, is_active, created_at DESC);

-- 4. Actualizar mensajes existentes para que sean activos
UPDATE chat_history SET is_active = true WHERE is_active IS NULL;

-- 5. Comentar las columnas para documentación
COMMENT ON COLUMN chat_history.is_active IS 'Indica si el mensaje es parte de la conversación activa (true) o fue marcado como obsoleto al hacer reset (false)';
COMMENT ON COLUMN chat_history.session_ended_at IS 'Timestamp cuando el usuario hizo reset de la conversación';

-- 6. Índice compuesto para mejor performance en queries de historial activo
CREATE INDEX IF NOT EXISTS idx_chat_history_user_active_created 
ON chat_history(user_id, is_active, created_at DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_chat_history_session_active_created 
ON chat_history(session_id, is_active, created_at DESC) 
WHERE is_active = true;

