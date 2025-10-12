/**
 * Tipos relacionados con indexación
 */

export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface IndexationJob {
  id: string;
  admin_user_id: string;
  status: JobStatus;
  search_params: SearchParams;
  total_places: number;
  processed_places: number;
  successful_places: number;
  failed_places: number;
  estimated_cost?: number;
  actual_cost?: number;
  started_at?: string;
  completed_at?: string;
  error_log?: ErrorLog[];
  created_at: string;
}

export interface SearchParams {
  country: string;
  regions?: string[];
  provinces?: string[];
  city?: string;
  radius?: number;
  categories: string[];
  minRating: number;
  minReviews: number;
  excludeChains: boolean;
}

export interface ErrorLog {
  place_name?: string;
  google_place_id?: string;
  error_type: string;
  error_message: string;
  timestamp: string;
}

export interface IndexationProgress {
  jobId: string;
  status: JobStatus;
  totalPlaces: number;
  processedPlaces: number;
  successfulPlaces: number;
  failedPlaces: number;
  currentPlace?: string;
  estimatedTimeRemaining?: number;
  actualCost: number;
}

export interface IndexationConfig {
  country: string;
  regions: string[];
  provinces: string[];
  city?: string;
  radius?: number;
  categories: string[];
  minRating: number;
  minReviews: number;
  excludeChains: boolean;
}

export interface PreviewResult {
  totalFound: number;
  samplePlaces: Array<{
    name: string;
    category: string;
    rating: number;
    review_count: number;
  }>;
  estimatedCost: number;
  estimatedTime: number;
}
