'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MapLibreMap, Marker as MapLibreMarker, Popup as MapLibrePopup } from 'maplibre-gl';
import Supercluster from 'supercluster';

// ⚠️ maplibre-gl usa APIs del navegador al evaluarse: NO puede importarse en SSR.
// Se carga dinámicamente en el primer useEffect (solo cliente).
let maplibregl: typeof import('maplibre-gl') | null = null;
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Search,
  X,
  MapPin,
  Star,
  Loader2,
  Filter,
  Heart,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import BottomSheet from '@/components/mobile/BottomSheet';
import LoginOverlay from '@/components/auth/LoginOverlay';
import RoutePromoModal from '@/components/modals/RoutePromoModal';
import type { PlaceWithTier, PlaceFilters, QualityTier, ReviewsRange } from '@/types/filters';
import { calculateQualityTier, getTierInfo } from '@/lib/utils/tier-calculator';
import { trackEvent, EVENTS, CATEGORIES as ANALYTICS_CATEGORIES } from '@/lib/analytics/tracker';
import { getPlaceUrl } from '@/lib/utils/url-helper';
import { QUALITY_TIERS } from '@/types/filters';
import { CATEGORIES, subscribeSharedGps, writeSharedGps } from '@/lib/utils/constants';
import { toast } from 'sonner';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';
import { applyBrandTheme, applyMapLanguage } from '@/lib/map/brand-style';
import FiltrosMapa from '@/components/map/FiltrosMapa';

// 🚀 HOOK DE DEBOUNCE para optimizar búsquedas
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Centro de España para vista inicial
const DEFAULT_CENTER: [number, number] = [-3.7038, 40.5]; // [lng, lat]

// Zoom inicial (MapLibre usa tiles de 512px: equivale aprox. a zoom de Google - 1)
const DEFAULT_ZOOM_DESKTOP = 5.3;
const DEFAULT_ZOOM_MOBILE = 5.0;
const MIN_ZOOM = 4.3;

// Vuelo de entrada: arranca sobre Europa y baja a España. Solo la primera carga.
const INTRO_CENTER: [number, number] = [4.5, 47];
const INTRO_ZOOM = 3.1;
let introFlightPlayed = false;

// Límites del mapa con margen generoso: en MapLibre maxBounds es estricto
// (restringe el viewport completo), así que unos límites ajustados bloquean
// el desplazamiento lateral. Mismos límites en móvil y escritorio: con la
// península sola, Canarias quedaba fuera de alcance en el móvil.
const BOUNDS_FULL: [[number, number], [number, number]] = [
  [-28.0, 20.0], // suroeste [lng, lat]
  [12.0, 50.0], // noreste
];

