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
  RefreshCw,
  X,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface UserData {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at?: string;
  full_name?: string;
  avatar_url?: string;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  is_free_user?: boolean;
  trial_ends_at?: string | null;
  trial_days_remaining?: number;
  is_in_trial?: boolean;
  last_sign_in_at?: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  
  // Ordenamiento
  const [sortBy, setSortBy] = useState<'email' | 'created_at' | 'role' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal de edición de suscripción
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<UserData | null>(null);
  const [newSubscriptionType, setNewSubscriptionType] = useState<'free' | 'trial' | 'premium_monthly' | 'premium_yearly' | 'none'>('trial');

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

  const handleToggleFreeUser = async (userId: string, currentIsFree: boolean, userEmail: string) => {
    const action = currentIsFree ? 'quitar acceso gratis a' : 'dar acceso gratis a';
    if (!confirm(`¿Estás seguro de ${action} ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/set-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          isFree: !currentIsFree 
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || '✅ Estado actualizado');
        loadUsers(); // Recargar lista
      } else {
        toast.error(data.error || 'Error actualizando usuario');
      }
    } catch (error) {
      console.error('Error cambiando estado free:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  const handleOpenSubscriptionModal = (user: UserData) => {
    setEditingSubscription(user);
    
    // Determinar tipo actual
    if (user.is_free_user) {
      setNewSubscriptionType('free');
    } else if (user.is_in_trial) {
      setNewSubscriptionType('trial');
    } else if (user.subscription_plan === 'premium_monthly') {
      setNewSubscriptionType('premium_monthly');
    } else if (user.subscription_plan === 'premium_yearly') {
      setNewSubscriptionType('premium_yearly');
    } else {
      setNewSubscriptionType('none');
    }
    
    setShowSubscriptionModal(true);
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscription) return;

    try {
      const response = await fetch(`/api/admin/users/${editingSubscription.id}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionType: newSubscriptionType 
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Suscripción actualizada');
        setShowSubscriptionModal(false);
        setEditingSubscription(null);
        loadUsers();
      } else {
        toast.error(data.error || 'Error actualizando suscripción');
      }
    } catch (error) {
      console.error('Error actualizando suscripción:', error);
      toast.error('Error al actualizar suscripción');
    }
  };

  // Filtrar y ordenar usuarios
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = !searchTerm || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'role') {
        comparison = (a.role || 'user').localeCompare(b.role || 'user');
      } else if (sortBy === 'status') {
        // Ordenar por estado: Admin > Free > Trial > Premium > Sin acceso
        const getStatusPriority = (u: UserData) => {
          if (u.role === 'admin') return 0;
          if (u.is_free_user) return 1;
          if (u.is_in_trial) return 2;
          if (u.subscription_plan) return 3;
          return 4;
        };
        comparison = getStatusPriority(a) - getStatusPriority(b);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Cambiar ordenamiento
  const handleSort = (column: 'email' | 'created_at' | 'role' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Estadísticas
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    regulares: users.filter(u => u.role === 'user' || !u.role).length,
    premium: users.filter(u => u.subscription_plan).length,
    freeUsers: users.filter(u => u.is_free_user).length,
    inTrial: users.filter(u => u.is_in_trial).length,
  };

  // Función para exportar a CSV
  const exportToCSV = () => {
    try {
      // Preparar datos para exportación
      const exportData = filteredUsers.map(user => ({
        'ID': user.id,
        'Email': user.email,
        'Nombre': user.full_name || '',
        'Rol': user.role === 'admin' ? 'Administrador' : 'Usuario',
        'Plan Suscripción': user.subscription_plan || 'Ninguno',
        'Estado Suscripción': user.subscription_status || 'Ninguno',
        'Usuario Gratis': user.is_free_user ? 'Sí' : 'No',
        'En Trial': user.is_in_trial ? 'Sí' : 'No',
        'Días Trial Restantes': user.trial_days_remaining || 0,
        'Trial Termina': user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleString('es-ES') : '',
        'Fecha Registro': user.created_at ? new Date(user.created_at).toLocaleString('es-ES') : '',
        'Última Conexión': user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-ES') : '',
        'Actualizado': user.updated_at ? new Date(user.updated_at).toLocaleString('es-ES') : ''
      }));

      // Convertir a CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escapar comillas y envolver en comillas si contiene comas o saltos de línea
            const stringValue = String(value || '');
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');

      // Descargar archivo
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `usuarios_casicinco_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`✅ CSV exportado: ${exportData.length} usuarios`);
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error('Error al exportar CSV');
    }
  };

  // Función para exportar a Excel (XLSX)
  const exportToExcel = () => {
    try {
      // Preparar datos para exportación
      const exportData = filteredUsers.map(user => ({
        'ID': user.id,
        'Email': user.email,
        'Nombre': user.full_name || '',
        'Rol': user.role === 'admin' ? 'Administrador' : 'Usuario',
        'Plan Suscripción': user.subscription_plan || 'Ninguno',
        'Estado Suscripción': user.subscription_status || 'Ninguno',
        'Usuario Gratis': user.is_free_user ? 'Sí' : 'No',
        'En Trial': user.is_in_trial ? 'Sí' : 'No',
        'Días Trial Restantes': user.trial_days_remaining || 0,
        'Trial Termina': user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleString('es-ES') : '',
        'Fecha Registro': user.created_at ? new Date(user.created_at).toLocaleString('es-ES') : '',
        'Última Conexión': user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-ES') : '',
        'Actualizado': user.updated_at ? new Date(user.updated_at).toLocaleString('es-ES') : ''
      }));

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 30 }, // ID
        { wch: 35 }, // Email
        { wch: 30 }, // Nombre
        { wch: 15 }, // Rol
        { wch: 20 }, // Plan Suscripción
        { wch: 20 }, // Estado Suscripción
        { wch: 15 }, // Usuario Gratis
        { wch: 12 }, // En Trial
        { wch: 20 }, // Días Trial Restantes
        { wch: 20 }, // Trial Termina
        { wch: 20 }, // Fecha Registro
        { wch: 20 }, // Última Conexión
        { wch: 20 }, // Actualizado
      ];
      worksheet['!cols'] = columnWidths;

      // Descargar archivo
      XLSX.writeFile(workbook, `usuarios_casicinco_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success(`✅ Excel exportado: ${exportData.length} usuarios`);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      toast.error('Error al exportar Excel');
    }
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

        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            disabled={loading || filteredUsers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            onClick={exportToExcel}
            variant="outline"
            disabled={loading || filteredUsers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            onClick={loadUsers}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs font-medium text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              <p className="text-xs font-medium text-gray-600">Admins</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.freeUsers}</p>
              <p className="text-xs font-medium text-gray-600">Free</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.inTrial}</p>
              <p className="text-xs font-medium text-gray-600">En Trial</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">{stats.premium}</p>
              <p className="text-xs font-medium text-gray-600">Premium</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-600">{stats.regulares}</p>
              <p className="text-xs font-medium text-gray-600">Regulares</p>
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
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        {sortBy === 'email' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-2">
                        Rol
                        {sortBy === 'role' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Registro
                        {sortBy === 'created_at' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Suscripción</th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Estado
                        {sortBy === 'status' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
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
                        <Badge variant={
                          user.subscription_plan ? 'default' : 
                          user.is_free_user ? 'success' : 
                          'secondary'
                        }>
                          {user.is_free_user ? '🎁 Free' :
                           user.subscription_plan === 'premium_monthly' ? '💎 Mensual' :
                           user.subscription_plan === 'premium_yearly' ? '👑 Anual' :
                           user.subscription_plan || 'Ninguna'}
                        </Badge>
                      </td>

                      {/* Estado (Trial/Activo) */}
                      <td className="py-4 px-4">
                        {user.role === 'admin' ? (
                          <Badge className="bg-purple-100 text-purple-700">
                            👑 Admin
                          </Badge>
                        ) : user.is_free_user ? (
                          <Badge className="bg-green-100 text-green-700">
                            ✅ Acceso Gratis
                          </Badge>
                        ) : user.is_in_trial ? (
                          <Badge className="bg-blue-100 text-blue-700">
                            ⏰ Trial ({user.trial_days_remaining}d)
                          </Badge>
                        ) : user.subscription_status === 'active' ? (
                          <Badge className="bg-indigo-100 text-indigo-700">
                            ✅ Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700">
                            ❌ Sin acceso
                          </Badge>
                        )}
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
                              {/* Botón marcar como Free (solo para usuarios no-admin) */}
                              {/* Botón editar suscripción (icono estrella) */}
                              {user.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenSubscriptionModal(user)}
                                  className="hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-700"
                                  title="Editar suscripción (Free/Trial/Premium/Sin acceso)"
                                >
                                  <Crown className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(user);
                                  setNewRole(user.role);
                                }}
                                title={user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
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

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando {indexOfFirstUser + 1} a {Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length} usuarios
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? 'primary' : 'outline'}
                        onClick={() => paginate(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Editar Suscripción */}
      {showSubscriptionModal && editingSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="h-5 w-5 text-indigo-600" />
                Editar Suscripción
              </h3>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Info del usuario */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{editingSubscription.email}</p>
                <p className="text-xs text-gray-600">Registro: {new Date(editingSubscription.created_at).toLocaleDateString('es-ES')}</p>
              </div>

              {/* Selector de tipo de suscripción */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Tipo de Acceso:
                </label>
                <div className="space-y-2">
                  {/* Free */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                    newSubscriptionType === 'free' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="subscription"
                      value="free"
                      checked={newSubscriptionType === 'free'}
                      onChange={(e) => setNewSubscriptionType('free')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">🎁 Free (Cortesía)</p>
                      <p className="text-xs text-gray-600">Acceso gratis permanente. No paga nunca.</p>
                    </div>
                  </label>

                  {/* Trial */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                    newSubscriptionType === 'trial' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="subscription"
                      value="trial"
                      checked={newSubscriptionType === 'trial'}
                      onChange={(e) => setNewSubscriptionType('trial')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">⏰ Trial (30 días)</p>
                      <p className="text-xs text-gray-600">30 días de prueba gratis. Requiere tarjeta.</p>
                    </div>
                  </label>

                  {/* Premium Mensual */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                    newSubscriptionType === 'premium_monthly' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="subscription"
                      value="premium_monthly"
                      checked={newSubscriptionType === 'premium_monthly'}
                      onChange={(e) => setNewSubscriptionType('premium_monthly')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">💎 Premium Mensual</p>
                      <p className="text-xs text-gray-600">2,99€/mes. Suscripción activa.</p>
                    </div>
                  </label>

                  {/* Premium Anual */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                    newSubscriptionType === 'premium_yearly' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="subscription"
                      value="premium_yearly"
                      checked={newSubscriptionType === 'premium_yearly'}
                      onChange={(e) => setNewSubscriptionType('premium_yearly')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">👑 Premium Anual</p>
                      <p className="text-xs text-gray-600">24,99€/año (2,08€/mes). Mejor valor.</p>
                    </div>
                  </label>

                  {/* Sin acceso */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                    newSubscriptionType === 'none' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="subscription"
                      value="none"
                      checked={newSubscriptionType === 'none'}
                      onChange={(e) => setNewSubscriptionType('none')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">❌ Sin Acceso</p>
                      <p className="text-xs text-gray-600">Bloquear acceso. Tendrá que suscribirse.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>⚠️ Atención:</strong> Este cambio es manual y puede conflictuar con Stripe. 
                  Úsalo solo en casos excepcionales (soporte, emergencias).
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowSubscriptionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateSubscription}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info de Roles y Estados */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Información de Roles y Estados
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 mb-3">Roles:</h4>
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
                  Acceso estándar: mapa, chatbot, rutas (según suscripción).
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 mb-3">Estados:</h4>
            <div className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">🎁 Free (Cortesía)</p>
                <p className="text-sm text-gray-600">
                  Acceso gratis permanente. Admin puede activar/desactivar.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">⏰ Trial</p>
                <p className="text-sm text-gray-600">
                  30 días de prueba gratis. Cobra automáticamente al terminar.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">💎 Premium</p>
                <p className="text-sm text-gray-600">
                  Suscripción activa: 2,99€/mes o 24,99€/año.
                </p>
              </div>
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
                <li>• <strong>Botón verde (🎁):</strong> Da/Quita acceso gratis permanente (no necesitan pagar)</li>
                <li>• <strong>Free users:</strong> Ignora suscripción Stripe, siempre tienen acceso</li>
                <li>• No puedes eliminar tu propia cuenta de administrador</li>
                <li>• Eliminar un usuario NO se puede deshacer</li>
                <li>• Al cambiar un usuario a admin, tendrá acceso total al panel</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

