import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Endpoint optimizado para datos del mapa admin
 * Solo devuelve campos necesarios para markers (más rápido)
 */
export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Solo seleccionar campos necesarios para el mapa
    const { data: places, error } = await supabase
      .from('places')
      .select('id, name, category, latitude, longitude, rating, review_count, published, city, province, slug')
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error cargando datos del mapa:', error);
      return NextResponse.json(
        { success: false, error: 'Error al cargar datos del mapa' },
        { status: 500 }
      );
    }

    console.log(`✅ Cargados ${places?.length || 0} lugares para mapa admin`);

    return NextResponse.json({
      success: true,
      places: places || [],
      total: places?.length || 0,
    });

  } catch (error: any) {
    console.error('Error en API de mapa admin:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

