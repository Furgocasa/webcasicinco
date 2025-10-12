/**
 * Formateadores de datos para la UI
 */

/**
 * Formatea un número de rating con estrellas
 * Ejemplo: 4.8 -> "4.8★"
 */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)}★`;
}

/**
 * Formatea el número de reseñas
 * Ejemplo: 12300 -> "12.3k"
 */
export function formatReviewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Formatea el nivel de precio
 * Ejemplo: 2 -> "€€"
 */
export function formatPriceLevel(level?: number): string {
  if (!level) return '';
  return '€'.repeat(level);
}

/**
 * Formatea una dirección de forma compacta
 * Ejemplo: "Calle Granada, 62, 29015 Málaga, España" -> "Calle Granada, 62, Málaga"
 */
export function formatAddress(address: string): string {
  // Elimina código postal y país
  return address.replace(/\d{5}\s*/g, '').replace(/, España/g, '');
}

/**
 * Formatea un número de teléfono para click-to-call
 * Ejemplo: "+34 952 22 89 90" -> "tel:+34952228990"
 */
export function formatPhoneLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

/**
 * Formatea una URL para asegurar que tenga protocolo
 */
export function formatWebsiteUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Formatea la distancia en metros a km
 * Ejemplo: 1500 -> "1.5 km", 500 -> "500 m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formatea la duración en segundos
 * Ejemplo: 3600 -> "1h", 7200 -> "2h", 90 -> "1h 30min"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}min`;
  }
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}min`;
}

/**
 * Formatea un coste en dólares
 * Ejemplo: 3.87 -> "$3.87"
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

/**
 * Formatea una fecha en formato legible
 * Ejemplo: "2025-10-09T14:30:00Z" -> "9 de octubre de 2025, 14:30"
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea una fecha relativa
 * Ejemplo: "2025-10-09T14:30:00Z" -> "Hace 1 día"
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Hace unos segundos';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `Hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`;
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
