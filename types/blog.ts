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

const BLOG_CATEGORY_TITLES: Record<BlogPost['category'], string> = {
  restaurante: 'Restaurantes',
  bar: 'Bares',
  hotel: 'Hoteles',
};

/** Preposición natural: "de Valencia", "de la Costa del Sol", "del País Vasco" */
export function blogLocationPhrase(location: string): string {
  const loc = location.trim();
  if (/^costa del/i.test(loc)) return `de la ${loc}`;
  if (loc === 'País Vasco') return 'del País Vasco';
  return `de ${loc}`;
}

/**
 * Título editorial estándar Casi Cinco — criterio por valoración (+4.7★), no opinión subjetiva.
 * Ej: "Los 10 Restaurantes Mejor Valorados de Valencia (2026)"
 */
export function buildBlogPostTitle(
  category: BlogPost['category'],
  location: string,
  year: number = new Date().getFullYear()
): string {
  return `Los 10 ${BLOG_CATEGORY_TITLES[category]} Mejor Valorados ${blogLocationPhrase(location)} (${year})`;
}

