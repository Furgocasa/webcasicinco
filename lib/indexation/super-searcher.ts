/**
 * SUPER BÚSQUEDA - Encuentra TODOS los lugares posibles
 * Combina múltiples estrategias para no escapar ningún lugar
 */

import { searchPlaces, searchNearbyPlaces } from '../google/places';
import { geocodeAddress } from '../google/geocoding';

interface SuperSearchParams {
  province: string;
  category: string;
  minRating: number;
}

/**
 * Realiza una super búsqueda exhaustiva
 */
export async function superSearchProvince(params: SuperSearchParams): Promise<string[]> {
  const allPlaceIds: Set<string> = new Set();

  console.log(`🚀 SUPER BÚSQUEDA en ${params.province} para ${params.category}`);

  // ESTRATEGIA 1: Búsqueda por ciudades principales
  const cities = getCitiesByProvince(params.province);
  for (const city of cities) {
    const cityIds = await searchInCity(city, params.province, params.category, params.minRating);
    cityIds.forEach(id => allPlaceIds.add(id));
    console.log(`  ✅ ${city}: ${cityIds.length} lugares`);
  }

  // ESTRATEGIA 2: Búsqueda por barrios/zonas de ciudades grandes
  const neighborhoods = getNeighborhoodsByProvince(params.province);
  for (const neighborhood of neighborhoods) {
    try {
      const neighborhoodIds = await searchPlaces({
        location: `${neighborhood.name}, ${neighborhood.city}, ${params.province}, España`,
        keyword: getCategorySearchTerm(params.category),
        minRating: params.minRating,
        radius: 10000, // 10km por barrio
      });
      neighborhoodIds.forEach(id => allPlaceIds.add(id));
      console.log(`  ✅ ${neighborhood.name}: ${neighborhoodIds.length} lugares`);
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error(`  ❌ Error en ${neighborhood.name}`);
    }
  }

  // ESTRATEGIA 3: Búsqueda por coordenadas (grid)
  // Dividir la provincia en una cuadrícula de 20km x 20km
  const gridPoints = await getGridPointsForProvince(params.province);
  for (const point of gridPoints) {
    try {
      const gridIds = await searchNearbyPlaces(
        point.lat,
        point.lng,
        15000, // 15km de radio
        getCategoryType(params.category)
      );
      gridIds.forEach(id => allPlaceIds.add(id));
      console.log(`  ✅ Grid (${point.lat.toFixed(2)}, ${point.lng.toFixed(2)}): ${gridIds.length} lugares`);
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error(`  ❌ Error en grid point`);
    }
  }

  // ESTRATEGIA 4: Variaciones de búsqueda
  const searchVariations = getSearchVariations(params.category);
  for (const variation of searchVariations) {
    try {
      const varIds = await searchPlaces({
        location: `${params.province}, España`,
        keyword: variation,
        minRating: params.minRating,
        radius: 80000,
      });
      varIds.forEach(id => allPlaceIds.add(id));
      console.log(`  ✅ "${variation}": ${varIds.length} lugares`);
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error(`  ❌ Error con "${variation}"`);
    }
  }

  console.log(`🎯 TOTAL ENCONTRADO: ${allPlaceIds.size} lugares únicos`);
  return Array.from(allPlaceIds);
}

/**
 * Busca en una ciudad específica
 */
