import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichPlace } from '@/lib/indexation/enricher';

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

    const { placeId } = await request.json();

    if (!placeId) {
      return NextResponse.json(
        { error: 'Se requiere placeId' },
        { status: 400 }
      );
    }

    // Enriquecer el lugar
    const success = await enrichPlace(placeId);

    if (!success) {
      return NextResponse.json(
        { error: 'Error al enriquecer el lugar' },
        { status: 500 }
      );
    }

    // Publicar después de enriquecer
    await supabase
      .from('places')
      .update({ 
        published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', placeId);

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {
    console.error('Error enriqueciendo lugar:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enriquecer' },
      { status: 500 }
    );
  }
}

