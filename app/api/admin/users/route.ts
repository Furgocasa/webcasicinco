import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users
 * Obtener lista de todos los usuarios (solo admins)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar que el usuario sea admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Se requiere rol de administrador' },
        { status: 403 }
      );
    }

    // Obtener todos los usuarios usando auth.admin
    // Nota: Supabase Auth no expone todos los usuarios por seguridad
    // Usamos la tabla auth.users si tenemos acceso, sino usamos metadata
    
    // Opción 1: Obtener de la base de datos si tienes una tabla de profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error obteniendo profiles:', profilesError);
      
      // Si no hay tabla profiles, retornar solo info básica
      return NextResponse.json({
        success: true,
        users: [{
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'user',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        }],
        message: 'Tabla profiles no encontrada. Mostrando solo usuario actual.'
      });
    }

    // Formatear usuarios
    const users = profiles?.map((profile: any) => ({
      id: profile.id,
      email: profile.email,
      role: profile.role || 'user',
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      // Campos adicionales si existen
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      subscription_tier: profile.subscription_tier,
    })) || [];

    return NextResponse.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Error en GET /api/admin/users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
}

