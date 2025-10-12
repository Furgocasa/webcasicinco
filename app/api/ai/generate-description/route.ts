import { NextRequest, NextResponse } from 'next/server';
import { generatePlaceDescription } from '@/lib/ai/openai';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y que sea admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { place_id } = body;

    if (!place_id) {
      return NextResponse.json({ error: 'place_id requerido' }, { status: 400 });
    }

    // Obtener el lugar de la BD
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', place_id)
      .single();

    if (placeError || !place) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    }

    // Generar descripción con IA
    const description = await generatePlaceDescription({
      name: place.name,
      category: place.category,
      city: place.city,
      province: place.province,
      rating: place.rating,
      review_count: place.review_count,
      price_level: place.price_level,
    });

    // Actualizar el lugar con la descripción
    const { error: updateError } = await supabase
      .from('places')
      .update({ ai_description: description })
      .eq('id', place_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      description,
    });
  } catch (error: any) {
    console.error('Error generando descripción:', error);
    return NextResponse.json(
      { error: error.message || 'Error generando descripción' },
      { status: 500 }
    );
  }
}
