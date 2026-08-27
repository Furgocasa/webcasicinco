import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { evaluateConversation, fetchPlacesForReview, formatPriorContext } from '@/lib/ai/evaluation-agent';

/**
 * POST - Analizar conversaciones pendientes con IA
 * Body: { limit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { limit = 20 } = await request.json().catch(() => ({ limit: 20 }));

    // Usar cliente admin
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener conversaciones sin analizar
    const { data: conversations, error } = await adminSupabase
      .from('chatbot_analytics')
      .select('*')
      .is('quality_assessment', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay conversaciones pendientes de analizar',
        analyzed: 0
      });
    }

    let analyzed = 0;
    let failed = 0;
    const results: any[] = [];

    // Analizar cada conversación
    for (const conv of conversations) {
      try {
        const extras = await fetchPlacesForReview(
          adminSupabase,
          conv.detected_intent,
          conv.bot_response || ''
        );
        const analysis = await evaluateConversation(
          conv.user_message,
          conv.bot_response,
          conv.detected_intent,
          conv.places_found,
          undefined,
          {
            priorContext: formatPriorContext(conv.conversation_context),
            placesReales: extras.placesReales,
            citedMissing: extras.citedMissing,
          }
        );

        // Actualizar en BD
        const { error: updateError } = await adminSupabase
          .from('chatbot_analytics')
          .update({
            ai_summary: analysis.summary,
            quality_assessment: analysis.quality,
            quality_reasoning: analysis.reasoning,
            suggested_improvements: analysis.improvements
              ? `${analysis.improvements}${analysis.data_gap && analysis.data_gap !== 'none' ? ` | hueco: ${analysis.data_gap}` : ''}`
              : analysis.data_gap && analysis.data_gap !== 'none'
                ? `hueco: ${analysis.data_gap}`
                : null,
            analyzed_at: new Date().toISOString()
          })
          .eq('id', conv.id);

        if (updateError) {
          console.error(`Error actualizando ${conv.id}:`, updateError);
          failed++;
        } else {
          analyzed++;
          results.push({
            id: conv.id,
            quality: analysis.quality,
            summary: analysis.summary
          });
        }

        // Delay para no saturar OpenAI
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error analizando conversación ${conv.id}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      analyzed,
      failed,
      total: conversations.length,
      results: results.slice(0, 10) // Solo primeros 10 para no saturar response
    });

  } catch (error: any) {
    console.error('Error en analyze-conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - Obtener estadísticas de conversaciones
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Total de conversaciones
    const { count: total } = await adminSupabase
      .from('chatbot_analytics')
      .select('*', { count: 'exact', head: true });

    // Pendientes de analizar
    const { count: pending } = await adminSupabase
      .from('chatbot_analytics')
      .select('*', { count: 'exact', head: true })
      .is('quality_assessment', null);

    // Por calidad
    const { data: qualityData } = await adminSupabase
      .from('chatbot_analytics')
      .select('quality_assessment')
      .not('quality_assessment', 'is', null);

    const qualityCount: Record<string, number> = {
      correcta: 0,
      mejorable: 0,
      incorrecta: 0
    };

    qualityData?.forEach(item => {
      if (item.quality_assessment) {
        qualityCount[item.quality_assessment] = (qualityCount[item.quality_assessment] || 0) + 1;
      }
    });

    // Tiempo de respuesta promedio
    const { data: avgData } = await adminSupabase
      .from('chatbot_analytics')
      .select('query_time_ms')
      .not('query_time_ms', 'is', null);

    const avgQueryTime = avgData && avgData.length > 0
      ? Math.round(avgData.reduce((sum, item) => sum + (item.query_time_ms || 0), 0) / avgData.length)
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        total: total || 0,
        pending: pending || 0,
        analyzed: (total || 0) - (pending || 0),
        byQuality: qualityCount,
        avgQueryTimeMs: avgQueryTime
      }
    });

  } catch (error: any) {
    console.error('Error en GET analyze-conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

