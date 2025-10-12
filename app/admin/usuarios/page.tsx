'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Shield, 
  User,
  Mail,
  Calendar,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Crown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at?: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier?: string;
  last_sign_in_at?: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
        
        if (data.message) {
          toast.warning(data.message);
        }
      } else {
        toast.error(data.error || 'Error cargando usuarios');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Rol actualizado a ${newRole}`);
        setEditingUser(null);
        loadUsers(); // Recargar lista
      } else {
        toast.error(data.error || 'Error actualizando rol');
      }
    } catch (error) {
      console.error('Error cambiando rol:', error);
      toast.error('Error al cambiar rol');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Usuario eliminado');
        loadUsers(); // Recargar lista
      } else {
        toast.error(data.error || 'Error eliminando usuario');
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Estadísticas
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    regulares: users.filter(u => u.role === 'user' || !u.role).length,
    premium: users.filter(u => u.subscription_tier && u.subscription_tier !== 'free').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra usuarios, roles y permisos
          </p>
        </div>

        <Button
          onClick={loadUsers}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <Users className="h-12 w-12 text-indigo-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.admins}</p>
              </div>
              <Crown className="h-12 w-12 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Regulares</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.regulares}</p>
              </div>
              <User className="h-12 w-12 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Premium</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{stats.premium}</p>
              </div>
              <Shield className="h-12 w-12 text-amber-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por email o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro de rol */}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos los Roles</option>
                <option value="admin">Solo Admins</option>
                <option value="user">Solo Usuarios</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'Usuario' : 'Usuarios'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Registro</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Suscripción</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      {/* Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {user.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.email}</p>
                            {user.full_name && (
                              <p className="text-sm text-gray-500">{user.full_name}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-4 px-4">
                        {editingUser?.id === user.id ? (
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="user">Usuario</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? (
                              <>
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                Usuario
                              </>
                            )}
                          </Badge>
                        )}
                      </td>

                      {/* Fecha de registro */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Suscripción */}
                      <td className="py-4 px-4">
                        <Badge variant={user.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                          {user.subscription_tier || 'free'}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {editingUser?.id === user.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleChangeRole(user.id, newRole)}
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(null)}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(user);
                                  setNewRole(user.role);
                                }}
                                title="Cambiar rol"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info de Roles */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Información de Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Administrador</p>
              <p className="text-sm text-gray-600">
                Acceso completo: gestión de lugares, indexación, configuración y usuarios.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Usuario</p>
              <p className="text-sm text-gray-600">
                Acceso básico: ver lugares, guardar favoritos, planificar rutas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertencias */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">⚠️ Precauciones</p>
              <ul className="text-sm text-amber-800 mt-2 space-y-1">
                <li>• No puedes eliminar tu propia cuenta de administrador</li>
                <li>• Eliminar un usuario NO se puede deshacer</li>
                <li>• Al cambiar un usuario a admin, tendrá acceso total</li>
                <li>• Los usuarios premium mantendrán su suscripción</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

