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
 * OPTIMIZADO: Solo Nearby Search por cuadrantes geográficos
 * Elimina Text Search para mejor ratio guardados/descartados
 */
export function generateSearchStrategy(
  city: CityData,
  category: string,
  province: string
): SearchStrategy {
  const { name, coords, population } = city;
  const searches: SearchQuery[] = [];

  // ESTRATEGIA SOLO NEARBY POR CUADRANTES
  
  // 🏙️ CIUDADES GRANDES (>200k habitantes): 9 búsquedas por cuadrantes
  // Nearby Search solo devuelve 20 resultados/búsqueda (no 60 como Text Search)
  // Necesitamos más búsquedas para compensar
  if (population > 200000) {
    searches.push(
      {
        type: 'nearby',
        coords: coords,
        radius: 8000, // 8km centro (aumentado)
        description: `Centro de ${name} (8km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 4, 'north'),
        radius: 8000,
        description: `Zona Norte ${name} (8km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 4, 'south'),
        radius: 8000,
        description: `Zona Sur ${name} (8km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 4, 'east'),
        radius: 8000,
        description: `Zona Este ${name} (8km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 4, 'west'),
        radius: 8000,
        description: `Zona Oeste ${name} (8km)`,
      },
      // Búsquedas adicionales en zonas intermedias
      {
        type: 'nearby',
        coords: offsetCoords(coords, 6, 'north'),
        radius: 7000,
        description: `Norte Externo ${name} (7km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 6, 'south'),
        radius: 7000,
        description: `Sur Externo ${name} (7km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 6, 'east'),
        radius: 7000,
        description: `Este Externo ${name} (7km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 6, 'west'),
        radius: 7000,
        description: `Oeste Externo ${name} (7km)`,
      }
    );

    return {
      cityName: name,
      cityPopulation: population,
      strategyLevel: 'MAXIMA',
      searches,
      estimatedResults: 90, // 9 búsquedas × ~10 guardados (con 4.7★)
      estimatedTimeMinutes: 18, // 9 búsquedas × ~2min
    };
  }

  // 🏘️ CIUDADES MEDIANAS (50k-200k habitantes): 5 búsquedas
  if (population > 50000) {
    searches.push(
      {
        type: 'nearby',
        coords: coords,
        radius: 10000, // 10km centro (aumentado)
        description: `Centro ${name} (10km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 5, 'north'),
        radius: 10000,
        description: `Norte/Pedanías ${name} (10km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 5, 'south'),
        radius: 10000,
        description: `Sur/Alrededores ${name} (10km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 5, 'east'),
        radius: 10000,
        description: `Este ${name} (10km)`,
      },
      {
        type: 'nearby',
        coords: offsetCoords(coords, 5, 'west'),
        radius: 10000,
        description: `Oeste ${name} (10km)`,
      }
    );

    return {
      cityName: name,
      cityPopulation: population,
      strategyLevel: 'MEDIA',
      searches,
      estimatedResults: 50, // 5 búsquedas × ~10 guardados (con 4.7★)
      estimatedTimeMinutes: 10, // 5 búsquedas × ~2min
    };
  }

  // 🏡 CIUDADES PEQUEÑAS (<50k habitantes): 3 búsquedas con radios amplios
  searches.push(
    {
      type: 'nearby',
      coords: coords,
      radius: 15000, // 15km centro
      description: `${name} centro (15km)`,
    },
    {
      type: 'nearby',
      coords: offsetCoords(coords, 8, 'north'),
      radius: 12000,
      description: `${name} norte (12km)`,
    },
    {
      type: 'nearby',
      coords: offsetCoords(coords, 8, 'south'),
      radius: 12000,
      description: `${name} sur (12km)`,
    }
  );

  return {
    cityName: name,
    cityPopulation: population,
    strategyLevel: 'BASICA',
    searches,
    estimatedResults: 30, // 3 búsquedas × ~10 guardados (con 4.7★)
    estimatedTimeMinutes: 6, // 3 búsquedas × ~2min
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

