import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cities?province=Murcia
 * Obtiene las ciudades de una provincia desde Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');

    if (!province) {
      return NextResponse.json({ error: 'Provincia requerida' }, { status: 400 });
    }

    // Obtener ciudades de Supabase
    const { data: cities, error } = await supabase
      .from('cities')
      .select('name, province, population, coords')
      .eq('province', province)
      .order('population', { ascending: false });

    if (error) {
      console.error('Error loading cities from Supabase:', error);
      return NextResponse.json({ error: 'Error al cargar ciudades' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      province,
      cities: cities || [],
      count: cities?.length || 0,
    });

  } catch (error: any) {
    console.error('Error in GET /api/admin/cities:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

