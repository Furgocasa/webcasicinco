/**
 * ESTRATEGIAS DE BÚSQUEDA DINÁMICAS
 * Sistema inteligente que adapta el número de búsquedas según el tamaño de la ciudad
 */

import type { CityData } from './cities-database';

export interface SearchQuery {
  type: 'text' | 'nearby';
  query?: string;
  coords?: { lat: number; lng: number };
  radius?: number;
  description: string;
}

export interface SearchStrategy {
  cityName: string;
  cityPopulation: number;
  strategyLevel: 'MAXIMA' | 'MEDIA' | 'BASICA';
  searches: SearchQuery[];
  estimatedResults: number;
  estimatedTimeMinutes: number;
}

/**
 * Calcular coordenadas desplazadas (para búsquedas nearby en diferentes zonas)
 * @param coords Coordenadas base
 * @param distanceKm Distancia en kilómetros
 * @param direction Dirección del desplazamiento
 */
function offsetCoords(
  coords: { lat: number; lng: number },
  distanceKm: number,
  direction: 'north' | 'south' | 'east' | 'west'
): { lat: number; lng: number } {
  // 1 grado de latitud ≈ 111 km
  // 1 grado de longitud ≈ 111 km * cos(latitud)
  const latOffset = distanceKm / 111;
  const lngOffset = distanceKm / (111 * Math.cos(coords.lat * Math.PI / 180));

  switch (direction) {
    case 'north':
      return { lat: coords.lat + latOffset, lng: coords.lng };
    case 'south':
      return { lat: coords.lat - latOffset, lng: coords.lng };
    case 'east':
      return { lat: coords.lat, lng: coords.lng + lngOffset };
    case 'west':
      return { lat: coords.lat, lng: coords.lng - lngOffset };
    default:
      return coords;
  }
}

/**
 * Obtener sub-categorías específicas para búsquedas diversificadas
 * Esto permite capturar hamburgueserías, pizzerías, etc. que se perdían antes
 */
function getSubCategoriesForSearch(category: string): string[] {
  const subCategories: Record<string, string[]> = {
    'restaurantes': ['restaurantes', 'hamburgueserías', 'pizzerías', 'asadores'],
    'bares': ['bares', 'pubs', 'cervecerías', 'cocktelerías'],
    'cafeterías': ['cafeterías', 'coffee shops', 'pastelerías'],
    'hoteles': ['hoteles', 'hostales', 'alojamiento'],
  };
  
  return subCategories[category] || [category];
}

/**
 * Generar estrategia de búsqueda óptima según tamaño de ciudad
 * ESTRATEGIA MEJORADA: Búsquedas por sub-categorías específicas
 * Aprovecha el límite de 60 resultados por búsqueda con términos diversos
 * Esto captura hamburgueserías, pizzerías, etc. que antes se perdían
 */
export function generateSearchStrategy(
  city: CityData,
  category: string,
  province: string
): SearchStrategy {
  const { name, coords, population } = city;
  const searches: SearchQuery[] = [];

  // Obtener sub-categorías específicas para esta categoría
  const subCategories = getSubCategoriesForSearch(category);
  
  // 🏙️ CIUDADES GRANDES (>200k habitantes): 4-5 búsquedas por sub-categoría
  // Total: ~240-300 resultados únicos (vs 180 con método anterior)
  if (population > 200000) {
    // Usar todas las sub-categorías disponibles
    for (let i = 0; i < subCategories.length; i++) {
      searches.push({
        type: 'text',
        query: `${subCategories[i]} ${name}, ${province}, España`,
        description: `${subCategories[i]} en ${name}`,
      });
    }

    return {
      cityName: name,
      cityPopulation: population,
      strategyLevel: 'MAXIMA',
      searches,
      estimatedResults: searches.length * 60,
      estimatedTimeMinutes: searches.length,
    };
  }

  // 🏘️ CIUDADES MEDIANAS (50k-200k habitantes): 2-3 búsquedas por sub-categoría
  // Usar las primeras 2-3 sub-categorías más importantes
  if (population > 50000) {
    const mainSubCategories = subCategories.slice(0, Math.min(3, subCategories.length));
    
    for (let i = 0; i < mainSubCategories.length; i++) {
      searches.push({
        type: 'text',
        query: `${mainSubCategories[i]} ${name}, ${province}, España`,
        description: `${mainSubCategories[i]} en ${name}`,
      });
    }

    return {
      cityName: name,
      cityPopulation: population,
      strategyLevel: 'MEDIA',
      searches,
      estimatedResults: searches.length * 60,
      estimatedTimeMinutes: searches.length,
    };
  }

  // 🏡 CIUDADES PEQUEÑAS (<50k habitantes): 1-2 búsquedas
  // Usar la categoría principal y una secundaria si existe
  const smallCitySubCategories = subCategories.slice(0, Math.min(2, subCategories.length));
  
  for (let i = 0; i < smallCitySubCategories.length; i++) {
    searches.push({
      type: 'text',
      query: `${smallCitySubCategories[i]} ${name}, ${province}, España`,
      description: `${smallCitySubCategories[i]} en ${name}`,
    });
  }

  return {
    cityName: name,
    cityPopulation: population,
    strategyLevel: 'BASICA',
    searches,
    estimatedResults: searches.length * 60,
    estimatedTimeMinutes: searches.length,
  };
}

/**
 * Calcular estimación total para un job de indexación
 */
export function calculateJobEstimation(
  cities: CityData[],
  categories: string[]
): {
  totalSearches: number;
  estimatedResults: number;
  estimatedTimeMinutes: number;
  breakdown: {
    cityName: string;
    strategyLevel: string;
    searches: number;
    results: number;
  }[];
} {
  let totalSearches = 0;
  let estimatedResults = 0;
  let estimatedTimeMinutes = 0;
  const breakdown: any[] = [];

  for (const city of cities) {
    for (const category of categories) {
      const strategy = generateSearchStrategy(city, category, ''); // Province no afecta cálculo
      totalSearches += strategy.searches.length;
      estimatedResults += strategy.estimatedResults;
      estimatedTimeMinutes += strategy.estimatedTimeMinutes;

      breakdown.push({
        cityName: city.name,
        strategyLevel: strategy.strategyLevel,
        searches: strategy.searches.length,
        results: strategy.estimatedResults,
      });
    }
  }

  return {
    totalSearches,
    estimatedResults,
    estimatedTimeMinutes,
    breakdown,
  };
}

/**
 * Obtener descripción de la estrategia para logs
 */
export function getStrategyDescription(strategy: SearchStrategy): string {
  const level = strategy.strategyLevel;
  const searches = strategy.searches.length;
  
  return `${strategy.cityName} (${Math.round(strategy.cityPopulation / 1000)}k hab) → ${level} (${searches} búsquedas)`;
}

