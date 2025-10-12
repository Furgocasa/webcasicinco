'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, DirectionsRenderer, Marker, Autocomplete } from '@react-google-maps/api';
import { 
  Navigation, 
  MapPin, 
  Sliders,
  Star,
  Search,
  X,
  Loader2,
  Award,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';
import { toast } from 'sonner';

const libraries: ("places" | "geometry" | "drawing")[] = ["places", "geometry", "drawing"];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.4168,
  lng: -3.7038, // Madrid
};

type Place = {
  id: string;
  name: string;
  slug: string;
  category: string;
  rating: number;
  review_count: number;
  latitude: number;
  longitude: number;
  city: string;
  province: string;
  address: string;
  photos?: string[];
};

export default function RutaPage() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  
  // Inputs de ruta
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [calculating, setCalculating] = useState(false);

  // Configuración de búsqueda
  const [searchRadius, setSearchRadius] = useState(10); // km desde la ruta
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  
  // Lugares encontrados
  const [placesNearRoute, setPlacesNearRoute] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Info de la ruta
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  const calculateRoute = async () => {
    if (!origin || !destination) {
      toast.error('Por favor, introduce origen y destino');
      return;
    }

    if (!window.google) {
      toast.error('Google Maps no está cargado');
      return;
    }

    setCalculating(true);
    
    try {
      const directionsService = new google.maps.DirectionsService();
      
      const results = await directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      setDirectionsResponse(results);
      
      // Extraer info de la ruta
      const route = results.routes[0];
      if (route) {
        const leg = route.legs[0];
        setRouteInfo({
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || '',
        });

        toast.success('✅ Ruta calculada correctamente');
        
        // Buscar lugares cerca de la ruta
        await findPlacesNearRoute(results);
      }
    } catch (error) {
      console.error('Error calculando ruta:', error);
      toast.error('No se pudo calcular la ruta. Verifica las direcciones.');
    } finally {
      setCalculating(false);
    }
  };

  const findPlacesNearRoute = async (directions: google.maps.DirectionsResult) => {
    setLoadingPlaces(true);
    
    try {
      // 1. Obtener TODOS los lugares publicados
      const response = await fetch('/api/places?limit=5000');
      const data = await response.json();
      
      if (!data.success || !data.places) {
        toast.error('Error cargando lugares');
        return;
      }

      const allPlaces: Place[] = data.places;
      
      // 2. Obtener el path de la ruta (conjunto de puntos)
      const route = directions.routes[0];
      const path = route.overview_path;
      
      // 3. Filtrar lugares que estén dentro del radio de la ruta
      const radiusMeters = searchRadius * 1000; // Convertir km a metros
      const nearbyPlaces: Place[] = [];
      
      allPlaces.forEach(place => {
        const placeLatLng = new google.maps.LatLng(place.latitude, place.longitude);
        
        // Verificar si el lugar está cerca de algún punto de la ruta
        for (let i = 0; i < path.length; i++) {
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            placeLatLng,
            path[i]
          );
          
          if (distance <= radiusMeters) {
            nearbyPlaces.push(place);
            break; // Ya lo encontramos, no seguir buscando
          }
        }
      });

      // 4. Aplicar filtros adicionales
      let filtered = nearbyPlaces;
      
      if (categoryFilter) {
        filtered = filtered.filter(p => p.category === categoryFilter);
      }
      
      if (tierFilter.length > 0) {
        filtered = filtered.filter(p => {
          const tier = calculateQualityTier(p.rating, p.review_count);
          return tierFilter.includes(tier);
        });
      }

      // 5. Ordenar por rating y reseñas
      filtered.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.review_count - a.review_count;
      });

      setPlacesNearRoute(filtered);
      toast.success(`🎯 Encontrados ${filtered.length} lugares cerca de tu ruta`);
      
    } catch (error) {
      console.error('Error buscando lugares:', error);
      toast.error('Error al buscar lugares cercanos');
    } finally {
      setLoadingPlaces(false);
    }
  };

  const clearRoute = () => {
    setDirectionsResponse(null);
    setRouteInfo(null);
    setPlacesNearRoute([]);
    setSelectedPlace(null);
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Error cargando el mapa</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Navigation className="h-6 w-6 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Planificar Ruta</h1>
                <p className="text-sm text-gray-600">Descubre lugares excepcionales en tu camino</p>
              </div>
            </div>
            
            {routeInfo && (
              <div className="flex items-center gap-4 text-sm">
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-600">Distancia:</span>
                  <span className="font-bold text-gray-900 ml-2">{routeInfo.distance}</span>
                </div>
                <div className="bg-green-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-600">Tiempo:</span>
                  <span className="font-bold text-gray-900 ml-2">{routeInfo.duration}</span>
                </div>
                <Button 
                  onClick={clearRoute}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar Ruta
                </Button>
              </div>
            )}
          </div>

          {/* CONFIGURACIÓN DE RUTA - Mobile Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {/* Origen con Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Origen
              </label>
              {isLoaded && (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    originAutocompleteRef.current = autocomplete;
                  }}
                  onPlaceChanged={() => {
                    if (originAutocompleteRef.current) {
                      const place = originAutocompleteRef.current.getPlace();
                      if (place.formatted_address) {
                        setOrigin(place.formatted_address);
                      }
                    }
                  }}
                  options={{
                    componentRestrictions: { country: 'es' }, // Solo España
                    fields: ['formatted_address', 'geometry'],
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ej: Madrid, Puerta del Sol"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && calculateRoute()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  />
                </Autocomplete>
              )}
            </div>

            {/* Destino con Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Destino
              </label>
              {isLoaded && (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    destinationAutocompleteRef.current = autocomplete;
                  }}
                  onPlaceChanged={() => {
                    if (destinationAutocompleteRef.current) {
                      const place = destinationAutocompleteRef.current.getPlace();
                      if (place.formatted_address) {
                        setDestination(place.formatted_address);
                      }
                    }
                  }}
                  options={{
                    componentRestrictions: { country: 'es' }, // Solo España
                    fields: ['formatted_address', 'geometry'],
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ej: Barcelona, Sagrada Familia"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && calculateRoute()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                  />
                </Autocomplete>
              )}
            </div>

            {/* Radio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📏 Radio de búsqueda
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏷️ Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todas</option>
                <option value="restaurante">Restaurantes</option>
                <option value="hotel">Hoteles</option>
                <option value="spa">Spas</option>
                <option value="bar">Bares</option>
                <option value="experiencia">Experiencias</option>
                <option value="monumento">Monumentos</option>
              </select>
            </div>

            {/* Botón calcular */}
            <div className="flex items-end">
              <Button 
                onClick={calculateRoute}
                disabled={calculating || !origin || !destination}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {calculating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Calcular Ruta
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Ayuda */}
          {!directionsResponse && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>Cómo usar:</strong> Introduce tu origen y destino (ciudad, dirección, lugar conocido), 
                selecciona el radio de búsqueda, y haz clic en "Calcular Ruta". 
                Te mostraremos los mejores lugares a lo largo de tu camino.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden relative bg-white">
        {/* Margen izquierdo 8% */}
        <div style={{ width: '8%' }} className="bg-white flex-shrink-0"></div>
        
        {/* MAPA */}
        <div className="flex-1 relative rounded-lg overflow-hidden shadow-lg my-4 mr-4">
          {!isLoaded ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={6}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              options={{
                styles: [
                  {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }], // Ocultar POIs de Google
                  },
                ],
                streetViewControl: false,
                mapTypeControl: true,
                mapTypeControlOptions: {
                  position: google.maps.ControlPosition.TOP_RIGHT,
                },
                fullscreenControl: true,
                fullscreenControlOptions: {
                  position: google.maps.ControlPosition.RIGHT_TOP,
                },
                zoomControl: true,
                zoomControlOptions: {
                  position: google.maps.ControlPosition.RIGHT_BOTTOM,
                },
                gestureHandling: 'greedy', // Permite scroll sin Ctrl
                restriction: {
                  latLngBounds: {
                    north: 43.8,
                    south: 35.9,
                    east: 4.5,
                    west: -9.5,
                  },
                  strictBounds: false,
                },
              }}
            >
              {/* Ruta calculada */}
              {directionsResponse && (
                <DirectionsRenderer
                  directions={directionsResponse}
                  options={{
                    polylineOptions: {
                      strokeColor: '#9333ea', // Purple
                      strokeWeight: 5,
                      strokeOpacity: 0.8,
                    },
                  }}
                />
              )}

              {/* Marcadores de lugares */}
              {placesNearRoute.map((place) => {
                const tier = calculateQualityTier(place.rating, place.review_count);
                const tierInfo = getTierInfo(tier);
                
                // Colores de medalla
                const tierColors: Record<string, string> = {
                  diamond: '#93c5fd',
                  platinum: '#e5e7eb',
                  gold: '#fbbf24',
                  silver: '#d1d5db',
                  bronze: '#fb923c',
                  none: '#ffffff'
                };
                
                const bgColor = tierColors[tier] || '#ffffff';

                return (
                  <Marker
                    key={place.id}
                    position={{ lat: place.latitude, lng: place.longitude }}
                    icon={{
                      url: `data:image/svg+xml,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="${bgColor}" stroke="#d1d5db" stroke-width="2"/>
                          <text x="18" y="26" text-anchor="middle" font-size="20">${tierInfo.icon}</text>
                        </svg>
                      `)}`,
                      scaledSize: new google.maps.Size(36, 36),
                      anchor: new google.maps.Point(18, 18),
                    }}
                    onClick={() => setSelectedPlace(place)}
                    title={`${place.name} - ${tierInfo.name}`}
                  />
                );
              })}
            </GoogleMap>
          )}

          {/* Card flotante centrada (igual que en mapa) */}
          {selectedPlace && (() => {
            const tier = calculateQualityTier(selectedPlace.rating, selectedPlace.review_count || 0);
            const tierInfo = getTierInfo(tier);

            return (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="w-80 bg-white rounded-xl shadow-2xl border-2 border-gray-300 pointer-events-auto relative">
                  {/* Botón cerrar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlace(null);
                    }}
                    className="absolute top-2 right-2 z-30 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>

                  {/* Foto del lugar */}
                  {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                    <div className="relative">
                      <img
                        src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${selectedPlace.photos[0]}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                        alt={selectedPlace.name}
                        className="w-full h-32 object-cover rounded-t-xl"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Contenido */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-gray-900 leading-tight mb-1">
                          {selectedPlace.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-sm">{selectedPlace.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {selectedPlace.review_count} reseñas
                          </span>
                        </div>
                      </div>
                      <span className="text-2xl">{tierInfo.icon}</span>
                    </div>

                    {/* Dirección */}
                    <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                      {selectedPlace.city}, {selectedPlace.province}
                    </p>

                    {/* Categoría y tier */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                        {selectedPlace.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${tierInfo.color} text-white`}>
                        {tierInfo.name}
                      </span>
                    </div>

                    {/* Botones */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => window.open(`/${selectedPlace.category}/${selectedPlace.province}/${selectedPlace.slug}`, '_blank')}
                        className="w-full"
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`, '_blank')}
                        className="w-full"
                      >
                        Cómo Llegar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* SIDEBAR DE LUGARES */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lugares en la Ruta</h2>
                <p className="text-sm text-gray-600">
                  {placesNearRoute.length} lugares a menos de {searchRadius}km
                </p>
              </div>
            </div>

            {/* Filtros rápidos */}
            {directionsResponse && (
              <div className="mb-6 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tier de Calidad
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: 'diamond', label: '💎', name: 'Diamante' },
                      { value: 'platinum', label: '🏆', name: 'Platino' },
                      { value: 'gold', label: '🥇', name: 'Oro' },
                      { value: 'silver', label: '🥈', name: 'Plata' },
                      { value: 'bronze', label: '🥉', name: 'Bronce' },
                    ].map(tier => (
                      <button
                        key={tier.value}
                        onClick={() => {
                          if (tierFilter.includes(tier.value)) {
                            setTierFilter(tierFilter.filter(t => t !== tier.value));
                          } else {
                            setTierFilter([...tierFilter, tier.value]);
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-lg border transition ${
                          tierFilter.includes(tier.value)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                        }`}
                        title={tier.name}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => directionsResponse && findPlacesNearRoute(directionsResponse)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={loadingPlaces}
                >
                  {loadingPlaces ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3 mr-2" />
                      Aplicar Filtros
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Lista de lugares */}
            {loadingPlaces ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                <p className="text-sm text-gray-600">Buscando lugares...</p>
              </div>
            ) : placesNearRoute.length > 0 ? (
              <div className="space-y-4">
                {placesNearRoute.map((place) => {
                  const tier = calculateQualityTier(place.rating, place.review_count);
                  const tierInfo = getTierInfo(tier);
                  
                  return (
                    <div
                      key={place.id}
                      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white"
                      onClick={() => {
                        setSelectedPlace(place);
                        if (mapRef.current) {
                          mapRef.current.panTo({ lat: place.latitude, lng: place.longitude });
                          mapRef.current.setZoom(14);
                        }
                      }}
                    >
                      {/* Foto del lugar */}
                      {place.photos && place.photos.length > 0 && (
                        <div className="mb-3 -mx-4 -mt-4 relative">
                          <img
                            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0]}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt={place.name}
                            className="w-full h-32 object-cover rounded-t-lg"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Tier y nombre */}
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{place.name}</h3>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-sm">{place.rating}</span>
                            <span className="text-gray-400 text-xs">•</span>
                            <span className="text-xs text-gray-600">{place.review_count} reseñas</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-2xl">{tierInfo.icon}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${tierInfo.color} text-white whitespace-nowrap`}>
                            {tierInfo.name}
                          </span>
                        </div>
                      </div>

                      {/* Ubicación */}
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{place.city}, {place.province}</span>
                      </div>

                      {/* Categoría */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium capitalize">
                          {place.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : directionsResponse ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No hay lugares en un radio de {searchRadius}km de tu ruta.
                  <br />
                  Prueba aumentar el radio de búsqueda.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Navigation className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Calcula una ruta para ver lugares cercanos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
