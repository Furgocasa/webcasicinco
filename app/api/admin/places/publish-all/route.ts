import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar rol admin
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Publicar TODOS los lugares
    const { data, error, count } = await supabase
      .from('places')
      .update({ 
        published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('published', false) // Solo los que NO están publicados
      .select('id', { count: 'exact' });

    if (error) {
      console.error('Error publicando lugares:', error);
      return NextResponse.json(
        { error: 'Error al publicar los lugares' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      message: `${count || 0} lugares publicados`,
    });

  } catch (error: any) {
    console.error('Error en publicación masiva:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

