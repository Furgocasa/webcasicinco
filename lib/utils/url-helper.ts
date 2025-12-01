/**
 * Convierte texto a slug URL-friendly (sin tildes ni caracteres especiales)
 * Ejemplo: "Málaga" → "malaga"
 * Ejemplo: "A Coruña" → "a-coruna"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres con tildes
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^a-z0-9-]/g, ''); // Solo letras, números y guiones
}

/**
 * Convierte slug de URL a texto formateado con mayúsculas
 * Ejemplo: "malaga" → "Málaga" (requiere mapeo manual para restaurar tildes)
 * Ejemplo: "a-coruna" → "A Coruña"
 */
export function fromSlug(slug: string): string {
  // Mapeo manual para provincias con nombres especiales
  const provinceMap: Record<string, string> = {
    'malaga': 'Málaga',
    'cadiz': 'Cádiz',
    'cordoba': 'Córdoba',
    'almeria': 'Almería',
    'avila': 'Ávila',
    'leon': 'León',
    'jaen': 'Jaén',
    'caceres': 'Cáceres',
    'a-coruna': 'A Coruña',
    'alava': 'Álava',
  };

  // Si existe en el mapeo, retornar el valor correcto
  if (provinceMap[slug]) {
    return provinceMap[slug];
  }

  // Si no, capitalizar cada palabra
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Genera una URL limpia para un lugar
 * Ejemplo: category="bar", province="Málaga", slug="fomo-bar-malaga"
 * → "/bar/malaga/fomo-bar-malaga"
 */
export function getPlaceUrl(category: string, province: string, slug: string): string {
  const provinceSlug = toSlug(province);
  return `/${category}/${provinceSlug}/${slug}`;
}

