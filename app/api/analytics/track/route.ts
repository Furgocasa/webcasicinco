import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST - Trackear evento de usuario
 * 
 * Body: {
 *   event_type: string,
 *   event_category: string,
 *   session_id: string,
 *   place_id?: string,
 *   place_name?: string,
 *   place_category?: string,
 *   page_url: string,
 *   device_type: string,
 *   user_agent: string,
 *   referrer?: string,
 *   event_data: object
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_type,
      event_category,
      session_id,
      place_id,
      place_name,
      place_category,
      page_url,
      event_data,
      device_type,
      user_agent,
      referrer
    } = body;

    // Validación básica
    if (!event_type || !event_category || !session_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Obtener usuario si está autenticado
    const { data: { user } } = await supabase.auth.getUser();

    // Guardar evento en analytics
    const { error } = await supabase.from('user_analytics').insert({
      user_id: user?.id || null,
      session_id,
      event_type,
      event_category,
      place_id: place_id || null,
      place_name: place_name || null,
      place_category: place_category || null,
      page_url,
      event_data,
      device_type,
      user_agent,
      referrer: referrer || null
    });

    if (error) {
      console.error('Error saving analytics:', error);
      // No devolver error 500, solo success false (no afectar UX del usuario)
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in analytics track:', error);
    // No devolver error, solo success false
    return NextResponse.json({ success: false });
  }
}

