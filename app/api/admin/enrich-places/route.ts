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

    // Obtener TODOS los lugares SIN descripción IA (sin límite)
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('id, name, published, ai_description')
      .is('ai_description', null); // Solo los que no tienen IA

    if (placesError) {
      throw new Error('Error al obtener lugares');
    }

    console.log(`📊 Total lugares sin IA: ${places?.length || 0}`);

    if (!places || places.length === 0) {
      // Verificar si hay lugares en total
      const { data: allPlaces } = await supabase
        .from('places')
        .select('id, ai_description', { count: 'exact' });
      
      const withAI = allPlaces?.filter(p => p.ai_description).length || 0;
      const withoutAI = allPlaces?.filter(p => !p.ai_description).length || 0;

      return NextResponse.json({
        success: true,
        message: `No hay lugares pendientes. Total: ${allPlaces?.length || 0}, Con IA: ${withAI}, Sin IA: ${withoutAI}`,
        enriched: 0,
        errors: 0,
      });
    }

    let enriched = 0;
    let errors = 0;

    console.log(`🎨 Enriqueciendo ${places.length} lugares...`);

    // Procesar cada lugar
    for (const place of places) {
      try {
        const success = await enrichPlace(place.id);
        
        if (success) {
          // Publicar el lugar después de enriquecerlo
          await supabase
            .from('places')
            .update({ 
              published: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', place.id);
          
          enriched++;
          console.log(`✅ ${enriched}/${places.length}: ${place.name}`);
        } else {
          errors++;
        }

        // Pausa para no saturar OpenAI
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error enriqueciendo ${place.name}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      enriched,
      errors,
      total: places.length,
      message: `${enriched} lugares enriquecidos y publicados, ${errors} errores`,
    });

  } catch (error: any) {
    console.error('Error en enriquecimiento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enriquecer lugares' },
      { status: 500 }
    );
  }
}

