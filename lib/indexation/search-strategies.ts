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
 * Generar estrategia de búsqueda óptima según tamaño de ciudad
 */
export function generateSearchStrategy(
  city: CityData,
  category: string,
  province: string
): SearchStrategy {
  const { name, coords, population } = city;
  const searches: SearchQuery[] = [];

  // ESTRATEGIA SEGÚN POBLACIÓN
  
  // 🏙️ CIUDADES GRANDES (>200k habitantes): Cobertura MÁXIMA
  if (population > 200000) {
    searches.push(
      {
        type: 'text',
        query: `${category} ${name} ${province} España`,
        description: `Búsqueda general en ${name}`,
      },
      {
        type: 'text',
        query: `${category} ${name} centro ${province} España`,
        description: `Búsqueda en centro de ${name}`,
      },
      {
        type: 'nearby',
        coords: coords,
        radius: 15000, // 15km desde el centro
        description: `Nearby desde centro (15km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 5, 'north'),
        radius: 15000,
        description: `Nearby desde zona norte (15km)`,
      }
    );

    return {
      cityName: name,
      cityPopulation: population,
      strategyLevel: 'MAXIMA',
      searches,
      estimatedResults: 180, // ~240 brutos, ~180 después de deduplicar
      estimatedTimeMinutes: 6, // 4 búsquedas × ~1.5min
    };
  }

  // 🏘️ CIUDADES MEDIANAS (50k-200k habitantes): Cobertura MEDIA
  if (population > 50000) {
    searches.push(
      {
        type: 'text',
        query: `${category} ${name} ${province} España`,
        description: `Búsqueda general en ${name}`,
      },
      {
        type: 'text',
        query: `${category} ${name} centro ${province} España`,
        description: `Búsqueda en centro de ${name}`,
      },
      {
        type: 'nearby',
        coords: coords,
        radius: 20000, // 20km (radio mayor para cubrir más)
        description: `Nearby desde centro (20km)`,
      }
    );

    return {
      cityName: name,
      cityPopulation: population,
      strategyLevel: 'MEDIA',
      searches,
      estimatedResults: 120, // ~180 brutos, ~120 después de deduplicar
      estimatedTimeMinutes: 4, // 3 búsquedas × ~1.3min
    };
  }

  // 🏡 CIUDADES PEQUEÑAS (<50k habitantes): Cobertura BÁSICA
  searches.push(
    {
      type: 'text',
      query: `${category} ${name} ${province} España`,
      description: `Búsqueda general en ${name}`,
    },
    {
      type: 'nearby',
      coords: coords,
      radius: 25000, // 25km (radio muy amplio)
      description: `Nearby desde centro (25km)`,
    }
  );

  return {
    cityName: name,
    cityPopulation: population,
    strategyLevel: 'BASICA',
    searches,
    estimatedResults: 80, // ~120 brutos, ~80 después de deduplicar
    estimatedTimeMinutes: 3, // 2 búsquedas × ~1.5min
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

