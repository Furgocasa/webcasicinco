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
    // ✅ SOLO mensajes activos (is_active = true)
    let query = supabase
      .from('chat_history')
      .select('role, message, created_at')
      .eq('is_active', true) // ← FILTRAR SOLO ACTIVOS
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

    let logs: Array<{ id: string; bot_response: string | null; voto_usuario: 'up' | 'down' | null }> = [];
    if (user) {
      const { data: analytics } = await supabase
        .from('chatbot_analytics')
        .select('id, bot_response, voto_usuario')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      logs = analytics || [];
    }

    const used = new Set<string>();
    const messages = (data || [])
      .reverse()
      .map((msg) => {
        if (msg.role !== 'assistant') return { role: msg.role, content: msg.message };
        const match = logs.find((l) => !used.has(l.id) && l.bot_response === msg.message);
        if (match) used.add(match.id);
        return {
          role: msg.role,
          content: msg.message,
          logId: match?.id,
          voto: match?.voto_usuario ?? null,
        };
      });

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

// DELETE - Marcar historial como obsoleto (SOFT DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ✅ SOFT DELETE MEJORADO: Marcar TODOS los mensajes como inactivos (no solo los activos)
    // Esto soluciona el bug donde mensajes viejos reaparecían al recargar
    let query = supabase
      .from('chat_history')
      .update({ 
        is_active: false,
        session_ended_at: new Date().toISOString()
      });

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

    // 🆕 CAMBIO CRÍTICO: NO filtrar por is_active = true
    // Marcamos TODOS los mensajes del usuario/sesión como inactivos

    const { error, count } = await query;

    if (error) {
      console.error('Error marcando historial como obsoleto:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    console.log(`✅ ${count || 0} mensajes de conversación ${user ? `usuario ${user.email}` : `sesión ${session_id}`} marcados como obsoletos`);

    return NextResponse.json({
      success: true,
      message: 'Conversación finalizada correctamente',
      deletedCount: count || 0,
    });

  } catch (error: any) {
    console.error('Error en DELETE historial:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}


