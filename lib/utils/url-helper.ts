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
  // Mapeo manual para provincias con tildes y caracteres especiales
  // Valores canónicos alineados con lo más frecuente en BD
  const provinceMap: Record<string, string> = {
    // Provincias con tildes
    'malaga': 'Málaga',
    'cadiz': 'Cádiz',
    'cordoba': 'Córdoba',
    'almeria': 'Almería',
    'avila': 'Ávila',
    'leon': 'León',
    'jaen': 'Jaén',
    'caceres': 'Cáceres',
    'alava': 'Álava',
    'guipuzcoa': 'Guipúzcoa',
    'gipuzkoa': 'Gipuzkoa',
    'vizcaya': 'Vizcaya',
    'bizkaia': 'Bizkaia',
    // Ciudad usada como provincia en URLs estáticas
    'bilbao': 'Vizcaya',
    // Provincias con múltiples palabras o caracteres especiales
    'a-coruna': 'A Coruña',
    'la-coruna': 'A Coruña',
    'islas-baleares': 'Baleares',
    'baleares': 'Baleares',
    'illes-balears': 'Illes Balears',
    'las-palmas': 'Las Palmas',
    'santa-cruz-de-tenerife': 'Santa Cruz de Tenerife',
    'castellon': 'Castellón',
    'castello': 'Castellón',
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
 * Nombres de provincia a buscar en BD (incluye alias fragmentados).
 * Ej: "baleares" → Baleares + Illes Balears + Islas Baleares
 */
export function getProvinceSearchNames(provinceSlug: string): string[] {
  const canonical = fromSlug(provinceSlug);
  const aliasGroups: string[][] = [
    ['Baleares', 'Illes Balears', 'Islas Baleares'],
    ['Vizcaya', 'Bizkaia'],
    ['Guipúzcoa', 'Gipuzkoa'],
    ['Álava', 'Araba'],
  ];

  for (const group of aliasGroups) {
    if (group.some((name) => name.toLowerCase() === canonical.toLowerCase())) {
      return group;
    }
  }

  return [canonical];
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

