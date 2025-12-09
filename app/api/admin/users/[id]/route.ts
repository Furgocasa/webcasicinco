import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * PATCH /api/admin/users/[id]
 * Actualizar usuario (cambiar rol, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Rol inválido. Debe ser "user" o "admin"' },
        { status: 400 }
      );
    }

    // Actualizar en la tabla profiles
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando usuario:', error);
      return NextResponse.json(
        { success: false, error: 'Error actualizando usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: `Rol actualizado a ${role} correctamente`
    });

  } catch (error) {
    console.error('Error en PATCH /api/admin/users/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Eliminar usuario (solo admins)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // No permitir que un admin se elimine a sí mismo
    if (id === user.id) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminar tu propia cuenta de administrador' },
        { status: 400 }
      );
    }

    // Usar cliente admin para bypass de RLS
    const adminClient = createAdminClient();

    // Eliminar de la tabla profiles primero
    const { error: deleteProfileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteProfileError) {
      console.error('Error eliminando perfil:', deleteProfileError);
      return NextResponse.json(
        { success: false, error: 'Error eliminando perfil de usuario' },
        { status: 500 }
      );
    }

    // Eliminar completamente de Supabase Auth
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      console.error('Error eliminando usuario de auth:', deleteAuthError);
      // El perfil ya se eliminó, pero el usuario auth no
      return NextResponse.json({
        success: true,
        message: 'Perfil eliminado. Usuario auth no pudo eliminarse.',
        warning: deleteAuthError.message
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado completamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
}

