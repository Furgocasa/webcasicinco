/**
 * Calculadora de tiers de calidad
 * Basada en rating y número de reseñas
 */

export type QualityTier = 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'none';

export interface TierInfo {
  tier: QualityTier;
  name: string;
  color: string;
  icon: string;
  description: string;
}

/**
 * Calcula el tier de calidad de un lugar
 */
export function calculateQualityTier(rating: number, reviewCount: number): QualityTier {
  // DIAMANTE: 4.8+ con 1000+ reseñas (El top 0.1%)
  if (rating >= 4.8 && reviewCount >= 1000) {
    return 'diamond';
  }
  
  // PLATINO: 4.8+ con 500+ reseñas (El top 1%)
  if (rating >= 4.8 && reviewCount >= 500) {
    return 'platinum';
  }
  
  // ORO: 4.8+ con 200+ reseñas (El top 5%)
  if (rating >= 4.8 && reviewCount >= 200) {
    return 'gold';
  }
  
  // PLATA: 4.7+ con 100+ reseñas (El top 15%)
  if (rating >= 4.7 && reviewCount >= 100) {
    return 'silver';
  }
  
  // BRONCE: 4.7+ con menos reseñas
  if (rating >= 4.7) {
    return 'bronze';
  }
  
  // NONE: No cumple los criterios
  return 'none';
}

/**
 * Obtiene la información completa del tier
 */
export function getTierInfo(tier: QualityTier): TierInfo {
  const tierMap: Record<QualityTier, TierInfo> = {
    diamond: {
      tier: 'diamond',
      name: 'Diamante',
      color: 'from-blue-400 to-blue-600', // Azul más visible
      icon: '💎',
      description: '4.8+ con 1000+ reseñas - El top 0.1%'
    },
    platinum: {
      tier: 'platinum',
      name: 'Platino',
      color: 'from-gray-400 to-gray-600',
      icon: '🏆',
      description: '4.8+ con 500+ reseñas - El top 1%'
    },
    gold: {
      tier: 'gold',
      name: 'Oro',
      color: 'from-yellow-400 to-yellow-600',
      icon: '🥇',
      description: '4.8+ con 200+ reseñas - El top 5%'
    },
    silver: {
      tier: 'silver',
      name: 'Plata',
      color: 'from-purple-400 to-purple-600',
      icon: '🥈',
      description: '4.7+ con 100+ reseñas - El top 15%'
    },
    bronze: {
      tier: 'bronze',
      name: 'Bronce',
      color: 'from-orange-400 to-red-500',
      icon: '🥉',
      description: '4.7+ estrellas'
    },
    none: {
      tier: 'none',
      name: 'Standard',
      color: 'from-gray-400 to-gray-600',
      icon: '⭐',
      description: 'Menos de 4.7 estrellas'
    }
  };

  return tierMap[tier];
}

/**
 * Obtiene el color del marcador según el tier
 */
export function getTierMarkerColor(tier: QualityTier): string {
  const colors: Record<QualityTier, string> = {
    diamond: '#06b6d4', // Cyan brillante
    platinum: '#94a3b8', // Gris platino
    gold: '#f59e0b', // Dorado
    silver: '#a855f7', // Morado (purple-500)
    bronze: '#ea580c', // Naranja bronce
    none: '#9ca3af', // Gris
  };

  return colors[tier];
}

/**
 * Obtiene el peso numérico de un tier para ordenación
 * Valores más altos = mejor tier
 */
export function getTierWeight(tier: QualityTier): number {
  const weights: Record<QualityTier, number> = {
    diamond: 5,
    platinum: 4,
    gold: 3,
    silver: 2,
    bronze: 1,
    none: 0,
  };
  return weights[tier];
}

/**
 * Función de comparación para ordenar lugares por tier (diamante primero)
 * Dentro del mismo tier, ordena por rating y luego por número de reseñas
 */
export function comparePlacesByTier(
  a: { rating: number; review_count: number },
  b: { rating: number; review_count: number }
): number {
  const tierA = calculateQualityTier(a.rating, a.review_count);
  const tierB = calculateQualityTier(b.rating, b.review_count);
  
  const weightA = getTierWeight(tierA);
  const weightB = getTierWeight(tierB);
  
  // 1. Ordenar por tier (mayor peso primero)
  if (weightA !== weightB) {
    return weightB - weightA;
  }
  
  // 2. Dentro del mismo tier, ordenar por rating
  if (a.rating !== b.rating) {
    return b.rating - a.rating;
  }
  
  // 3. Si mismo tier y rating, ordenar por número de reseñas
  return b.review_count - a.review_count;
}

