import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Obtener un job específico
      const { data: job, error } = await supabase
        .from('enrichment_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 });
      }

      // Calcular progreso
      const progress = job.total_places > 0 
        ? Math.round((job.processed_places / job.total_places) * 100)
        : 0;

      return NextResponse.json({
        success: true,
        job: {
          ...job,
          progress,
        }
      });
    }

    // Obtener último job del usuario
    const { data: jobs } = await supabase
      .from('enrichment_jobs')
      .select('*')
      .eq('admin_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const latestJob = jobs?.[0];

    if (latestJob) {
      const progress = latestJob.total_places > 0 
        ? Math.round((latestJob.processed_places / latestJob.total_places) * 100)
        : 0;

      return NextResponse.json({
        success: true,
        job: {
          ...latestJob,
          progress,
        }
      });
    }

    return NextResponse.json({
      success: true,
      job: null,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