async function searchInCity(
  city: string,
  province: string,
  category: string,
  minRating: number
): Promise<string[]> {
  const placeIds = await searchPlaces({
    location: `${city}, ${province}, España`,
    keyword: getCategorySearchTerm(category),
    minRating,
    radius: 50000,
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  return placeIds;
}

/**
 * Ciudades principales por provincia
 */
function getCitiesByProvince(province: string): string[] {
  const citiesMap: Record<string, string[]> = {
    'Murcia': [
      'Murcia', 'Cartagena', 'Lorca', 'Molina de Segura', 'Alcantarilla',
      'Mazarrón', 'Yecla', 'Jumilla', 'Cieza', 'Águilas', 'San Javier',
      'Torre-Pacheco', 'Las Torres de Cotillas', 'San Pedro del Pinatar'
    ],
    'Alicante': [
      'Alicante', 'Elche', 'Torrevieja', 'Orihuela', 'Benidorm', 'Alcoy',
      'San Vicente del Raspeig', 'Elda', 'Villena', 'Dénia', 'Calpe',
      'Altea', 'Jávea', 'Petrer', 'Santa Pola'
    ],
    'Madrid': [
      'Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés',
      'Getafe', 'Alcorcón', 'Torrejón de Ardoz', 'Parla', 'Alcobendas'
    ],
    'Barcelona': [
      'Barcelona', 'Hospitalet de Llobregat', 'Terrassa', 'Badalona', 'Sabadell',
      'Mataró', 'Santa Coloma de Gramenet', 'Cornellà de Llobregat'
    ],
    'Valencia': [
      'Valencia', 'Gandía', 'Torrent', 'Paterna', 'Sagunto',
      'Mislata', 'Burjassot', 'Alzira', 'Xirivella'
    ],
  };

  return citiesMap[province] || [province];
}

/**
 * Barrios/zonas de ciudades grandes para búsqueda ultra-detallada
 */
function getNeighborhoodsByProvince(province: string): Array<{name: string, city: string}> {
  const neighborhoods: Record<string, Array<{name: string, city: string}>> = {
    'Murcia': [
      { name: 'Centro', city: 'Murcia' },
      { name: 'El Carmen', city: 'Murcia' },
      { name: 'La Manga', city: 'Cartagena' },
      { name: 'Cabo de Palos', city: 'Cartagena' },
    ],
    'Alicante': [
      { name: 'Centro', city: 'Alicante' },
      { name: 'Playa San Juan', city: 'Alicante' },
      { name: 'El Campello', city: 'El Campello' },
    ],
  };

  return neighborhoods[province] || [];
}

/**
 * Crea grid de puntos para búsqueda por coordenadas
 */
async function getGridPointsForProvince(province: string): Promise<Array<{lat: number, lng: number}>> {
  try {
    // Obtener centro de la provincia
    const geocode = await geocodeAddress(`${province}, España`);
    const center = geocode.geometry.location;

    // Crear grid 3x3 alrededor del centro (cubriendo ~60km x 60km)
    const points: Array<{lat: number, lng: number}> = [];
    const step = 0.2; // ~20km

    for (let latOffset = -step; latOffset <= step; latOffset += step) {
      for (let lngOffset = -step; lngOffset <= step; lngOffset += step) {
        points.push({
          lat: center.lat + latOffset,
          lng: center.lng + lngOffset,
        });
      }
    }

    return points;
  } catch (error) {
    console.error('Error creando grid:', error);
    return [];
  }
}

/**
 * Variaciones de búsqueda para encontrar más lugares
 */
function getSearchVariations(category: string): string[] {
  const variations: Record<string, string[]> = {
    'restaurante': [
      'restaurantes',
      'restaurante',
      'donde comer',
      'comida',
      'gastronomía',
      'asador',
      'tasca',
      'mesón',
    ],
    'hotel': [
      'hoteles',
      'hotel',
      'alojamiento',
      'hostal',
      'apartamentos',
    ],
    'bar': [
      'bares',
      'bar',
      'cafetería',
      'café',
      'pub',
      'cervecería',
    ],
  };

  return variations[category] || [category];
}

/**
 * Mapea categorías a términos de búsqueda mejorados
 * Incluye variantes para capturar más tipos (hamburgueserías, pizzerías, etc.)
 */
function getCategorySearchTerm(category: string): string {
  const terms: Record<string, string> = {
    'restaurante': 'restaurantes hamburgueserías pizzerías',
    'hotel': 'hoteles hostales',
    'spa': 'spa wellness',
    'bar': 'bares pubs',
    'experiencia': 'lugares turísticos',
    'monumento': 'monumentos',
  };
  return terms[category] || category;
}

/**
 * Mapea categorías a tipos de Google
 */
function getCategoryType(category: string): string {
  const types: Record<string, string> = {
    'restaurante': 'restaurant',
    'hotel': 'lodging',
    'spa': 'spa',
    'bar': 'bar',
    'experiencia': 'tourist_attraction',
    'monumento': 'museum',
  };
  return types[category] || 'point_of_interest';
}

