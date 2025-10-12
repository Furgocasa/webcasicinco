import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient();
    
    // Buscar lugar por slug
    const { data: place, error } = await supabase
      .from('places')
      .select('*')
      .eq('slug', params.slug)
      .eq('published', true) // Solo lugares publicados
      .single();

    if (error || !place) {
      return NextResponse.json(
        { error: 'Lugar no encontrado' },
        { status: 404 }
      );
    }

    // Calcular tier dinámicamente
    const tier = calculateTier(place.rating, place.review_count);

    return NextResponse.json({
      success: true,
      place: {
        ...place,
        quality_tier: tier,
      },
    });

  } catch (error: any) {
    console.error('Error obteniendo lugar:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener el lugar' },
      { status: 500 }
    );
  }
}

function calculateTier(rating: number, reviewCount: number): string {
  if (rating >= 4.8 && reviewCount >= 1000) return 'diamond';
  if (rating >= 4.8 && reviewCount >= 500) return 'platinum';
  if (rating >= 4.8 && reviewCount >= 200) return 'gold';
  if (rating >= 4.7 && reviewCount >= 100) return 'silver';
  if (rating >= 4.7) return 'bronze';
  return 'none';
}

