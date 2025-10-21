'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  MapPin, 
  Star, 
  Calendar,
  TrendingUp,
  Award,
  Eye,
  Trash2,
  ExternalLink,
  User,
  BarChart3,
  Crown,
  CreditCard,
  Check,
  X as XIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import { toast } from 'sonner';

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'visits' | 'stats' | 'subscription'>('favorites');
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [accessInfo, setAccessInfo] = useState<any>(null);

  // Establecer título de la página
  useEffect(() => {
    document.title = 'Mi Perfil | Casi Cinco';
  }, []);

  useEffect(() => {
    loadUserData();
    loadAccessInfo();
  }, []);

  const loadAccessInfo = async () => {
    try {
      const response = await fetch('/api/user/access');
      const data = await response.json();
      if (data.success) {
        setAccessInfo(data.access); // ✅ Guardar solo el objeto access, no todo el response
      }
    } catch (error) {
      console.error('Error cargando info de acceso:', error);
    }
  };

  const loadUserData = async () => {
    try {
      // Cargar favoritos
      const favResponse = await fetch('/api/favorites');
      const favData = await favResponse.json();
      if (favData.success) {
        setFavorites(favData.favorites || []);
      }

      // Cargar visitas
      const visitsResponse = await fetch('/api/visits');
      const visitsData = await visitsResponse.json();
      if (visitsData.success) {
        setVisits(visitsData.visits || []);
      }

    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`/api/favorites?id=${favoriteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites(favorites.filter(f => f.id !== favoriteId));
        toast.success('Eliminado de favoritos');
      }
    } catch (error) {
      toast.error('Error al eliminar favorito');
    }
  };

  const handleRemoveVisit = async (visitId: string) => {
    try {
      const response = await fetch(`/api/visits?id=${visitId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVisits(visits.filter(v => v.id !== visitId));
        toast.success('Visita eliminada');
      }
    } catch (error) {
      toast.error('Error al eliminar visita');
    }
  };

  // Calcular estadísticas
  const stats = {
    totalFavorites: favorites.length,
    totalVisits: visits.length,
    citiesVisited: new Set(visits.map(v => v.place?.city).filter(Boolean)).size,
    provincesVisited: new Set(visits.map(v => v.place?.province).filter(Boolean)).size,
  };

  // Análisis de favoritos por categoría
  const favoritesByCategory = favorites.reduce((acc: any, fav) => {
    const category = fav.place?.category || 'Otros';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Análisis de favoritos por tier
  const favoritesByTier = favorites.reduce((acc: any, fav) => {
    if (!fav.place) return acc;
    const tier = calculateQualityTier(fav.place.rating, fav.place.review_count || 0);
    const tierInfo = getTierInfo(tier);
    if (!acc[tier]) {
      acc[tier] = { count: 0, name: tierInfo.name, icon: tierInfo.icon, color: tierInfo.color };
    }
    acc[tier].count++;
    return acc;
  }, {});

  // Lugares más visitados (conteo de visitas por lugar)
  const visitCounts = visits.reduce((acc: any, visit) => {
    const placeId = visit.place?.id;
    if (!placeId) return acc;
    
    if (!acc[placeId]) {
      acc[placeId] = {
        place: visit.place,
        count: 0,
      };
    }
    acc[placeId].count++;
    return acc;
  }, {});

  const topVisitedPlaces = Object.values(visitCounts)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <p className="text-gray-600">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <User className="h-10 w-10" />
            Mi Perfil
          </h1>
          <p className="text-gray-600">
            Tus lugares favoritos, visitas y estadísticas personales
          </p>
        </div>

        {/* Estadísticas - 4 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-pink-100">Favoritos</p>
                  <p className="mt-1 text-3xl font-bold">{stats.totalFavorites}</p>
                </div>
                <Heart className="h-8 w-8 text-pink-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-100">Visitas</p>
                  <p className="mt-1 text-3xl font-bold">{stats.totalVisits}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-100">Ciudades</p>
                  <p className="mt-1 text-3xl font-bold">{stats.citiesVisited}</p>
                </div>
                <MapPin className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-100">Provincias</p>
                  <p className="mt-1 text-3xl font-bold">{stats.provincesVisited}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'favorites'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className="h-4 w-4 inline mr-2" />
            Favoritos ({stats.totalFavorites})
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'visits'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Visitas ({stats.totalVisits})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'stats'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Estadísticas
          </button>
          
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'subscription'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Crown className="h-4 w-4 inline mr-2" />
            Suscripción
          </button>
        </div>

        {/* Contenido de Tabs */}
        <div>
          {/* TAB: FAVORITOS */}
          {activeTab === 'favorites' && (
            <div>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav) => {
                    const place = fav.place;
                    if (!place) return null;
                    
                    const tier = calculateQualityTier(place.rating, place.review_count || 0);
                    const tierInfo = getTierInfo(tier);
                    
                    return (
                      <Card key={fav.id} className="hover:shadow-lg transition">
                        <CardContent className="p-0">
                          {/* Foto */}
                          {(() => {
                            const photoUrl = getPlacePhotoUrl(place, 0);
                            return photoUrl ? (
                              <div className="relative h-48">
                                <img
                                  src={photoUrl}
                                  alt={place.name}
                                  className="w-full h-full object-cover rounded-t-lg"
                                  loading="lazy"
                                />
                              <div className="absolute top-2 right-2">
                                <button
                                  onClick={() => handleRemoveFavorite(fav.id)}
                                  className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition"
                                  title="Eliminar de favoritos"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ) : null;
                          })()}
                          
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-lg text-gray-900 flex-1">
                                {place.name}
                              </h3>
                              <span className="text-2xl">{tierInfo.icon}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-bold">{place.rating}</span>
                              <span className="text-xs text-gray-500">
                                ({place.review_count} reseñas)
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              {place.city}, {place.province}
                            </p>
                            
                            <Link href={`/${place.category}/${place.province}/${place.slug}`}>
                              <Button size="sm" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No tienes favoritos aún
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Explora el mapa y guarda tus lugares favoritos
                    </p>
                    <Link href="/mapa">
                      <Button>
                        <MapPin className="h-4 w-4 mr-2" />
                        Explorar Mapa
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB: VISITAS */}
          {activeTab === 'visits' && (
            <div>
              {visits.length > 0 ? (
                <div className="space-y-4">
                  {visits.map((visit) => {
                    const place = visit.place;
                    if (!place) return null;
                    
                    const tier = calculateQualityTier(place.rating, place.review_count || 0);
                    const tierInfo = getTierInfo(tier);
                    const visitDate = new Date(visit.visited_at);
                    
                    return (
                      <Card key={visit.id} className="hover:shadow-md transition">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Fecha */}
                            <div className="flex-shrink-0 text-center bg-blue-50 rounded-lg p-3">
                              <div className="text-2xl font-bold text-blue-600">
                                {visitDate.getDate()}
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                {visitDate.toLocaleString('es-ES', { month: 'short' })}
                              </div>
                            </div>
                            
                            {/* Info del lugar */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{tierInfo.icon}</span>
                                <h3 className="font-bold text-xl text-gray-900">
                                  {place.name}
                                </h3>
                              </div>
                              
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-bold">{place.rating}</span>
                                </div>
                                <span className="text-gray-400">·</span>
                                <span className="text-sm text-gray-600">{place.city}, {place.province}</span>
                              </div>
                              
                              {visit.notes && (
                                <p className="text-sm text-gray-600 italic mb-2">
                                  "{visit.notes}"
                                </p>
                              )}
                              
                              {visit.rating && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Tu valoración:</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star
                                        key={star}
                                        className={`h-3 w-3 ${
                                          star <= visit.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Acciones */}
                            <div className="flex flex-col gap-2">
                              <Link href={`/${place.category}/${place.province}/${place.slug}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <button
                                onClick={() => handleRemoveVisit(visit.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar visita"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No has registrado visitas
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Marca los lugares que visitas para llevar un registro
                    </p>
                    <Link href="/mapa">
                      <Button>
                        <MapPin className="h-4 w-4 mr-2" />
                        Explorar Lugares
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TAB: ESTADÍSTICAS */}
          {activeTab === 'stats' && (
            <div className="grid gap-6">
              {/* Grid de 2 columnas */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Favoritos por Categoría */}
                <Card className="border-2 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg">🏷️ Favoritos por Categoría</CardTitle>
                    <CardDescription>Tus preferencias de tipos de lugares</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(favoritesByCategory).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(favoritesByCategory)
                          .sort(([, a]: any, [, b]: any) => b - a)
                          .map(([category, count]: any) => (
                            <div key={category}>
                              <div className="flex items-center justify-between mb-1.5 text-sm">
                                <span className="font-medium text-gray-900 capitalize">{category}</span>
                                <span className="text-gray-600 font-bold">{count}</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                                  style={{ width: `${(count / stats.totalFavorites) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No tienes favoritos aún</p>
                    )}
                  </CardContent>
                </Card>

                {/* Favoritos por Tier */}
                <Card className="border-2 border-indigo-200">
                  <CardHeader>
                    <CardTitle className="text-lg">💎 Favoritos por Tier</CardTitle>
                    <CardDescription>Calidad de tus lugares favoritos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(favoritesByTier).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(favoritesByTier)
                          .sort(([, a]: any, [, b]: any) => b.count - a.count)
                          .map(([tier, data]: any) => (
                            <div key={tier}>
                              <div className="flex items-center justify-between mb-1.5 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{data.icon}</span>
                                  <span className="font-medium text-gray-900">{data.name}</span>
                                </div>
                                <span className="text-gray-600 font-bold">{data.count}</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full bg-gradient-to-r ${data.color}`}
                                  style={{ width: `${(data.count / stats.totalFavorites) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">No tienes favoritos aún</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Lugares más visitados */}
              {topVisitedPlaces.length > 0 && (
                <Card className="border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">🔥 Lugares Más Visitados</CardTitle>
                    <CardDescription>Tus lugares recurrentes favoritos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topVisitedPlaces.map((item: any, index) => {
                        const place = item.place;
                        const tier = calculateQualityTier(place.rating, place.review_count || 0);
                        const tierInfo = getTierInfo(tier);
                        
                        return (
                          <div key={place.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:shadow-md transition">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                              'bg-green-400'
                            }`}>
                              {item.count}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{tierInfo.icon}</span>
                                <h4 className="font-semibold text-sm text-gray-900 truncate">
                                  {place.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{place.rating}</span>
                                <span>·</span>
                                <span>{place.city}</span>
                                <span>·</span>
                                <Badge className="text-[10px]" variant="default">
                                  {item.count} {item.count === 1 ? 'visita' : 'visitas'}
                                </Badge>
                              </div>
                            </div>
                            <Link href={`/${place.category}/${place.province}/${place.slug}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resumen de actividad */}
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 Resumen de Actividad
                  </CardTitle>
                  <CardDescription>Tu experiencia en la plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Lugares</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Guardados como favoritos:</span>
                          <span className="font-bold text-pink-600">{stats.totalFavorites}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lugares visitados:</span>
                          <span className="font-bold text-blue-600">{stats.totalVisits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lugares únicos visitados:</span>
                          <span className="font-bold text-green-600">{Object.keys(visitCounts).length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Cobertura</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ciudades exploradas:</span>
                          <span className="font-bold text-green-600">{stats.citiesVisited}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Provincias visitadas:</span>
                          <span className="font-bold text-purple-600">{stats.provincesVisited}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Promedio visitas/lugar:</span>
                          <span className="font-bold text-indigo-600">
                            {Object.keys(visitCounts).length > 0 
                              ? (stats.totalVisits / Object.keys(visitCounts).length).toFixed(1)
                              : '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB: SUSCRIPCIÓN */}
          {activeTab === 'subscription' && (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-indigo-600" />
                    Mi Suscripción
                  </CardTitle>
                  <CardDescription>Gestiona tu plan y facturación</CardDescription>
                </CardHeader>
                <CardContent>
                  {!accessInfo ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Cargando información...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Estado actual */}
                      <div className={`p-6 rounded-xl border-2 ${
                        accessInfo.isAdmin ? 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700 text-white' :
                        accessInfo.isFreeUser ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-700 text-white' :
                        accessInfo.isInTrial ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300' :
                        accessInfo.subscriptionPlan ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300' :
                        'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className={`text-2xl font-bold mb-2 ${
                              accessInfo.isAdmin || accessInfo.isFreeUser ? 'text-white' : 'text-gray-900'
                            }`}>
                              {accessInfo.isAdmin ? '👑 Admin' :
                               accessInfo.isFreeUser ? '🎁 Usuario Gratis (Cortesía)' :
                               accessInfo.isInTrial ? `⏰ Trial - ${accessInfo.trialDaysRemaining} días restantes` :
                               accessInfo.subscriptionPlan === 'premium_monthly' ? '💎 Premium Mensual' :
                               accessInfo.subscriptionPlan === 'premium_yearly' ? '👑 Premium Anual' :
                               '❌ Sin Suscripción'}
                            </h3>
                            <p className={`text-sm ${
                              accessInfo.isAdmin || accessInfo.isFreeUser ? 'text-green-100' : 'text-gray-600'
                            }`}>
                              {accessInfo.isAdmin ? 'Acceso total y perpetuo' :
                               accessInfo.isFreeUser ? '✨ Acceso gratuito permanente otorgado por el administrador · Sin cargos nunca' :
                               accessInfo.isInTrial ? `Tu trial termina el ${new Date(accessInfo.trialEndsAt).toLocaleDateString('es-ES')}` :
                               accessInfo.subscriptionPlan ? 'Suscripción activa' :
                               'Suscríbete para continuar usando la app'}
                            </p>
                          </div>
                          {!accessInfo.isAdmin && (
                            <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                              accessInfo.isFreeUser ? 'bg-white text-green-600 shadow-lg' :
                              accessInfo.isInTrial ? 'bg-blue-600 text-white' :
                              accessInfo.subscriptionPlan ? 'bg-purple-600 text-white' :
                              'bg-orange-600 text-white'
                            }`}>
                              {accessInfo.isFreeUser ? '⭐ GRATIS PARA SIEMPRE' :
                               accessInfo.isInTrial ? 'TRIAL' :
                               accessInfo.subscriptionPlan ? 'ACTIVO' :
                               'INACTIVO'}
                            </div>
                          )}
                        </div>

                        {/* Información del plan */}
                        {accessInfo.subscriptionPlan && !accessInfo.isAdmin && !accessInfo.isFreeUser && (
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-white/50 backdrop-blur-sm p-3 rounded-lg">
                              <p className="text-gray-600 mb-1">Plan actual</p>
                              <p className="font-bold text-gray-900">
                                {accessInfo.subscriptionPlan === 'premium_monthly' ? '2,99€/mes' : '24,99€/año (2,08€/mes)'}
                              </p>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm p-3 rounded-lg">
                              <p className="text-gray-600 mb-1">Próximo cobro</p>
                              <p className="font-bold text-gray-900">
                                {accessInfo.subscriptionEndsAt ? new Date(accessInfo.subscriptionEndsAt).toLocaleDateString('es-ES') : 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Trial warning */}
                        {accessInfo.isInTrial && accessInfo.trialDaysRemaining <= 7 && (
                          <div className="mt-4 bg-orange-100 border border-orange-300 rounded-lg p-3 flex items-start gap-2">
                            <Award className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-semibold text-orange-900 mb-1">Tu trial termina pronto</p>
                              <p className="text-orange-800">
                                Quedan {accessInfo.trialDaysRemaining} días. Suscríbete ahora para no perder acceso.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {!accessInfo.isAdmin && !accessInfo.isFreeUser && accessInfo.subscriptionPlan && (
                          <Button
                            onClick={async () => {
                              const response = await fetch('/api/subscription/manage');
                              const data = await response.json();
                              if (data.url) {
                                window.location.href = data.url;
                              }
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Gestionar en Stripe
                          </Button>
                        )}
                        
                        {(accessInfo.isInTrial || !accessInfo.hasAccess) && !accessInfo.isAdmin && !accessInfo.isFreeUser && (
                          <Button
                            onClick={() => router.push('/pricing')}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            {accessInfo.isInTrial ? 'Ver Planes' : 'Suscribirse Ahora'}
                          </Button>
                        )}
                      </div>

                      {/* Info adicional */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">💡 Información</h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Cancela en cualquier momento desde el portal de Stripe</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Cambiar de plan mensual a anual (o viceversa) cuando quieras</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>Si cancelas durante el trial (30 días), no se cobra nada</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <XIcon className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span><strong>Al cancelar:</strong> No se devuelve el dinero, simplemente no se aplican nuevos cargos al finalizar el período actual</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

