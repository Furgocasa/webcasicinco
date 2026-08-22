'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { useMap } from '@/lib/contexts/MapContext';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Route,
  Search,
  Star,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import BottomSheet from '@/components/mobile/BottomSheet';
import LoginOverlay from '@/components/auth/LoginOverlay';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import { getPlaceUrl } from '@/lib/utils/url-helper';
import { CATEGORIES, PLACE_CATEGORIES } from '@/lib/utils/constants';
import { toast } from 'sonner';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.4168,
  lng: -3.7038, // Madrid
};

const DEFAULT_ZOOM = 6;

const RADIUS_OPTIONS = [5, 10, 20, 50];

const CATEGORY_COLORS: Record<string, string> = {
  restaurante: '#002297',
  bar: '#c44317',
  hotel: '#0ea5e9',
};

const TIER_MARKER_COLORS: Record<string, string> = {
  diamond: '#93c5fd',
  platinum: '#e5e7eb',
  gold: '#fbbf24',
  silver: '#d1d5db',
  bronze: '#fb923c',
  none: '#ffffff',
};

const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: { country: 'es' },
  fields: ['formatted_address', 'geometry'],
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

type Stop = { id: string; value: string };

type SortBy = 'rating' | 'reviews' | 'proximity';

/** En el planificador la pestaña central de la barra móvil es la ruta, no los filtros */
type MobileView = 'map' | 'filters' | 'list';

function formatDistance(distance: number) {
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
}

function PlaceRatingLine({
  rating,
  reviews,
}: {
  rating: number;
  reviews?: number | null;
}) {
  const n = Number(reviews) || 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-bold text-sm text-gray-900">{rating}</span>
      </div>
      {n > 0 && (
        <span className="text-xs text-gray-500">
          {n.toLocaleString('es-ES')} reseñas
        </span>
      )}
    </div>
  );
}

