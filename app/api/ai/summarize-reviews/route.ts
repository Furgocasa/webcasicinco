import { NextRequest, NextResponse } from 'next/server';
import { generatePlaceDescription } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { place } = body;

    if (!place || !place.name) {
      return NextResponse.json(
        { error: 'Datos del lugar requeridos' },
        { status: 400 }
      );
    }

    // Generar descripción con IA
    const description = await generatePlaceDescription({
      name: place.name,
      category: place.category || 'Lugar',
      city: place.city || '',
      province: place.province || '',
      rating: place.rating || 4.7,
      review_count: place.review_count || 0,
      price_level: place.price_level,
      reviews: place.reviews || [],
    });

    return NextResponse.json({
      success: true,
      description,
    });

  } catch (error) {
    console.error('Error generando descripción:', error);
    return NextResponse.json(
      { error: 'Error al generar la descripción con IA' },
      { status: 500 }
    );
  }
}
