/**
 * Motor de búsqueda de lugares en Google Maps
 */

import { searchPlaces, searchNearbyPlaces } from '../google/places';
import { geocodeAddress } from '../google/geocoding';
import type { SearchParams } from '@/types/indexation';

export interface SearchResult {
  place_ids: string[];
  total_found: number;
  search_area: string;
}

/**
 * Busca lugares según los parámetros de búsqueda
 */
export async function searchPlacesByParams(
  params: SearchParams
): Promise<SearchResult> {
  try {
    const allPlaceIds: Set<string> = new Set();
    const searchAreas: string[] = [];

    // Si hay ciudad específica, buscar en ella
    if (params.city) {
      const cityPlaces = await searchInLocation(
        `${params.city}, ${params.country}`,
        params.categories,
        params.minRating,
        params.minReviews,
        params.radius
      );
      cityPlaces.forEach((id) => allPlaceIds.add(id));
      searchAreas.push(params.city);
    }
    // Si no hay ciudad pero hay provincias, buscar en ellas
    else if (params.provinces && params.provinces.length > 0) {
      for (const province of params.provinces) {
        const provincePlaces = await searchInLocation(
          `${province}, ${params.country}`,
          params.categories,
          params.minRating,
          params.minReviews,
          params.radius
        );
        provincePlaces.forEach((id) => allPlaceIds.add(id));
        searchAreas.push(province);
      }
    }
    // Si solo hay regiones, buscar en ellas
    else if (params.regions && params.regions.length > 0) {
      for (const region of params.regions) {
        const regionPlaces = await searchInLocation(
          `${region}, ${params.country}`,
          params.categories,
          params.minRating,
          params.minReviews,
          params.radius
        );
        regionPlaces.forEach((id) => allPlaceIds.add(id));
        searchAreas.push(region);
      }
    }
    // Si no hay nada específico, buscar en todo el país
    else {
      const countryPlaces = await searchInLocation(
        params.country,
        params.categories,
        params.minRating,
        params.minReviews,
        params.radius
      );
      countryPlaces.forEach((id) => allPlaceIds.add(id));
      searchAreas.push(params.country);
    }

    return {
      place_ids: Array.from(allPlaceIds),
      total_found: allPlaceIds.size,
      search_area: searchAreas.join(', '),
    };
  } catch (error) {
    console.error('Error searching places by params:', error);
    throw error;
  }
}

/**
 * Busca lugares en una ubicación específica
 */
async function searchInLocation(
  location: string,
  categories: string[],
  minRating: number,
  minReviews: number,
  radius?: number
): Promise<string[]> {
  const placeIds: Set<string> = new Set();

  // Obtener coordenadas de la ubicación
  const geocodeResult = await geocodeAddress(location);
  const { lat, lng } = geocodeResult.geometry.location;

  // Buscar para cada categoría
  for (const category of categories) {
    const type = mapCategoryToGoogleType(category);
    
    try {
      // Usar text search
      const textSearchIds = await searchPlaces({
        location,
        latitude: lat,
        longitude: lng,
        radius: radius || 50000,
        type,
        keyword: category,
        minRating,
      });

      textSearchIds.forEach((id) => placeIds.add(id));

      // También buscar nearby
      const nearbyIds = await searchNearbyPlaces(lat, lng, radius || 25000, type);
      nearbyIds.forEach((id) => placeIds.add(id));
    } catch (error) {
      console.error(`Error searching for ${category} in ${location}:`, error);
      // Continuar con las otras categorías
    }
  }

  return Array.from(placeIds);
}

/**
 * Mapea nuestras categorías a tipos de Google Places
 */
function mapCategoryToGoogleType(category: string): string {
  const typeMap: Record<string, string> = {
    restaurante: 'restaurant',
    hotel: 'lodging',
    spa: 'spa',
    bar: 'bar',
    experiencia: 'tourist_attraction',
    monumento: 'museum',
  };

  return typeMap[category] || 'point_of_interest';
}

/**
 * Filtra cadenas comerciales si está activado
 */
export function shouldExcludeChain(placeName: string, excludeChains: boolean): boolean {
  if (!excludeChains) return false;

  const chains = [
    'McDonald',
    'Burger King',
    'KFC',
    'Subway',
    'Starbucks',
    'Domino',
    'Pizza Hut',
    'Telepizza',
    'Vips',
    'Ginos',
    'NH Hotel',
    'Ibis',
    'Novotel',
    'Mercure',
    'Holiday Inn',
    'Marriott',
    'Hilton',
  ];

  return chains.some((chain) =>
    placeName.toLowerCase().includes(chain.toLowerCase())
  );
}
