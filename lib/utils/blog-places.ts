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

export type BlogLocationFilter =
  | { mode: 'or'; value: string }
  | { mode: 'in'; value: string[] }
  | { mode: 'eq-city'; value: string }
  | { mode: 'eq-province'; value: string }
  | { mode: 'eq-community'; value: string };

/**
 * Construye el filtro de ubicación para places según el post del blog.
 */
export function getBlogLocationFilter(post: BlogLocationInput): BlogLocationFilter {
  const location = post.location?.trim() || '';

  // Destinos especiales
  if (location === 'Costa del Sol') {
    return { mode: 'eq-province', value: 'Málaga' };
  }

  // Comunidades: community=X O provincias del listado
  // (algunos lugares tienen community null pero province correcto)
  if (post.location_type === 'community' || COMMUNITY_PROVINCES[location]) {
    const provinces = COMMUNITY_PROVINCES[location];
    if (provinces?.length) {
      const provinceIn = `province.in.(${provinces.join(',')})`;
      return {
        mode: 'or',
        value: `community.eq.${location},${provinceIn}`,
      };
    }
    return { mode: 'eq-community', value: location };
  }

  const aliases = CITY_ALIASES[location];
  if (aliases?.length) {
    // Solo ciudades alias — no toda la provincia
    return { mode: 'or', value: aliases.map((c) => `city.eq.${c}`).join(',') };
  }

  // Ciudad O provincia con el mismo nombre (Madrid, Valencia…)
  return {
    mode: 'or',
    value: `city.eq.${location},province.eq.${location}`,
  };
}

/** Aplica el filtro de ubicación a una query de Supabase places */
export function applyBlogLocationFilter<
  T extends { or: Function; in: Function; eq: Function }
>(query: T, post: BlogLocationInput): T {
  const filter = getBlogLocationFilter(post);

  if (filter.mode === 'in') {
    return query.in('province', filter.value) as T;
  }
  if (filter.mode === 'eq-province') {
    return query.eq('province', filter.value) as T;
  }
  if (filter.mode === 'eq-city') {
    return query.eq('city', filter.value) as T;
  }
  if (filter.mode === 'eq-community') {
    return query.eq('community', filter.value) as T;
  }
  return query.or(filter.value) as T;
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
