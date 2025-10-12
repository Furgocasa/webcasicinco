/**
 * Tipos para respuestas de API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

// Request types
export interface CreatePlaceRequest {
  google_place_id: string;
  name: string;
  category: string;
  rating: number;
  review_count: number;
  // ... otros campos
}

export interface UpdatePlaceRequest {
  name?: string;
  ai_description?: string;
  ai_highlights?: string[];
  published?: boolean;
  featured?: boolean;
}

export interface StartIndexationRequest {
  searchParams: {
    country: string;
    regions?: string[];
    provinces?: string[];
    city?: string;
    radius?: number;
    categories: string[];
    minRating: number;
    minReviews: number;
    excludeChains: boolean;
  };
}

export interface RoutePlannerRequest {
  origin: string;
  destination: string;
  categories?: string[];
  maxDetour?: number; // en km
  minRating?: number;
}

export interface RoutePlannerResponse {
  route: {
    distance: number;
    duration: number;
    polyline: string;
  };
  places: Array<{
    id: string;
    name: string;
    rating: number;
    category: string;
    distanceFromRoute: number;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }>;
}
