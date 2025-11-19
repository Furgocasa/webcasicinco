/**
 * Constantes de la aplicación
 */

// Categorías de lugares (SOLO 4 categorías principales)
export const PLACE_CATEGORIES = [
  { value: 'restaurante', label: 'Restaurantes', icon: '🍽️' },
  { value: 'bar', label: 'Bares', icon: '🍺' },
  { value: 'hotel', label: 'Hoteles', icon: '🏨' },
] as const;

// Categorías como objeto (para el mapa)
export const CATEGORIES: Record<string, string> = {
  restaurante: 'Restaurantes',
  bar: 'Bares',
  hotel: 'Hoteles',
};

// Comunidades Autónomas de España
export const REGIONS = [
  'Andalucía',
  'Aragón',
  'Asturias',
  'Baleares',
  'Canarias',
  'Cantabria',
  'Castilla-La Mancha',
  'Castilla y León',
  'Cataluña',
  'Comunidad Valenciana',
  'Extremadura',
  'Galicia',
  'La Rioja',
  'Madrid',
  'Murcia',
  'Navarra',
  'País Vasco',
] as const;

// Alias para compatibilidad
export const COMMUNITIES = REGIONS;

// Provincias de España por región
export const PROVINCES_BY_REGION: Record<string, string[]> = {
  'Andalucía': ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla'],
  'Aragón': ['Huesca', 'Teruel', 'Zaragoza'],
  'Asturias': ['Asturias'],
  'Baleares': ['Baleares'],
  'Canarias': ['Las Palmas', 'Santa Cruz de Tenerife'],
  'Cantabria': ['Cantabria'],
  'Castilla-La Mancha': ['Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara', 'Toledo'],
  'Castilla y León': ['Ávila', 'Burgos', 'León', 'Palencia', 'Salamanca', 'Segovia', 'Soria', 'Valladolid', 'Zamora'],
  'Cataluña': ['Barcelona', 'Girona', 'Lleida', 'Tarragona'],
  'Comunidad Valenciana': ['Alicante', 'Castellón', 'Valencia'],
  'Extremadura': ['Badajoz', 'Cáceres'],
  'Galicia': ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra'],
  'La Rioja': ['La Rioja'],
  'Madrid': ['Madrid'],
  'Murcia': ['Murcia'],
  'Navarra': ['Navarra'],
  'País Vasco': ['Álava', 'Guipúzcoa', 'Vizcaya'],
};

// Array de todas las provincias (para el mapa)
export const PROVINCES: string[] = Object.values(PROVINCES_BY_REGION).flat().sort((a, b) => a.localeCompare(b, 'es'));

// Niveles de rating para filtros
export const RATING_LEVELS = [
  { value: 4.0, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
  { value: 4.7, label: '4.7+' },
  { value: 4.8, label: '4.8+' },
  { value: 4.9, label: '4.9+' },
  { value: 5.0, label: '5.0' },
] as const;

// Niveles de precio
export const PRICE_LEVELS = [
  { value: 1, label: '€', description: 'Económico' },
  { value: 2, label: '€€', description: 'Moderado' },
  { value: 3, label: '€€€', description: 'Caro' },
  { value: 4, label: '€€€€', description: 'Muy caro' },
] as const;

// Estados de jobs de indexación
export const JOB_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'gray' },
  { value: 'running', label: 'En curso', color: 'blue' },
  { value: 'paused', label: 'Pausado', color: 'yellow' },
  { value: 'completed', label: 'Completado', color: 'green' },
  { value: 'failed', label: 'Fallido', color: 'red' },
] as const;

// Radios de búsqueda (en km)
export const SEARCH_RADII = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
] as const;

// Máximos desvíos para el planificador de rutas (en km)
export const MAX_DETOURS = [
  { value: 1, label: '1 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
] as const;

// Configuración por defecto de indexación
export const DEFAULT_INDEXATION_CONFIG = {
  country: 'España',
  regions: [],
  provinces: [],
  city: '',
  radius: 10,
  categories: [],
  minRating: 4.7,
  minReviews: 50,
  excludeChains: true,
};

// Límites de la aplicación
export const LIMITS = {
  MAX_PHOTOS_PER_PLACE: 5,
  MIN_REVIEW_COUNT: 50,
  DEFAULT_MIN_RATING: 4.7,
  MAX_PLACES_PER_PAGE: 24,
  MAX_PLACES_IN_MAP: 500,
  MAX_INDEXATION_BATCH_SIZE: 100,
} as const;

// URLs útiles
export const URLS = {
  GOOGLE_MAPS: 'https://www.google.com/maps/search/?api=1&query=',
  SUPABASE_STORAGE: process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/',
} as const;

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  NOT_FOUND: 'No se encontró el recurso solicitado',
  INTERNAL_ERROR: 'Ha ocurrido un error interno. Por favor, inténtalo de nuevo',
  VALIDATION_ERROR: 'Los datos proporcionados no son válidos',
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet',
} as const;

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  PLACE_CREATED: 'Lugar creado correctamente',
  PLACE_UPDATED: 'Lugar actualizado correctamente',
  PLACE_DELETED: 'Lugar eliminado correctamente',
  INDEXATION_STARTED: 'Indexación iniciada correctamente',
  INDEXATION_PAUSED: 'Indexación pausada',
  INDEXATION_COMPLETED: 'Indexación completada exitosamente',
} as const;
