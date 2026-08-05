export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  category: 'restaurante' | 'bar' | 'hotel';
  location: string;
  location_type: 'city' | 'province' | 'community';
  intro_text: string;
  conclusion_text?: string;
  keywords: string[];
  featured_image_url?: string;
  first_place_photo?: string | null; // Photo reference o URL del primer lugar del Top 10
  first_place_photo_is_url?: boolean; // True si es URL completa, false si es photo_reference
  published: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostWithPlaces extends BlogPost {
  places: any[]; // Array de lugares filtrados
}

/** Marcador para artículo HTML completo (vs intro legacy en texto plano) */
export const BLOG_FULL_HTML_MARKER = '<!-- FULL_HTML -->';

export function isBlogFullHtml(content: string | null | undefined): boolean {
  return Boolean(content?.startsWith(BLOG_FULL_HTML_MARKER));
}

export function extractBlogHtml(content: string): string {
  return content.replace(BLOG_FULL_HTML_MARKER, '').trim();
}

