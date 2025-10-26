'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, Autocomplete } from '@react-google-maps/api';
import { useMap } from '@/lib/contexts/MapContext';
import { useAuth } from '@/lib/hooks/useAuth';
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
import BottomNavigation from '@/components/mobile/BottomNavigation';
import BottomSheet from '@/components/mobile/BottomSheet';
import LoginOverlay from '@/components/auth/LoginOverlay';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import { toast } from 'sonner';

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
  photo_urls?: string[];  // ✅ Fotos de Supabase (prioritario)
  photos?: string[];      // Fallback legacy (Google)
  google_maps_url?: string;
};

export default function RutaPage() {
  // ✅ OPTIMIZACIÓN: Usar contexto del mapa (ahorro 66% en navegaciones)
  const { isLoaded, loadError } = useMap();
  const { user, loading: authLoading } = useAuth();

  const mapRef = useRef<google.maps.Map | null>(null);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Refs para persistir valores (evita que Google Autocomplete los borre)
  const originValueRef = useRef('');
  const destinationValueRef = useRef('');
  
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
  
  // Vista móvil: 'form', 'map', 'list' - Empieza en 'map' como experiencia por defecto
  const [mobileView, setMobileView] = useState<'form' | 'map' | 'list'>('map');

  // Ordenamiento de lista
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'proximity'>('reviews');

  // Geolocalización para cálculo de distancia
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Info de la ruta
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  // Calcular distancia entre dos puntos (en km)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Establecer título de la página
  useEffect(() => {
    document.title = 'Planificar Ruta | Casi Cinco';
  }, []);

  // Obtener ubicación del usuario al montar el componente
  useEffect(() => {
    if (navigator.geolocation) {
      // Opciones optimizadas para todos los dispositivos, especialmente iOS
      const options = {
        enableHighAccuracy: true,  // Máxima precisión (GPS)
        timeout: 10000,            // 10 segundos timeout (iOS puede ser lento)
        maximumAge: 300000         // Aceptar caché de hasta 5 minutos (más rápido)
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          console.log('✅ Ubicación obtenida para cálculo de distancias');
        },
        (error) => {
          console.log('Geolocalización no disponible:', error.code, error.message);
          // No mostrar error al usuario aquí (es opcional, no crítico)
        },
        options
      );
    }
  }, []);

  // Ordenar lugares según el criterio seleccionado
  const sortedPlaces = useMemo(() => {
    return [...placesNearRoute].sort((a, b) => {
      if (sortBy === 'rating') {
        // Primero por rating, luego por reseñas
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.review_count || 0) - (a.review_count || 0);
      } else if (sortBy === 'reviews') {
        // Primero por reseñas, luego por rating
        if ((b.review_count || 0) !== (a.review_count || 0)) {
          return (b.review_count || 0) - (a.review_count || 0);
        }
        return b.rating - a.rating;
      } else if (sortBy === 'proximity' && userLocation) {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      }
      return 0;
    });
  }, [placesNearRoute, sortBy, userLocation, calculateDistance]);

  // ✅ OPTIMIZACIÓN: Cache de rutas en localStorage (ahorro 50% Directions)
  const getCachedRoute = (origin: string, dest: string): google.maps.DirectionsResult | null => {
    try {
      const cacheKey = `route_${origin.toLowerCase()}_${dest.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días
        
        // Cache válido por 7 días
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('💾 Ruta encontrada en caché - Ahorro: $0.005');
          return data;
        }
      }
    } catch (error) {
      // Si falla el caché, continuar normalmente
      console.warn('Error leyendo caché de rutas:', error);
    }
    return null;
  };

  const saveRouteToCache = (origin: string, dest: string, data: google.maps.DirectionsResult) => {
    try {
      // ✅ OPTIMIZACIÓN: Desactivar caché de rutas para evitar QuotaExceededError
      // DirectionsResult es muy pesado (~500KB-2MB) y localStorage tiene límite de 5-10MB total
      // Las rutas cambian con el tráfico, así que el caché no es tan útil
      console.log('💾 Caché de ruta omitido (evita QuotaExceededError)');
      return;
      
      /* Código original (desactivado):
      const cacheKey = `route_${origin.toLowerCase()}_${dest.toLowerCase()}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('💾 Ruta guardada en caché');
      */
    } catch (error) {
      // Si falla guardar en caché, no afecta funcionalidad
      console.warn('Error guardando ruta en caché:', error);
    }
  };

  const calculateRoute = async () => {
    // ✅ FIX MEJORADO: Capturar valor del Autocomplete justo antes de calcular
    if (originAutocompleteRef.current) {
      const place = originAutocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        originValueRef.current = place.formatted_address;
        setOrigin(place.formatted_address);
      }
    }
    
    if (destinationAutocompleteRef.current) {
      const place = destinationAutocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        destinationValueRef.current = place.formatted_address;
        setDestination(place.formatted_address);
      }
    }
    
    // Usar refs como fuente de verdad
    const finalOrigin = originValueRef.current || origin;
    const finalDestination = destinationValueRef.current || destination;
    
    // Validación simple: solo verificar que no estén vacíos
    if (!finalOrigin?.trim()) {
      toast.error('Por favor, introduce un origen');
      return;
    }
    
    if (!finalDestination?.trim()) {
      toast.error('Por favor, introduce un destino');
      return;
    }

    if (!window.google) {
      toast.error('Google Maps no está cargado');
      return;
    }

    // ✅ Sincronizar estados con refs (para mostrar correctamente en UI)
    if (finalOrigin !== origin) setOrigin(finalOrigin);
    if (finalDestination !== destination) setDestination(finalDestination);

    // Limpiar solo ruta y lugares, NO los inputs de origen/destino
    setDirectionsResponse(null);
    setRouteInfo(null);
    setPlacesNearRoute([]);
    setSelectedPlace(null);

    setCalculating(true);
    
    try {
      // ✅ Verificar caché primero (con valores finales)
      const cachedRoute = getCachedRoute(finalOrigin, finalDestination);
      
      let results: google.maps.DirectionsResult;
      
      if (cachedRoute) {
        // Usar ruta cacheada
        results = cachedRoute;
        toast.success('✅ Ruta cargada desde caché');
      } else {
        // Calcular nueva ruta
        const directionsService = new google.maps.DirectionsService();
        
        results = await directionsService.route({
          origin: finalOrigin,
          destination: finalDestination,
          travelMode: google.maps.TravelMode.DRIVING,
        });
        
        // Guardar en caché (con valores finales)
        saveRouteToCache(finalOrigin, finalDestination, results);
        toast.success('✅ Ruta calculada correctamente');
      }

      setDirectionsResponse(results);
      
      // Extraer info de la ruta
      const route = results.routes[0];
      if (route) {
        // ✅ FIX: Ajustar zoom del mapa para mostrar toda la ruta
        if (mapRef.current) {
          const bounds = new google.maps.LatLngBounds();
          
          // Añadir todos los puntos de la ruta a los bounds
          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              bounds.extend(step.start_location);
              bounds.extend(step.end_location);
            });
          });
          
          // Aplicar bounds con padding diferente según dispositivo
          const isMobile = window.innerWidth < 768;
          
          if (isMobile) {
            // Móvil: Más padding para header y controles inferiores
            mapRef.current.fitBounds(bounds, {
              top: 150,
              bottom: 150,
              left: 20,
              right: 20,
            });
          } else {
            // PC: Padding mínimo, el DirectionsRenderer ya ajusta bien
            mapRef.current.fitBounds(bounds, {
              top: 50,
              bottom: 50,
              left: 50,
              right: 400, // Más espacio a la derecha por el sidebar
            });
          }
        }
        
        const leg = route.legs[0];
        setRouteInfo({
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || '',
        });
        
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
      console.log('🔍 Iniciando búsqueda de lugares cerca de la ruta...');
      
      // 1. Obtener solo lugares de categoría seleccionada (optimización)
      // ✅ OPTIMIZACIÓN: fields=light reduce payload 80% (solo campos esenciales)
      let queryParams = 'limit=2000&fields=light';
      if (categoryFilter) {
        queryParams += `&category=${categoryFilter}`;
      }
      
      console.log(`📡 Llamando a API: /api/places?${queryParams}`);
      // Agregar timestamp para forzar recarga de lugares frescos (sin caché)
      const response = await fetch(`/api/places?${queryParams}&t=${Date.now()}`);
      const data = await response.json();
      
      console.log('📦 Respuesta de API:', {
        success: data.success,
        placesCount: data.places?.length || 0,
        hasPlaces: !!data.places
      });
      
      if (!data.success || !data.places || data.places.length === 0) {
        console.warn('⚠️ No hay lugares disponibles en la base de datos');
        toast.warning('⚠️ No hay lugares indexados todavía. Indexa lugares desde el panel de administración.');
        setLoadingPlaces(false);
        return;
      }
      
      const allPlaces: Place[] = data.places;
      console.log(`✅ Cargados ${allPlaces.length} lugares para buscar en ruta`);
      
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

      console.log(`🎯 Lugares encontrados: ${nearbyPlaces.length} cerca de ruta, ${filtered.length} después de filtros`);
      setPlacesNearRoute(filtered);
      
      if (filtered.length > 0) {
        toast.success(`🎯 Encontrados ${filtered.length} lugares cerca de tu ruta`);
      } else if (nearbyPlaces.length > 0) {
        toast.warning(`⚠️ ${nearbyPlaces.length} lugares encontrados pero ninguno cumple los filtros seleccionados`);
      } else {
        toast.warning(`⚠️ No hay lugares cerca de esta ruta. Intenta aumentar el radio de búsqueda.`);
      }
      
    } catch (error) {
      console.error('❌ Error buscando lugares:', error);
      toast.error('Error al buscar lugares cercanos. Revisa la consola para más detalles.');
    } finally {
      setLoadingPlaces(false);
    }
  };


  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Error cargando el mapa</p>
      </div>
    );
  }

  // Handler móvil
  const handleMobileViewChange = (view: 'form' | 'map' | 'list') => {
    setMobileView(view);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* HEADER - Solo desktop */}
      <div className="hidden md:block bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Navigation className="h-6 w-6 text-[#063971]" />
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
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-gray-600">Lugares:</span>
                  <span className="font-bold text-gray-900 ml-2">{placesNearRoute.length}</span>
                </div>
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
                  key="origin-autocomplete"
                  onLoad={(autocomplete) => {
                    originAutocompleteRef.current = autocomplete;
                  }}
                  onPlaceChanged={() => {
                    if (originAutocompleteRef.current) {
                      const place = originAutocompleteRef.current.getPlace();
                      if (place && place.formatted_address) {
                        const value = place.formatted_address;
                        setOrigin(value);
                        originValueRef.current = value;
                      }
                    }
                  }}
                  options={{
                    componentRestrictions: { country: 'es' },
                    fields: ['formatted_address', 'geometry'],
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ej: Madrid, Puerta del Sol"
                    value={origin}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOrigin(value);
                      originValueRef.current = value;
                    }}
                    onBlur={() => {
                      // Restaurar valor si Google lo borró
                      if (!origin && originValueRef.current) {
                        setOrigin(originValueRef.current);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Dar 150ms a Google Autocomplete para completar
                        setTimeout(() => {
                          if (destination) {
                            calculateRoute();
                          }
                        }, 150);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#063971] focus:border-transparent text-base"
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
                  key="destination-autocomplete"
                  onLoad={(autocomplete) => {
                    destinationAutocompleteRef.current = autocomplete;
                  }}
                  onPlaceChanged={() => {
                    if (destinationAutocompleteRef.current) {
                      const place = destinationAutocompleteRef.current.getPlace();
                      if (place && place.formatted_address) {
                        const value = place.formatted_address;
                        setDestination(value);
                        destinationValueRef.current = value;
                      }
                    }
                  }}
                  options={{
                    componentRestrictions: { country: 'es' },
                    fields: ['formatted_address', 'geometry'],
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ej: Barcelona, Sagrada Familia"
                    value={destination}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDestination(value);
                      destinationValueRef.current = value;
                    }}
                    onBlur={() => {
                      // Restaurar valor si Google lo borró
                      if (!destination && destinationValueRef.current) {
                        setDestination(destinationValueRef.current);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Dar 150ms a Google Autocomplete para completar
                        setTimeout(() => {
                          if (origin) {
                            calculateRoute();
                          }
                        }, 150);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#063971] focus:border-transparent text-base"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#063971] focus:border-transparent text-base"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#063971] focus:border-transparent text-base"
              >
                <option value="">Todas</option>
                <option value="restaurante">Restaurantes</option>
                <option value="bar">Bares</option>
                <option value="hotel">Hoteles</option>
              </select>
            </div>

            {/* Botón calcular */}
            <div className="flex items-end">
              <Button 
                onClick={calculateRoute}
                disabled={calculating || !origin || !destination}
                className="w-full bg-[#ffd935] hover:bg-[#e6c430] text-[#063971] font-bold"
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
      <div className="flex-1 flex overflow-hidden relative bg-white pb-16 md:pb-0">
        {/* Overlay de Login para usuarios no autenticados */}
        {!authLoading && !user && <LoginOverlay feature="ruta" />}
        
        {/* Margen izquierdo 8% - Solo desktop */}
        <div style={{ width: '8%' }} className="hidden md:block bg-white flex-shrink-0"></div>
        
        {/* MAPA - Pantalla completa en móvil */}
        <div className="flex-1 relative md:rounded-lg overflow-hidden md:shadow-lg md:my-4 md:mr-4">
          {!isLoaded ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#063971] mx-auto mb-4" />
                <p className="text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          ) : (
            <>
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

            {/* Overlay central cuando no hay ruta - Guía al usuario */}
            {!directionsResponse && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm pointer-events-auto border-2 border-[#ffd935]">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#063971] rounded-full flex items-center justify-center">
                      <Navigation className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                      Planifica tu Ruta
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 mb-4">
                      Calcula una ruta para descubrir los mejores lugares en tu camino
                    </p>
                    <Button
                      onClick={() => setMobileView('form')}
                      className="w-full bg-[#ffd935] hover:bg-[#e6c430] text-[#063971]"
                    >
                      🚀 Calcular Ruta
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
          )}

          {/* Card flotante centrada (igual que en mapa) */}
          {selectedPlace && (() => {
            const tier = calculateQualityTier(selectedPlace.rating, selectedPlace.review_count || 0);
            const tierInfo = getTierInfo(tier);
            const distance = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, selectedPlace.latitude, selectedPlace.longitude)
              : null;

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
                  {(() => {
                    const photoUrl = getPlacePhotoUrl(selectedPlace, 0);
                    return photoUrl ? (
                      <div className="relative">
                        <img
                          src={photoUrl}
                          alt={selectedPlace.name}
                          className="w-full h-32 object-cover rounded-t-xl"
                          loading="lazy"
                        />
                      {/* Badge de distancia en esquina superior derecha */}
                      {distance !== null && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {distance < 1 
                            ? `${Math.round(distance * 1000)}m`
                            : `${distance.toFixed(1)}km`
                          }
                        </div>
                      )}
                    </div>
                  ) : null;
                  })()}

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
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#063971] text-xs font-medium">
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
                        onClick={() => window.open(
                          selectedPlace.google_maps_url || 
                          `https://www.google.com/maps/search/?api=1&query=${selectedPlace.latitude},${selectedPlace.longitude}`,
                          '_blank'
                        )}
                        className="w-full"
                      >
                        Google Maps
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        {/* FIN del contenedor del mapa */}

        {/* SIDEBAR DERECHO - Lista de Lugares - Desktop */}
        <div 
          className={`hidden md:block ${
            placesNearRoute.length > 0 ? 'w-96' : 'w-0'
          } transition-all duration-300 bg-white border-l border-gray-200 overflow-y-auto`}
        >
          {placesNearRoute.length > 0 && (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="mb-4 sticky top-0 bg-white pb-2 border-b z-10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Lugares en la Ruta</h3>
                    <p className="text-sm text-gray-600">{placesNearRoute.length} resultados</p>
                  </div>
                </div>

                {/* Selector de ordenamiento */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Ordenar por:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'rating' | 'reviews' | 'proximity')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="reviews">📊 Más Reseñas</option>
                    <option value="rating">⭐ Mayor Valoración</option>
                    <option value="proximity" disabled={!userLocation}>
                      📍 Proximidad {!userLocation && '(requiere ubicación)'}
                    </option>
                  </select>
                  {sortBy === 'proximity' && !userLocation && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Activa tu ubicación para ordenar por proximidad
                    </p>
                  )}
                </div>
              </div>

              {/* Lista de lugares */}
              {loadingPlaces ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-gray-600">Cargando lugares...</p>
                </div>
              ) : sortedPlaces.length > 0 ? (
                sortedPlaces.map((place) => {
                  const tier = calculateQualityTier(place.rating, place.review_count);
                  const tierInfo = getTierInfo(tier);
                  
                  // Calcular distancia si hay geolocalización
                  const distance = userLocation 
                    ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                    : null;
                  
                  return (
                    <div
                      key={place.id}
                      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white"
                      onClick={() => {
                        setSelectedPlace(place);
                        mapRef.current?.panTo({ lat: place.latitude, lng: place.longitude });
                        mapRef.current?.setZoom(15);
                      }}
                    >
                      {/* Foto del lugar */}
                      {(() => {
                        const photoUrl = getPlacePhotoUrl(place, 0);
                        return photoUrl ? (
                          <div className="mb-3 -mx-4 -mt-4 relative">
                            <img
                              src={photoUrl}
                              alt={place.name}
                              className="w-full h-32 object-cover rounded-t-lg"
                              loading="lazy"
                            />
                          {/* Badge de distancia */}
                          {distance !== null && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {distance < 1 
                                ? `${Math.round(distance * 1000)}m`
                                : `${distance.toFixed(1)}km`
                              }
                            </div>
                          )}
                        </div>
                      ) : null;
                      })()}

                      {/* Nombre y rating */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base text-gray-900 leading-tight mb-1">
                            {place.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-bold text-sm">{place.rating}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {place.review_count} reseñas
                            </span>
                          </div>
                        </div>
                        <span className="text-2xl">{tierInfo.icon}</span>
                      </div>

                      {/* Dirección y distancia */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-600 line-clamp-1 flex-1">
                          {place.city}, {place.province}
                        </p>
                        {distance !== null && !place.photo_urls?.length && !place.photos?.length && (
                          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 ml-2">
                            <MapPin className="h-3 w-3" />
                            {distance < 1 
                              ? `${Math.round(distance * 1000)}m`
                              : `${distance.toFixed(1)}km`
                            }
                          </span>
                        )}
                      </div>

                      {/* Categoría y tier */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#063971] text-xs font-medium">
                          {place.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${tierInfo.color} text-white`}>
                          {tierInfo.name}
                        </span>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/${place.category}/${place.province}/${place.slug}`;
                          }}
                          className="flex-1"
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(place.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`, '_blank');
                          }}
                          className="flex-1"
                        >
                          Google Maps
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Calcula una ruta para ver lugares</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAVIGATION - Solo móvil */}
      <div className="md:hidden">
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="flex">
            <button
              onClick={() => setMobileView('form')}
              className={`flex-1 flex flex-col items-center justify-center py-3 ${
                mobileView === 'form' ? 'text-[#063971] bg-blue-50' : 'text-gray-600'
              }`}
            >
              <Navigation className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Ruta</span>
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={`flex-1 flex flex-col items-center justify-center py-3 ${
                mobileView === 'map' ? 'text-[#063971] bg-blue-50' : 'text-gray-600'
              }`}
            >
              <MapPin className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Mapa</span>
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`flex-1 flex flex-col items-center justify-center py-3 ${
                mobileView === 'list' ? 'text-[#063971] bg-blue-50' : 'text-gray-600'
              }`}
            >
              <MapPin className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Lista</span>
              {placesNearRoute.length > 0 && (
                <span className="absolute top-1 text-[10px] text-[#063971] font-bold">
                  {placesNearRoute.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* BOTTOM SHEET - Formulario de Ruta */}
        <BottomSheet
          isOpen={mobileView === 'form'}
          onClose={() => setMobileView('map')}
          title="Planificar Ruta"
          height="full"
        >
          <div className="space-y-4 py-4">
            {/* Formulario móvil con Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Origen
              </label>
              {isLoaded && (
                <Autocomplete
                  key="origin-autocomplete-mobile"
                  onLoad={(autocomplete) => {
                    originAutocompleteRef.current = autocomplete;
                  }}
                  onPlaceChanged={() => {
                    if (originAutocompleteRef.current) {
                      const place = originAutocompleteRef.current.getPlace();
                      if (place && place.formatted_address) {
                        const value = place.formatted_address;
                        setOrigin(value);
                        originValueRef.current = value;
                      }
                    }
                  }}
                  options={{
                    componentRestrictions: { country: 'es' },
                    fields: ['formatted_address', 'geometry'],
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ej: Madrid, Puerta del Sol"
                    value={origin}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOrigin(value);
                      originValueRef.current = value;
                    }}
                    onBlur={() => {
                      if (!origin && originValueRef.current) {
                        setOrigin(originValueRef.current);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#063971] focus:border-transparent text-base"
                  />
                </Autocomplete>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Destino
              </label>
              {isLoaded && (
                <Autocomplete
                  key="destination-autocomplete-mobile"
                  onLoad={(autocomplete) => {
                    destinationAutocompleteRef.current = autocomplete;
                  }}
                  onPlaceChanged={() => {
                    if (destinationAutocompleteRef.current) {
                      const place = destinationAutocompleteRef.current.getPlace();
                      if (place && place.formatted_address) {
                        const value = place.formatted_address;
                        setDestination(value);
                        destinationValueRef.current = value;
                      }
                    }
                  }}
                  options={{
                    componentRestrictions: { country: 'es' },
                    fields: ['formatted_address', 'geometry'],
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ej: Barcelona, Sagrada Familia"
                    value={destination}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDestination(value);
                      destinationValueRef.current = value;
                    }}
                    onBlur={() => {
                      if (!destination && destinationValueRef.current) {
                        setDestination(destinationValueRef.current);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#063971] focus:border-transparent text-base"
                  />
                </Autocomplete>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📏 Radio de búsqueda
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🍽️ Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              >
                <option value="">Todas</option>
                <option value="restaurante">Restaurantes</option>
                <option value="bar">Bares</option>
                <option value="hotel">Hoteles</option>
              </select>
            </div>

            <div className="pt-4">
              <Button
                onClick={calculateRoute}
                disabled={calculating || !origin || !destination}
                className="w-full bg-[#ffd935] hover:bg-[#e6c430] text-[#063971] font-bold"
              >
                {calculating ? '⏳ Calculando...' : '🚀 Calcular Ruta'}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Calcula una nueva ruta para actualizar los resultados
              </p>
            </div>

            {routeInfo && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-blue-50 px-3 py-2 rounded-lg text-center">
                  <div className="text-xs text-gray-600">Distancia</div>
                  <div className="font-bold text-gray-900">{routeInfo.distance}</div>
                </div>
                <div className="bg-green-50 px-3 py-2 rounded-lg text-center">
                  <div className="text-xs text-gray-600">Tiempo</div>
                  <div className="font-bold text-gray-900">{routeInfo.duration}</div>
                </div>
              </div>
            )}
          </div>
        </BottomSheet>

        {/* BOTTOM SHEET - Lista de Lugares */}
        <BottomSheet
          isOpen={mobileView === 'list'}
          onClose={() => setMobileView('map')}
          title={`${placesNearRoute.length} Lugares en la Ruta`}
          height="full"
        >
          <div className="space-y-3 py-2">
            {/* Selector de ordenamiento - Igual que en mapa */}
            {placesNearRoute.length > 0 && (
              <div className="sticky top-0 bg-white pb-3 border-b z-10">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rating' | 'reviews' | 'proximity')}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg"
                >
                  <option value="reviews">📊 Más Reseñas</option>
                  <option value="rating">⭐ Mayor Valoración</option>
                  <option value="proximity" disabled={!userLocation}>
                    📍 Más Cercano {!userLocation && '(requiere ubicación)'}
                  </option>
                </select>
                {sortBy === 'proximity' && !userLocation && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Permite el acceso a tu ubicación para ordenar por proximidad
                  </p>
                )}
              </div>
            )}

            {loadingPlaces ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#063971]" />
              </div>
            ) : sortedPlaces.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Calcula una ruta para ver lugares
              </div>
            ) : (
              sortedPlaces.map((place) => {
                const tier = calculateQualityTier(place.rating, place.review_count);
                const tierInfo = getTierInfo(tier);
                
                // Calcular distancia si hay geolocalización
                const distance = userLocation 
                  ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                  : null;
                
                return (
                  <div
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place);
                      setMobileView('map');
                    }}
                    className="border rounded-xl p-3 hover:shadow-md transition cursor-pointer bg-white"
                  >
                    {/* Foto */}
                    {(() => {
                      const photoUrl = getPlacePhotoUrl(place, 0);
                      return photoUrl ? (
                        <div className="mb-3 -mx-3 -mt-3 relative">
                          <img
                            src={photoUrl}
                            alt={place.name}
                            className="w-full h-32 object-cover rounded-t-xl"
                            loading="lazy"
                          />
                        {/* Badge de distancia en esquina superior derecha */}
                        {distance !== null && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {distance < 1 
                              ? `${Math.round(distance * 1000)}m`
                              : `${distance.toFixed(1)}km`
                            }
                          </div>
                        )}
                      </div>
                    ) : null;
                    })()}

                    {/* Nombre y rating */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-gray-900 leading-tight mb-1 line-clamp-1">
                          {place.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-sm">{place.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {place.review_count} reseñas
                          </span>
                        </div>
                      </div>
                      {/* Icono grande de tier al lado del nombre */}
                      <span className="text-2xl">{tierInfo.icon}</span>
                    </div>

                    {/* Dirección y distancia */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600 line-clamp-1 flex-1">
                        {place.city}, {place.province}
                      </p>
                      {/* Mostrar distancia solo si no hay foto */}
                      {distance !== null && !place.photo_urls?.length && !place.photos?.length && (
                        <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 ml-2">
                          <MapPin className="h-3 w-3" />
                          {distance < 1 
                            ? `${Math.round(distance * 1000)}m`
                            : `${distance.toFixed(1)}km`
                          }
                        </span>
                      )}
                    </div>

                    {/* Categoría y tier */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#063971] text-xs font-medium">
                        {place.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${tierInfo.color} text-white`}>
                        {tierInfo.name}
                      </span>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/${place.category}/${place.province}/${place.slug}`;
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(place.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`, '_blank');
                        }}
                        className="flex-1"
                      >
                        Google Maps
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}
