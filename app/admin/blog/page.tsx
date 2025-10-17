'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  TrendingUp,
  Search,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import type { BlogPost } from '@/types/blog';

export default function AdminBlogPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPosts();
    }
  }, [user, isAdmin]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blog');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Error cargando posts');
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = async (postId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/blog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: postId, 
          published: !currentStatus 
        })
      });

      if (response.ok) {
        toast.success(currentStatus ? 'Post ocultado' : 'Post publicado');
        fetchPosts();
      } else {
        toast.error('Error actualizando post');
      }
    } catch (error) {
      toast.error('Error actualizando post');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de eliminar este post? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/blog', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId })
      });

      if (response.ok) {
        toast.success('Post eliminado');
        fetchPosts();
      } else {
        toast.error('Error eliminando post');
      }
    } catch (error) {
      toast.error('Error eliminando post');
    }
  };


  // Filtrar posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    
    const now = new Date();
    const postDate = new Date(post.created_at);
    const isVisible = post.published && postDate <= now;
    const isScheduled = post.published && postDate > now;
    
    const matchesPublished = filterPublished === 'all' || 
                            (filterPublished === 'published' && isVisible) ||
                            (filterPublished === 'draft' && isScheduled);
    
    return matchesSearch && matchesCategory && matchesPublished;
  });

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      restaurante: '🍽️',
      bar: '🍺',
      cafe: '☕',
      hotel: '🏨'
    };
    return emojis[category] || '📍';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                Gestor de Blog
              </h1>
              <p className="text-gray-600 mt-1">Administra los artículos del blog</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/admin/blog/nuevo')}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Post
              </Button>
              <Button
                onClick={() => router.push('/blog')}
                variant="outline"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Blog Público
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Publicados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {posts.filter(p => p.published).length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Programados</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {posts.filter(p => p.published && new Date(p.created_at) > new Date()).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vistas Totales</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {posts.reduce((sum, p) => sum + p.views_count, 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                <option value="restaurante">🍽️ Restaurantes</option>
                <option value="bar">🍺 Bares</option>
                <option value="cafe">☕ Cafeterías</option>
                <option value="hotel">🏨 Hoteles</option>
              </select>

              <select
                value={filterPublished}
                onChange={(e) => setFilterPublished(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="published">Visibles Ahora</option>
                <option value="draft">Programados (futuro)</option>
              </select>

              <Button onClick={fetchPosts} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refrescar
              </Button>
            </div>
          </Card>
        </div>

        {/* Posts Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vistas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryEmoji(post.category)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{post.title}</div>
                          <div className="text-sm text-gray-500">/blog/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {post.views_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(post.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const now = new Date();
                        const postDate = new Date(post.created_at);
                        
                        if (!post.published) {
                          return (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Oculto
                            </span>
                          );
                        }
                        
                        if (postDate > now) {
                          return (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                              Programado
                            </span>
                          );
                        }
                        
                        return (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Visible
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => router.push(`/admin/blog/${post.id}`)}
                          variant="ghost"
                          size="sm"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                          variant="ghost"
                          size="sm"
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => togglePublished(post.id, post.published)}
                          variant="ghost"
                          size="sm"
                          title={post.published ? 'Ocultar' : 'Publicar'}
                        >
                          {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={() => deletePost(post.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron posts</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

