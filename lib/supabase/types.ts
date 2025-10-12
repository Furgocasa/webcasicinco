/**
 * Tipos de base de datos generados desde Supabase
 * Estos tipos deben ser generados con el CLI de Supabase
 * o definidos manualmente basándose en el esquema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string;
          google_place_id: string;
          slug: string;
          name: string;
          category: string;
          subcategory: string | null;
          rating: number;
          review_count: number;
          country: string;
          region: string;
          province: string;
          city: string;
          address: string;
          postal_code: string | null;
          latitude: number;
          longitude: number;
          phone: string | null;
          website: string | null;
          price_level: number | null;
          ai_description: string | null;
          ai_review_summary: string | null;
          ai_highlights: Json | null;
          photos: Json | null;
          google_maps_url: string | null;
          published: boolean;
          featured: boolean;
          indexed_at: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          google_place_id: string;
          slug: string;
          name: string;
          category: string;
          subcategory?: string | null;
          rating: number;
          review_count: number;
          country: string;
          region: string;
          province: string;
          city: string;
          address: string;
          postal_code?: string | null;
          latitude: number;
          longitude: number;
          phone?: string | null;
          website?: string | null;
          price_level?: number | null;
          ai_description?: string | null;
          ai_review_summary?: string | null;
          ai_highlights?: Json | null;
          photos?: Json | null;
          google_maps_url?: string | null;
          published?: boolean;
          featured?: boolean;
          indexed_at?: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          google_place_id?: string;
          slug?: string;
          name?: string;
          category?: string;
          subcategory?: string | null;
          rating?: number;
          review_count?: number;
          country?: string;
          region?: string;
          province?: string;
          city?: string;
          address?: string;
          postal_code?: string | null;
          latitude?: number;
          longitude?: number;
          phone?: string | null;
          website?: string | null;
          price_level?: number | null;
          ai_description?: string | null;
          ai_review_summary?: string | null;
          ai_highlights?: Json | null;
          photos?: Json | null;
          google_maps_url?: string | null;
          published?: boolean;
          featured?: boolean;
          indexed_at?: string;
          updated_at?: string;
          created_at?: string;
        };
      };
      indexation_jobs: {
        Row: {
          id: string;
          admin_user_id: string;
          status: string;
          search_params: Json;
          total_places: number;
          processed_places: number;
          successful_places: number;
          failed_places: number;
          estimated_cost: number | null;
          actual_cost: number | null;
          started_at: string | null;
          completed_at: string | null;
          error_log: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          status?: string;
          search_params: Json;
          total_places?: number;
          processed_places?: number;
          successful_places?: number;
          failed_places?: number;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          error_log?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          status?: string;
          search_params?: Json;
          total_places?: number;
          processed_places?: number;
          successful_places?: number;
          failed_places?: number;
          estimated_cost?: number | null;
          actual_cost?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          error_log?: Json | null;
          created_at?: string;
        };
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          place_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          place_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          place_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
