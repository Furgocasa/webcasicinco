// Filtros avanzados para el mapa

import type { Place } from './place';

export type QualityTier = 
  | 'diamond'   // 4.8★+ con 1,000+ reseñas - EL TOP ABSOLUTO
  | 'platinum'  // 4.8★+ con 500-999 reseñas
  | 'gold'      // 4.7★+ con 200+ reseñas
  | 'silver'    // 4.7★+ con 50+ reseñas
  | 'bronze'    // 4.7★+ con menos de 50 reseñas
  | 'none';

export type ReviewsRange = 
  | 'under_50'           // Menos de 50 reseñas
  | 'from_50_to_100'     // 50-99 reseñas
  | 'from_100_to_200'    // 100-199 reseñas
  | 'from_200_to_500'    // 200-499 reseñas
  | 'from_500_to_1000'   // 500-999 reseñas
  | 'over_1000';         // 1,000+ reseñas - LOS MEJORES

export type PriceLevel = 1 | 2 | 3 | 4; // € a €€€€

export interface PlaceFilters {
  // Ubicación
  community?: string;        // CCAA
  province?: string;         // Provincia
  city?: string;            // Ciudad

  // Categoría
  category?: string;         // restaurante, hotel, spa...

  // Rating
  minRating?: number;        // 4.7 - 5.0
  maxRating?: number;        // 4.7 - 5.0

  // Número de reseñas (CRÍTICO)
  reviewsRange?: ReviewsRange;
  minReviews?: number;
  maxReviews?: number;

  // Precio
  priceLevel?: PriceLevel;

  // Tier de calidad
  qualityTier?: QualityTier[];

  // Búsqueda
  searchTerm?: string;

  // Paginación
  limit?: number;
  offset?: number;
}

export interface PlaceWithTier extends Place {
  quality_tier: QualityTier;
  tier_rank: number;
  community: string;
  city?: string;
  reviews_count: number;
  price_level?: PriceLevel;
}

export interface FilterStats {
  total_places: number;
  by_tier: {
    diamond: number;
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  by_category: Record<string, number>;
  by_reviews_range: {
    under_50: number;
    from_50_to_100: number;
    from_100_to_200: number;
    from_200_to_500: number;
    from_500_to_1000: number;
    over_1000: number;
  };
  avg_rating: number;
  avg_reviews: number;
}

// Constantes de filtros
export const QUALITY_TIERS: Record<QualityTier, { 
  name: string; 
  icon: string; 
  color: string;
  description: string;
}> = {
  diamond: {
    name: 'Diamante',
    icon: '💎',
    color: 'from-cyan-500 to-blue-500',
    description: '4.8★+ con 1,000+ reseñas - El top 0.1%'
  },
  platinum: {
    name: 'Platino',
    icon: '🏆',
    color: 'from-gray-400 to-gray-600',
    description: '4.8★+ con 500-999 reseñas - Excelencia probada'
  },
  gold: {
    name: 'Oro',
    icon: '🥇',
    color: 'from-yellow-400 to-orange-500',
    description: '4.7★+ con 200+ reseñas - Muy confiable'
  },
  silver: {
    name: 'Plata',
    icon: '🥈',
    color: 'from-gray-300 to-gray-400',
    description: '4.7★+ con 50+ reseñas - Buena opción'
  },
  bronze: {
    name: 'Bronce',
    icon: '🥉',
    color: 'from-orange-300 to-orange-400',
    description: '4.7★+ con menos de 50 reseñas - Promesa'
  },
  none: {
    name: 'Sin clasificar',
    icon: '⚪',
    color: 'from-gray-200 to-gray-300',
    description: 'No cumple requisitos mínimos'
  }
};

export const REVIEWS_RANGES: Record<ReviewsRange, {
  name: string;
  min: number;
  max: number | null;
  description: string;
}> = {
  under_50: {
    name: 'Menos de 50',
    min: 0,
    max: 49,
    description: 'Lugares nuevos o de nicho'
  },
  from_50_to_100: {
    name: '50 - 100',
    min: 50,
    max: 99,
    description: 'Validación inicial'
  },
  from_100_to_200: {
    name: '100 - 200',
    min: 100,
    max: 199,
    description: 'Bien establecidos'
  },
  from_200_to_500: {
    name: '200 - 500',
    min: 200,
    max: 499,
    description: 'Muy populares'
  },
  from_500_to_1000: {
    name: '500 - 1,000',
    min: 500,
    max: 999,
    description: 'Referencias en su zona'
  },
  over_1000: {
    name: 'Más de 1,000',
    min: 1000,
    max: null,
    description: '🏆 Los más validados de España'
  }
};

export const PRICE_LEVELS: Record<PriceLevel, {
  symbol: string;
  name: string;
  description: string;
}> = {
  1: {
    symbol: '€',
    name: 'Económico',
    description: 'Menos de 15€'
  },
  2: {
    symbol: '€€',
    name: 'Moderado',
    description: '15€ - 30€'
  },
  3: {
    symbol: '€€€',
    name: 'Alto',
    description: '30€ - 60€'
  },
  4: {
    symbol: '€€€€',
    name: 'Premium',
    description: 'Más de 60€'
  }
};

// Comunidades Autónomas
export const COMMUNITIES = [
  'Andalucía',
  'Aragón',
  'Principado de Asturias',
  'Islas Baleares',
  'Canarias',
  'Cantabria',
  'Castilla y León',
  'Castilla-La Mancha',
  'Cataluña',
  'Comunidad Valenciana',
  'Extremadura',
  'Galicia',
  'Comunidad de Madrid',
  'Región de Murcia',
  'Comunidad Foral de Navarra',
  'País Vasco',
  'La Rioja',
  'Ceuta',
  'Melilla'
];

// Helper para obtener rango de reseñas desde números
export function getReviewsRangeFromNumbers(min?: number, max?: number): ReviewsRange | undefined {
  if (min === undefined && max === undefined) return undefined;
  
  if (min !== undefined && max !== undefined) {
    if (min === 0 && max === 49) return 'under_50';
    if (min === 50 && max === 99) return 'from_50_to_100';
    if (min === 100 && max === 199) return 'from_100_to_200';
    if (min === 200 && max === 499) return 'from_200_to_500';
    if (min === 500 && max === 999) return 'from_500_to_1000';
  }
  
  if (min !== undefined && min >= 1000) return 'over_1000';
  
  return undefined;
}

// Helper para obtener números desde rango
export function getNumbersFromReviewsRange(range: ReviewsRange): { min: number; max: number | null } {
  return {
    min: REVIEWS_RANGES[range].min,
    max: REVIEWS_RANGES[range].max
  };
}
