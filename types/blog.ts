export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  category: 'restaurante' | 'bar' | 'cafe' | 'hotel';
  location: string;
  location_type: 'city' | 'province' | 'community';
  intro_text: string;
  conclusion_text?: string;
  keywords: string[];
  featured_image_url?: string;
  published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostWithPlaces extends BlogPost {
  places: any[]; // Array de lugares filtrados
}

