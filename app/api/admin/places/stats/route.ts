import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Contar total de lugares
    const { count: total } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true });

    // Contar publicados
    const { count: published } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('published', true);

    // Contar borradores
    const { count: drafts } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('published', false);

    // Obtener provincias únicas
    const { data: provincesData } = await supabase
      .from('places')
      .select('province')
      .not('province', 'is', null);

    const provinces = provincesData 
      ? Array.from(new Set(provincesData.map(p => p.province))).sort()
      : [];

    // Obtener categorías únicas
    const { data: categoriesData } = await supabase
      .from('places')
      .select('category')
      .not('category', 'is', null);

    const categories = categoriesData
      ? Array.from(new Set(categoriesData.map(c => c.category)))
      : [];

    return NextResponse.json({
      success: true,
      total: total || 0,
      published: published || 0,
      drafts: drafts || 0,
      provinces,
      categories,
    });
  } catch (error: any) {
    console.error('Error en stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

