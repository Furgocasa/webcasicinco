'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useMap } from '@/lib/contexts/MapContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Search, 
  X, 
  MapPin, 
  Star, 
  SlidersHorizontal,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  Heart,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import BottomSheet from '@/components/mobile/BottomSheet';
import LoginOverlay from '@/components/auth/LoginOverlay';
import type { PlaceWithTier, PlaceFilters, QualityTier, ReviewsRange } from '@/types/filters';
import { calculateQualityTier, getTierMarkerColor, getTierInfo } from '@/lib/utils/tier-calculator';
import { trackEvent, EVENTS, CATEGORIES as ANALYTICS_CATEGORIES } from '@/lib/analytics/tracker';
import { 
  QUALITY_TIERS, 
  REVIEWS_RANGES, 
  PRICE_LEVELS, 
  COMMUNITIES,
  getNumbersFromReviewsRange 
} from '@/types/filters';
import { PROVINCES, CATEGORIES } from '@/lib/utils/constants';
import { toast } from 'sonner';
import { getPlacesFromCache, savePlacesToCache } from '@/lib/utils/places-cache';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';

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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Centro de España para vista inicial (más al norte para mejor vista móvil)
const defaultCenter = {
  lat: 40.5,  // ✅ Subido para mejor vista del norte en móvil
  lng: -3.7038,  // Madrid
};

// Límites del mapa para península ibérica (mejor UX móvil)
const SPAIN_BOUNDS_PENINSULA = {
  north: 43.8,    // Norte de España (Costa Vasca)
  south: 36.0,    // Sur de Andalucía (Tarifa)
  west: -9.5,     // Galicia (Cabo Finisterre)
  east: 3.5,      // Cataluña/Girona
};

