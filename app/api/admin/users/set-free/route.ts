import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/users/set-free
 * Marca un usuario como gratis (acceso perpetuo sin pagar)
 * Solo admin puede ejecutar esta acción
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que es admin
    const role = user.user_metadata?.role;
    if (role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden ejecutar esta acción' },
        { status: 403 }
      );
    }

    // Obtener parámetros
    const body = await request.json();
    const { userId, isFree } = body;

    if (!userId || typeof isFree !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    // Llamar a la función de base de datos para actualizar
    const { data, error } = await supabase.rpc('set_user_as_free', {
      target_user_id: userId,
      is_free: isFree,
    });

    if (error) {
      console.error('Error setting user as free:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isFree 
        ? 'Usuario marcado como gratis correctamente' 
        : 'Acceso gratis removido correctamente',
    });
  } catch (error: any) {
    console.error('Error in set-free API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

