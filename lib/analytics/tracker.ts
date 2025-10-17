/**
 * Sistema de tracking de eventos de usuarios
 * 
 * Trackea interacciones importantes para analytics del dashboard admin
 */

// Generar o recuperar session_id único
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Detectar tipo de dispositivo
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Trackear un evento de usuario
 * 
 * @param eventType - Tipo de evento: 'map_marker_click', 'place_view', 'place_phone_click', etc.
 * @param eventCategory - Categoría: 'map', 'engagement', 'conversion', 'search'
 * @param data - Datos específicos del evento
 */
export async function trackEvent(
  eventType: string,
  eventCategory: string,
  data?: {
    place_id?: string;
    place_name?: string;
    place_category?: string;
    [key: string]: any;
  }
) {
  try {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined') return;

    // No trackear en desarrollo (opcional, descomentar si quieres)
    // if (process.env.NODE_ENV === 'development') return;

    const payload = {
      event_type: eventType,
      event_category: eventCategory,
      session_id: getSessionId(),
      place_id: data?.place_id || null,
      place_name: data?.place_name || null,
      place_category: data?.place_category || null,
      page_url: window.location.pathname,
      device_type: getDeviceType(),
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      event_data: data || {}
    };

    // Enviar de forma asíncrona sin esperar respuesta
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true // Importante: permite que se envíe incluso si el usuario cierra la página
    }).catch(err => {
      // Silenciar errores (no afectar UX)
      console.debug('Analytics error:', err);
    });

  } catch (error) {
    // No fallar la app si analytics falla
    console.debug('Error tracking event:', error);
  }
}

/**
 * Tipos de eventos más comunes (para autocompletado)
 */
export const EVENTS = {
  // Navegación
  PAGE_VIEW: 'page_view',
  
  // Mapa
  MAP_MARKER_CLICK: 'map_marker_click',
  MAP_FILTER_CHANGE: 'map_filter_change',
  
  // Móvil específico
  MOBILE_FILTER_CLOSE: 'mobile_filter_close',
  
  // Engagement con lugares
  PLACE_VIEW: 'place_view',
  PLACE_DETAIL_CLICK: 'place_detail_click',
  
  // Conversiones
  PLACE_PHONE_CLICK: 'place_phone_click',
  PLACE_DIRECTIONS_CLICK: 'place_directions_click',
  PLACE_WEBSITE_CLICK: 'place_website_click',
  
  // Chatbot
  CHATBOT_MESSAGE_SEND: 'chatbot_message_send',
  CHATBOT_LINK_CLICK: 'chatbot_link_click',
  
  // Rutas
  ROUTE_CALCULATE: 'route_calculate',
} as const;

export const CATEGORIES = {
  NAVIGATION: 'navigation',
  MAP: 'map',
  ENGAGEMENT: 'engagement',
  CONVERSION: 'conversion',
  SEARCH: 'search',
  CHATBOT: 'chatbot',
} as const;

