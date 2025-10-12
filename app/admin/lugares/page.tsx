'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Search, 
  MapPin, 
  Star, 
  Filter,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  RefreshCw,
  Edit,
  ExternalLink,
  MoreVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateQualityTier, getTierMarkerColor, getTierInfo } from '@/lib/utils/tier-calculator';

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 40.4168,
  lng: -3.7038,
};

type SortField = 'name' | 'rating' | 'review_count' | 'created_at' | 'category' | 'province';
type SortOrder = 'asc' | 'desc';

export default function LugaresPage() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [places, setPlaces] = useState<any[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [showMap, setShowMap] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
    setCurrentPage(1); // Resetear a página 1 cuando cambien los filtros
  }, [places, searchTerm, categoryFilter, provinceFilter, publishedFilter, sortField, sortOrder]);

  // Calcular datos paginados
  const totalPages = Math.ceil(filteredPlaces.length / (itemsPerPage === 0 ? filteredPlaces.length : itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 0 ? filteredPlaces.length : startIndex + itemsPerPage;
  const paginatedPlaces = itemsPerPage === 0 ? filteredPlaces : filteredPlaces.slice(startIndex, endIndex);

  const loadPlaces = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/places`);
      const data = await response.json();
      
      if (data.success) {
        setPlaces(data.places || []);
        if (data.places && data.places.length > 0) {
          setMapCenter({
            lat: data.places[0].latitude,
            lng: data.places[0].longitude,
          });
        }
      }
    } catch (error) {
      console.error('Error cargando lugares:', error);
      toast.error('Error al cargar lugares');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...places];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.province?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (provinceFilter) {
      filtered = filtered.filter(p => p.province === provinceFilter);
    }

    if (publishedFilter === 'published') {
      filtered = filtered.filter(p => p.published === true);
    } else if (publishedFilter === 'draft') {
      filtered = filtered.filter(p => p.published === false);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'name') {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPlaces(filtered);
  }, [places, searchTerm, categoryFilter, provinceFilter, publishedFilter, sortField, sortOrder]);

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/places/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus }),
      });

      if (response.ok) {
        setPlaces(places.map(p => 
          p.id === id ? { ...p, published: !currentStatus } : p
        ));
        toast.success(!currentStatus ? 'Lugar publicado' : 'Lugar ocultado');
      }
    } catch (error) {
      toast.error('Error al actualizar el lugar');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;

    try {
      await fetch(`/api/places/${id}`, { method: 'DELETE' });
      setPlaces(places.filter(p => p.id !== id));
      toast.success('Lugar eliminado');
    } catch (error) {
      toast.error('Error al eliminar el lugar');
    }
  };

  const handlePublishAll = async () => {
    if (!confirm('¿Publicar TODOS los lugares no publicados?')) return;

    try {
      const response = await fetch('/api/admin/places/publish-all', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${data.count} lugares publicados`);
        loadPlaces();
      }
    } catch (error) {
      toast.error('Error al publicar los lugares');
    }
  };

  const handleEnrichPlaces = async () => {
    try {
      // Obtener lugares sin IA
      const checkResponse = await fetch('/api/admin/places');
      const checkData = await checkResponse.json();
      const placesWithoutAI = checkData.places?.filter((p: any) => !p.ai_description) || [];
      
      if (placesWithoutAI.length === 0) {
        toast.info('✅ Todos los lugares ya están enriquecidos');
        return;
      }

      const estimatedMinutes = Math.ceil(placesWithoutAI.length * 3 / 60);
      if (!confirm(`¿Enriquecer ${placesWithoutAI.length} lugares con IA?\n\nTiempo estimado: ~${estimatedMinutes} minutos\n\n⚠️ No cierres esta pestaña durante el proceso.`)) return;

      setEnriching(true);
      setEnrichProgress({ current: 0, total: placesWithoutAI.length });

      let enriched = 0;
      let errors = 0;

      // Procesar uno por uno para mostrar progreso
      for (let i = 0; i < placesWithoutAI.length; i++) {
        const place = placesWithoutAI[i];
        
        try {
          console.log(`🎨 Enriqueciendo ${i + 1}/${placesWithoutAI.length}: ${place.name}`);
          
          const response = await fetch('/api/admin/enrich-single-place', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ placeId: place.id }),
          });

          if (response.ok) {
            enriched++;
            console.log(`✅ ${place.name} enriquecido`);
          } else {
            errors++;
            console.error(`❌ Error enriqueciendo ${place.name}`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Error en ${place.name}:`, error);
        }

        setEnrichProgress({ current: i + 1, total: placesWithoutAI.length });
      }

      toast.success(`✅ Completado: ${enriched} enriquecidos, ${errors} errores`);
      loadPlaces();
      
    } catch (error: any) {
      toast.error(error.message || 'Error al enriquecer los lugares');
    } finally {
      setEnriching(false);
      setEnrichProgress({ current: 0, total: 0 });
    }
  };

  const handleMarkerClick = (place: any) => {
    setSelectedPlace(place);
    setMapCenter({
      lat: place.latitude,
      lng: place.longitude,
    });
  };

  const getMarkerIcon = (place: any) => {
    const tier = calculateQualityTier(place.rating, place.review_count);
    const color = getTierMarkerColor(tier);

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#ffffff',
      scale: 6,
    };
  };

  const uniqueCategories = Array.from(new Set(places.map(p => p.category))).filter(Boolean);
  const uniqueProvinces = Array.from(new Set(places.map(p => p.province))).filter(Boolean).sort();

  const categoryNames: Record<string, string> = {
    restaurante: 'Restaurantes',
    hotel: 'Hoteles',
    spa: 'Spas',
    bar: 'Bares',
    experiencia: 'Experiencias',
    monumento: 'Monumentos',
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Lugares</h1>
          <p className="text-gray-600 mt-1">
            {filteredPlaces.length} de {places.length} lugares
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadPlaces} variant="outline" size="sm" disabled={enriching}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
          <Button onClick={handleEnrichPlaces} variant="primary" size="sm" disabled={enriching}>
            {enriching ? '⏳ Procesando...' : '🎨 Enriquecer con IA'}
          </Button>
          <Button onClick={handlePublishAll} variant="outline" size="sm" disabled={enriching}>
            <Eye className="h-4 w-4 mr-2" />
            Publicar Todos
          </Button>
        </div>
      </div>

      {/* Banner de progreso del enriquecimiento */}
      {enriching && enrichProgress.total > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Enriqueciendo con IA...
                  </span>
                </div>
                <span className="text-sm text-blue-700">
                  {enrichProgress.current} / {enrichProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(enrichProgress.current / enrichProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-700">
                Generando descripciones SEO, resúmenes de reseñas y highlights. No cierres esta pestaña.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapa colapsable */}
      {isLoaded && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowMap(!showMap)}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mapa de Lugares</CardTitle>
                <CardDescription>Vista geográfica de todos los lugares</CardDescription>
              </div>
              {showMap ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {showMap && (
            <CardContent>
              <div className="relative">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={6}
                  onClick={() => setSelectedPlace(null)}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                  }}
                >
                  {filteredPlaces.map((place) => (
                    <Marker
                      key={place.id}
                      position={{ lat: place.latitude, lng: place.longitude }}
                      onClick={() => handleMarkerClick(place)}
                      icon={getMarkerIcon(place)}
                    />
                  ))}

                {selectedPlace && (
                  <InfoWindow
                    position={{
                      lat: selectedPlace.latitude,
                      lng: selectedPlace.longitude,
                    }}
                    onCloseClick={() => setSelectedPlace(null)}
                    options={{
                      pixelOffset: new google.maps.Size(0, -10),
                    }}
                  >
                    <div className="w-80 -m-2">
                      {/* Hero con foto */}
                      {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                        <div className="relative h-40 mb-4">
                          <img
                            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${selectedPlace.photos[0]}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt={selectedPlace.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                          
                          {/* Badges sobre foto */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <div className="bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-bold text-base">{selectedPlace.rating}</span>
                              <span className="text-xs text-gray-600">({selectedPlace.review_count})</span>
                            </div>
                            {selectedPlace.published ? (
                              <div className="bg-green-500 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg flex items-center gap-1">
                                <Eye className="h-3 w-3"/> Público
                              </div>
                            ) : (
                              <div className="bg-gray-600 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg flex items-center gap-1">
                                <EyeOff className="h-3 w-3"/> Borrador
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Info */}
                      <div className="px-4 pb-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">
                          {selectedPlace.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{selectedPlace.city}, {selectedPlace.province}</span>
                        </div>

                        {/* Botones CTA */}
                        <div className="space-y-2">
                          {selectedPlace.published && (
                            <a
                              href={`/${selectedPlace.category}/${selectedPlace.province}/${selectedPlace.slug}`}
                              target="_blank"
                              className="block w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-semibold text-center text-sm shadow-md"
                            >
                              🔗 Ver Página Pública
                            </a>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                handleTogglePublish(selectedPlace.id, selectedPlace.published);
                                toast.success(selectedPlace.published ? 'Lugar ocultado' : 'Lugar publicado');
                              }}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-medium"
                            >
                              {selectedPlace.published ? 'Ocultar' : 'Publicar'}
                            </button>
                            
                            <a
                              href={selectedPlace.google_maps_url}
                              target="_blank"
                              className="px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-xs font-medium text-center"
                            >
                              Google Maps
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
              
              {/* LEYENDA DE TIERS */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 border border-gray-200 z-10">
                <h4 className="font-bold text-sm mb-3 text-gray-900">Leyenda de Calidad</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#06b6d4' }}></div>
                    <span className="font-medium">💎 Diamante</span>
                    <span className="text-gray-500 text-[10px]">(4.8+ · 1000+ reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#94a3b8' }}></div>
                    <span className="font-medium">🏆 Platino</span>
                    <span className="text-gray-500 text-[10px]">(4.8+ · 500+ reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                    <span className="font-medium">🥇 Oro</span>
                    <span className="text-gray-500 text-[10px]">(4.8+ · 200+ reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#cbd5e1' }}></div>
                    <span className="font-medium">🥈 Plata</span>
                    <span className="text-gray-500 text-[10px]">(4.7+ · 100+ reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ea580c' }}></div>
                    <span className="font-medium">🥉 Bronce</span>
                    <span className="text-gray-500 text-[10px]">(4.7+ estrellas)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#9ca3af' }}></div>
                    <span className="font-medium">⭐ Standard</span>
                    <span className="text-gray-500 text-[10px]">(&lt;4.7 estrellas)</span>
                  </div>
                </div>
              </div>
            </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Controles de paginación y filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Mostrar:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="500">500</option>
                  <option value="0">Todos</option>
                </select>
                <span className="text-sm text-gray-600">
                  por página
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredPlaces.length)} de {filteredPlaces.length}
              </div>
            </div>
            
            {/* Paginación */}
            {itemsPerPage !== 0 && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, ciudad, provincia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">Todas las categorías</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryNames[cat] || cat}
                </option>
              ))}
            </select>

            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">Todas las provincias</option>
              {uniqueProvinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>

            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Lugares */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Lugar
                      {sortField === 'name' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">
                      Categoría
                      {sortField === 'category' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('province')}>
                    <div className="flex items-center gap-1">
                      Ubicación
                      {sortField === 'province' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('rating')}>
                    <div className="flex items-center gap-1">
                      Rating
                      {sortField === 'rating' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('review_count')}>
                    <div className="flex items-center gap-1">
                      Reseñas
                      {sortField === 'review_count' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
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
                {paginatedPlaces.length > 0 ? (
                  paginatedPlaces.map((place) => {
                    const tier = calculateQualityTier(place.rating, place.review_count);
                    const tierInfo = getTierInfo(tier);

                    return (
                      <tr key={place.id} className="hover:bg-gray-50 transition">
                        {/* Lugar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl flex-shrink-0">{tierInfo.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900">{place.name}</div>
                              <div className="text-xs text-gray-500">{place.city}</div>
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="px-6 py-4">
                          <Badge variant="default" className="text-xs">
                            {categoryNames[place.category] || place.category}
                          </Badge>
                        </td>

                        {/* Ubicación */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{place.city}</div>
                          <div className="text-xs text-gray-500">{place.province}</div>
                        </td>

                        {/* Rating */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-gray-900">{place.rating}</span>
                          </div>
                        </td>

                        {/* Reseñas */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{place.review_count}</span>
                        </td>

                        {/* Tier */}
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${tierInfo.color} text-white inline-block`}>
                            {tierInfo.name}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4">
                          {place.published ? (
                            <Badge className="bg-green-500 text-white text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Borrador
                            </Badge>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTogglePublish(place.id, place.published)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                              title={place.published ? 'Ocultar' : 'Publicar'}
                            >
                              {place.published ? (
                                <EyeOff className="h-4 w-4 text-gray-600" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            
                            {place.published && (
                              <button
                                onClick={() => window.open(`/${place.category}/${place.province}/${place.slug}`, '_blank')}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                                title="Ver página pública"
                              >
                                <ExternalLink className="h-4 w-4 text-gray-600" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleMarkerClick(place)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                              title="Ver en mapa"
                            >
                              <MapPin className="h-4 w-4 text-gray-600" />
                            </button>
                            
                            <button
                              onClick={() => handleDelete(place.id, place.name)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No hay lugares que coincidan</p>
                      <p className="text-sm mt-1">Prueba ajustando los filtros</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
