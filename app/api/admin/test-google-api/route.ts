import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        GOOGLE_MAPS_API_KEY_exists: !!GOOGLE_API_KEY,
        GOOGLE_MAPS_API_KEY_length: GOOGLE_API_KEY?.length || 0,
        GOOGLE_MAPS_API_KEY_preview: GOOGLE_API_KEY ? GOOGLE_API_KEY.substring(0, 20) + '...' : 'NO ENCONTRADA',
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_exists: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      tests: []
    };

    if (!GOOGLE_API_KEY) {
      diagnostics.error = '❌ GOOGLE_MAPS_API_KEY NO ESTÁ CONFIGURADA';
      return NextResponse.json(diagnostics);
    }

    // TEST 1: Buscar restaurantes en Murcia
    try {
      const query = 'restaurantes in Murcia, Murcia, España';
      const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
      
      diagnostics.tests.push({
        test: 'TEXT_SEARCH_MURCIA',
        query,
        url,
        params: {
          query,
          key: GOOGLE_API_KEY.substring(0, 20) + '...',
        }
      });

      const response = await axios.get(url, {
        params: {
          query,
          key: GOOGLE_API_KEY,
        },
      });

      diagnostics.tests[0].response = {
        status: response.data.status,
        results_count: response.data.results?.length || 0,
        error_message: response.data.error_message || null,
        first_result: response.data.results?.[0] ? {
          name: response.data.results[0].name,
          place_id: response.data.results[0].place_id,
          rating: response.data.results[0].rating,
        } : null,
      };

      diagnostics.tests[0].success = response.data.status === 'OK';

    } catch (error: any) {
      diagnostics.tests[0].error = error.message;
      diagnostics.tests[0].success = false;
    }

    // TEST 2: Buscar lugares en Albacete
    try {
      const query = 'restaurantes in Albacete, España';
      const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
      
      diagnostics.tests.push({
        test: 'TEXT_SEARCH_ALBACETE',
        query,
        url,
      });

      const response = await axios.get(url, {
        params: {
          query,
          key: GOOGLE_API_KEY,
        },
      });

      diagnostics.tests[1].response = {
        status: response.data.status,
        results_count: response.data.results?.length || 0,
        error_message: response.data.error_message || null,
      };

      diagnostics.tests[1].success = response.data.status === 'OK';

    } catch (error: any) {
      diagnostics.tests[1].error = error.message;
      diagnostics.tests[1].success = false;
    }

    // TEST 3: Place Details
    try {
      // Usar un place_id conocido (La Alhambra)
      const placeId = 'ChIJfcIyLeb8cg0RS2-33TGT91k';
      const url = 'https://maps.googleapis.com/maps/api/place/details/json';
      
      diagnostics.tests.push({
        test: 'PLACE_DETAILS',
        place_id: placeId,
        url,
      });

      const response = await axios.get(url, {
        params: {
          place_id: placeId,
          fields: 'place_id,name,rating',
          key: GOOGLE_API_KEY,
        },
      });

      diagnostics.tests[2].response = {
        status: response.data.status,
        error_message: response.data.error_message || null,
        result: response.data.result ? {
          name: response.data.result.name,
          rating: response.data.result.rating,
        } : null,
      };

      diagnostics.tests[2].success = response.data.status === 'OK';

    } catch (error: any) {
      diagnostics.tests[2].error = error.message;
      diagnostics.tests[2].success = false;
    }

    // Resumen
    diagnostics.summary = {
      total_tests: diagnostics.tests.length,
      passed: diagnostics.tests.filter((t: any) => t.success).length,
      failed: diagnostics.tests.filter((t: any) => !t.success).length,
    };

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error ejecutando diagnósticos',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

