import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/blog/auto-publish
 * 
 * Auto-publica posts programados cuya fecha ya pasó
 */
export async function POST(request: NextRequest) {
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

    // Obtener posts no publicados cuya fecha ya pasó
    const { data: postsToPublish, error: fetchError } = await adminSupabase
      .from('blog_posts')
      .select('id')
      .eq('published', false)
      .lte('created_at', new Date().toISOString());

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!postsToPublish || postsToPublish.length === 0) {
      return NextResponse.json({ success: true, published: 0, message: 'No hay posts para publicar' });
    }

    // Publicar todos los posts
    const { error: updateError } = await adminSupabase
      .from('blog_posts')
      .update({ published: true })
      .in('id', postsToPublish.map(p => p.id));

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      published: postsToPublish.length,
      message: `${postsToPublish.length} posts publicados` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

