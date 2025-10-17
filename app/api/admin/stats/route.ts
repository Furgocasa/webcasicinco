import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const days = period === '30d' ? 30 : 7;

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Usuarios activos
    const { count: activeUsers } = await adminSupabase
      .from('user_analytics')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .not('user_id', 'is', null);

    // Nuevos usuarios (desde auth.users)
    const { count: newUsers } = await adminSupabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    // Total usuarios
    const { count: totalUsers } = await adminSupabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    // Lugares más visitados
    let placeViews = null;
    try {
      const result = await adminSupabase
        .rpc('get_most_viewed_places', { days_ago: days, limit_count: 10 });
      placeViews = result.data;
    } catch (error) {
      // Si la función RPC no existe, placeViews quedará null
      console.log('RPC function not available, using manual query');
    }

    // Si la función no existe, hacer query manual
    let mostViewed = placeViews || [];
    if (!placeViews) {
      const { data } = await adminSupabase
        .from('user_analytics')
        .select('place_id, place_name, place_category, event_data')
        .eq('event_type', 'place_view')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .not('place_id', 'is', null);

      const grouped = (data || []).reduce((acc: any, item) => {
        const id = item.place_id;
        if (!acc[id]) {
          acc[id] = {
            name: item.place_name || 'Unknown',
            city: 'N/A',
            category: item.place_category || 'N/A',
            views: 0
          };
        }
        acc[id].views++;
        return acc;
      }, {});

      mostViewed = Object.values(grouped)
        .sort((a: any, b: any) => b.views - a.views)
        .slice(0, 10);
    }

    // Total eventos
    const { count: totalEvents } = await adminSupabase
      .from('user_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    // Eventos por tipo
    const { data: eventTypes } = await adminSupabase
      .from('user_analytics')
      .select('event_type')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    const byType = (eventTypes || []).reduce((acc: Record<string, number>, item) => {
      acc[item.event_type] = (acc[item.event_type] || 0) + 1;
      return acc;
    }, {});

    // Dispositivos
    const { data: devices } = await adminSupabase
      .from('user_analytics')
      .select('device_type')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    const deviceCounts = (devices || []).reduce((acc: Record<string, number>, item) => {
      acc[item.device_type || 'unknown'] = (acc[item.device_type || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    const totalDevices = Object.values(deviceCounts).reduce((a, b) => a + b, 0);

    // Conversiones
    const { count: phoneClicks } = await adminSupabase
      .from('user_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'place_phone_click')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    const { count: directionsClicks } = await adminSupabase
      .from('user_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'place_directions_click')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    const { count: websiteClicks } = await adminSupabase
      .from('user_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'place_website_click')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers || 0,
          active_7d: activeUsers || 0,
          active_30d: activeUsers || 0,
          new_7d: newUsers || 0
        },
        places: {
          most_viewed: mostViewed
        },
        events: {
          total_7d: totalEvents || 0,
          by_type: byType
        },
        devices: {
          mobile: totalDevices > 0 ? Math.round((deviceCounts.mobile || 0) / totalDevices * 100) : 0,
          desktop: totalDevices > 0 ? Math.round((deviceCounts.desktop || 0) / totalDevices * 100) : 0,
          tablet: totalDevices > 0 ? Math.round((deviceCounts.tablet || 0) / totalDevices * 100) : 0
        },
        conversions: {
          phone_clicks: phoneClicks || 0,
          directions_clicks: directionsClicks || 0,
          website_clicks: websiteClicks || 0
        }
      }
    });

  } catch (error: any) {
    console.error('Error en stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