// Basemap: MapTiler streets-v2 (mismo que Mapa Furgocasa) con la clave de la
// cuenta Furgocasa. Sin clave cae a Carto Voyager, que también funciona: encima
// se aplica applyBrandTheme() y applyMapLanguage() con cualquiera de los dos.
// La variable se llama igual que en Mapa Furgocasa para no duplicar nombres.
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
const MAP_STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}&language=es`
  : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// Persistencia de filtros (solo selección manual; el GPS nunca escribe aquí)
const FILTERS_STORAGE_KEY = 'mapaFilters_v1';

// Propiedades de los puntos en Supercluster
type MapPointProps = { placeId: string; tier: QualityTier };

// Tamaño visual del cluster según count
function getClusterSize(count: number): number {
  if (count < 10) return 22;
  if (count < 50) return 30;
  if (count < 100) return 38;
  return 45;
}

// Azul corporativo Casi Cinco para los clusters
const CLUSTER_COLOR = '#002297';

// Colores e iconos de tier para los puntos individuales (diseño original de Casi Cinco)
const TIER_POINT_COLORS: Record<QualityTier, string> = {
  diamond: '#93c5fd',
  platinum: '#e5e7eb',
  gold: '#fbbf24',
  silver: '#d1d5db',
  bronze: '#fb923c',
  none: '#ffffff',
};

const TIER_POINT_ICONS: Record<QualityTier, string> = {
  diamond: '💎',
  platinum: '🏆',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  none: '⚪',
};

function getReviewCount(place: { review_count?: number | null; reviews_count?: number | null }) {
  return Number(place.review_count || place.reviews_count) || 0;
}

/** Misma línea de nota + reseñas en ficha del mapa y cards de la lista. */
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

// Coordenadas válidas para España (incluye Canarias)
function hasValidCoords(place: PlaceWithTier): boolean {
  return (
    typeof place.latitude === 'number' &&
    typeof place.longitude === 'number' &&
    place.latitude >= 26 &&
    place.latitude <= 46 &&
    place.longitude >= -18.5 &&
    place.longitude <= 5
  );
}

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // ===== REFS DEL MOTOR DE MAPA (MapLibre + Supercluster) =====
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const clusterIndexRef = useRef<Supercluster<MapPointProps> | null>(null);
  // Pool de markers en pantalla: si un id ya existe se reutiliza su DOM, si sale del viewport se elimina
  const markerPoolRef = useRef<Map<string, MapLibreMarker>>(new Map());
  const placesByIdRef = useRef<Map<string, PlaceWithTier>>(new Map());
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  const isUserInteractingRef = useRef(false);
  // El auto-zoom de filtros espera a que termine el vuelo de entrada para no cortarlo
  const [introDone, setIntroDone] = useState(false);

  // La ficha va anclada al pin: MapLibre mueve el globo y React pinta dentro
  const popupRef = useRef<MapLibrePopup | null>(null);
  const [popupNode] = useState<HTMLDivElement | null>(() =>
    typeof document === 'undefined' ? null : document.createElement('div')
  );
  const prefersReducedMotionRef = useRef(false);
  const hoverEnabledRef = useRef(false);

  // Establecer título de la página
  useEffect(() => {
    document.title = 'Mapa de Lugares | Casi Cinco';
  }, []);

  // ===== STATE =====
  const [allPlaces, setAllPlaces] = useState<PlaceWithTier[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Vista móvil: 'map', 'filters', 'list'
  const [mobileView, setMobileView] = useState<'map' | 'filters' | 'list'>('map');
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');
  const [visitRating, setVisitRating] = useState(0);

  // Geolocalización
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeolocationActive, setIsGeolocationActive] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  // Buscador geográfico sobre el mapa
  const [geoQuery, setGeoQuery] = useState('');
  const [showGeoSuggestions, setShowGeoSuggestions] = useState(false);
  const [openMobileSearch, setOpenMobileSearch] = useState(false);

  // Ordenamiento de lista
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'proximity'>('reviews');

  // Control de leyenda expandida (solo móvil)
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<PlaceFilters>({
    community: searchParams.get('community') || undefined,
    province: searchParams.get('province') || undefined,
    city: searchParams.get('city') || undefined,
    category: searchParams.get('category') || undefined,
    minRating: 4.7,
    maxRating: 5.0,
    reviewsRange: (searchParams.get('reviewsRange') as ReviewsRange) || undefined,
    qualityTier: (searchParams.get('qualityTier')?.split(',') as QualityTier[]) || undefined,
    searchTerm: searchParams.get('q') || undefined,
  });

  // 🚀 Debounce para búsqueda (espera 500ms antes de aplicar)
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

  // Rango de reseñas con slider
  const [minReviews, setMinReviews] = useState(0);
  const [maxReviews, setMaxReviews] = useState(10000);

  // ✅ Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== PERSISTENCIA DE FILTROS EN LOCALSTORAGE =====
  // Restaurar al montar (solo si la URL no trae filtros; la URL siempre tiene prioridad)
  useEffect(() => {
    const hasUrlFilters = ['community', 'province', 'city', 'category', 'reviewsRange', 'qualityTier', 'q'].some(
      (key) => searchParams.get(key)
    );
    if (hasUrlFilters) return;

    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.filters) {
        setFilters((prev) => ({ ...prev, ...saved.filters }));
      }
      if (typeof saved.minReviews === 'number') setMinReviews(saved.minReviews);
      if (typeof saved.maxReviews === 'number') setMaxReviews(saved.maxReviews);
    } catch {
      // Cache corrupto: ignorar
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar selección manual de filtros (el GPS no guarda ningún filtro geográfico)
  useEffect(() => {
    try {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({
          filters: {
            community: filters.community,
            province: filters.province,
            city: filters.city,
            category: filters.category,
            minRating: filters.minRating,
            qualityTier: filters.qualityTier,
          },
          minReviews,
          maxReviews,
        })
      );
    } catch {
      // Almacenamiento no disponible: no es crítico
    }
  }, [filters.community, filters.province, filters.city, filters.category, filters.minRating, filters.qualityTier, minReviews, maxReviews]);

  // ===== CARGA DE DATOS =====
  // Endpoint ligero cacheado en CDN (una sola respuesta). Fallback: paginar de 1000 en 1000.
  const allPlacesCountRef = useRef(0);
  useEffect(() => {
    allPlacesCountRef.current = allPlaces.length;
  }, [allPlaces.length]);

  const loadPlacesPaginated = async (): Promise<PlaceWithTier[]> => {
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;
    let loaded: PlaceWithTier[] = [];

    while (hasMore) {
      const response = await fetch(`/api/places?limit=${batchSize}&offset=${offset}&fields=light`);
      if (!response.ok) break;
      const data = await response.json();
      if (data.success && data.places && data.places.length > 0) {
        loaded = loaded.concat(data.places);
        offset += batchSize;
        if (data.places.length < batchSize) hasMore = false;
      } else {
        hasMore = false;
      }
    }
    return loaded;
  };

  const loadPlaces = useCallback(async (isRevalidation = false) => {
    if (!isRevalidation) setLoading(true);
    try {
      // Cubo temporal de 30s: URL estable para aprovechar el cache CDN sin petar el origen
      const bucket = Math.floor(Date.now() / 30000);
      const response = await fetch(`/api/places?fields=map&t=${bucket}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.success || !Array.isArray(data.places)) throw new Error('Respuesta inválida');

      const previousCount = allPlacesCountRef.current;
      setAllPlaces(data.places);
      if (isRevalidation && data.places.length > previousCount) {
        toast.success(`🆕 ${data.places.length - previousCount} lugares nuevos disponibles`, { duration: 5000 });
      }
    } catch (error) {
      console.error('❌ Error en endpoint de mapa, usando fallback paginado:', error);
      try {
        const loaded = await loadPlacesPaginated();
        if (loaded.length > 0) {
          setAllPlaces(loaded);
        } else if (!isRevalidation) {
          toast.error('Error cargando lugares. Recarga la página.');
        }
      } catch (fallbackError) {
        console.error('❌ Error crítico cargando lugares:', fallbackError);
        if (!isRevalidation) toast.error('Error cargando lugares. Revisa tu conexión.');
      }
    } finally {
      if (!isRevalidation) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // 🔄 Revalidación automática cada 5 minutos
  useEffect(() => {
    const REVALIDATE_INTERVAL = 5 * 60 * 1000;
    const interval = setInterval(() => {
      loadPlaces(true);
    }, REVALIDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [loadPlaces]);

  // Índice de lugares por id (para resolver clicks de markers sin closures obsoletos)
  useEffect(() => {
    placesByIdRef.current = new Map(allPlaces.map((p) => [p.id, p]));
  }, [allPlaces]);

  // ===== FILTRADO: UN SOLO useMemo COMPARTIDO POR MAPA Y LISTA =====
  const filteredPlaces = useMemo(() => {
    let filtered = allPlaces;

    // Filtro de comunidad
    if (filters.community) {
      filtered = filtered.filter((p) => p.region === filters.community);
    }

    // Filtro de provincia
    if (filters.province) {
      filtered = filtered.filter((p) => p.province === filters.province);
    }

    // 🔍 Búsqueda universal (nombre, ciudad, provincia, región, categoría, tier)
    if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      const searchWords = searchLower.split(' ').filter((word) => word.length > 2);

      filtered = filtered.filter((p) => {
        const searchableText = [
          p.city?.toLowerCase() || '',
          p.province?.toLowerCase() || '',
          p.region?.toLowerCase() || '',
          p.name?.toLowerCase() || '',
          p.category?.toLowerCase() || '',
          p.subcategory?.toLowerCase() || '',
          calculateQualityTier(p.rating, p.review_count || 0).toLowerCase(),
        ].join(' ');

        if (searchWords.length > 1) {
          return searchWords.every((word) => searchableText.includes(word));
        }
        return searchableText.includes(searchLower);
      });
    }

    // Filtro de ciudad
    if (filters.city && filters.city.trim()) {
      const cityTerm = filters.city.toLowerCase().trim();
      filtered = filtered.filter((p) => (p.city?.toLowerCase() || '').includes(cityTerm));
    }

    // Filtro de categoría
    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    // Filtro de rating
    if (filters.minRating) {
      filtered = filtered.filter((p) => p.rating >= filters.minRating!);
    }
    if (filters.maxRating) {
      filtered = filtered.filter((p) => p.rating <= filters.maxRating!);
    }

    // Filtro de precio
    if (filters.priceLevel) {
      filtered = filtered.filter((p) => p.price_level === filters.priceLevel);
    }

    // Filtro de tier de calidad (calculado dinámicamente)
    if (filters.qualityTier && filters.qualityTier.length > 0) {
      filtered = filtered.filter((p) => {
        const tier = calculateQualityTier(p.rating, p.review_count || 0);
        return filters.qualityTier!.includes(tier);
      });
    }

    // Filtro de rango de reseñas
    filtered = filtered.filter((p) => {
      const count = p.review_count || 0;
      return count >= minReviews && count <= maxReviews;
    });

    return filtered;
  }, [allPlaces, filters, minReviews, maxReviews, debouncedSearchTerm]);

  // ===== SELECCIÓN DE LUGAR (única fuente de verdad: pin, card y lista) =====
  const selectPlace = useCallback((place: PlaceWithTier, source: string) => {
    trackEvent(EVENTS.PLACE_VIEW, ANALYTICS_CATEGORIES.PLACE, {
      place_id: place.id,
      place_name: place.name,
      place_category: place.category,
      place_city: place.city,
      place_rating: place.rating,
      source,
    });

    setSelectedPlace(place);

    const map = mapRef.current;
    if (!map) return;

    // Desplazar la cámara con offset vertical: el pin queda arriba y la card cabe debajo
    const mapHeight = map.getContainer().clientHeight;
    const offsetY = -Math.round(mapHeight * 0.22);
    const currentZoom = map.getZoom();
    const targetZoom = source === 'map_marker' ? currentZoom : Math.max(currentZoom, 13);
    // easeTo con duration 0 = salto instantáneo (prefers-reduced-motion) pero admite offset
    map.easeTo({
      center: [place.longitude, place.latitude],
      zoom: targetZoom,
      offset: [0, offsetY],
      duration: prefersReducedMotionRef.current ? 0 : 500,
    });
  }, []);

  const selectPlaceRef = useRef(selectPlace);
  useEffect(() => {
    selectPlaceRef.current = selectPlace;
  }, [selectPlace]);

  // ===== SUPERCLUSTER: PINTAR SOLO EL VIEWPORT REUTILIZANDO DOM =====
  const createClusterElement = useCallback(
    (props: { cluster_id: number; point_count: number }, lng: number, lat: number) => {
      const count = props.point_count;
      const size = getClusterSize(count);

      const wrapper = document.createElement('div');
      wrapper.style.cssText = `width:${size}px;height:${size}px;cursor:pointer;`;
      const el = document.createElement('div');
      el.className = 'cc-cluster cc-marker-drop';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.backgroundColor = CLUSTER_COLOR;
      el.style.fontSize = count < 100 ? '14px' : '16px';
      el.textContent = count >= 1000 ? `${Math.round(count / 100) / 10}k` : String(count);
      wrapper.appendChild(el);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const map = mapRef.current;
        const index = clusterIndexRef.current;
        if (!map || !index) return;

        let targetZoom = 16;
        try {
          targetZoom = Math.min(index.getClusterExpansionZoom(props.cluster_id), 16);
        } catch {
          targetZoom = Math.min(map.getZoom() + 2, 16);
        }

        if (prefersReducedMotionRef.current) {
          map.jumpTo({ center: [lng, lat], zoom: targetZoom });
        } else {
          map.flyTo({ center: [lng, lat], zoom: targetZoom, duration: 500 });
        }
      });

      return wrapper;
    },
    []
  );

  const createPointElement = useCallback((props: MapPointProps) => {
    const place = placesByIdRef.current.get(props.placeId);

    const wrapper = document.createElement('div');
    const el = document.createElement('div');
    el.className = 'cc-point cc-marker-drop';
    el.style.backgroundColor = TIER_POINT_COLORS[props.tier] || '#ffffff';

    // Emoji del tier dentro del círculo (diseño original de Casi Cinco)
    const icon = document.createElement('span');
    icon.className = 'cc-point-icon';
    icon.textContent = TIER_POINT_ICONS[props.tier] || '⚪';
    el.appendChild(icon);
    wrapper.appendChild(el);

    // Hover con nombre, valoración y reseñas SOLO en dispositivos con puntero fino (nunca en táctil)
    if (hoverEnabledRef.current && place) {
      const label = document.createElement('span');
      label.className = 'cc-point-label';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'cc-point-label-name';
      nameSpan.textContent = place.name;
      label.appendChild(nameSpan);

      if (place.rating) {
        const ratingSpan = document.createElement('span');
        ratingSpan.className = 'cc-point-label-rating';
        const reviews = Number(place.review_count) || 0;
        ratingSpan.textContent =
          reviews > 0
            ? `★ ${Number(place.rating).toFixed(1)} (${reviews.toLocaleString('es-ES')})`
            : `★ ${Number(place.rating).toFixed(1)}`;
        label.appendChild(ratingSpan);
      }

      el.appendChild(label);
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentPlace = placesByIdRef.current.get(props.placeId);
      if (currentPlace) {
        selectPlaceRef.current(currentPlace, 'map_marker');
      }
    });

    return wrapper;
  }, []);

  // Pide SOLO los clusters/puntos del bbox visible y reutiliza el DOM existente
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    const index = clusterIndexRef.current;
    if (!map || !index || !maplibregl) return;

    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    const zoom = Math.floor(map.getZoom());
    const clusters = index.getClusters(bbox, zoom);

    const pool = markerPoolRef.current;
    const visibleKeys = new Set<string>();

    for (const feature of clusters) {
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const props: any = feature.properties;
      const key = props.cluster ? `c:${props.cluster_id}` : `p:${props.placeId}`;
      visibleKeys.add(key);

      // Si el id ya está en pantalla, NO recrear su DOM
      if (pool.has(key)) continue;

      const element = props.cluster ? createClusterElement(props, lng, lat) : createPointElement(props);
      const marker = new maplibregl!.Marker({ element }).setLngLat([lng, lat]).addTo(map);
      pool.set(key, marker);
    }

    // Eliminar los que salieron del viewport
    pool.forEach((marker, key) => {
      if (!visibleKeys.has(key)) {
        marker.remove();
        pool.delete(key);
      }
    });
  }, [createClusterElement, createPointElement]);

  const updateMarkersRef = useRef(updateMarkers);
  useEffect(() => {
    updateMarkersRef.current = updateMarkers;
  }, [updateMarkers]);

  // ===== INICIALIZAR MAPLIBRE (una sola vez, sin esperar al dataset) =====
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Cargar maplibre-gl SOLO en el navegador (su módulo no soporta SSR)
      if (!maplibregl) {
        const mod: any = await import('maplibre-gl');
        maplibregl = (mod.default ?? mod) as typeof import('maplibre-gl');
      }
      if (cancelled || !mapDivRef.current || mapRef.current) return;

      prefersReducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      hoverEnabledRef.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const mobile = window.innerWidth < 768;
      const homeZoom = mobile ? DEFAULT_ZOOM_MOBILE : DEFAULT_ZOOM_DESKTOP;

      // El vuelo se salta con "reducir movimiento" y con enlace directo a un lugar.
      const playIntro =
        !introFlightPlayed && !prefersReducedMotionRef.current && !searchParams.get('place');
      if (playIntro) introFlightPlayed = true;

      const map = new maplibregl.Map({
        container: mapDivRef.current,
        style: MAP_STYLE,
        center: playIntro ? INTRO_CENTER : DEFAULT_CENTER,
        zoom: playIntro ? INTRO_ZOOM : homeZoom,
        // Durante el vuelo no hay límites: el encuadre de Europa es más ancho que ellos.
        minZoom: playIntro ? INTRO_ZOOM : MIN_ZOOM,
        maxZoom: 18,
        ...(playIntro ? {} : { maxBounds: BOUNDS_FULL }),
        attributionControl: false,
        fadeDuration: prefersReducedMotionRef.current ? 0 : 300,
      });

      // Controles nativos de MapLibre: zoom + attribution compacta.
      // La attribution va a la izquierda: a la derecha se solapa con el chat del Tío Viajero.
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
      // MapLibre abre el © en escritorio y solo lo pliega al mover; lo contraemos ya.
      const attrib = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
      if (attrib) {
        attrib.classList.remove('maplibregl-compact-show');
        attrib.removeAttribute('open');
      }
      // Con brújula: la rotación táctil está activa y sin ella no hay forma de recuperar el norte.
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      if (popupNode) {
        popupRef.current = new maplibregl.Popup({
          offset: 18,
          anchor: 'top',
          closeButton: false, // la tarjeta ya trae su propia X
          closeOnClick: false, // el cierre lo controla el estado de React
          maxWidth: '340px',
          className: 'cc-popup',
        }).setDOMContent(popupNode);
      }

      // Repintar viewport en cada movimiento (moveend cubre también zoomend)
      map.on('moveend', () => updateMarkersRef.current());

      // Rastrear interacción manual del usuario (desactiva auto-zoom de filtros)
      map.on('dragstart', () => {
        isUserInteractingRef.current = true;
      });
      map.on('zoomstart', (e: any) => {
        if (e.originalEvent) isUserInteractingRef.current = true;
      });
      map.on('moveend', () => {
        setTimeout(() => {
          isUserInteractingRef.current = false;
        }, 2000);
      });

      // Click en el canvas (no en un pin): cerrar la card
      map.on('click', () => setSelectedPlace(null));

      map.on('load', () => {
        applyBrandTheme(map);
        applyMapLanguage(map);
        setMapReady(true);

        if (!playIntro) {
          setIntroDone(true);
          return;
        }
        map.flyTo({
          center: DEFAULT_CENTER,
          zoom: homeZoom,
          duration: 2600,
          curve: 1.42,
          essential: true,
        });
        map.once('moveend', () => {
          map.setMinZoom(MIN_ZOOM);
          map.setMaxBounds(BOUNDS_FULL);
          setIntroDone(true);
        });
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      markerPoolRef.current.forEach((marker) => marker.remove());
      markerPoolRef.current.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== CONSTRUIR ÍNDICE SUPERCLUSTER CON EL SET FILTRADO =====
  // NUNCA se crea un marker por punto: solo el índice + los nodos del viewport
  useEffect(() => {
    if (!mapReady) return;

    const index = new Supercluster<MapPointProps>({
      radius: 60, // 100 agrupa de más y obliga a zooms absurdos
      maxZoom: 12, // desde zoom 13 todo son puntos individuales
      minPoints: 3,
    });

    const features = filteredPlaces.filter(hasValidCoords).map((place) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [place.longitude, place.latitude],
      },
      properties: {
        placeId: place.id,
        tier: calculateQualityTier(place.rating, place.review_count || 0),
      },
    }));

    index.load(features);
    clusterIndexRef.current = index;

    // El índice cambió: los cluster_id son nuevos, vaciar pool y repintar viewport
    markerPoolRef.current.forEach((marker) => marker.remove());
    markerPoolRef.current.clear();
    updateMarkersRef.current();
  }, [filteredPlaces, mapReady]);

  // Anclar el globo al lugar seleccionado (MapLibre lo mantiene pegado al pin al mover)
  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map || !popup) return;

    if (!selectedPlace) {
      popup.remove();
      return;
    }

    popup.setLngLat([selectedPlace.longitude, selectedPlace.latitude]);
    if (!popup.isOpen()) popup.addTo(map);
  }, [selectedPlace, mapReady]);

  // Resaltar el pin seleccionado (si está en el viewport)
  useEffect(() => {
    markerPoolRef.current.forEach((marker, key) => {
      const inner = marker.getElement().firstElementChild;
      if (inner) {
        inner.classList.toggle('cc-point--selected', key === `p:${selectedPlace?.id}`);
      }
    });
  }, [selectedPlace]);

  // Auto-zoom SOLO con filtros geográficos (comunidad/provincia/ciudad).
  // Tier, categoría o reseñas no mueven la cámara: el usuario se queda donde estaba.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || filteredPlaces.length === 0) return;
    if (searchParams.get('place')) return;
    if (isUserInteractingRef.current) return;
    if (!introDone) return;

    const hasGeographicFilters = Boolean(
      filters.community || filters.province || filters.city
    );
    if (!hasGeographicFilters) return;

    const timer = setTimeout(() => {
      const currentMap = mapRef.current;
      if (!currentMap || !maplibregl) return;

      const bounds = new maplibregl.LngLatBounds();
      let validCount = 0;
      filteredPlaces.forEach((place) => {
        if (hasValidCoords(place)) {
          bounds.extend([place.longitude, place.latitude]);
          validCount++;
        }
      });

      if (validCount > 0) {
        currentMap.fitBounds(bounds, {
          padding: { top: 80, bottom: 100, left: 60, right: 60 },
          maxZoom: 15,
          animate: !prefersReducedMotionRef.current,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
    // Solo reencuadrar al cambiar el recorte geográfico, no al filtrar por tier/categoría.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.community, filters.province, filters.city, mapReady, introDone]);

  // 🔗 Abrir lugar desde URL (ej: desde chatbot con ?place=ID)
  useEffect(() => {
    const placeIdFromUrl = searchParams.get('place');
    if (!placeIdFromUrl || !allPlaces.length || !mapReady) return;
    if (selectedPlace && selectedPlace.id === placeIdFromUrl) return;

    const placeToOpen = allPlaces.find((p) => p.id === placeIdFromUrl);
    if (placeToOpen) {
      setSelectedPlace(placeToOpen);
      // easeTo con duration 0 = salto instantáneo pero admite offset vertical
      mapRef.current?.easeTo({
        center: [placeToOpen.longitude, placeToOpen.latitude],
        zoom: 14,
        offset: [0, -Math.round((mapRef.current?.getContainer().clientHeight || 600) * 0.22)],
        duration: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlaces, mapReady]);

  // ===== GPS al molde MapafurgoCasa: pide al entrar (sin timeout) y Ver ubicación es un watch =====
  const startWatch = useCallback((center: boolean) => {
    if (!navigator.geolocation) return;
    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setIsGeolocationActive(true);
        setGeolocationError(null);
        writeSharedGps(true, location);
        if (center && !hasCenteredOnUserRef.current && mapRef.current) {
          hasCenteredOnUserRef.current = true;
          const cameraOptions = {
            center: [location.lng, location.lat] as [number, number],
            zoom: Math.max(mapRef.current.getZoom(), 11),
          };
          if (prefersReducedMotionRef.current) mapRef.current.jumpTo(cameraOptions);
          else mapRef.current.easeTo({ ...cameraOptions, duration: 800 });
        }
      },
      (error) => {
        console.error('Error GPS:', error);
        setGeolocationError('No se pudo obtener tu ubicación');
        setIsGeolocationActive(false);
        writeSharedGps(false);
        if (geoWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    geoWatchIdRef.current = watchId;
  }, []);

  const activateGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError('No se pudo obtener tu ubicación');
      return;
    }
    setGeolocationError(null);
    setIsGeolocationActive(true);
    writeSharedGps(true);
    startWatch(true);
  }, [startWatch]);

  const deactivateGeolocation = useCallback(() => {
    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }
    hasCenteredOnUserRef.current = false;
    setUserLocation(null);
    setIsGeolocationActive(false);
    setGeolocationError(null);
    writeSharedGps(false);
    setSortBy((current) => (current === 'proximity' ? 'reviews' : current));
  }, []);

  // Al entrar: getCurrentPosition sin opciones (MapafurgoCasa). Si falla, silencio.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5) return;
        setUserLocation({ lat, lng });
        setIsGeolocationActive(true);
        writeSharedGps(true, { lat, lng });
      },
      (error) => {
        console.log('GPS no disponible:', error.message);
        setIsGeolocationActive(false);
      }
    );
    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isGeolocationActive && mapReady && geoWatchIdRef.current === null && navigator.geolocation) {
      startWatch(!hasCenteredOnUserRef.current);
    }
  }, [isGeolocationActive, mapReady, startWatch]);

  // El Tío Viajero y /ruta comparten el mismo GPS
  useEffect(() => {
    return subscribeSharedGps((active, coords) => {
      if (active) {
        if (coords) setUserLocation(coords);
        setIsGeolocationActive(true);
        setGeolocationError(null);
        return;
      }
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      hasCenteredOnUserRef.current = false;
      setUserLocation(null);
      setIsGeolocationActive(false);
    });
  }, []);

  // Marcador de usuario (distinto a los pins de lugares)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !maplibregl) return;

    if (userLocation) {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'cc-user-marker';
        el.innerHTML = '<div class="cc-user-ring"></div><div class="cc-user-dot"></div>';
        el.title = 'Tu ubicación';
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation, mapReady]);

  // ===== RESTABLECER VISTA (según filtro geográfico activo) =====
  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map || !maplibregl) return;

    const hasGeoFilter = filters.community || filters.province || filters.city;

    if (hasGeoFilter && filteredPlaces.length > 0 && filteredPlaces.length < allPlaces.length) {
      // Encuadrar la zona filtrada (CCAA / provincia / ciudad)
      const bounds = new maplibregl.LngLatBounds();
      let validCount = 0;
      filteredPlaces.forEach((place) => {
        if (hasValidCoords(place)) {
          bounds.extend([place.longitude, place.latitude]);
          validCount++;
        }
      });
      if (validCount > 0) {
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 100, left: 60, right: 60 },
          maxZoom: 15,
          animate: !prefersReducedMotionRef.current,
        });
        return;
      }
    }

    // Vista de España
    const cameraOptions = {
      center: DEFAULT_CENTER,
      zoom: window.innerWidth < 768 ? DEFAULT_ZOOM_MOBILE : DEFAULT_ZOOM_DESKTOP,
    };
    if (prefersReducedMotionRef.current) map.jumpTo(cameraOptions);
    else map.easeTo({ ...cameraOptions, duration: 600 });
  }, [filters.community, filters.province, filters.city, filteredPlaces, allPlaces.length]);

  // ===== BUSCADOR GEOGRÁFICO SOBRE EL MAPA (BD: nombre/ciudad, top 8, startsWith primero) =====
  type GeoSuggestion =
    | { type: 'place'; label: string; sublabel: string; place: PlaceWithTier }
    | { type: 'city'; label: string; sublabel: string; city: string };

  const geoSuggestions = useMemo<GeoSuggestion[]>(() => {
    const query = geoQuery.trim().toLowerCase();
    if (query.length < 2) return [];

    const placeStarts: GeoSuggestion[] = [];
    const placeContains: GeoSuggestion[] = [];
    const cityStarts = new Map<string, number>();
    const seenCities = new Set<string>();

    for (const place of allPlaces) {
      const name = place.name?.toLowerCase() || '';
      const city = place.city || '';
      const cityLower = city.toLowerCase();

      if (name.startsWith(query) && placeStarts.length < 8) {
        placeStarts.push({
          type: 'place',
          label: place.name,
          sublabel: `${place.city}, ${place.province}`,
          place,
        });
      } else if (name.includes(query) && placeContains.length < 8) {
        placeContains.push({
          type: 'place',
          label: place.name,
          sublabel: `${place.city}, ${place.province}`,
          place,
        });
      }

      if (cityLower.startsWith(query) && !seenCities.has(cityLower)) {
        seenCities.add(cityLower);
        cityStarts.set(city, (cityStarts.get(city) || 0) + 1);
      }
    }

    const citySuggestions: GeoSuggestion[] = Array.from(cityStarts.keys())
      .slice(0, 3)
      .map((city) => ({
        type: 'city',
        label: city,
        sublabel: 'Ciudad',
        city,
      }));

    return [...citySuggestions, ...placeStarts, ...placeContains].slice(0, 8);
  }, [geoQuery, allPlaces]);

  const handleGeoSuggestionSelect = useCallback(
    (suggestion: GeoSuggestion) => {
      setGeoQuery('');
      setShowGeoSuggestions(false);

      if (suggestion.type === 'place') {
        selectPlace(suggestion.place, 'geo_search');
        return;
      }

      // Ciudad: centrar el mapa en el centroide de sus lugares (NO filtra el dataset)
      const cityPlaces = allPlaces.filter(
        (p) => p.city?.toLowerCase() === suggestion.city.toLowerCase() && hasValidCoords(p)
      );
      if (cityPlaces.length === 0 || !mapRef.current || !maplibregl) return;

      const bounds = new maplibregl.LngLatBounds();
      cityPlaces.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      mapRef.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 100, left: 60, right: 60 },
        maxZoom: 13,
        animate: !prefersReducedMotionRef.current,
      });
    },
    [allPlaces, selectPlace]
  );

  // ===== OPCIONES DE FILTROS CON CONTEOS =====
  const availableOptions = useMemo(() => {
    const validCommunities = Array.from(
      new Set(allPlaces.map((p) => p.region).filter((r) => r && r !== 'España' && r !== 'Todas'))
    ).sort();

    return {
      communities: validCommunities,
      provinces: Array.from(new Set(allPlaces.map((p) => p.province))).filter(Boolean).sort(),
      categories: Array.from(new Set(allPlaces.map((p) => p.category))).filter(Boolean),
      cities: Array.from(new Set(allPlaces.map((p) => p.city))).filter(Boolean).sort(),
    };
  }, [allPlaces]);

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      minRating: 4.7,
      maxRating: 5.0,
    });
    setMinReviews(0);
    setMaxReviews(10000);
    try {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch {
      // No crítico
    }
    router.push('/mapa');

    setTimeout(() => {
      const map = mapRef.current;
      if (map) {
        const cameraOptions = {
          center: DEFAULT_CENTER,
          zoom: window.innerWidth < 768 ? DEFAULT_ZOOM_MOBILE : DEFAULT_ZOOM_DESKTOP,
        };
        if (prefersReducedMotionRef.current) map.jumpTo(cameraOptions);
        else map.easeTo({ ...cameraOptions, duration: 600 });
      }
    }, 100);
  };

  // Calcular distancia entre dos puntos (Haversine, en km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🎯 Manejar cierre de filtros móviles (trackear búsqueda finalizada)
  const handleCloseMobileFilters = () => {
    trackEvent(EVENTS.SEARCH_FINALIZED, ANALYTICS_CATEGORIES.SEARCH, {
      category: filters.category,
      search_term: filters.searchTerm,
      community: filters.community,
      province: filters.province,
      city: filters.city,
      quality_tier: filters.qualityTier,
      reviews_range: filters.reviewsRange,
      price_level: filters.priceLevel,
      results_count: filteredPlaces.length,
      has_filters: activeFiltersCount > 0,
    });

    setMobileView('map');
  };

  // Añadir a favoritos
  const handleAddFavorite = async (placeId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: placeId }),
      });

      if (response.ok) {
        toast.success('❤️ Guardado en favoritos');
      } else if (response.status === 401) {
        toast.error('Debes iniciar sesión para guardar favoritos');
        router.push('/login');
      }
    } catch (error) {
      toast.error('Error al guardar favorito');
    }
  };

  // Registrar visita
  const handleRegisterVisit = async () => {
    if (!selectedPlace) return;

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: selectedPlace.id,
          notes: visitNotes,
          rating: visitRating > 0 ? visitRating : null,
        }),
      });

      if (response.ok) {
        toast.success('✅ Visita registrada');
        setShowVisitModal(false);
        setVisitNotes('');
        setVisitRating(0);
      } else {
        const data = await response.json();
        if (response.status === 401) {
          toast.error('Debes iniciar sesión para registrar visitas');
          router.push('/login');
        } else {
          toast.error(data.error || 'Error al registrar visita');
        }
      }
    } catch (error) {
      toast.error('Error al registrar visita');
    }
  };

  // Ordenar lugares según el criterio seleccionado
  const sortedPlaces = useMemo(() => {
    return [...filteredPlaces].sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      } else if (sortBy === 'reviews') {
        return (b.review_count || 0) - (a.review_count || 0);
      } else if (sortBy === 'proximity' && userLocation) {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      }
      return 0;
    });
  }, [filteredPlaces, sortBy, userLocation]);

  // 🎯 La lista muestra máximo 50 cards; el mapa muestra el set filtrado completo vía clusters
  const DISPLAY_LIMIT = 50;
  const displayedPlaces = useMemo(() => {
    return sortedPlaces.slice(0, DISPLAY_LIMIT);
  }, [sortedPlaces]);

  // Handlers para mobile view
  const handleMobileViewChange = (view: 'map' | 'filters' | 'list') => {
    setMobileView(view);
  };

  // Contar filtros activos
  const activeFiltersCount = [
    filters.community,
    filters.province,
    filters.city,
    filters.category,
    filters.qualityTier?.length,
    filters.reviewsRange,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] overflow-hidden">
      {/* Modal Promocional de Rutas */}
      <RoutePromoModal />

      <div className="flex-1 flex overflow-hidden relative pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {/* Overlay de Login para usuarios no autenticados */}
        {!authLoading && !user && <LoginOverlay feature="mapa" />}

        {/* SIDEBAR DE FILTROS - Desktop */}
        <aside className="hidden md:block md:w-72 lg:w-80 bg-white border-r border-gray-200 overflow-hidden">
          <FiltrosMapa
            filters={filters}
            onFiltersChange={setFilters}
            minReviews={minReviews}
            onMinReviewsChange={setMinReviews}
            loading={loading}
            totalResultados={filteredPlaces.length}
            availableOptions={availableOptions}
            onClear={clearFilters}
            activeCount={activeFiltersCount}
          />
        </aside>

        {/* MAPA */}
        <div className="flex-1 relative">
          {/* Recuento, diamante y leyenda son independientes: abrir la leyenda no ensancha el badge */}
          <div className="absolute top-3 left-3 z-10 w-max whitespace-nowrap bg-white/90 backdrop-blur-md rounded-full shadow-lg ring-1 ring-gray-900/5 px-3 py-1.5">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <span className="text-primary font-bold tabular-nums">{loading ? '…' : filteredPlaces.length}</span>
              {filteredPlaces.length === 1 ? 'lugar' : 'lugares'}
              {filters.community && (
                <span className="text-xs text-gray-500 font-normal truncate">· {filters.community}</span>
              )}
              {loading && (
                <span className="inline-flex animate-spin rounded-full h-3 w-3 border-2 border-primary-200 border-t-primary" />
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsLegendExpanded((v) => !v)}
            className="absolute top-14 left-3 z-10 flex bg-white/90 backdrop-blur-md rounded-full shadow-lg ring-1 ring-gray-900/5 w-11 h-11 items-center justify-center"
            aria-label="Leyenda de tier"
          >
            <span className="text-lg" aria-hidden>💎</span>
          </button>

          {isLegendExpanded && (
            <div className="absolute top-[6.75rem] left-3 z-30 bg-white/95 backdrop-blur-md shadow-lg rounded-2xl p-3 ring-1 ring-gray-900/5 w-56">
              <p className="text-xs font-semibold text-gray-900 mb-2">Leyenda de calidad</p>
              <div className="space-y-1.5">
                {(Object.entries(QUALITY_TIERS) as [QualityTier, typeof QUALITY_TIERS[QualityTier]][])
                  .filter(([tier]) => tier !== 'none')
                  .map(([tier, config]) => (
                    <div key={tier} className="flex items-start gap-2">
                      <span className="text-base shrink-0">{config.icon}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-gray-900 leading-tight">{config.name}</p>
                        <p className="text-[11px] text-gray-500 leading-tight">{config.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 right-14 md:top-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-80 z-30 pointer-events-none">
            <div className="flex justify-end md:block">
              {!openMobileSearch && !geoQuery ? (
                <button
                  type="button"
                  onClick={() => setOpenMobileSearch(true)}
                  className="md:hidden pointer-events-auto w-11 h-11 bg-white/90 backdrop-blur-md rounded-full shadow-lg ring-1 ring-gray-900/5 flex items-center justify-center"
                  aria-label="Buscar"
                >
                  <Search className="w-5 h-5 text-gray-700" />
                </button>
              ) : null}
              <div className={`relative pointer-events-auto ${openMobileSearch || geoQuery ? 'block w-full' : 'hidden md:block'}`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="¿A dónde ir?"
                  value={geoQuery}
                  onChange={(e) => {
                    setGeoQuery(e.target.value);
                    setShowGeoSuggestions(true);
                  }}
                  onFocus={() => {
                    setOpenMobileSearch(true);
                    setShowGeoSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowGeoSuggestions(false);
                      if (!geoQuery) setOpenMobileSearch(false);
                    }, 150);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 text-sm bg-white/90 backdrop-blur-md border-0 rounded-full shadow-lg ring-1 ring-gray-900/5 focus:ring-2 focus:ring-primary"
                />
                {geoQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeoQuery('');
                      setShowGeoSuggestions(false);
                      setOpenMobileSearch(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
                    aria-label="Limpiar"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
                {showGeoSuggestions && geoSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl ring-1 ring-gray-900/5 overflow-hidden z-[10001]">
                    {geoSuggestions.map((suggestion, i) => (
                      <button
                        key={`${suggestion.type}-${suggestion.label}-${i}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleGeoSuggestionSelect(suggestion);
                          setOpenMobileSearch(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                      >
                        <MapPin className={`h-4 w-4 shrink-0 ${suggestion.type === 'city' ? 'text-primary' : 'text-gray-400'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{suggestion.label}</p>
                          <p className="text-xs text-gray-500 truncate">{suggestion.sublabel}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={isGeolocationActive ? deactivateGeolocation : activateGeolocation}
            className={`absolute left-3 bottom-[calc(8.25rem+env(safe-area-inset-bottom,0px))] md:left-1/2 md:-translate-x-1/2 md:bottom-20 p-3 md:px-4 md:py-2 rounded-full shadow-lg font-semibold transition-all z-30 flex items-center md:gap-2 ${
              isGeolocationActive ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label={isGeolocationActive ? 'GPS activo' : 'Ver ubicación'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden md:inline text-sm">{isGeolocationActive ? 'GPS Activo' : 'Ver ubicación'}</span>
          </button>

          {geolocationError && (
            <button
              type="button"
              onClick={() => setGeolocationError(null)}
              className="absolute left-3 z-30 bottom-[calc(12rem+env(safe-area-inset-bottom,0px))] md:left-1/2 md:-translate-x-1/2 md:bottom-32 bg-amber-50 text-amber-900 px-2 py-1 rounded-md shadow-md text-[11px] max-w-[220px] text-center"
            >
              {geolocationError}
            </button>
          )}

          <div className="h-full w-full relative">
            <div ref={mapDivRef} className="h-full w-full" />

            {loading && (
              <div className="absolute inset-0 z-30 flex items-center justify-center px-4 pointer-events-none">
                <div className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-3xl shadow-lg ring-1 ring-gray-900/5 px-7 py-8 max-w-[22rem] w-full text-center">
                  <div className="absolute inset-x-0 top-0 h-1 bg-secondary" />
                  <p className="text-4xl mb-3" aria-hidden>💎</p>
                  <h2 className="text-[1.45rem] leading-tight font-bold text-gray-900 mb-2">
                    Cargando los mejores sitios
                  </h2>
                  <p className="text-gray-600 text-[13.5px] leading-relaxed mb-5">
                    Lugares con 4.7★ o más en toda España.
                  </p>
                  {allPlaces.length > 0 && (
                    <p className="text-xs font-medium text-gray-400 mb-3 tabular-nums">
                      {allPlaces.length.toLocaleString('es-ES')} lugares encontrados
                    </p>
                  )}
                  <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 w-1/3 rounded-full bg-secondary animate-[cc-bar-slide_1.2s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            )}

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
          </div>

          {/* Ficha ÚNICA anclada al pin: se pinta dentro del globo de MapLibre */}
          {selectedPlace && popupNode && (() => {
            const tier = calculateQualityTier(selectedPlace.rating, selectedPlace.review_count || 0);
            const tierInfo = getTierInfo(tier);
            const distance = userLocation
              ? calculateDistance(userLocation.lat, userLocation.lng, selectedPlace.latitude, selectedPlace.longitude)
              : null;

            return createPortal(
              (
                <div className="w-80 max-w-[88vw] relative">
                  {/* Botón cerrar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlace(null);
                      // Limpiar parámetro place de la URL si existe
                      if (searchParams.get('place')) {
                        router.push('/mapa', { scroll: false });
                      }
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

                  <div className="p-4">
                    {/* Nombre y rating */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base text-gray-900 leading-tight mb-1">
                          {selectedPlace.name}
                        </h4>
                        <PlaceRatingLine
                          rating={selectedPlace.rating}
                          reviews={getReviewCount(selectedPlace)}
                        />
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
                        {CATEGORIES[selectedPlace.category as keyof typeof CATEGORIES] || selectedPlace.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${tierInfo.color} text-white`}>
                        {tierInfo.name}
                      </span>
                    </div>

                    {/* Botones principales */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button
                        size="sm"
                        onClick={() => router.push(getPlaceUrl(selectedPlace.category, selectedPlace.province, selectedPlace.slug))}
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

                    {/* Botones de acción de usuario */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFavorite(selectedPlace.id)}
                        className="w-full hover:bg-pink-50 hover:border-pink-500 hover:text-pink-700"
                      >
                        <Heart className="h-3.5 w-3.5 mr-1" />
                        Favorito
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowVisitModal(true)}
                        className="w-full hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Visita
                      </Button>
                    </div>
                  </div>
                </div>
              ),
              popupNode
            );
          })()}
        </div>

        {/* PANEL LATERAL DERECHO - Lista de Lugares - Desktop */}
        <div className="hidden md:block md:w-80 lg:w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-4">
              {/* Header */}
              <div className="mb-4 sticky top-0 bg-white pb-2 border-b z-10">
                <div className="mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Lugares Encontrados</h3>
                    <p className="text-sm text-gray-600">{filteredPlaces.length} resultados</p>

                    {/* 🎯 Límite visual de 50 lugares */}
                    {filteredPlaces.length > DISPLAY_LIMIT && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <span className="font-semibold">Mostrando {DISPLAY_LIMIT} de {filteredPlaces.length} lugares</span>
                          <br />
                          Usa los filtros para refinar tu búsqueda
                        </p>
                      </div>
                    )}
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
                    <option value="proximity" disabled={!isGeolocationActive}>
                      📍 Proximidad {!isGeolocationActive && '(requiere ubicación)'}
                    </option>
                  </select>
                  {sortBy === 'proximity' && !isGeolocationActive && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Activa tu ubicación para ordenar por proximidad
                    </p>
                  )}
                </div>
              </div>

              {/* Lista de lugares */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-gray-600">Cargando lugares...</p>
                </div>
              ) : displayedPlaces.length > 0 ? (
                displayedPlaces.map((place) => {
                  const tier = calculateQualityTier(place.rating, place.review_count || 0);
                  const tierInfo = getTierInfo(tier);

                  const distance = userLocation
                    ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                    : null;

                  return (
                    <div
                      key={place.id}
                      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white"
                      onClick={() => selectPlace(place, 'list_card')}
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
                          <PlaceRatingLine
                            rating={place.rating}
                            reviews={getReviewCount(place)}
                          />
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
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                          {CATEGORIES[place.category as keyof typeof CATEGORIES] || place.category}
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
                            router.push(`/${place.category}/${place.province}/${place.slug}`);
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
                            window.open(
                              place.google_maps_url ||
                              `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`,
                              '_blank'
                            );
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
                  <Filter className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No hay lugares que coincidan con los filtros</p>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Modal Registrar Visita */}
      {showVisitModal && selectedPlace && (() => {
        const tier = calculateQualityTier(selectedPlace.rating, selectedPlace.review_count || 0);
        const tierInfo = getTierInfo(tier);

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Registrar Visita</h3>
                <button
                  onClick={() => {
                    setShowVisitModal(false);
                    setVisitNotes('');
                    setVisitRating(0);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre del lugar */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{tierInfo.icon}</span>
                    <h4 className="font-semibold text-gray-900">{selectedPlace.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{selectedPlace.city}, {selectedPlace.province}</p>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    ¿Cómo fue tu experiencia? (Opcional)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setVisitRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= visitRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Notas personales (Opcional)
                  </label>
                  <textarea
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder="¿Qué tal fue? ¿Volverías? Tus impresiones..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowVisitModal(false);
                      setVisitNotes('');
                      setVisitRating(0);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRegisterVisit}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Registrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* BOTTOM NAVIGATION - Solo móvil */}
      <BottomNavigation
        activeView={mobileView}
        onViewChange={handleMobileViewChange}
        filtersCount={activeFiltersCount}
        placesCount={filteredPlaces.length}
      />

      {/* BOTTOM SHEET - Filtros Mobile */}
      <BottomSheet
        isOpen={mobileView === 'filters'}
        onClose={handleCloseMobileFilters}
        title="Filtros"
        height="full"
      >
        <FiltrosMapa
          filters={filters}
          onFiltersChange={setFilters}
          minReviews={minReviews}
          onMinReviewsChange={setMinReviews}
          loading={loading}
          totalResultados={filteredPlaces.length}
          availableOptions={availableOptions}
          onClear={clearFilters}
          onClose={handleCloseMobileFilters}
          activeCount={activeFiltersCount}
        />
      </BottomSheet>

      {/* BOTTOM SHEET - Lista de Lugares Mobile */}
      <BottomSheet
        isOpen={mobileView === 'list'}
        onClose={() => setMobileView('map')}
        title={`${filteredPlaces.length} Lugares`}
        height="full"
      >
        <div className="space-y-3 py-2">
          {/* Selector de ordenamiento móvil */}
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
              <option value="proximity" disabled={!isGeolocationActive}>
                📍 Proximidad {!isGeolocationActive && '(requiere ubicación)'}
              </option>
            </select>
          </div>

          {/* 🎯 Límite visual móvil */}
          {!loading && filteredPlaces.length > DISPLAY_LIMIT && (
            <div className="mx-4 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 text-center">
                <span className="font-semibold">Mostrando {DISPLAY_LIMIT} de {filteredPlaces.length} lugares</span>
                <br />
                Usa los filtros para refinar tu búsqueda
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : displayedPlaces.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron lugares
            </div>
          ) : (
            displayedPlaces.map((place) => {
              const tier = calculateQualityTier(place.rating, place.review_count || 0);
              const tierInfo = getTierInfo(tier);

              const distance = userLocation
                ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                : null;

              return (
                <div
                  key={place.id}
                  className="border rounded-xl p-3 hover:shadow-md transition cursor-pointer bg-white"
                  onClick={() => {
                    // Misma fuente de verdad que el click en el pin
                    setMobileView('map');
                    selectPlace(place, 'list_card_mobile');
                  }}
                >
                  {/* Foto del lugar */}
                  {(() => {
                    const photoUrl = getPlacePhotoUrl(place, 0);
                    return photoUrl ? (
                      <div className="mb-3 -mx-3 -mt-3 relative">
                        <img
                          src={photoUrl}
                          alt={place.name}
                          className="w-full h-32 object-cover rounded-t-xl"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
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
                      <h4 className="font-semibold text-base text-gray-900 leading-tight mb-1 line-clamp-1">
                        {place.name}
                      </h4>
                      <PlaceRatingLine
                        rating={place.rating}
                        reviews={getReviewCount(place)}
                      />
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
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                      {CATEGORIES[place.category as keyof typeof CATEGORIES] || place.category}
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
                        router.push(`/${place.category}/${place.province}/${place.slug}`);
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
                        window.open(
                          place.google_maps_url ||
                          `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`,
                          '_blank'
                        );
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
  );
}
