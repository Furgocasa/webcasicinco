// Google Analytics configuration and tracking functions

export const GA_TRACKING_ID = 'G-YQKPN92JH8';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Eventos específicos para Casi Cinco
export const trackPlaceView = (placeName: string, category: string) => {
  event({
    action: 'view_place',
    category: 'Places',
    label: `${category}: ${placeName}`,
  });
};

export const trackSearch = (query: string) => {
  event({
    action: 'search',
    category: 'Search',
    label: query,
  });
};

export const trackMapInteraction = (action: string) => {
  event({
    action: action,
    category: 'Map',
  });
};

export const trackRouteCalculation = (origin: string, destination: string) => {
  event({
    action: 'calculate_route',
    category: 'Routes',
    label: `${origin} -> ${destination}`,
  });
};

export const trackChatbotUsage = (message: string) => {
  event({
    action: 'chatbot_message',
    category: 'Chatbot',
    label: message.substring(0, 100), // Limitar longitud
  });
};
