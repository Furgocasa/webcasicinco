/**
 * CIUDADES DESDE SUPABASE
 * Lee la lista de ciudades desde la tabla cities_to_province
 * con fallback al archivo hardcodeado
 */

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { CityData } from './cities-database';

// Tipo para las filas de cities_to_province
interface CityRow {
  city_name: string;
  province: string;
  latitude: string;
  longitude: string;
  population: number;
  priority: number;
  active: boolean;
}

// Helper para crear cliente admin
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Obtener ciudades de una provincia desde Supabase
 * @param province Nombre de la provincia
 * @param priorityFilter Filtro por prioridad (1=Grande, 2=Mediana, 3=Pequeña)
 * @returns Array de ciudades
 */
export async function getCitiesFromSupabase(
  province: string,
  priorityFilter?: 1 | 2 | 3 | 'all'
): Promise<CityData[]> {
  try {
    const supabase = getAdminClient();
    
    // Construir query
    let query = supabase
      .from('cities_to_province')
      .select('*')
      .eq('province', province)
      .eq('active', true)
      .order('priority', { ascending: true })
      .order('population', { ascending: false });
    
    // Aplicar filtro de prioridad si se especifica
    if (priorityFilter && priorityFilter !== 'all') {
      query = query.lte('priority', priorityFilter);
    }
    
    const { data: rawData, error } = await query;
    
    if (error) {
      console.error(`❌ Error obteniendo ciudades de Supabase para ${province}:`, error);
      return [];
    }
    
    const data = rawData as CityRow[] | null;
    
    if (!data || data.length === 0) {
      console.warn(`⚠️ No se encontraron ciudades en Supabase para: ${province}`);
      return [];
    }
    
    // Transformar a formato CityData
    return data.map(row => ({
      name: row.city_name,
      coords: { 
        lat: parseFloat(row.latitude), 
        lng: parseFloat(row.longitude) 
      },
      population: row.population,
      priority: row.priority as 1 | 2 | 3
    }));
    
  } catch (error) {
    console.error(`❌ Error inesperado obteniendo ciudades de Supabase para ${province}:`, error);
    return [];
  }
}

/**
 * Obtener TODAS las ciudades de TODAS las provincias de una vez
 * (Más eficiente para el inicio del proceso de indexación)
 * @returns Map de provincia → ciudades
 */
export async function getAllCitiesFromSupabase(): Promise<Map<string, CityData[]>> {
  try {
    const supabase = getAdminClient();
    
    const { data: rawData, error } = await supabase
      .from('cities_to_province')
      .select('*')
      .eq('active', true)
      .order('province', { ascending: true })
      .order('priority', { ascending: true })
      .order('population', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo todas las ciudades de Supabase:', error);
      return new Map();
    }
    
    const data = rawData as CityRow[] | null;
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No se encontraron ciudades en Supabase');
      return new Map();
    }
    
    // Agrupar por provincia
    const citiesByProvince = new Map<string, CityData[]>();
    
    for (const row of data) {
      const cityData: CityData = {
        name: row.city_name,
        coords: { 
          lat: parseFloat(row.latitude), 
          lng: parseFloat(row.longitude) 
        },
        population: row.population,
        priority: row.priority as 1 | 2 | 3
      };
      
      if (!citiesByProvince.has(row.province)) {
        citiesByProvince.set(row.province, []);
      }
      
      citiesByProvince.get(row.province)!.push(cityData);
    }
    
    console.log(`✅ Cargadas ${data.length} ciudades de ${citiesByProvince.size} provincias desde Supabase`);
    
    return citiesByProvince;
    
  } catch (error) {
    console.error('❌ Error inesperado obteniendo todas las ciudades:', error);
    return new Map();
  }
}

/**
 * Verificar si Supabase tiene datos de ciudades
 * @returns true si hay datos disponibles
 */
export async function hasSupabaseCitiesData(): Promise<boolean> {
  try {
    const supabase = getAdminClient();
    
    const { count, error } = await supabase
      .from('cities_to_province')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error verificando datos de ciudades en Supabase:', error);
      return false;
    }
    
    return (count || 0) > 0;
  } catch (error) {
    console.error('Error inesperado verificando Supabase:', error);
    return false;
  }
}

