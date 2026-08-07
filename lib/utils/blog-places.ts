/**
 * Resolución de lugares para posts del blog.
 * Unifica city/province/community y alias (Costa del Sol, San Sebastián, Palma…).
 */

export const COMMUNITY_PROVINCES: Record<string, string[]> = {
  Galicia: ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra'],
  'País Vasco': ['Álava', 'Bizkaia', 'Vizcaya', 'Guipúzcoa', 'Gipuzkoa'],
  Navarra: ['Navarra'],
  Andalucía: ['Sevilla', 'Málaga', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Almería'],
};

/** Alias de ciudad → nombres posibles en BD */
export const CITY_ALIASES: Record<string, string[]> = {
  'San Sebastián': ['San Sebastián', 'Donostia', 'Donostia-San Sebastián', 'Donostia / San Sebastián'],
  Palma: ['Palma', 'Palma de Mallorca'],
  'Las Palmas': ['Las Palmas', 'Las Palmas de Gran Canaria'],
  'A Coruña': ['A Coruña', 'La Coruña'],
  'Santa Cruz de Tenerife': ['Santa Cruz de Tenerife', 'Tenerife'],
  Santiago: ['Santiago', 'Santiago de Compostela'],
  'Santiago de Compostela': ['Santiago de Compostela', 'Santiago'],
};

export type BlogLocationInput = {
  location: string;
  location_type?: 'city' | 'province' | 'community' | string | null;
  category: string;
};

/**
 * Construye filtro PostgREST `.or(...)` para city/province según el post.
 * Devuelve null si hay que usar `.in('province', ...)` (comunidades).
 */
export function getBlogLocationFilter(post: BlogLocationInput): {
  mode: 'or' | 'in' | 'eq-city' | 'eq-province';
  value: string | string[];
} {
  const location = post.location?.trim() || '';

  // Destinos especiales
  if (location === 'Costa del Sol') {
    return { mode: 'eq-province', value: 'Málaga' };
  }

  if (post.location_type === 'community' || COMMUNITY_PROVINCES[location]) {
    const provinces = COMMUNITY_PROVINCES[location];
    if (provinces?.length) {
      return { mode: 'in', value: provinces };
    }
  }

  const aliases = CITY_ALIASES[location];
  if (aliases?.length) {
    // Solo ciudades alias — no toda la provincia (evita mezclar Getaria en SS, Ibiza en Palma…)
    const parts = aliases.map((c) => `city.eq.${c}`);
    return { mode: 'or', value: parts.join(',') };
  }

  // Por defecto: ciudad O provincia con el mismo nombre (cubre Madrid ciudad/provincia)
  return {
    mode: 'or',
    value: `city.eq.${location},province.eq.${location}`,
  };
}

/** Aplica el filtro de ubicación a una query de Supabase places */
export function applyBlogLocationFilter<T extends { or: Function; in: Function; eq: Function }>(
  query: T,
  post: BlogLocationInput
): T {
  const filter = getBlogLocationFilter(post);

  if (filter.mode === 'in') {
    return query.in('province', filter.value as string[]) as T;
  }
  if (filter.mode === 'eq-province') {
    return query.eq('province', filter.value as string) as T;
  }
  if (filter.mode === 'eq-city') {
    return query.eq('city', filter.value as string) as T;
  }
  return query.or(filter.value as string) as T;
}

/** True si la URL de portada es inválida / Unsplash Source (API muerta) */
export function isBrokenFeaturedImage(url?: string | null): boolean {
  if (!url) return true;
  return (
    url.includes('source.unsplash.com') ||
    url.includes('images.unsplash.com/source') ||
    url === '/images/placeholder.jpg'
  );
}