// Límites completos incluyendo Canarias y Baleares (para desktop)
const SPAIN_BOUNDS_FULL = {
  north: 46.0,    // Más margen para centrar el norte (Galicia, Asturias, País Vasco)
  south: 26.0,    // Más margen para centrar Canarias (El Hierro)
  west: -18.5,    // Oeste de Canarias (La Palma)
  east: 4.5,      // Este de Baleares (Menorca)
};

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const isUserInteractingRef = useRef(false); // 🔧 Nuevo: rastrear si el usuario está moviendo el mapa manualmente

  // Establecer título de la página
  useEffect(() => {
    document.title = 'Mapa de Lugares | Casi Cinco';
  }, []);

  // ✅ Detectar si es móvil para ajustar límites del mapa
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ OPTIMIZACIÓN: Usar contexto del mapa (ahorro 66% en navegaciones)
  const { isLoaded, loadError } = useMap();

  // State
  const [allPlaces, setAllPlaces] = useState<PlaceWithTier[]>([]); // TODOS los lugares
  const [filteredPlaces, setFilteredPlaces] = useState<PlaceWithTier[]>([]); // Lugares que cumplen filtros
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showPlacesList, setShowPlacesList] = useState(true);
  const [mapReady, setMapReady] = useState(false); // ✅ Nuevo: saber cuándo el mapa está listo
  const [isMobile, setIsMobile] = useState(false); // ✅ Detectar dispositivo móvil
  
  // Vista móvil: 'map', 'filters', 'list'
  const [mobileView, setMobileView] = useState<'map' | 'filters' | 'list'>('map');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(6.2); // Zoom enfocado en península con mejor vista del norte
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');
  const [visitRating, setVisitRating] = useState(0);

  // Geolocalización
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeolocationActive, setIsGeolocationActive] = useState(false); // ✅ Siempre false inicialmente (sin hidratación)
  const [shouldReactivateGeo, setShouldReactivateGeo] = useState(false); // Flag para reactivar geo después de definir la función
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  
  // ✅ Recuperar flag de localStorage al montar (sin hidratar)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('geolocationActive') === 'true';
      if (saved) {
        setShouldReactivateGeo(true);
      }
    }
  }, []);

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
    qualityTier: searchParams.get('qualityTier')?.split(',') as QualityTier[] || undefined,
    searchTerm: searchParams.get('q') || undefined,
  });
  
  // 🚀 OPTIMIZACIÓN: Debounce para búsqueda (espera 500ms antes de aplicar)
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

  // Rango de reseñas con slider
  const [minReviews, setMinReviews] = useState(0);
  const [maxReviews, setMaxReviews] = useState(10000);

  // 🚀 CARGA CON CACHE: Primero intenta cache (24h), luego API
  const loadPlaces = async () => {
    setLoading(true);
    let loadedPlaces: PlaceWithTier[] = [];
    
    try {
      // 1️⃣ INTENTAR CARGAR DESDE CACHE (IndexedDB - 24 horas)
      console.log('📦 Intentando cargar desde cache...');
      const cachedPlaces = await getPlacesFromCache();
      
      if (cachedPlaces && cachedPlaces.length > 0) {
        // ✅ CACHE HIT: Usar datos cacheados
        loadedPlaces = cachedPlaces;
        setAllPlaces(loadedPlaces);
        setLoading(false);
        console.log(`✅ ${loadedPlaces.length} lugares cargados desde cache (instantáneo)`);
        return; // Terminar aquí, no cargar desde API
      }
      
      // 2️⃣ CACHE MISS: Cargar desde API
      console.log('🔄 Cache no disponible, cargando desde API...');
      
      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;
      
      while (hasMore) {
        try {
          // ✅ OPTIMIZACIÓN: fields=light reduce payload 80% (evita error 413)
          const response = await fetch(`/api/places?limit=${batchSize}&offset=${offset}&fields=light`);
          
          // ✅ Verificar error 413 (Payload Too Large)
          if (!response.ok) {
            if (response.status === 413) {
              console.error('❌ Error 413: Payload demasiado grande');
              toast.error('Error cargando lugares. Intenta recargar.');
              hasMore = false;
              break;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.places && data.places.length > 0) {
            loadedPlaces = [...loadedPlaces, ...data.places];
            offset += batchSize;
            
            // Si recibimos menos del tamaño del lote, ya no hay más
            if (data.places.length < batchSize) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } catch (batchError) {
          // Si falla un lote pero ya tenemos datos, continuar
          console.error(`❌ Error en lote offset ${offset}:`, batchError);
          
          // Mostrar error al usuario si no hay datos cargados
          if (loadedPlaces.length === 0) {
            toast.error('Error cargando lugares. Revisa tu conexión.');
          }
          
          hasMore = false;
        }
      }
      
      // 3️⃣ GUARDAR EN CACHE para próximas visitas
      if (loadedPlaces.length > 0) {
        setAllPlaces(loadedPlaces);
        
        // Guardar en IndexedDB (asíncrono, no bloquea)
        savePlacesToCache(loadedPlaces).catch(err => {
          console.warn('⚠️ Error guardando en cache (no crítico):', err);
        });
        
        console.log(`✅ ${loadedPlaces.length} lugares cargados desde API y guardados en cache`);
      } else {
        console.warn('⚠️ No se encontraron lugares');
      }
    } catch (error) {
      // Error crítico - solo mostrar toast si NO hay datos cargados
      console.error('❌ Error crítico:', error);
      if (loadedPlaces.length === 0) {
        toast.error('Error cargando lugares. Recarga la página.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros en el cliente
  const applyClientSideFilters = useCallback((placesToFilter: PlaceWithTier[]) => {
    let filtered = placesToFilter;
    console.log(`🔍 Aplicando filtros. Total lugares: ${placesToFilter.length}`);
    console.log(`   - Filtros activos:`, { 
      community: filters.community, 
      province: filters.province, 
      city: filters.city,
      category: filters.category,
      minReviews, 
      maxReviews,
      qualityTier: filters.qualityTier 
    });

    // Filtro de comunidad
    if (filters.community) {
      filtered = filtered.filter(p => p.region === filters.community);
      console.log(`   - Después de filtro comunidad: ${filtered.length}`);
    }

    // Filtro de provincia
    if (filters.province) {
      filtered = filtered.filter(p => p.province === filters.province);
    }

    // Filtro de ciudad (búsqueda PARCIAL, case-insensitive) 🔍
    if (filters.city && filters.city.trim()) {
      const cityTerm = filters.city.toLowerCase().trim();
      
      filtered = filtered.filter(p => {
        const cityName = p.city?.toLowerCase() || '';
        // Búsqueda parcial: "murci" encuentra "Murcia"
        const cityMatch = cityName.includes(cityTerm);
        
        // Si hay filtro de provincia seleccionado, verificar que coincida
        if (filters.province && cityMatch) {
          return p.province === filters.province;
        }
        
        return cityMatch;
      });
      console.log(`   - Filtro ciudad (búsqueda parcial) "${cityTerm}": ${filtered.length}`);
    }

    // Filtro de categoría
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Filtro de rating
    if (filters.minRating) {
      filtered = filtered.filter(p => p.rating >= filters.minRating!);
    }
    if (filters.maxRating) {
      filtered = filtered.filter(p => p.rating <= filters.maxRating!);
    }

    // Filtro de precio
    if (filters.priceLevel) {
      filtered = filtered.filter(p => p.price_level === filters.priceLevel);
    }

    // Filtro de Tier de Calidad - CALCULAR DINÁMICAMENTE
    if (filters.qualityTier && filters.qualityTier.length > 0) {
      filtered = filtered.filter(p => {
        const tier = calculateQualityTier(p.rating, p.review_count || 0);
        return filters.qualityTier!.includes(tier);
      });
    }

    // Filtro de rango de reseñas con slider
    const beforeReviewsFilter = filtered.length;
    filtered = filtered.filter(p => {
      const count = p.review_count || 0;
      return count >= minReviews && count <= maxReviews;
    });
    console.log(`   - Filtro reseñas (${minReviews}-${maxReviews}): ${beforeReviewsFilter} → ${filtered.length}`);

    // Filtro de búsqueda - 🚀 USA debouncedSearchTerm en vez del filtro directo
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.address?.toLowerCase().includes(term)
      );
    }

    console.log(`✅ Total filtrados final: ${filtered.length}`);
    setFilteredPlaces(filtered);
  }, [filters, minReviews, maxReviews, debouncedSearchTerm]);

  // 🚀 AUTO-ZOOM: Ajustar mapa cuando cambien los filtros (IGNORA ubicación del usuario)
  useEffect(() => {
    if (!mapRef.current || filteredPlaces.length === 0) return;

    // NO aplicar auto-zoom si viene con ?place=ID (desde chatbot o enlace directo)
    const placeIdFromUrl = searchParams.get('place');
    if (placeIdFromUrl) {
      console.log('⏸️ Auto-zoom de filtros desactivado - modo lugar específico');
      return;
    }
    
    // 🔧 NO aplicar auto-zoom si el usuario está moviendo el mapa manualmente
    if (isUserInteractingRef.current) {
      console.log('⏸️ Auto-zoom de filtros desactivado - usuario interactuando con el mapa');
      return;
    }

    // Detectar si hay filtros activos
    const hasActiveFilters = filters.community || filters.province || filters.city || 
                             filters.category || filters.qualityTier?.length || 
                             debouncedSearchTerm || minReviews > 0 || maxReviews < 10000;

    // Delay para que no se ejecute mientras se está ajustando
    const timer = setTimeout(() => {
      if (hasActiveFilters && filteredPlaces.length > 0 && filteredPlaces.length < allPlaces.length) {
        // HAY FILTROS: Hacer zoom PERFECTO solo a los lugares filtrados (NO incluir ubicación usuario)
        const bounds = new google.maps.LatLngBounds();
        
        // Incluir SOLO los lugares filtrados con coordenadas válidas
        let validPlaces = 0;
        filteredPlaces.forEach(place => {
          // Validar que las coordenadas sean válidas para España
          if (place.latitude && place.longitude &&
              place.latitude >= 27 && place.latitude <= 44 &&
              place.longitude >= -18 && place.longitude <= 5) {
            bounds.extend({ lat: place.latitude, lng: place.longitude });
            validPlaces++;
          } else {
            console.warn(`⚠️ Coordenadas inválidas: ${place.name} (${place.latitude}, ${place.longitude})`);
          }
        });
        
        if (validPlaces > 0 && mapRef.current) {
          // Calcular padding dinámico según paneles
          const leftPadding = showFilters ? 400 : 20;
          const rightPadding = showPlacesList ? 400 : 20;
          
          // Ajustar bounds con padding - CENTRADO EN LOS LUGARES
          mapRef.current.fitBounds(bounds, {
            top: 50,
            bottom: 100,
            left: leftPadding,
            right: rightPadding,
          });
          
          console.log(`🔍 Zoom centrado en ${validPlaces} lugares válidos de ${filteredPlaces.length} total`);
        }
      } else if (!hasActiveFilters && filteredPlaces.length === allPlaces.length && mapRef.current) {
        // SIN FILTROS: Restaurar vista de España (península centrada)
        mapRef.current.setCenter(defaultCenter);
        mapRef.current?.setZoom(6);
        console.log(`🗺️ Zoom restaurado a vista de España`);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filteredPlaces, filters, minReviews, maxReviews, debouncedSearchTerm, showFilters, showPlacesList, allPlaces]);

  // 🚀 OPTIMIZACIÓN: Calcular opciones con useMemo para evitar recalcular constantemente
  const availableOptions = useMemo(() => {
    // Debug: Ver todas las regiones sin filtrar
    const allRegions = allPlaces.map(p => p.region);
    const uniqueRegions = Array.from(new Set(allRegions));
    console.log('🔍 DEBUG: Regiones únicas encontradas (sin filtrar):', uniqueRegions);
    console.log('🔍 DEBUG: Total de lugares:', allPlaces.length);
    
    // Filtrar comunidades válidas
    const validCommunities = Array.from(new Set(
      allPlaces
        .map(p => p.region)
        .filter(r => r && r !== 'España' && r !== 'Todas')
    )).sort();
    
    console.log('✅ Comunidades válidas después de filtrar:', validCommunities);
    
    return {
      communities: validCommunities,
      provinces: Array.from(new Set(allPlaces.map(p => p.province))).filter(Boolean).sort(),
      categories: Array.from(new Set(allPlaces.map(p => p.category))).filter(Boolean),
      cities: Array.from(new Set(allPlaces.map(p => p.city))).filter(Boolean).sort(),
    };
  }, [allPlaces]);

  useEffect(() => {
    loadPlaces();
  }, []);

  // 🔄 REVALIDACIÓN AUTOMÁTICA: Recargar cada 5 minutos
  useEffect(() => {
    const REVALIDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
    
    const interval = setInterval(async () => {
      console.log('🔄 Revalidación automática (cada 5 minutos)...');
      
      try {
        // Forzar recarga desde API (bypass cache)
        const batchSize = 1000;
        let offset = 0;
        let hasMore = true;
        let freshPlaces: PlaceWithTier[] = [];
        
        while (hasMore) {
          // ✅ OPTIMIZACIÓN: fields=light reduce payload 80%
          const response = await fetch(`/api/places?limit=${batchSize}&offset=${offset}&fields=light&t=${Date.now()}`);
          
          if (!response.ok) {
            console.error(`❌ Error HTTP ${response.status} en revalidación`);
            hasMore = false;
            break;
          }
          
          const data = await response.json();
          
          if (data.success && data.places && data.places.length > 0) {
            freshPlaces = [...freshPlaces, ...data.places];
            offset += batchSize;
            
            if (data.places.length < batchSize) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        
        if (freshPlaces.length > 0) {
          const oldCount = allPlaces.length;
          const newCount = freshPlaces.length;
          
          setAllPlaces(freshPlaces);
          savePlacesToCache(freshPlaces);
          
          if (newCount > oldCount) {
            const diff = newCount - oldCount;
            toast.success(`🆕 ${diff} lugares nuevos disponibles`, { duration: 5000 });
            console.log(`✅ Revalidación: ${newCount} lugares (${diff} nuevos)`);
          } else {
            console.log(`✅ Revalidación: ${newCount} lugares (sin cambios)`);
          }
        }
      } catch (error) {
        console.error('⚠️ Error en revalidación automática:', error);
      }
    }, REVALIDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [allPlaces.length]);

  // 🔗 Abrir lugar desde URL (ej: desde chatbot con ?place=ID)
  useEffect(() => {
    const placeIdFromUrl = searchParams.get('place');
    
    // Solo ejecutar si:
    // 1. Hay un ID en la URL
    // 2. Los lugares ya cargaron
    // 3. El mapa está listo
    // 4. NO está ya seleccionado ese mismo lugar
    if (!placeIdFromUrl || !allPlaces.length || !mapRef.current || !isLoaded) return;
    if (selectedPlace && selectedPlace.id === placeIdFromUrl) return;
    
    const placeToOpen = allPlaces.find(p => p.id === placeIdFromUrl);
    if (placeToOpen) {
      console.log(`🎯 Abriendo lugar desde URL: ${placeToOpen.name}`);
      setSelectedPlace(placeToOpen);
      
      // Centrar y hacer zoom INMEDIATAMENTE (el auto-zoom está desactivado para ?place=ID)
      mapRef.current?.setCenter({
        lat: placeToOpen.latitude,
        lng: placeToOpen.longitude
      });
      mapRef.current?.setZoom(15);
    }
  }, [allPlaces, isLoaded]); // NO incluir searchParams ni selectedPlace para evitar loops

  // 🎨 CACHE DE ICONOS: Pre-renderizar iconos una sola vez (mejora performance)
  const markerIcons = useMemo(() => {
    // ✅ CRÍTICO: Verificar que Google Maps esté cargado
    if (!isLoaded || typeof google === 'undefined' || !google.maps) {
      console.log('⏳ Google Maps aún no está listo, esperando...');
      return null;
    }

    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const markerSize = isMobile ? 28 : 36;
    const markerRadius = isMobile ? 12 : 16;
    const fontSize = isMobile ? 16 : 20;
    const grayMarkerSize = isMobile ? 18 : 24;
    const grayMarkerRadius = isMobile ? 8 : 10;
    const grayFontSize = isMobile ? 11 : 14;

    const tierColors: Record<string, string> = {
      diamond: '#93c5fd',
      platinum: '#e5e7eb',
      gold: '#fbbf24',
      silver: '#d1d5db',
      bronze: '#fb923c',
      none: '#ffffff'
    };

    const tierIcons: Record<string, string> = {
      diamond: '💎',
      platinum: '🏆',
      gold: '🥇',
      silver: '🥈',
      bronze: '🥉',
      none: '⚪'
    };

    // Pre-renderizar todos los iconos de tiers
    const icons: Record<string, any> = {};
    
    Object.keys(tierColors).forEach(tier => {
      icons[tier] = {
        url: `data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${markerSize}" height="${markerSize}" viewBox="0 0 ${markerSize} ${markerSize}">
            <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${markerRadius}" fill="${tierColors[tier]}" stroke="#d1d5db" stroke-width="2"/>
            <text x="${markerSize/2}" y="${markerSize/2 + 7}" text-anchor="middle" font-size="${fontSize}">${tierIcons[tier]}</text>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(markerSize, markerSize),
        anchor: new google.maps.Point(markerSize/2, markerSize/2),
      };

      // Iconos grises para lugares no filtrados
      icons[`${tier}_gray`] = {
        url: `data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${grayMarkerSize}" height="${grayMarkerSize}" viewBox="0 0 ${grayMarkerSize} ${grayMarkerSize}">
            <circle cx="${grayMarkerSize/2}" cy="${grayMarkerSize/2}" r="${grayMarkerRadius}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1.5" opacity="0.4"/>
            <text x="${grayMarkerSize/2}" y="${grayMarkerSize/2 + 4}" text-anchor="middle" font-size="${grayFontSize}" opacity="0.4">${tierIcons[tier]}</text>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(grayMarkerSize, grayMarkerSize),
        anchor: new google.maps.Point(grayMarkerSize/2, grayMarkerSize/2),
      };
    });

    console.log('🎨 Iconos pre-renderizados:', Object.keys(icons).length);
    return icons;
  }, [isLoaded]); // Solo recrear si cambia isLoaded

  // 🚀 CLUSTERING: Mostrar TODOS los lugares (filtrados en color, no filtrados en gris)
  useEffect(() => {
    console.log('🔄 useEffect marcadores triggered:', {
      mapReady,
      mapRef: !!mapRef.current,
      isLoaded,
      allPlacesLength: allPlaces.length,
      filteredPlacesLength: filteredPlaces.length,
      markerIconsReady: !!markerIcons,
      markerIconsCount: markerIcons ? Object.keys(markerIcons).length : 0,
      googleAvailable: typeof google !== 'undefined' && !!google.maps,
    });

    // ✅ Verificar que Google Maps esté completamente listo
    if (!mapReady) {
      console.log('⏭️ Marcadores: Esperando que el mapa se cargue (mapReady=false)');
      return;
    }
    
    if (!mapRef.current) {
      console.log('⏭️ Marcadores: mapRef no disponible (no debería pasar si mapReady=true)');
      return;
    }
    
    if (!isLoaded) {
      console.log('⏭️ Marcadores: Google Maps no cargado (isLoaded=false)');
      return;
    }
    
    if (allPlaces.length === 0) {
      console.log('⏭️ Marcadores: No hay lugares cargados aún');
      return;
    }
    
    if (!markerIcons || Object.keys(markerIcons).length === 0) {
      console.log('⏭️ Marcadores: Iconos no pre-renderizados aún');
      return;
    }
    
    if (typeof google === 'undefined' || !google.maps) {
      console.log('⚠️ Google Maps API no disponible globalmente');
      return;
    }

    console.log('✅ TODOS LOS REQUISITOS CUMPLIDOS - Creando marcadores...');

    // Ejecutar INMEDIATAMENTE (sin setTimeout)
    console.time('⏱️ Creación de marcadores');
    console.log(`📍 Creando ${allPlaces.length} marcadores (${filteredPlaces.length} filtrados)`);
      
      // Limpiar marcadores anteriores de forma eficiente
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

    // Separar marcadores filtrados y no filtrados
    const filteredIds = new Set(filteredPlaces.map(p => p.id));
    const notFilteredPlaces = allPlaces.filter(p => !filteredIds.has(p.id));
    
    // 1️⃣ Crear marcadores FILTRADOS (van al cluster) - USANDO CACHE DE ICONOS
    const filteredMarkers = filteredPlaces.map((place) => {
      const tier = calculateQualityTier(place.rating, place.review_count || 0);
      const tierInfo = getTierInfo(tier);
      
      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        icon: markerIcons[tier], // ← REUTILIZAR icono pre-renderizado
        title: `${place.name} - ${tierInfo.name}`,
        zIndex: 100,
      });

      marker.addListener('click', () => {
        handleMarkerClick(place);
      });

      return marker;
    });
    
    // 2️⃣ Crear marcadores NO FILTRADOS (grises) - USANDO CACHE DE ICONOS
    const notFilteredMarkers = notFilteredPlaces.map((place) => {
      const tier = calculateQualityTier(place.rating, place.review_count || 0);
      const tierInfo = getTierInfo(tier);
      
      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        icon: markerIcons[`${tier}_gray`], // ← REUTILIZAR icono gris pre-renderizado
        title: `${place.name} - ${tierInfo.name}`,
        zIndex: 10,
        map: mapRef.current, // Añadir directamente al mapa (SIN cluster)
      });

      marker.addListener('click', () => {
        handleMarkerClick(place);
      });

      return marker;
    });
    
    console.timeEnd('⏱️ Creación de marcadores');

    markersRef.current = [...filteredMarkers, ...notFilteredMarkers];

    // Crear o actualizar clusterer con estilo personalizado simple
    // Tamaño adaptativo para clusters
    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const clusterSize = isMobile ? 32 : 40;
    const clusterRadius = isMobile ? 14 : 18;
    const clusterFontSize = isMobile ? 10 : 12;
    
    const renderer = {
      render: ({ count, position, markers }: any) => {
        // Estilo simple y discreto
        const color = count > 100 ? "#dc2626" : count > 50 ? "#f59e0b" : count > 20 ? "#3b82f6" : "#10b981";
        
        const clusterMarker = new google.maps.Marker({
          position,
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="${clusterSize}" height="${clusterSize}" viewBox="0 0 ${clusterSize} ${clusterSize}">
                <circle cx="${clusterSize/2}" cy="${clusterSize/2}" r="${clusterRadius}" fill="${color}" opacity="0.8" stroke="white" stroke-width="2"/>
                <text x="${clusterSize/2}" y="${clusterSize/2 + 4}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${clusterFontSize}" font-weight="bold">${count}</text>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(clusterSize, clusterSize),
          },
          label: {
            text: " ",
            color: "transparent",
          },
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
        });

        // Click en cluster: hacer zoom para mostrar todos los marcadores dentro
        clusterMarker.addListener('click', () => {
          if (mapRef.current && markers && markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach((marker: any) => {
              bounds.extend(marker.getPosition()!);
            });
            mapRef.current?.fitBounds(bounds);
            
            // Limitar zoom máximo para no acercarse demasiado
            const listener = google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
              const currentZoom = mapRef.current?.getZoom();
              if (currentZoom && currentZoom > 16) {
                mapRef.current?.setZoom(16);
              }
            });
          }
        });

        return clusterMarker;
      },
    };

    // Clusterer SOLO con marcadores filtrados
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers: filteredMarkers, // SOLO los filtrados
        renderer,
      });
    } else {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(filteredMarkers); // SOLO los filtrados
    }

    console.log(`🎯 Clustering: ${filteredMarkers.length} marcadores filtrados + ${notFilteredMarkers.length} grises individuales`);

    // Cleanup: limpiar marcadores al desmontar
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, [allPlaces, filteredPlaces, isLoaded, markerIcons, mapReady]); // ✅ Agregado mapReady

  // Reactivar geolocalización si estaba activa antes
  useEffect(() => {
    if (isGeolocationActive && !userLocation && typeof window !== 'undefined' && navigator.geolocation) {
      // Si el flag está activo pero no tenemos ubicación, obtenerla automáticamente
      
      // Opciones optimizadas para todos los dispositivos
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          console.log('✅ Ubicación reactivada correctamente');
        },
        (error) => {
          console.error('Error reactivando geolocalización:', error);
          
          // Mensaje específico según el error
          let errorMsg = 'No pudimos obtener tu ubicación';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Permiso de ubicación denegado';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Tiempo agotado al obtener ubicación';
          }
          
          setGeolocationError(errorMsg);
          localStorage.setItem('geolocationActive', 'false');
          setIsGeolocationActive(false);
        },
        options
      );
    }
  }, []); // Solo ejecutar una vez al montar el componente

  // ✅ OPTIMIZACIÓN: Activar carga del mapa cuando sea necesario
  
  // ❌ ELIMINADO: useEffect duplicado (ya existe en línea 415)

  // Aplicar filtros cuando cambian (automático) - 🚀 Incluye debouncedSearchTerm
  useEffect(() => {
    if (allPlaces.length > 0) {
      applyClientSideFilters(allPlaces);
    }
  }, [allPlaces, filters, minReviews, maxReviews, debouncedSearchTerm, applyClientSideFilters]);

  // (Auto-zoom ahora se maneja arriba con detección de filtros activos)

  // Aplicar filtros (llamado desde el botón)
  const applyFilters = () => {
    applyClientSideFilters(allPlaces);
    
    // Actualizar URL
    const params = new URLSearchParams();
    if (filters.community) params.set('community', filters.community);
    if (filters.province) params.set('province', filters.province);
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.reviewsRange) params.set('reviewsRange', filters.reviewsRange);
    if (filters.qualityTier) params.set('qualityTier', filters.qualityTier.join(','));
    if (filters.searchTerm) params.set('q', filters.searchTerm);
    
    router.push(`/mapa?${params.toString()}`, { scroll: false });
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      minRating: 4.7,
      maxRating: 5.0,
    });
    setMinReviews(0);
    setMaxReviews(10000);
    router.push('/mapa');
    
    // Resetear zoom a vista de España
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.setCenter(defaultCenter);
        mapRef.current.setZoom(6); // Península centrada
        console.log('🗺️ Zoom reseteado a vista península');
      }
    }, 100);
  };

  // Activar geolocalización
  const activateGeolocation = useCallback(() => {
    // Verificar soporte del navegador
    if (!navigator.geolocation) {
      setGeolocationError('Tu navegador no soporta geolocalización');
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    // Verificar que estamos en HTTPS (requerido en iOS)
    if (typeof window !== 'undefined' && window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
      setGeolocationError('La geolocalización requiere HTTPS');
      toast.error('La geolocalización requiere una conexión segura (HTTPS)');
      return;
    }

    setGeolocationError(null);
    
    // Detectar si es móvil o desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      toast.info('📍 Solicitando tu ubicación GPS...');
    } else {
      toast.info('📍 Obteniendo ubicación aproximada (WiFi/IP)...');
    }
    
    // Opciones adaptativas: GPS en móvil, WiFi/IP en desktop
    const options = {
      enableHighAccuracy: isMobile,  // GPS solo en móviles (más preciso pero consume batería)
      timeout: isMobile ? 10000 : 5000,  // Más tiempo en móvil
      maximumAge: isMobile ? 0 : 60000   // Permitir caché de 1 min en desktop
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        // Verificar precisión de la ubicación
        const accuracy = position.coords.accuracy; // En metros
        
        setUserLocation(location);
        setIsGeolocationActive(true);
        
        // Guardar en localStorage para persistir entre recargas
        localStorage.setItem('geolocationActive', 'true');
        
        // Mensaje según precisión
        if (accuracy > 5000) {
          // Muy impreciso (> 5km) - Típico de PC con WiFi/IP
          toast.warning(`⚠️ Ubicación aproximada (±${Math.round(accuracy/1000)}km). Para mayor precisión, usa un dispositivo móvil.`);
        } else if (accuracy > 1000) {
          // Impreciso (1-5km)
          toast.success(`✅ Ubicación obtenida (±${Math.round(accuracy/1000)}km de precisión)`);
        } else {
          // Preciso (< 1km) - GPS
          toast.success('✅ Ubicación GPS activada correctamente');
        }
        
        console.log('📍 Ubicación obtenida:', {
          lat: location.lat,
          lng: location.lng,
          accuracy: `±${Math.round(accuracy)}m`,
          isMobile
        });
      },
      (error) => {
        // Mensajes de error específicos según el código
        let errorMessage = 'No pudimos obtener tu ubicación';
        let toastMessage = '';
        let helpText = '';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            toastMessage = '❌ Permiso denegado';
            if (isMobile) {
              helpText = 'Safari/Chrome → Configuración del sitio → Permitir ubicación';
            } else {
              helpText = 'Click en el candado 🔒 → Permisos del sitio → Ubicación → Permitir';
            }
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            toastMessage = '❌ Ubicación no disponible';
            helpText = 'Verifica que GPS/WiFi estén activos';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo agotado';
            toastMessage = '❌ Tiempo agotado (tardó > 10s)';
            helpText = 'Intenta de nuevo, asegúrate de tener buena señal';
            break;
          default:
            errorMessage = 'Error al obtener ubicación';
            toastMessage = '❌ Error desconocido';
        }
        
        setGeolocationError(errorMessage + (helpText ? ` - ${helpText}` : ''));
        toast.error(toastMessage + (helpText ? `\n${helpText}` : ''));
        
        console.error('❌ Error de geolocalización:', {
          code: error.code,
          message: error.message,
          userAgent: navigator.userAgent,
          isMobile,
          isHTTPS: window.location.protocol === 'https:'
        });
        
        // Si falla, limpiar el flag
        localStorage.setItem('geolocationActive', 'false');
        setIsGeolocationActive(false);
      },
      options // ✅ Opciones adaptativas según dispositivo
    );
  }, []); // ✅ useCallback sin dependencias para que sea estable

  // ✅ Reactivar geolocalización si el flag está activo (ejecuta después de que activateGeolocation esté definido)
  useEffect(() => {
    if (shouldReactivateGeo) {
      activateGeolocation();
      setShouldReactivateGeo(false); // Resetear flag
    }
  }, [shouldReactivateGeo, activateGeolocation]);

  // Desactivar geolocalización
  const deactivateGeolocation = () => {
    setUserLocation(null);
    setIsGeolocationActive(false);
    setGeolocationError(null);
    
    // Guardar en localStorage que está desactivado
    localStorage.setItem('geolocationActive', 'false');
    
    // Si estaba ordenando por proximidad, cambiar a reseñas
    if (sortBy === 'proximity') {
      setSortBy('reviews');
    }
  };

  // Calcular distancia entre dos puntos (en km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Manejar click en marcador
  const handleMarkerClick = (place: PlaceWithTier) => {
    // 🎯 Trackear click en marcador del mapa
    trackEvent(EVENTS.PLACE_VIEW, ANALYTICS_CATEGORIES.PLACE, {
      place_id: place.id,
      place_name: place.name,
      place_category: place.category,
      place_city: place.city,
      place_rating: place.rating,
      source: 'map_marker'
    });
    
    // Primero centrar el mapa en el lugar
    if (mapRef.current) {
      mapRef.current.panTo({ lat: place.latitude, lng: place.longitude });
    }
    
    // Luego mostrar la card
    setTimeout(() => {
      setSelectedPlace(place);
    }, 300);
  };

  // 🎯 Manejar cierre de filtros móviles (trackear búsqueda finalizada)
  const handleCloseMobileFilters = () => {
    // Trackear búsqueda finalizada con todos los filtros aplicados
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
      has_filters: activeFiltersCount > 0
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

  // Obtener color del marcador según rating
  const getMarkerColor = (rating: number) => {
    if (rating >= 4.9) return '#10b981'; // Verde brillante
    if (rating >= 4.8) return '#06b6d4'; // Cyan
    return '#3b82f6'; // Azul
  };

  // Ordenar lugares según el criterio seleccionado usando useMemo
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

  // 🎯 OPTIMIZACIÓN: Limitar vista de lista a 50 lugares máximo
  // El mapa sigue mostrando todos, solo la lista lateral se limita para mejor rendimiento
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

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Error cargando el mapa</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 flex overflow-hidden relative pb-16 md:pb-0">
        {/* Overlay de Login para usuarios no autenticados */}
        {!authLoading && !user && <LoginOverlay feature="mapa" />}
        
        {/* SIDEBAR DE FILTROS - Desktop */}
        <div 
          className={`hidden md:block ${
            showFilters ? 'w-96' : 'w-0'
          } transition-all duration-300 bg-white border-r border-gray-200 overflow-y-auto`}
        >
          {showFilters && (
            <div className="p-6 space-y-6">
              {/* Header de filtros */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Búsqueda rápida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre, ciudad..."
                    value={filters.searchTerm || ''}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Comunidad Autónoma */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Comunidad Autónoma
                </label>
                {loading ? (
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded-lg"></div>
                ) : (
                  <select
                    value={filters.community || ''}
                    onChange={(e) => setFilters({ ...filters, community: e.target.value || undefined, province: undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {availableOptions.communities.map((community) => (
                      <option key={community} value={community}>
                        {community}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {loading ? '...' : `${availableOptions.communities.length} disponibles`}
                </p>
              </div>

              {/* Provincia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Provincia
                </label>
                {loading ? (
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded-lg"></div>
                ) : (
                  <select
                    value={filters.province || ''}
                    onChange={(e) => setFilters({ ...filters, province: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {availableOptions.provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {loading ? '...' : `${availableOptions.provinces.length} disponibles`}
                </p>
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Málaga, Marbella, San Pedro..."
                  value={filters.city || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters({ ...filters, city: value || undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {filters.city && (
                  <p className="text-xs text-gray-600 mt-1">
                    Filtrando por: "{filters.city}"
                  </p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Categoría
                </label>
                {loading ? (
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded-lg"></div>
                ) : (
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {availableOptions.categories.map((category) => (
                      <option key={category} value={category}>
                        {CATEGORIES[category as keyof typeof CATEGORIES] || category}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {loading ? '...' : `${availableOptions.categories.length} disponibles`}
                </p>
              </div>

              {/* TIER DE CALIDAD - LO MÁS IMPORTANTE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  💎 Tier de Calidad
                </label>
                <div className="space-y-2">
                  {(Object.entries(QUALITY_TIERS) as [QualityTier, typeof QUALITY_TIERS[QualityTier]][]).map(([tier, config]) => {
                    if (tier === 'none') return null;
                    
                    const isSelected = filters.qualityTier?.includes(tier);
                    
                    return (
                      <label
                        key={tier}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newTiers = e.target.checked
                              ? [...(filters.qualityTier || []), tier]
                              : (filters.qualityTier || []).filter(t => t !== tier);
                            setFilters({ ...filters, qualityTier: newTiers.length > 0 ? newTiers : undefined });
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{config.icon}</span>
                            <span className="font-semibold text-gray-900">{config.name}</span>
                          </div>
                          <p className="text-xs text-gray-600">{config.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* NÚMERO DE RESEÑAS - SLIDER CON VISUAL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📊 Número de Reseñas
                </label>
                <div className="space-y-4">
                  {/* Indicador visual */}
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-indigo-600">{minReviews === 0 ? 'Todas' : `Desde ${minReviews}`}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-indigo-600">{maxReviews >= 10000 ? '∞' : `hasta ${maxReviews}`}</span>
                  </div>
                  
                  {/* Barra visual con degradado */}
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-200"
                      style={{ 
                        left: `${(minReviews / 1000) * 100}%`,
                        right: `${100 - (maxReviews >= 10000 ? 100 : (maxReviews / 1000) * 100)}%`
                      }}
                    ></div>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="10"
                      value={minReviews}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMinReviews(val);
                        if (val > maxReviews && maxReviews < 10000) {
                          setMaxReviews(val);
                        }
                      }}
                      className="w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                      <span>0</span>
                      <span>250</span>
                      <span>500</span>
                      <span>750</span>
                      <span>1000+</span>
                    </div>
                  </div>

                  {/* Atajos rápidos */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => { setMinReviews(0); setMaxReviews(10000); }}
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        minReviews === 0 && maxReviews >= 10000
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => { setMinReviews(50); setMaxReviews(10000); }}
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        minReviews === 50
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      }`}
                    >
                      50+
                    </button>
                    <button
                      onClick={() => { setMinReviews(200); setMaxReviews(10000); }}
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        minReviews === 200
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                      }`}
                    >
                      200+
                    </button>
                    <button
                      onClick={() => { setMinReviews(1000); setMaxReviews(10000); }}
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        minReviews === 1000
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                      }`}
                    >
                      1000+
                    </button>
                  </div>
                </div>
              </div>

              {/* RATING MÍNIMO - SLIDER CON VISUAL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ⭐ Rating Mínimo
                </label>
                <div className="space-y-4">
                  {/* Indicador visual */}
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-yellow-600">{filters.minRating || 4.7}★</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-yellow-600">5.0★</span>
                  </div>
                  
                  {/* Barra visual con degradado */}
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-200"
                      style={{ 
                        left: `${((filters.minRating || 4.7) - 4.7) / 0.3 * 100}%`,
                        right: '0%'
                      }}
                    ></div>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="4.7"
                      max="5.0"
                      step="0.1"
                      value={filters.minRating || 4.7}
                      onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                      <span>4.7★</span>
                      <span>4.8★</span>
                      <span>4.9★</span>
                      <span>5.0★</span>
                    </div>
                  </div>

                  {/* Atajos rápidos */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setFilters({ ...filters, minRating: 4.7 })}
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        filters.minRating === 4.7
                          ? 'bg-yellow-500 text-white'
                          : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      }`}
                    >
                      4.7+
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, minRating: 4.8 })}
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        filters.minRating === 4.8
                          ? 'bg-yellow-500 text-white'
                          : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      }`}
                    >
                      4.8+
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, minRating: 4.9 })}
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        filters.minRating === 4.9
                          ? 'bg-yellow-500 text-white'
                          : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      }`}
                    >
                      4.9+
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, minRating: 5.0 })}
                      className={`px-3 py-1.5 text-xs rounded-lg transition font-medium ${
                        filters.minRating === 5.0
                          ? 'bg-yellow-500 text-white'
                          : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      }`}
                    >
                      5.0★
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 space-y-2 border-t border-gray-200">
                <Button onClick={applyFilters} className="w-full" size="lg">
                  <Filter className="h-5 w-5 mr-2" />
                  Aplicar Filtros
                </Button>
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Limpiar Filtros
                </Button>
              </div>

              {/* Contador de resultados */}
              <div className="text-center text-sm text-gray-600">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </span>
                ) : (
                  <span>
                    {filteredPlaces.length} {filteredPlaces.length === 1 ? 'lugar' : 'lugares'} encontrados
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MAPA */}
        <div className="flex-1 relative">
          {/* Botón toggle filtros */}
          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          )}

          {/* Barra de controles superior - Móvil */}
          <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between gap-2">
            {/* Leyenda de calidad - Izquierda */}
            <div className="bg-white/95 backdrop-blur-sm shadow-md rounded-lg px-2.5 py-1.5 border border-gray-200">
              <button
                onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                className="flex items-center gap-1.5"
              >
                <span className="text-base">💎</span>
                <span className="text-[10px] font-semibold text-gray-900 whitespace-nowrap">Leyenda de Tier</span>
                <ChevronDown 
                  className={`h-3 w-3 text-gray-600 transition-transform ${
                    isLegendExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* GPS - Centro */}
            <button
              onClick={isGeolocationActive ? deactivateGeolocation : activateGeolocation}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full shadow-md transition-all font-medium text-[10px] border whitespace-nowrap ${
                isGeolocationActive
                  ? 'bg-green-500 text-white border-green-600'
                  : 'bg-white/95 backdrop-blur-sm text-gray-700 border-gray-300'
              }`}
            >
              <MapPin className={`h-3 w-3 ${isGeolocationActive ? 'animate-pulse' : ''}`} />
              <span>
                {isGeolocationActive ? 'GPS ON' : 'Activar Geolocalización'}
              </span>
            </button>

            {/* Contador de lugares - Derecha */}
            <div className="bg-white/95 backdrop-blur-sm shadow-md rounded-full px-2.5 py-1.5 border border-gray-200">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-indigo-600 flex-shrink-0" />
                <span className="font-semibold text-gray-900 text-[11px] whitespace-nowrap">
                  {filteredPlaces.length}
                </span>
              </div>
            </div>
          </div>

          {/* Panel expandible de leyenda - Debajo de barra superior */}
          {isLegendExpanded && (
            <div className="absolute top-14 left-2 z-10 bg-white/95 backdrop-blur-sm shadow-md rounded-lg p-2 border border-gray-200 max-w-[200px]">
              <div className="space-y-1">
                <div className="flex items-start gap-1.5">
                  <span className="text-sm shrink-0">💎</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[10px] text-gray-900 leading-tight">Diamante</p>
                    <p className="text-[8px] text-gray-600 leading-tight mt-0.5">4.8★+ con 1,000+</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-sm shrink-0">🏆</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[10px] text-gray-900 leading-tight">Platino</p>
                    <p className="text-[8px] text-gray-600 leading-tight mt-0.5">4.8★+ con 500+</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-sm shrink-0">🥇</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[10px] text-gray-900 leading-tight">Oro</p>
                    <p className="text-[8px] text-gray-600 leading-tight mt-0.5">4.8★+ con 200+</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-sm shrink-0">🥈</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[10px] text-gray-900 leading-tight">Plata</p>
                    <p className="text-[8px] text-gray-600 leading-tight mt-0.5">4.7★+ con 100+</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-sm shrink-0">🥉</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[10px] text-gray-900 leading-tight">Bronce</p>
                    <p className="text-[8px] text-gray-600 leading-tight mt-0.5">4.7★+ (-100)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de error GPS - Debajo del botón */}
          {geolocationError && (
            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-10 bg-red-50 text-red-600 px-2 py-1 rounded-md shadow-md text-[9px] max-w-[180px] text-center leading-tight">
              {geolocationError.split(' - ')[0]}
            </div>
          )}

          {/* Contenedor del mapa y controles */}
          <div className="h-full w-full relative">
            {/* Loader sobre el mapa mientras se carga Google Maps API */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-gray-600">Cargando Google Maps...</p>
                </div>
              </div>
            )}
            
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                onClick={() => setSelectedPlace(null)}
                onLoad={(map) => {
                  console.log('🗺️ Google Map cargado correctamente');
                  mapRef.current = map;
                  setMapReady(true); // ✅ Disparar creación de marcadores
                  
                  // 🔧 Detectar cuando el usuario mueve el mapa manualmente
                  map.addListener('dragstart', () => {
                    isUserInteractingRef.current = true;
                  });
                  
                  map.addListener('zoom_changed', () => {
                    isUserInteractingRef.current = true;
                  });
                  
                  // Resetear después de 2 segundos de inactividad
                  map.addListener('idle', () => {
                    setTimeout(() => {
                      isUserInteractingRef.current = false;
                    }, 2000);
                  });
                }}
            options={{
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }],
                },
              ],
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              minZoom: isMobile ? 6 : 5, // ✅ Zoom mínimo más alto en móvil para mejor navegación vertical
              maxZoom: 18,
              restriction: {
                latLngBounds: isMobile ? SPAIN_BOUNDS_PENINSULA : SPAIN_BOUNDS_FULL, // ✅ Límites según dispositivo
                strictBounds: false, // Permite scroll flexible
              },
              gestureHandling: 'greedy', // Permite desplazar con 1 dedo y zoom con 2 dedos en móvil
            }}
          >
            {/* Marcador de ubicación del usuario - Diseño especial */}
            {userLocation && (
              <>
                {/* Círculo exterior (anillo pulsante) */}
                <Marker
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.15,
                    strokeWeight: 2,
                    strokeColor: '#3b82f6',
                    strokeOpacity: 0.4,
                    scale: 20,
                  }}
                  zIndex={999}
                />
                {/* Círculo medio (borde blanco) */}
                <Marker
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#ffffff',
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 8,
                  }}
                  zIndex={1000}
                />
                {/* Círculo interior (punto azul sólido) */}
                <Marker
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeWeight: 0,
                    scale: 5,
                  }}
                  zIndex={1001}
                  title="Tu ubicación"
                />
              </>
            )}

            {/* 🚀 CLUSTERING: Los marcadores se renderizan con MarkerClusterer */}
            {/* Los marcadores ya no se renderizan aquí, el clusterer los maneja */}

              </GoogleMap>
            )}
          </div>

          {/* Card flotante FUERA del GoogleMap - Siempre centrada */}
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
                      // Limpiar parámetro place de la URL si existe
                      if (searchParams.get('place')) {
                        router.push('/mapa', { scroll: false });
                      }
                      // 🔧 En móvil, devolver foco al mapa para facilitar navegación
                      if (window.innerWidth < 768 && mapRef.current) {
                        setTimeout(() => {
                          const mapDiv = mapRef.current?.getDiv();
                          mapDiv?.focus();
                        }, 100);
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

                  <div className="p-4">
                    {/* Nombre y rating */}
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
                            {selectedPlace.review_count || selectedPlace.reviews_count} reseñas
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
                        onClick={() => router.push(`/${selectedPlace.category}/${selectedPlace.province}/${selectedPlace.slug}`)}
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
              </div>
            );
          })()}
        </div>

        {/* PANEL LATERAL DERECHO - Lista de Lugares - Desktop */}
        <div 
          className={`hidden md:block ${
            showPlacesList ? 'w-96' : 'w-0'
          } transition-all duration-300 bg-white border-l border-gray-200 overflow-y-auto`}
        >
          {showPlacesList && (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="mb-4 sticky top-0 bg-white pb-2 border-b z-10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Lugares Encontrados</h3>
                    <p className="text-sm text-gray-600">{filteredPlaces.length} resultados</p>
                    
                    {/* 🎯 MENSAJE INFORMATIVO: Límite visual de 50 lugares */}
                    {filteredPlaces.length > 50 && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <span className="font-semibold">Mostrando 50 de {filteredPlaces.length} lugares</span>
                          <br />
                          Usa los filtros para refinar tu búsqueda
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPlacesList(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
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

              {/* Lista de lugares - SOLO cuando termina de cargar */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-gray-600">Cargando lugares...</p>
                </div>
              ) : displayedPlaces.length > 0 ? (
                displayedPlaces.map((place) => {
                  const tier = calculateQualityTier(place.rating, place.review_count || 0);
                  const tierInfo = getTierInfo(tier);
                  
                  // Calcular distancia si hay geolocalización
                  const distance = userLocation 
                    ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                    : null;
                  
                  return (
                    <div
                      key={place.id}
                      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white"
                      onClick={() => handleMarkerClick(place)}
                    >
                      {/* Foto del lugar - Lazy loading para mejor rendimiento */}
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
          )}
        </div>

        {/* Botón para mostrar/ocultar lista */}
        {!showPlacesList && (
          <button
            onClick={() => setShowPlacesList(true)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-l-lg p-3 hover:bg-gray-50 transition z-10"
          >
            <ChevronUp className="h-6 w-6 rotate-90" />
          </button>
        )}
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
        <div className="space-y-4 py-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre, ciudad..."
                value={filters.searchTerm || ''}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base"
              />
            </div>
          </div>

          {/* Provincia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Provincia
            </label>
            <select
              value={filters.province || ''}
              onChange={(e) => setFilters({ ...filters, province: e.target.value || undefined })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
            >
              <option value="">Todas</option>
              {PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏙️ Ciudad
            </label>
            <input
              type="text"
              placeholder="Ej: Málaga, Marbella..."
              value={filters.city || ''}
              onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🍽️ Categoría
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value as any || undefined })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
            >
              <option value="">Todas</option>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Tier - Multi-selección con información detallada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              💎 Tier de Calidad
            </label>
            <div className="space-y-2">
              {Object.entries(QUALITY_TIERS).map(([key, tier]) => {
                if (key === 'none') return null; // No mostrar "Sin clasificar"
                
                return (
                  <label key={key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition">
                    <input
                      type="checkbox"
                      checked={filters.qualityTier?.includes(key as QualityTier) || false}
                      onChange={(e) => {
                        const currentTiers = filters.qualityTier || [];
                        if (e.target.checked) {
                          setFilters({ ...filters, qualityTier: [...currentTiers, key as QualityTier] });
                        } else {
                          setFilters({ ...filters, qualityTier: currentTiers.filter(t => t !== key) });
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{tier.icon}</span>
                        <span className="font-semibold text-gray-900">{tier.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-tight">
                        {tier.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rating Mínimo - Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⭐ Rating Mínimo
            </label>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-yellow-600">{filters.minRating || 4.7}★</span>
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                  style={{ width: `${((filters.minRating || 4.7) - 4.7) / (5.0 - 4.7) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">5.0★</span>
            </div>
            <input
              type="range"
              min="4.7"
              max="5.0"
              step="0.1"
              value={filters.minRating || 4.7}
              onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Número de Reseñas - Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Número de Reseñas
            </label>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Mínimo:</span>
                  <span className="font-medium text-indigo-600">{minReviews === 0 ? 'Todas' : minReviews}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={minReviews}
                  onChange={(e) => setMinReviews(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Máximo:</span>
                  <span className="font-medium text-indigo-600">{maxReviews >= 10000 ? '∞' : maxReviews}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={maxReviews >= 10000 ? 10000 : maxReviews}
                  onChange={(e) => setMaxReviews(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="flex-1"
            >
              Limpiar
            </Button>
            <Button
              onClick={() => setMobileView('map')}
              variant="primary"
              className="flex-1"
            >
              Ver Mapa
            </Button>
          </div>
        </div>
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

          {/* 🎯 MENSAJE INFORMATIVO MÓVIL: Límite visual */}
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
              
              // Calcular distancia si hay geolocalización
              const distance = userLocation 
                ? calculateDistance(userLocation.lat, userLocation.lng, place.latitude, place.longitude)
                : null;
              
              return (
                <div
                  key={place.id}
                  className="border rounded-xl p-3 hover:shadow-md transition cursor-pointer bg-white"
                  onClick={() => {
                    setSelectedPlace(place);
                    setMobileView('map');
                    mapRef.current?.panTo({ lat: place.latitude, lng: place.longitude });
                    mapRef.current?.setZoom(15);
                  }}
                >
                  {/* Foto del lugar - Desde Supabase o Google (fallback) */}
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
                            // Si la imagen falla al cargar, ocultar
                            e.currentTarget.style.display = 'none';
                          }}
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
