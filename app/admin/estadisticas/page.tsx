'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw, TrendingUp, Users, MessageCircle, MapPin, Phone, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Stats {
  users: {
    total: number;
    active_7d: number;
    active_30d: number;
    new_7d: number;
  };
  places: {
    most_viewed: Array<{
      name: string;
      city: string;
      category: string;
      views: number;
    }>;
  };
  events: {
    total_7d: number;
    by_type: Record<string, number>;
  };
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  conversions: {
    phone_clicks: number;
    directions_clicks: number;
    website_clicks: number;
  };
}

export default function EstadisticasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  // Verificar que es admin
  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/stats?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [period, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📈 Estadísticas de la Plataforma
          </h1>
          <p className="text-gray-600">
            Analytics de uso e interacciones de usuarios
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '7d' | '30d')}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>

          <Button onClick={loadStats} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !stats ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600">No hay datos disponibles</p>
        </Card>
      ) : (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Usuarios Activos</div>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {period === '7d' ? stats.users.active_7d : stats.users.active_30d}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                +{stats.users.new_7d} nuevos (7d)
              </div>
            </Card>

            <Card className="p-6 border-green-200 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Conversiones</div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900">
                {stats.conversions.phone_clicks + stats.conversions.directions_clicks + stats.conversions.website_clicks}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Llamadas, Directions, Webs
              </div>
            </Card>

            <Card className="p-6 border-purple-200 bg-purple-50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Eventos Totales</div>
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {stats.events.total_7d}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Interacciones registradas
              </div>
            </Card>

            <Card className="p-6 border-orange-200 bg-orange-50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Dispositivos</div>
                <MessageCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-lg font-bold text-orange-900">
                📱 {stats.devices.mobile}% | 💻 {stats.devices.desktop}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Móvil vs Desktop
              </div>
            </Card>
          </div>

          {/* Lugares Más Visitados */}
          <Card className="p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🔥 Top 10 Lugares Más Visitados
            </h3>
            {stats.places.most_viewed.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No hay datos aún</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Lugar</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ciudad</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Categoría</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Visitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.places.most_viewed.map((place, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-bold">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900">{place.name}</td>
                        <td className="px-4 py-3 text-gray-600">{place.city}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            {place.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{place.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Conversiones Detalladas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-6 w-6 text-green-600" />
                <h4 className="font-semibold text-gray-900">Llamadas</h4>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.conversions.phone_clicks}</div>
              <div className="text-sm text-gray-600 mt-1">Clicks en teléfono</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Direcciones</h4>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.conversions.directions_clicks}</div>
              <div className="text-sm text-gray-600 mt-1">Abrir en Google Maps</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <ExternalLink className="h-6 w-6 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Webs Externas</h4>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.conversions.website_clicks}</div>
              <div className="text-sm text-gray-600 mt-1">Visitas a sitios web</div>
            </Card>
          </div>

          {/* Eventos por Tipo */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📊 Eventos por Tipo
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.events.by_type)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / stats.events.total_7d) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-16 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

