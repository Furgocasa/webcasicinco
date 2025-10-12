import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Llamar a la función SQL que obtiene las estadísticas
    const { data, error } = await supabase.rpc('get_filter_stats');

    if (error) {
      console.error('Error obteniendo estadísticas:', error);
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: data
    });

  } catch (error: any) {
    console.error('Error en API de estadísticas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
