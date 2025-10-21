/**
 * Tipos relacionados con lugares
 */

export type PlaceCategory = 'restaurante' | 'bar' | 'hotel';

// Tipos de Google Places API
export interface GooglePlaceData {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  formatted_address: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  price_level?: number;
  formatted_phone_number?: string;
  website?: string;
  photos?: GooglePlacePhoto[];
  reviews?: GoogleReview[];
  types: string[];
  url?: string;
}

export interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

export interface Place {
  id: string;
  google_place_id: string;
  slug: string;
  name: string;
  category: PlaceCategory;
  subcategory?: string;
  rating: number;
  review_count: number;
  country: string;
  region: string;
  province: string;
  city: string;
  address: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  price_level?: number;
  ai_description?: string;
  ai_review_summary?: string;
  ai_highlights?: string[];
  photos?: string[]; // Legacy: photo_reference de Google (backward compatibility)
  photo_urls?: string[]; // NUEVO: URLs de Supabase Storage (ahorra costos)
  google_maps_url?: string;
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  tiktok_url?: string | null;
  published: boolean;
  featured: boolean;
  indexed_at: string;
  updated_at: string;
  created_at: string;
}

export interface PlaceFilters {
  category?: PlaceCategory;
  province?: string;
  city?: string;
  minRating?: number;
  maxPriceLevel?: number;
  published?: boolean;
  featured?: boolean;
  search?: string;
}

export interface PlaceSearchParams {
  location?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  filters?: PlaceFilters;
  limit?: number;
  offset?: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceCardData {
  id: string;
  slug: string;
  name: string;
  category: PlaceCategory;
  rating: number;
  review_count: number;
  city: string;
  province: string;
  price_level?: number;
  photos: string[]; // Legacy
  photo_urls?: string[]; // Nuevo
  featured?: boolean;
}
