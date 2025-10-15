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
 * NUEVA ESTRATEGIA: Text Search por ciudad (aprovecha límite de 60 resultados)
 * Ciudades grandes: 2 búsquedas complementarias para máxima cobertura
 */
export function generateSearchStrategy(
  city: CityData,
  category: string,
  province: string
): SearchStrategy {
  const { name, coords, population } = city;
  const searches: SearchQuery[] = [];

  // ESTRATEGIA TEXT SEARCH OPTIMIZADA
  
  // 🏙️ CIUDADES GRANDES (>200k habitantes): 2 búsquedas Text Search
  // 1. Búsqueda general (60 resultados)
  // 2. Búsqueda enfocada en calidad (60 resultados)
  // Total: ~120 resultados, filtro 4.7★ → ~15-20 guardados
  if (population > 200000) {
    searches.push(
      {
        type: 'text',
        query: `${name} ${province} España`,
        description: `${category} en ${name} (búsqueda general)`,
      },
      {
        type: 'text',
        query: `mejores ${category} ${name} ${province} España`,
        description: `Mejores ${category} de ${name} (búsqueda calidad)`,
      },
    );

    return {
      cityName: name,
      cityPopulation: population,
      strategyLevel: 'MAXIMA',
      searches,
      estimatedResults: 120, // 2 búsquedas × 60 resultados
      estimatedTimeMinutes: 2, // 2 búsquedas × ~1min
    };
  }

  // 🏘️ CIUDADES MEDIANAS (50k-200k habitantes): 1 búsqueda Text Search
  // Aprovecha los 60 resultados de Text Search
  if (population > 50000) {
    searches.push(
      {
        type: 'text',
        query: `${name} ${province} España`,
        description: `${category} en ${name}`,
      }
    );

    return {
      cityName: name,
      cityPopulation: population,
      strategyLevel: 'MEDIA',
      searches,
      estimatedResults: 60, // 1 búsqueda × 60 resultados
      estimatedTimeMinutes: 1, // 1 búsqueda × ~1min
    };
  }

  // 🏡 CIUDADES PEQUEÑAS (<50k habitantes): 1 búsqueda Text Search
  searches.push(
    {
      type: 'text',
      query: `${name} ${province} España`,
      description: `${category} en ${name}`,
    }
  );

  return {
    cityName: name,
    cityPopulation: population,
    strategyLevel: 'BASICA',
    searches,
    estimatedResults: 60, // 1 búsqueda × 60 resultados
    estimatedTimeMinutes: 1, // 1 búsqueda × ~1min
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