/** Misma tarjeta en la columna de escritorio y en la hoja móvil */
function PlaceCard({
  place,
  distance,
  onSelect,
}: {
  place: Place;
  distance: number | null;
  onSelect: () => void;
}) {
  const tier = calculateQualityTier(place.rating, place.review_count);
  const tierInfo = getTierInfo(tier);
  const photoUrl = getPlacePhotoUrl(place, 0);

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white"
      onClick={onSelect}
    >
      {photoUrl && (
        <div className="mb-3 -mx-4 -mt-4 relative">
          <img
            src={photoUrl}
            alt={place.name}
            className="w-full h-32 object-cover rounded-t-lg"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {distance !== null && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {formatDistance(distance)}
            </div>
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-base text-gray-900 leading-tight mb-1 line-clamp-2">
            {place.name}
          </h4>
          <PlaceRatingLine rating={place.rating} reviews={place.review_count} />
        </div>
        <span className="text-2xl">{tierInfo.icon}</span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-600 line-clamp-1 flex-1">
          {place.city}, {place.province}
        </p>
        {distance !== null && !photoUrl && (
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 ml-2">
            <MapPin className="h-3 w-3" />
            {formatDistance(distance)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#002297] text-xs font-medium">
          {CATEGORIES[place.category] || place.category}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${tierInfo.color} text-white`}>
          {tierInfo.name}
        </span>
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          onClick={() => {
            window.location.href = getPlaceUrl(place.category, place.province, place.slug);
          }}
          className="flex-1"
        >
          Ver Detalles
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            window.open(
              place.google_maps_url ||
                `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`,
              '_blank'
            )
          }
          className="flex-1"
        >
          Google Maps
        </Button>
      </div>
    </div>
  );
}

interface PanelRutaProps {
  isLoaded: boolean;
  showHeader: boolean;
  origin: string;
  destination: string;
  stops: Stop[];
  radius: number;
  category: string;
  routeInfo: { distance: string; duration: string } | null;
  calculating: boolean;
  placesCount: number;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onAddStop: () => void;
  onUpdateStop: (id: string, value: string) => void;
  onRemoveStop: (id: string) => void;
  onMoveStop: (index: number, direction: -1 | 1) => void;
  onRadiusChange: (radius: number) => void;
  onCategoryChange: (category: string) => void;
  onCalculate: () => void;
  onClear: () => void;
}

/** Columna izquierda en escritorio y hoja inferior en móvil */
function PanelRuta({
  isLoaded,
  showHeader,
  origin,
  destination,
  stops,
  radius,
  category,
  routeInfo,
  calculating,
  placesCount,
  onOriginChange,
  onDestinationChange,
  onAddStop,
  onUpdateStop,
  onRemoveStop,
  onMoveStop,
  onRadiusChange,
  onCategoryChange,
  onCalculate,
  onClear,
}: PanelRutaProps) {
  // Cada instancia del panel tiene sus propios Autocomplete: el de escritorio y
  // el de la hoja móvil coexisten y no deben pisarse el uno al otro
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const stopAutocompletesRef = useRef<Record<string, google.maps.places.Autocomplete>>({});

  const puedeCalcular = Boolean(origin.trim() && destination.trim()) && !calculating;

  const calcularConRetardo = () => {
    // Google necesita un instante para completar el campo antes de leerlo
    setTimeout(() => {
      if (origin.trim() && destination.trim()) onCalculate();
    }, 150);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {showHeader && (
        <div className="hidden md:flex items-center justify-between px-4 py-3 bg-primary-50 border-b border-primary-100">
          <h2 className="text-lg font-bold text-primary-900">Planificar ruta</h2>
          {placesCount > 0 && (
            <span className="text-xs font-bold bg-secondary text-primary-900 rounded-full px-2 py-0.5">
              {placesCount}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <p className="flex items-start gap-1.5 text-[11px] text-gray-500 leading-relaxed">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
          Indica origen y destino, ajusta el radio y calcula: te mostramos los lugares de 4.7★ o más
          que quedan a tu paso.
        </p>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" aria-hidden />
            Origen
          </label>
          <div className="relative">
            {isLoaded ? (
              <Autocomplete
                onLoad={(autocomplete) => {
                  originAutocompleteRef.current = autocomplete;
                }}
                onPlaceChanged={() => {
                  const place = originAutocompleteRef.current?.getPlace();
                  if (place?.formatted_address) onOriginChange(place.formatted_address);
                }}
                options={AUTOCOMPLETE_OPTIONS}
              >
                <input
                  type="text"
                  placeholder="Madrid, Puerta del Sol"
                  value={origin}
                  onChange={(e) => onOriginChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      calcularConRetardo();
                    }
                  }}
                  className="w-full pl-8 pr-8 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </Autocomplete>
            ) : (
              <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
            )}
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            {origin.trim() && (
              <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600">
              Paradas {stops.length > 0 && `(${stops.length})`}
            </label>
            <button
              type="button"
              onClick={onAddStop}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir
            </button>
          </div>

          {stops.length === 0 ? (
            <p className="text-[11px] text-gray-500">
              Añade paradas si quieres pasar por algún sitio concreto.
            </p>
          ) : (
            <div className="space-y-1.5">
              {stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-1.5 py-1"
                >
                  <span className="w-5 h-5 rounded-full bg-primary-50 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    {isLoaded ? (
                      <Autocomplete
                        onLoad={(autocomplete) => {
                          stopAutocompletesRef.current[stop.id] = autocomplete;
                        }}
                        onPlaceChanged={() => {
                          const place = stopAutocompletesRef.current[stop.id]?.getPlace();
                          if (place?.formatted_address) onUpdateStop(stop.id, place.formatted_address);
                        }}
                        options={AUTOCOMPLETE_OPTIONS}
                      >
                        <input
                          type="text"
                          placeholder={`Parada ${index + 1}`}
                          value={stop.value}
                          onChange={(e) => onUpdateStop(stop.id, e.target.value)}
                          className="w-full px-1.5 py-1.5 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                        />
                      </Autocomplete>
                    ) : (
                      <div className="h-8 bg-gray-100 animate-pulse rounded-lg" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onMoveStop(index, -1)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Subir parada ${index + 1}`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveStop(index, 1)}
                    disabled={index === stops.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Bajar parada ${index + 1}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveStop(stop.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Quitar parada ${index + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0" aria-hidden />
            Destino
          </label>
          <div className="relative">
            {isLoaded ? (
              <Autocomplete
                onLoad={(autocomplete) => {
                  destinationAutocompleteRef.current = autocomplete;
                }}
                onPlaceChanged={() => {
                  const place = destinationAutocompleteRef.current?.getPlace();
                  if (place?.formatted_address) onDestinationChange(place.formatted_address);
                }}
                options={AUTOCOMPLETE_OPTIONS}
              >
                <input
                  type="text"
                  placeholder="Barcelona, Sagrada Familia"
                  value={destination}
                  onChange={(e) => onDestinationChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      calcularConRetardo();
                    }
                  }}
                  className="w-full pl-8 pr-8 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </Autocomplete>
            ) : (
              <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
            )}
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            {destination.trim() && (
              <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Radio de búsqueda ({radius} km)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {RADIUS_OPTIONS.map((option) => {
              const activo = radius === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onRadiusChange(option)}
                  aria-pressed={activo}
                  className={`rounded-xl border px-2.5 py-2 text-center text-[13px] transition-all active:scale-[0.98] ${
                    activo
                      ? 'border-primary bg-primary text-white font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option} km
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
          <div className="space-y-2">
            {PLACE_CATEGORIES.map((cat) => {
              const activo = category === cat.value;
              const color = CATEGORY_COLORS[cat.value] || '#002297';
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onCategoryChange(activo ? '' : cat.value)}
                  aria-pressed={activo}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                    activo ? 'shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  style={activo ? { borderColor: color, backgroundColor: `${color}14` } : undefined}
                >
                  <span className="text-lg shrink-0" aria-hidden>
                    {cat.icon}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{cat.label}</span>
                  {activo && <Check className="w-5 h-5 shrink-0" style={{ color }} />}
                </button>
              );
            })}
          </div>
        </div>

        {routeInfo && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-1.5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Información de la ruta
            </h3>
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Route className="w-4 h-4 text-gray-400" />
                Distancia
              </span>
              <span className="text-sm font-bold text-primary">{routeInfo.distance}</span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Tiempo
              </span>
              <span className="text-sm font-bold text-primary">{routeInfo.duration}</span>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 py-3 space-y-2">
        <button
          type="button"
          onClick={onCalculate}
          disabled={!puedeCalcular}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#ffd935] text-[#002297] font-bold text-sm hover:bg-[#e6c430] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {calculating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              Calcular ruta
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="w-full h-11 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}

export default function RutaPage() {
  // ✅ OPTIMIZACIÓN: Usar contexto del mapa (ahorro 66% en navegaciones)
  const { isLoaded, loadError } = useMap();
  const { user, loading: authLoading } = useAuth();

  const mapRef = useRef<google.maps.Map | null>(null);

  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [calculating, setCalculating] = useState(false);

  const [searchRadius, setSearchRadius] = useState(10); // km desde la ruta
  const [categoryFilter, setCategoryFilter] = useState('');

  const [placesNearRoute, setPlacesNearRoute] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [mobileView, setMobileView] = useState<MobileView>('map');
  const [sortBy, setSortBy] = useState<SortBy>('reviews');

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsActive, setGpsActive] = useState(false);

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

  const distanceTo = useCallback(
    (place: Place) =>
      userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
        : null,
    [userLocation, calculateDistance]
  );

  const addStop = () => {
    setStops((current) => [...current, { id: `stop-${Date.now()}-${current.length}`, value: '' }]);
  };

  const updateStop = (id: string, value: string) => {
    setStops((current) => current.map((stop) => (stop.id === id ? { ...stop, value } : stop)));
  };

  const removeStop = (id: string) => {
    setStops((current) => current.filter((stop) => stop.id !== id));
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    setStops((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const resetView = () => {
    mapRef.current?.setCenter(defaultCenter);
    mapRef.current?.setZoom(DEFAULT_ZOOM);
  };

  const toggleGps = () => {
    if (gpsActive) {
      setGpsActive(false);
      return;
    }
    if (!navigator.geolocation) {
      toast.error('Tu navegador no permite compartir la ubicación');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(pos);
        setGpsActive(true);
        mapRef.current?.panTo(pos);
        mapRef.current?.setZoom(12);
      },
      () => {
        toast.error('No se pudo obtener tu ubicación');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const clearRoute = () => {
    setDirectionsResponse(null);
    setRouteInfo(null);
    setPlacesNearRoute([]);
    setSelectedPlace(null);
    setOrigin('');
    setDestination('');
    setStops([]);
    resetView();
  };

  // Traducir errores de Google Directions a mensajes claros en español
  // Evita mensajes engañosos: solo hablamos de "sin conexión" si realmente no hay red
  const getRouteErrorMessage = (error: unknown): string => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'No tienes conexión a internet. Revisa tu red e inténtalo de nuevo.';
    }
    const code = String((error as any)?.code || (error as any)?.message || '');
    if (code.includes('NOT_FOUND')) {
      return 'No se encontró el origen o el destino. Revisa las direcciones.';
    }
    if (code.includes('ZERO_RESULTS')) {
      return 'No existe una ruta en coche entre esos dos puntos.';
    }
    if (code.includes('OVER_QUERY_LIMIT')) {
      return 'Demasiadas peticiones seguidas. Espera unos segundos e inténtalo de nuevo.';
    }
    if (code.includes('REQUEST_DENIED')) {
      return 'El servicio de rutas no está disponible en este momento.';
    }
    return 'Error temporal calculando la ruta. Inténtalo de nuevo.';
  };

  const calculateRoute = async () => {
    const finalOrigin = origin.trim();
    const finalDestination = destination.trim();

    if (!finalOrigin) {
      toast.error('Por favor, introduce un origen');
      return;
    }

    if (!finalDestination) {
      toast.error('Por favor, introduce un destino');
      return;
    }

    if (!window.google) {
      toast.error('Google Maps no está cargado');
      return;
    }

    // Limpiar solo ruta y lugares, NO los inputs de origen/destino
    setDirectionsResponse(null);
    setRouteInfo(null);
    setPlacesNearRoute([]);
    setSelectedPlace(null);

    setCalculating(true);
    
    try {
      // Calcular ruta (sin caché en localStorage: el DirectionsResult no es
      // serializable de forma fiable y las entradas antiguas rompían el renderizado)
      const directionsService = new google.maps.DirectionsService();

      const routeRequest: google.maps.DirectionsRequest = {
        origin: finalOrigin,
        destination: finalDestination,
        waypoints: stops
          .map((stop) => stop.value.trim())
          .filter(Boolean)
          .map((location) => ({ location, stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
      };

      let results: google.maps.DirectionsResult;

      try {
        results = await directionsService.route(routeRequest);
      } catch (firstError: any) {
        // Si el error es definitivo (dirección inválida, sin ruta), no reintentar
        const code = String(firstError?.code || firstError?.message || '');
        const isDefinitive =
          code.includes('NOT_FOUND') ||
          code.includes('ZERO_RESULTS') ||
          code.includes('REQUEST_DENIED');

        if (isDefinitive) throw firstError;

        // Error transitorio (microcorte de red, límite puntual): reintentar una vez
        console.warn('⚠️ Fallo transitorio calculando ruta, reintentando...', firstError);
        await new Promise(resolve => setTimeout(resolve, 1000));
        results = await directionsService.route(routeRequest);
      }

      toast.success('✅ Ruta calculada correctamente');

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
          
          const isMobile = window.innerWidth < 768;
          mapRef.current.fitBounds(
            bounds,
            isMobile
              ? { top: 80, bottom: 140, left: 20, right: 20 }
              : { top: 50, bottom: 50, left: 50, right: 50 }
          );
        }

        // Con paradas hay varios tramos: la ruta es la suma de todos
        const totalMeters = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
        const totalSeconds = route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.round((totalSeconds % 3600) / 60);

        setRouteInfo({
          distance: `${(totalMeters / 1000).toFixed(1)} km`,
          duration: hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`,
        });

        // En móvil, el resultado se ve en el mapa
        setMobileView('map');

        // Buscar lugares cerca de la ruta
        await findPlacesNearRoute(results);
      }
    } catch (error) {
      console.error('Error calculando ruta:', error);
      toast.error(getRouteErrorMessage(error));
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
      // ⚠️ limit=5000 activa la carga por lotes en la API y devuelve TODOS los lugares
      // (con límites menores Supabase corta en 1000 filas y faltaban lugares en la ruta)
      let queryParams = 'limit=5000&fields=light';
      if (categoryFilter) {
        queryParams += `&category=${categoryFilter}`;
      }
      
      console.log(`📡 Llamando a API: /api/places?${queryParams}`);
      // Agregar timestamp para forzar recarga de lugares frescos (sin caché)
      const response = await fetch(`/api/places?${queryParams}&t=${Date.now()}`);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status} cargando lugares`);
      }

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

      // 4. Aplicar el filtro de categoría también en cliente (la API puede venir sin filtrar)
      const filtered = categoryFilter
        ? nearbyPlaces.filter(p => p.category === categoryFilter)
        : nearbyPlaces;

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
      // Solo hablar de conexión si realmente no hay red
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        toast.error('No tienes conexión a internet. No se pudieron cargar los lugares.');
      } else {
        toast.error('Error al buscar lugares cercanos. Inténtalo de nuevo.');
      }
    } finally {
      setLoadingPlaces(false);
    }
  };

  const selectPlaceFromList = (place: Place) => {
    setSelectedPlace(place);
    mapRef.current?.panTo({ lat: place.latitude, lng: place.longitude });
    mapRef.current?.setZoom(15);
    setMobileView('map');
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Error cargando el mapa</p>
      </div>
    );
  }

  const panelProps = {
    isLoaded,
    origin,
    destination,
    stops,
    radius: searchRadius,
    category: categoryFilter,
    routeInfo,
    calculating,
    placesCount: placesNearRoute.length,
    onOriginChange: setOrigin,
    onDestinationChange: setDestination,
    onAddStop: addStop,
    onUpdateStop: updateStop,
    onRemoveStop: removeStop,
    onMoveStop: moveStop,
    onRadiusChange: setSearchRadius,
    onCategoryChange: setCategoryFilter,
    onCalculate: calculateRoute,
    onClear: clearRoute,
  };

  const ordenarSelect = (className: string) => (
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as SortBy)}
      className={className}
    >
      <option value="reviews">📊 Más Reseñas</option>
      <option value="rating">⭐ Mayor Valoración</option>
      <option value="proximity" disabled={!userLocation}>
        📍 Proximidad {!userLocation && '(requiere ubicación)'}
      </option>
    </select>
  );

  const listaVacia = (
    <div className="text-center py-12 text-gray-500">
      <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
      <p className="text-sm font-semibold text-gray-900 mb-1">Todavía no hay lugares</p>
      <p className="text-sm">Calcula una ruta para ver los lugares que quedan a tu paso.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {/* Overlay de Login para usuarios no autenticados */}
        {!authLoading && !user && <LoginOverlay feature="ruta" />}

        {/* PANEL DEL PLANIFICADOR - Desktop */}
        <aside className="hidden md:block md:w-72 lg:w-80 bg-white border-r border-gray-200 overflow-hidden">
          <PanelRuta showHeader {...panelProps} />
        </aside>

        {/* MAPA */}
        <div className="flex-1 relative">
          <div className="absolute top-3 left-3 z-10 w-max whitespace-nowrap bg-white/90 backdrop-blur-md rounded-full shadow-lg ring-1 ring-gray-900/5 px-3 py-1.5">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <span className="text-primary font-bold tabular-nums">
                {loadingPlaces ? '…' : placesNearRoute.length}
              </span>
              {placesNearRoute.length === 1 ? 'lugar' : 'lugares'}
              {loadingPlaces && (
                <span className="inline-flex animate-spin rounded-full h-3 w-3 border-2 border-primary-200 border-t-primary" />
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleGps}
            className={`absolute left-3 bottom-[calc(8.25rem+env(safe-area-inset-bottom,0px))] md:left-1/2 md:-translate-x-1/2 md:bottom-20 p-3 md:px-4 md:py-2 rounded-full shadow-lg font-semibold transition-all z-30 flex items-center md:gap-2 ${
              gpsActive ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label={gpsActive ? 'GPS activo' : 'Ver ubicación'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden md:inline text-sm">{gpsActive ? 'GPS Activo' : 'Ver ubicación'}</span>
          </button>

          <button
            type="button"
            onClick={resetView}
            className="absolute left-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:left-1/2 md:-translate-x-1/2 md:bottom-6 bg-white p-3 md:px-4 md:py-2 rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all z-30 flex items-center md:gap-2 font-semibold text-gray-700"
            aria-label="Restablecer zoom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span className="hidden md:inline text-sm">Restablecer Zoom</span>
          </button>

          <div className="cc-ruta-map h-full w-full">
            {!isLoaded ? (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-[#002297] mx-auto mb-4" />
                  <p className="text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={DEFAULT_ZOOM}
                onLoad={(map) => {
                  mapRef.current = map;
                  // Si el contenedor nació sin tamaño, Google ignora el center inicial.
                  requestAnimationFrame(() => {
                    google.maps.event.trigger(map, 'resize');
                    map.setCenter(defaultCenter);
                    map.setZoom(DEFAULT_ZOOM);
                  });
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
                  mapTypeControl: false,
                  fullscreenControl: false,
                  zoomControl: true,
                  zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP,
                  },
                  gestureHandling: 'greedy', // Permite scroll sin Ctrl
                  restriction: {
                    // España peninsular, Baleares y Canarias
                    latLngBounds: {
                      north: 44.0,
                      south: 27.4,
                      east: 4.6,
                      west: -18.4,
                    },
                    strictBounds: false,
                  },
                }}
              >
                {directionsResponse && (
                  <DirectionsRenderer
                    directions={directionsResponse}
                    options={{
                      suppressMarkers: false,
                      polylineOptions: {
                        strokeColor: '#002297',
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                      },
                    }}
                  />
                )}

                {gpsActive && userLocation && (
                  <Marker
                    position={userLocation}
                    zIndex={999999}
                    title="Tu ubicación"
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 9,
                      fillColor: '#f97316',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 3,
                    }}
                  />
                )}

                {placesNearRoute.map((place) => {
                  const tier = calculateQualityTier(place.rating, place.review_count);
                  const tierInfo = getTierInfo(tier);
                  const bgColor = TIER_MARKER_COLORS[tier] || '#ffffff';

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
                      title={`${place.name} · ★ ${place.rating}${place.review_count ? ` (${place.review_count.toLocaleString('es-ES')})` : ''}`}
                    />
                  );
                })}

                {/* Ficha anclada al pin, como en el mapa */}
                {selectedPlace && (() => {
                  const tier = calculateQualityTier(selectedPlace.rating, selectedPlace.review_count || 0);
                  const tierInfo = getTierInfo(tier);
                  const distance = distanceTo(selectedPlace);
                  const photoUrl = getPlacePhotoUrl(selectedPlace, 0);

                  return (
                    <InfoWindow
                      position={{ lat: selectedPlace.latitude, lng: selectedPlace.longitude }}
                      onCloseClick={() => setSelectedPlace(null)}
                      options={{ pixelOffset: new google.maps.Size(0, -18), maxWidth: 320 }}
                    >
                      <div className="w-72 max-w-[88vw]">
                        {photoUrl && (
                          <div className="relative">
                            <img
                              src={photoUrl}
                              alt={selectedPlace.name}
                              className="w-full h-32 object-cover rounded-t-xl"
                              loading="lazy"
                            />
                            {distance !== null && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {formatDistance(distance)}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base text-gray-900 leading-tight mb-1">
                                {selectedPlace.name}
                              </h4>
                              <PlaceRatingLine
                                rating={selectedPlace.rating}
                                reviews={selectedPlace.review_count}
                              />
                            </div>
                            <span className="text-2xl">{tierInfo.icon}</span>
                          </div>

                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {selectedPlace.city}, {selectedPlace.province}
                          </p>

                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#002297] text-xs font-medium">
                              {CATEGORIES[selectedPlace.category] || selectedPlace.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${tierInfo.color} text-white`}>
                              {tierInfo.name}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                window.open(
                                  getPlaceUrl(selectedPlace.category, selectedPlace.province, selectedPlace.slug),
                                  '_blank'
                                )
                              }
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
                    </InfoWindow>
                  );
                })()}
              </GoogleMap>
            )}
          </div>
        </div>

        {/* PANEL LATERAL DERECHO - Lugares de la ruta - Desktop */}
        <div className="hidden md:block md:w-80 lg:w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="mb-4 sticky top-0 bg-white pb-2 border-b z-10">
              <div className="mb-3">
                <h3 className="font-bold text-lg">Lugares en la Ruta</h3>
                <p className="text-sm text-gray-600">{placesNearRoute.length} resultados</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Ordenar por:</label>
                {ordenarSelect(
                  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                {sortBy === 'proximity' && !userLocation && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Activa tu ubicación para ordenar por proximidad
                  </p>
                )}
              </div>
            </div>

            {loadingPlaces ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-600">Cargando lugares...</p>
              </div>
            ) : sortedPlaces.length > 0 ? (
              sortedPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  distance={distanceTo(place)}
                  onSelect={() => selectPlaceFromList(place)}
                />
              ))
            ) : (
              listaVacia
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION - Solo móvil */}
      <BottomNavigation
        activeView={mobileView}
        onViewChange={setMobileView}
        placesCount={placesNearRoute.length}
        middleLabel="Ruta"
        middleIcon="route"
      />

      {/* BOTTOM SHEET - Planificador */}
      <BottomSheet
        isOpen={mobileView === 'filters'}
        onClose={() => setMobileView('map')}
        title="Planificar ruta"
        height="full"
      >
        <PanelRuta showHeader={false} {...panelProps} />
      </BottomSheet>

      {/* BOTTOM SHEET - Lugares de la ruta */}
      <BottomSheet
        isOpen={mobileView === 'list'}
        onClose={() => setMobileView('map')}
        title={`${placesNearRoute.length} Lugares en la ruta`}
        height="full"
      >
        <div className="space-y-3 py-2">
          {placesNearRoute.length > 0 && (
            <div className="sticky top-0 bg-white pb-3 border-b z-10">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por:</label>
              {ordenarSelect('w-full px-3 py-3 text-base border border-gray-300 rounded-lg')}
              {sortBy === 'proximity' && !userLocation && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Permite el acceso a tu ubicación para ordenar por proximidad
                </p>
              )}
            </div>
          )}

          {loadingPlaces ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#002297]" />
            </div>
          ) : sortedPlaces.length > 0 ? (
            sortedPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                distance={distanceTo(place)}
                onSelect={() => selectPlaceFromList(place)}
              />
            ))
          ) : (
            listaVacia
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
