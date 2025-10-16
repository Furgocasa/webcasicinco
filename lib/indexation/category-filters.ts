/**
 * Filtros estrictos por categoría
 * Evita que se cuelen lugares incorrectos en cada categoría
 */

/**
 * Palabras clave que EXCLUYEN un lugar de ser hotel
 */
const HOTEL_EXCLUSIONS = [
  'autocaravana',
  'caravana',
  'camping',
  'campground',
  'rv_park',
  'aparcamiento',
  'parking',
  'área de',
  'area de',
  'zona de',
  'estacionamiento',
];

/**
 * Palabras clave que EXCLUYEN un lugar de ser restaurante
 */
const RESTAURANT_EXCLUSIONS = [
  'supermercado',
  'supermarket',
  'tienda',
  'store',
  'panadería solo',
  'carnicería',
  'pescadería',
  'mercado',
  'market',
];

/**
 * Palabras clave que EXCLUYEN un lugar de ser bar
 */
const BAR_EXCLUSIONS = [
  'peluquería',
  'barbería',
  'barber',
  'salon',
  'tienda',
  'store',
];

/**
 * Palabras clave que EXCLUYEN un lugar de ser cafetería
 */
const CAFE_EXCLUSIONS = [
  'internet cafe',
  'ciber',
  'cyber',
];

/**
 * Verifica si un lugar debe ser EXCLUIDO de una categoría específica
 */
export function shouldExcludeFromCategory(
  placeName: string,
  placeTypes: string[],
  targetCategory: string
): boolean {
  const nameLower = placeName.toLowerCase();
  const typesLower = placeTypes.map(t => t.toLowerCase());

  switch (targetCategory) {
    case 'hotel':
      // Verificar nombre
      if (HOTEL_EXCLUSIONS.some(keyword => nameLower.includes(keyword))) {
        return true;
      }
      // Verificar tipos de Google
      if (typesLower.includes('rv_park') || typesLower.includes('campground') || typesLower.includes('parking')) {
        return true;
      }
      // SOLO aceptar si tiene tipos válidos de hotel
      const validHotelTypes = ['lodging', 'hotel', 'resort', 'hostel', 'guest_house', 'bed_and_breakfast'];
      if (!typesLower.some(t => validHotelTypes.includes(t))) {
        return true; // Si no tiene ningún tipo válido de hotel, excluir
      }
      break;

    case 'restaurante':
      if (RESTAURANT_EXCLUSIONS.some(keyword => nameLower.includes(keyword))) {
        return true;
      }
      // Debe tener tipo 'restaurant', 'food', 'meal_delivery/takeaway', 'fast_food'
      // Incluye fast_food para capturar hamburgueserías, pizzerías, etc.
      const validRestaurantTypes = ['restaurant', 'food', 'meal_delivery', 'meal_takeaway', 'cafe', 'fast_food'];
      if (!typesLower.some(t => validRestaurantTypes.includes(t))) {
        return true;
      }
      break;

    case 'bar':
      if (BAR_EXCLUSIONS.some(keyword => nameLower.includes(keyword))) {
        return true;
      }
      // Debe tener tipo 'bar', 'night_club', o 'pub'
      const validBarTypes = ['bar', 'night_club', 'pub', 'liquor_store'];
      if (!typesLower.some(t => validBarTypes.includes(t))) {
        return true;
      }
      break;

    case 'cafe':
      if (CAFE_EXCLUSIONS.some(keyword => nameLower.includes(keyword))) {
        return true;
      }
      // Debe tener tipo 'cafe', 'coffee_shop', o 'bakery'
      const validCafeTypes = ['cafe', 'coffee_shop', 'bakery'];
      if (!typesLower.some(t => validCafeTypes.includes(t))) {
        return true;
      }
      break;
  }

  return false;
}

/**
 * Categoriza un lugar SOLO en las 4 categorías permitidas
 * Si no encaja en ninguna, retorna null (será descartado)
 */
export function strictCategorizePlaceByTypes(types: string[], placeName: string): string | null {
  if (!types || types.length === 0) {
    return null;
  }

  const typesLower = types.map(t => t.toLowerCase());
  const nameLower = placeName.toLowerCase();

  // PRIORIDAD 1: Hoteles (más específico)
  if (typesLower.includes('lodging') || typesLower.includes('hotel') || typesLower.includes('resort')) {
    if (!shouldExcludeFromCategory(placeName, types, 'hotel')) {
      return 'hotel';
    }
  }

  // PRIORIDAD 2: Restaurantes (incluye hamburgueserías, pizzerías = fast_food)
  if (typesLower.includes('restaurant') || typesLower.includes('food') || typesLower.includes('meal_takeaway') || typesLower.includes('fast_food')) {
    if (!shouldExcludeFromCategory(placeName, types, 'restaurante')) {
      return 'restaurante';
    }
  }

  // PRIORIDAD 3: Bares
  if (typesLower.includes('bar') || typesLower.includes('night_club') || typesLower.includes('pub')) {
    if (!shouldExcludeFromCategory(placeName, types, 'bar')) {
      return 'bar';
    }
  }

  // PRIORIDAD 4: Cafeterías
  if (typesLower.includes('cafe') || typesLower.includes('coffee_shop') || typesLower.includes('bakery')) {
    if (!shouldExcludeFromCategory(placeName, types, 'cafe')) {
      return 'cafe';
    }
  }

  // Si no encaja en ninguna de las 4 categorías permitidas, retornar null
  return null;
}

