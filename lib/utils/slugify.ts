import slugifyLib from 'slugify';

/**
 * Genera un slug único para un lugar
 * Ejemplo: "Restaurante El Pimpi" -> "restaurante-el-pimpi"
 */
export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

/**
 * Genera un slug único para un lugar incluyendo su ubicación
 * Ejemplo: "Restaurante El Pimpi", "Málaga" -> "restaurante-el-pimpi-malaga"
 */
export function generatePlaceSlug(name: string, city: string): string {
  const nameSlug = slugify(name);
  const citySlug = slugify(city);
  return `${nameSlug}-${citySlug}`;
}

/**
 * Genera un slug para una categoría
 */
export function generateCategorySlug(category: string): string {
  const categoryMap: Record<string, string> = {
    restaurante: 'restaurante',
    hotel: 'hotel',
    spa: 'spa',
    experiencia: 'experiencia',
  };
  
  return categoryMap[category.toLowerCase()] || slugify(category);
}

/**
 * Genera un slug para una provincia
 */
export function generateProvinceSlug(province: string): string {
  return slugify(province);
}
