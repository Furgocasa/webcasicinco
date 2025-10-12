import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Cargar historial (últimos 10 mensajes - 5 pares de conversación)
    let query = supabase
      .from('chat_history')
      .select('role, message, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (user) {
      query = query.eq('user_id', user.id);
    } else if (session_id) {
      query = query.eq('session_id', session_id);
    } else {
      return NextResponse.json({
        success: true,
        messages: [],
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error cargando historial:', error);
      return NextResponse.json({
        success: true,
        messages: [],
      });
    }

    // Ordenar de más antiguo a más reciente para mostrar correctamente
    const messages = (data || [])
      .reverse() // Invertir porque la query trae del más reciente al más antiguo
      .map(msg => ({
        role: msg.role,
        content: msg.message,
      }));

    return NextResponse.json({
      success: true,
      messages,
    });

  } catch (error: any) {
    console.error('Error en API de historial:', error);
    return NextResponse.json({
      success: true,
      messages: [],
    });
  }
}

// DELETE - Borrar historial de conversación
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Borrar historial
    let query = supabase
      .from('chat_history')
      .delete();

    if (user) {
      query = query.eq('user_id', user.id);
    } else if (session_id) {
      query = query.eq('session_id', session_id);
    } else {
      return NextResponse.json({
        success: false,
        error: 'No session',
      });
    }

    const { error } = await query;

    if (error) {
      console.error('Error borrando historial:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Historial borrado correctamente',
    });

  } catch (error: any) {
    console.error('Error en DELETE historial:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}


