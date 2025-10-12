import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlaceDetails, categorizePlaceByTypes } from '@/lib/google/places';

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

    // Obtener solo lugares mal categorizados como "experiencia"
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('id, google_place_id, name, category')
      .eq('category', 'experiencia'); // Solo recategorizar los "experiencia"

    if (placesError) {
      throw new Error('Error al obtener lugares');
    }

    let updated = 0;
    let errors = 0;

    console.log(`🔄 Recategorizando ${places?.length || 0} lugares...`);

    for (const place of places || []) {
      try {
        // Obtener detalles de Google para obtener los types
        const details = await getPlaceDetails(place.google_place_id);
        
        // Recategorizar con la nueva lógica
        const newCategory = categorizePlaceByTypes(details.types || []);

        // Actualizar solo si la categoría cambió
        if (newCategory !== place.category) {
          const { error: updateError } = await supabase
            .from('places')
            .update({ 
              category: newCategory,
              updated_at: new Date().toISOString(),
            })
            .eq('id', place.id);

          if (updateError) {
            console.error(`Error actualizando ${place.name}:`, updateError);
            errors++;
          } else {
            console.log(`✅ ${place.name}: ${place.category} → ${newCategory}`);
            updated++;
          }
        }

        // Pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error procesando ${place.name}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      errors,
      total: places?.length || 0,
    });

  } catch (error: any) {
    console.error('Error en recategorización:', error);
    return NextResponse.json(
      { error: error.message || 'Error al recategorizar' },
      { status: 500 }
    );
  }
}

