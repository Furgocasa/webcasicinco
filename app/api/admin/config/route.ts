import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET - Obtener configuración
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'chatbot_config';

    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      console.error('Error obteniendo configuración:', error);
      return NextResponse.json(
        { error: 'Error al obtener configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: data?.value || {},
    });

  } catch (error: any) {
    console.error('Error en API de configuración:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// POST - Guardar configuración
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

    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key y value son requeridos' },
        { status: 400 }
      );
    }

    // Usar cliente de servicio para evitar problemas con RLS
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar si ya existe la configuración
    const { data: existing } = await supabaseAdmin
      .from('app_config')
      .select('id')
      .eq('key', key)
      .single();

    let result;
    if (existing) {
      // Actualizar configuración existente
      result = await supabaseAdmin
        .from('app_config')
        .update({
          value,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('key', key);
    } else {
      // Insertar nueva configuración
      result = await supabaseAdmin
        .from('app_config')
        .insert({
          key,
          value,
          updated_by: user.id,
        });
    }

    if (result.error) {
      console.error('Error guardando configuración:', result.error);
      return NextResponse.json(
        { error: `Error al guardar: ${result.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente',
    });

  } catch (error: any) {
    console.error('Error en API de configuración:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

