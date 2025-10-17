/**
 * Utilidades para generar slugs únicos y SEO-friendly
 */

/**
 * Genera un slug a partir de un texto
 * Ejemplo: "El Pimpi - Málaga" -> "el-pimpi-malaga"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Espacios -> guiones
    .replace(/-+/g, '-') // Múltiples guiones -> uno solo
    .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio/final
}

/**
 * Genera un slug único añadiendo un sufijo si es necesario
 * @param baseName - Nombre base para el slug
 * @param existingSlugs - Array de slugs existentes para verificar unicidad
 * @returns Slug único
 */
export function generateUniqueSlug(
  baseName: string,
  existingSlugs: string[] = []
): string {
  const baseSlug = generateSlug(baseName);
  
  // Si no existe, devolver el slug base
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  // Si existe, añadir sufijo numérico
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

/**
 * Genera un slug para un lugar específico
 * Incluye el nombre y opcionalmente la ciudad para mayor unicidad
 */
export function generatePlaceSlug(
  name: string,
  city?: string,
  existingSlugs: string[] = []
): string {
  const baseName = city ? `${name} ${city}` : name;
  return generateUniqueSlug(baseName, existingSlugs);
}

