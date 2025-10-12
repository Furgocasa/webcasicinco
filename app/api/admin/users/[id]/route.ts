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

    // Eliminar de la tabla profiles
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error eliminando usuario:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Error eliminando usuario' },
        { status: 500 }
      );
    }

    // Nota: Para eliminar completamente de Supabase Auth, necesitarías:
    // const adminClient = createAdminClient();
    // await adminClient.auth.admin.deleteUser(id);
    
    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente'
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

