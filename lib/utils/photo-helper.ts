/**
 * Helper para manejar fotos de lugares
 * Prioriza Supabase Storage, fallback a Google Photos API
 * Ahorra costos evitando llamadas repetidas a Google
 */

/**
 * Obtiene la URL de la foto de un lugar
 * 1. Si tiene photo_urls (Supabase) → Usar esas (GRATIS, rápido)
 * 2. Si no, usar photos (photo_reference) de Google (CARO, $7/1,000 requests)
 */
export function getPlacePhotoUrl(
  place: {
    photo_urls?: string[] | null;
    photos?: string[] | null;
  },
  index: number = 0,
  maxwidth: number = 400
): string | null {
  // 1. Prioridad: URLs de Supabase (gratis, rápido, sin límites)
  if (place.photo_urls && place.photo_urls.length > index) {
    return place.photo_urls[index];
  }

  // 2. Fallback: photo_reference de Google (lugares antiguos antes de migración)
  if (place.photos && place.photos.length > index) {
    const photoRef = place.photos[index];
    // Construir URL de Google Photos API con tamaño configurable
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photoRef}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  }

  // 3. No hay fotos
  return null;
}

/**
 * Obtiene todas las URLs de fotos disponibles
 */
export function getAllPlacePhotoUrls(
  place: {
    photo_urls?: string[] | null;
    photos?: string[] | null;
  },
  maxPhotos: number = 5
): string[] {
  const urls: string[] = [];

  // Priorizar photo_urls de Supabase
  if (place.photo_urls && place.photo_urls.length > 0) {
    return place.photo_urls.slice(0, maxPhotos);
  }

  // Fallback a photo_reference de Google
  if (place.photos && place.photos.length > 0) {
    for (let i = 0; i < Math.min(place.photos.length, maxPhotos); i++) {
      const photoRef = place.photos[i];
      const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Verifica si un lugar tiene fotos disponibles
 */
export function hasPlacePhotos(
  place: {
    photo_urls?: string[] | null;
    photos?: string[] | null;
  }
): boolean {
  return Boolean(
    (place.photo_urls && place.photo_urls.length > 0) ||
    (place.photos && place.photos.length > 0)
  );
}

/**
 * Obtiene el número de fotos disponibles
 */
export function getPlacePhotosCount(
  place: {
    photo_urls?: string[] | null;
    photos?: string[] | null;
  }
): number {
  if (place.photo_urls && place.photo_urls.length > 0) {
    return place.photo_urls.length;
  }
  return place.photos?.length || 0;
}

/**
 * Determina el origen de las fotos (para debugging/analytics)
 */
export function getPhotoSource(
  place: {
    photo_urls?: string[] | null;
    photos?: string[] | null;
  }
): 'supabase' | 'google' | 'none' {
  if (place.photo_urls && place.photo_urls.length > 0) {
    return 'supabase';
  }
  if (place.photos && place.photos.length > 0) {
    return 'google';
  }
  return 'none';
}

