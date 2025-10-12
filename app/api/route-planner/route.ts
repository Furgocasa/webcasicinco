import { NextRequest, NextResponse } from 'next/server';
import { calculateRoute } from '@/lib/google/directions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeIds, origin } = body;

    if (!placeIds || placeIds.length < 2) {
      return NextResponse.json(
        { error: 'Se requieren al menos 2 lugares para calcular una ruta' },
        { status: 400 }
      );
    }

    // Calcular ruta óptima
    const route = await calculateRoute(origin, placeIds);

    return NextResponse.json({
      success: true,
      route,
    });

  } catch (error) {
    console.error('Error calculando ruta:', error);
    return NextResponse.json(
      { error: 'Error al calcular la ruta' },
      { status: 500 }
    );
  }
}
