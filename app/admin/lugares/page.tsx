'use client';

// Sin caché para admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
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
  ChevronUp,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { calculateQualityTier, getTierMarkerColor, getTierInfo } from '@/lib/utils/tier-calculator';
import { getPlacePhotoUrl } from '@/lib/utils/photo-helper';

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
  const [mapPlaces, setMapPlaces] = useState<any[]>([]); // 🚀 NUEVO: Lugares para el mapa (todos)
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 }); // 🚀 NUEVO: Progreso carga
  const [mapLoading, setMapLoading] = useState(false); // 🚀 NUEVO: Loading del mapa
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [showMap, setShowMap] = useState(false); // 🚀 Desactivado por defecto
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0 });
  
  // 🚀 NUEVO: Refs para clustering
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  
  // Stats globales (sin cargar todos los lugares)
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [uniqueProvinces, setUniqueProvinces] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  const [searchInput, setSearchInput] = useState(''); // Input real-time
  const [searchTerm, setSearchTerm] = useState(''); // Término aplicado (con debounce)
  const [categoryFilter, setCategoryFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);

  // Paginación SERVER-SIDE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadStats();
    loadPlaces();
  }, []);

  // 🚀 NUEVO: Cargar datos del mapa cuando se abre
  useEffect(() => {
    if (showMap && mapPlaces.length === 0) {
      loadMapData();
    }
  }, [showMap]);

  // 🚀 OPTIMIZACIÓN: Cargar datos del servidor cuando cambien filtros o paginación
  useEffect(() => {
    loadPlaces();
  }, [searchTerm, categoryFilter, provinceFilter, publishedFilter, sortField, sortOrder, currentPage, itemsPerPage]);

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, provinceFilter, publishedFilter]);

  // Calcular estadísticas
  const publishedPercentage = totalPlaces > 0 ? Math.round((publishedCount / totalPlaces) * 100) : 0;

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/places/stats');
      const data = await response.json();
      
      if (data.success) {
        setTotalPlaces(data.total);
        setPublishedCount(data.published);
        setDraftCount(data.drafts);
        setUniqueProvinces(data.provinces || []);
        setUniqueCategories(data.categories || []);
        console.log(`📊 Stats: ${data.total} lugares total`);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // 🚀 NUEVO: Cargar datos optimizados para el mapa (solo coordenadas + info básica)
  const loadMapData = async () => {
    setMapLoading(true);
    try {
      console.log('🗺️ Cargando datos del mapa...');
      const response = await fetch('/api/admin/places/map-data');
      const data = await response.json();
      
      if (data.success && data.places) {
        setMapPlaces(data.places);
        console.log(`✅ ${data.places.length} lugares cargados para mapa con clustering`);
        
        // Centrar en el primer lugar si hay datos
        if (data.places.length > 0) {
          setMapCenter({
            lat: data.places[0].latitude,
            lng: data.places[0].longitude,
          });
        }
      }
    } catch (error) {
      console.error('Error cargando datos del mapa:', error);
      toast.error('Error al cargar el mapa');
    } finally {
      setMapLoading(false);
    }
  };

  const loadPlaces = async () => {
    setLoading(true);
    try {
      // 🚀 Si itemsPerPage es 0 (Todos), cargar en BATCHES progresivos como el mapa público
      if (itemsPerPage === 0) {
        console.log('📦 Cargando TODOS los lugares en batches...');
        
        let allLoadedPlaces: any[] = [];
        const batchSize = 500; // ⚠️ Reducido a 500 para evitar error 413 (Payload Too Large)
        let page = 1;
        let hasMore = true;
        let totalExpected = 0;
        
        while (hasMore) {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: batchSize.toString(),
          });

          if (searchTerm) params.append('search', searchTerm);
          if (categoryFilter) params.append('category', categoryFilter);
          if (provinceFilter) params.append('province', provinceFilter);
          if (publishedFilter !== 'all') {
            params.append('published', publishedFilter === 'published' ? 'true' : 'false');
          }

          try {
            const response = await fetch(`/api/admin/places?${params.toString()}`);
            
            if (!response.ok) {
              console.error(`❌ Error HTTP ${response.status} en batch ${page}`);
              hasMore = false;
              break;
            }
            
            const data = await response.json();
            
            if (data.success && data.places && data.places.length > 0) {
              allLoadedPlaces = [...allLoadedPlaces, ...data.places];
              totalExpected = data.total;
              
              // Actualizar progreso
              setLoadingProgress({ current: allLoadedPlaces.length, total: data.total });
              
              console.log(`📍 Batch ${page}: +${data.places.length} lugares (Total acumulado: ${allLoadedPlaces.length}/${data.total})`);
              
              // Si recibimos menos del batch size, no hay más páginas
              if (data.places.length < batchSize) {
                hasMore = false;
              }
              
              // Si ya tenemos todos según el total, parar
              if (allLoadedPlaces.length >= data.total) {
                hasMore = false;
              }
              
              page++;
              
              // Pequeño delay entre batches para no saturar el servidor
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              console.log(`⚠️ Batch ${page} sin datos o error en respuesta`);
              hasMore = false;
            }
          } catch (batchError: any) {
            console.error(`❌ Error en batch ${page}:`, batchError);
            toast.error(`Error cargando batch ${page}: ${batchError.message}`);
            hasMore = false;
          }
        }
        
        setLoadingProgress({ current: 0, total: 0 }); // Reset
        
        setPlaces(allLoadedPlaces);
        setTotalPlaces(totalExpected || allLoadedPlaces.length);
        setTotalPages(1);
        
        if (allLoadedPlaces.length > 0) {
          console.log(`✅ Cargados ${allLoadedPlaces.length} lugares en ${page - 1} batches`);
          setMapCenter({
            lat: allLoadedPlaces[0].latitude,
            lng: allLoadedPlaces[0].longitude,
          });
          
          if (allLoadedPlaces.length < totalExpected) {
            toast.warning(`Cargados ${allLoadedPlaces.length} de ${totalExpected} lugares. Algunos batches fallaron.`);
          }
        } else {
          console.error('❌ No se pudo cargar ningún lugar');
          toast.error('No se pudieron cargar los lugares. Intenta con paginación normal.');
        }
        
      } else {
        // Carga normal con paginación
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter) params.append('category', categoryFilter);
        if (provinceFilter) params.append('province', provinceFilter);
        if (publishedFilter !== 'all') {
          params.append('published', publishedFilter === 'published' ? 'true' : 'false');
        }

        const response = await fetch(`/api/admin/places?${params.toString()}`);
        const data = await response.json();
        
        if (data.success && data.places) {
          setPlaces(data.places);
          setTotalPlaces(data.total);
          setTotalPages(data.totalPages || 1);
          console.log(`✅ Cargados ${data.places.length} de ${data.total} lugares (página ${currentPage})`);
          
          if (data.places.length > 0) {
            setMapCenter({
              lat: data.places[0].latitude,
              lng: data.places[0].longitude,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error cargando lugares:', error);
      toast.error('Error al cargar lugares');
    } finally {
      setLoading(false);
    }
  };


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
      setEnriching(true);
      
      // 🎯 UNIFICADO: Usar el mismo endpoint que el dashboard
      const checkResponse = await fetch(`/api/admin/enrich-pending?t=${Date.now()}`);
      const checkData = await checkResponse.json();
      
      if (!checkData.success || !checkData.stats) {
        toast.error('Error al obtener lugares pendientes');
        setEnriching(false);
        return;
      }

      const { pending, completed, totalPlaces, percentage } = checkData.stats;
      
      if (pending === 0) {
        toast.info(`✅ Todos los lugares ya están enriquecidos (${completed}/${totalPlaces} - ${percentage}%)`);
        setEnriching(false);
        return;
      }

      const estimatedMinutes = Math.ceil(pending * 3 / 60);
      if (!confirm(`¿Enriquecer ${pending} lugares con IA? (incluye borradores)\n\n📊 Progreso actual: ${completed}/${totalPlaces} (${percentage}%)\n⏱️ Tiempo estimado: ~${estimatedMinutes} minutos\n\n⚠️ El proceso se ejecutará en segundo plano.`)) {
        setEnriching(false);
        return;
      }

      setEnrichProgress({ current: 0, total: pending });

      // Obtener los lugares pendientes reales desde Supabase (INCLUYENDO BORRADORES)
      const supabase = createClient();
      const { data: placesToEnrich } = await supabase
        .from('places')
        .select('id, name, published')
        .is('ai_description', null)
        .limit(pending);

      if (!placesToEnrich || placesToEnrich.length === 0) {
        toast.info('No hay lugares pendientes de enriquecer');
        setEnriching(false);
        return;
      }

      let enriched = 0;
      let errors = 0;

      // Procesar en lotes de 5 para mejor rendimiento
      const batchSize = 5;
      for (let i = 0; i < placesToEnrich.length; i += batchSize) {
        const batch = placesToEnrich.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (place) => {
          try {
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
        }));

        setEnrichProgress({ current: Math.min(i + batchSize, placesToEnrich.length), total: pending });
        
        // Pequeña pausa entre lotes para no saturar
        await new Promise(resolve => setTimeout(resolve, 500));
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

  // Categorías permitidas en todo el sistema (regla del proyecto)
  const ALLOWED_CATEGORIES: Array<'restaurante' | 'bar' | 'cafe' | 'hotel'> = [
    'restaurante', 'bar', 'cafe', 'hotel'
  ];

  const categoryNames: Record<string, string> = {
    restaurante: 'Restaurantes',
    bar: 'Bares',
    cafe: 'Cafeterías',
    hotel: 'Hoteles',
  } as const;

  // Actualizar la categoría del lugar (edición rápida desde la tabla)
  const handleChangeCategory = async (id: string, newCategory: 'restaurante' | 'bar' | 'cafe' | 'hotel') => {
    // Guardar categoría anterior para rollback
    const previousPlace = places.find(p => p.id === id);
    const oldCategory = previousPlace?.category;
    
    try {
      setUpdatingCategoryId(id);
      
      // Actualización optimista (inmediata en UI)
      setPlaces(prev => prev.map(p => p.id === id ? { ...p, category: newCategory } : p));
      
      const res = await fetch(`/api/places/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        // Rollback: restaurar categoría anterior
        if (oldCategory) {
          setPlaces(prev => prev.map(p => p.id === id ? { ...p, category: oldCategory } : p));
        }
        throw new Error(data.error || 'Error al actualizar la categoría');
      }
      
      // Actualizar con datos completos del servidor (incluye slug regenerado)
      setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...data.place } : p));
      toast.success('✅ Categoría actualizada');
      
    } catch (error: any) {
      console.error('Error actualizando categoría:', error);
      toast.error(error.message || 'Error al actualizar la categoría');
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Función para exportar a CSV
  const exportToCSV = () => {
    try {
      // Preparar datos para exportación (solo página actual)
      const exportData = places.map(place => {
        const tier = calculateQualityTier(place.rating, place.review_count);
        const tierInfo = getTierInfo(tier);
        
        return {
          'ID': place.id,
          'Nombre': place.name,
          'Categoría': place.category || '',
          'Rating': place.rating,
          'Reseñas': place.review_count,
          'Tier': tierInfo.name,
          'Provincia': place.province || '',
          'Ciudad': place.city || '',
          'Dirección': place.address || '',
          'Teléfono': place.phone || '',
          'Email': place.email || '',
          'Email Verificado': place.email_verified ? 'Sí' : 'No',
          'Email Fuente': place.email_source || '',
          'Website': place.website || '',
          'Instagram': place.instagram_url || '',
          'Facebook': place.facebook_url || '',
          'Twitter': place.twitter_url || '',
          'TikTok': place.tiktok_url || '',
          'Google Maps ID': place.google_maps_id || '',
          'Google Place ID': place.google_place_id || '',
          'Latitud': place.latitude,
          'Longitud': place.longitude,
          'Publicado': place.published ? 'Sí' : 'No',
          'Verificado': place.verified ? 'Sí' : 'No',
          'Fecha Creación': place.created_at ? new Date(place.created_at).toLocaleString('es-ES') : '',
          'Descripción SEO': place.seo_description || '',
          'AI Summary': place.ai_summary || '',
          'Highlights': place.highlights || ''
        };
      });

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
      link.setAttribute('download', `lugares_casicinco_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`✅ CSV exportado: ${exportData.length} lugares`);
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error('Error al exportar CSV');
    }
  };

  // Función para exportar a Excel (XLSX)
  const exportToExcel = () => {
    try {
      // Preparar datos para exportación (solo página actual)
      const exportData = places.map(place => {
        const tier = calculateQualityTier(place.rating, place.review_count);
        const tierInfo = getTierInfo(tier);
        
        return {
          'ID': place.id,
          'Nombre': place.name,
          'Categoría': place.category || '',
          'Rating': place.rating,
          'Reseñas': place.review_count,
          'Tier': tierInfo.name,
          'Provincia': place.provincia || place.province || '',
          'Ciudad': place.city || '',
          'Dirección': place.address || '',
          'Teléfono': place.phone || '',
          'Email': place.email || '',
          'Email Verificado': place.email_verified ? 'Sí' : 'No',
          'Email Fuente': place.email_source || '',
          'Website': place.website || '',
          'Instagram': place.instagram_url || '',
          'Facebook': place.facebook_url || '',
          'Twitter': place.twitter_url || '',
          'TikTok': place.tiktok_url || '',
          'Google Maps ID': place.google_maps_id || '',
          'Google Place ID': place.google_place_id || '',
          'Latitud': place.latitude,
          'Longitud': place.longitude,
          'Publicado': place.published ? 'Sí' : 'No',
          'Verificado': place.verified ? 'Sí' : 'No',
          'Fecha Creación': place.created_at ? new Date(place.created_at).toLocaleString('es-ES') : '',
          'Descripción SEO': place.seo_description || '',
          'AI Summary': place.ai_summary || '',
          'Highlights': place.highlights || ''
        };
      });

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Lugares');

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 30 }, // ID
        { wch: 40 }, // Nombre
        { wch: 15 }, // Categoría
        { wch: 10 }, // Rating
        { wch: 10 }, // Reseñas
        { wch: 15 }, // Tier
        { wch: 20 }, // Provincia
        { wch: 20 }, // Ciudad
        { wch: 40 }, // Dirección
        { wch: 15 }, // Teléfono
        { wch: 30 }, // Email
        { wch: 15 }, // Email Verificado
        { wch: 15 }, // Email Fuente
        { wch: 40 }, // Website
        { wch: 40 }, // Instagram
        { wch: 40 }, // Facebook
        { wch: 40 }, // Twitter
        { wch: 40 }, // TikTok
        { wch: 30 }, // Google Maps ID
        { wch: 30 }, // Google Place ID
        { wch: 12 }, // Latitud
        { wch: 12 }, // Longitud
        { wch: 10 }, // Publicado
        { wch: 10 }, // Verificado
        { wch: 20 }, // Fecha Creación
        { wch: 50 }, // Descripción SEO
        { wch: 50 }, // AI Summary
        { wch: 50 }, // Highlights
      ];
      worksheet['!cols'] = columnWidths;

      // Descargar archivo
      XLSX.writeFile(workbook, `lugares_casicinco_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success(`✅ Excel exportado: ${exportData.length} lugares`);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      toast.error('Error al exportar Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          {loadingProgress.total > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Cargando lugares: {loadingProgress.current} / {loadingProgress.total}
              </p>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Gestión de Lugares</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ {publishedCount} publicados
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              📝 {draftCount} borradores
            </span>
            <span className="text-sm text-gray-500">
              · {totalPlaces} total ({publishedPercentage}% público)
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 md:flex gap-2">
          <Button onClick={loadPlaces} variant="outline" size="sm" disabled={enriching}>
            <RefreshCw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Recargar</span>
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={enriching || places.length === 0}>
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">CSV</span>
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm" disabled={enriching || places.length === 0}>
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Excel</span>
          </Button>
          <Button onClick={handleEnrichPlaces} variant="primary" size="sm" disabled={enriching}>
            <span className="md:hidden">🎨</span>
            <span className="hidden md:inline">{enriching ? '⏳ Procesando...' : '🎨 Enriquecer IA'}</span>
          </Button>
          <Button onClick={handlePublishAll} variant="outline" size="sm" disabled={enriching}>
            <Eye className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Publicar</span>
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
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition" onClick={() => setShowMap(!showMap)}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  Mapa de Lugares
                  {mapPlaces.length > 0 && (
                    <span className="text-sm font-normal text-gray-500">({mapPlaces.length} lugares)</span>
                  )}
                </CardTitle>
                <CardDescription>
                  {showMap ? 'Click para ocultar el mapa' : 'Click para mostrar el mapa con clustering'}
                </CardDescription>
              </div>
              {showMap ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </div>
          </CardHeader>
          {showMap && (
            <CardContent>
              {mapLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={6}
                    onClick={() => setSelectedPlace(null)}
                    onLoad={(map) => {
                      mapRef.current = map;
                      
                      // 🚀 Inicializar clustering cuando el mapa esté listo
                      if (mapPlaces.length > 0 && !clustererRef.current) {
                        console.log('🎯 Inicializando MarkerClusterer con', mapPlaces.length, 'lugares');
                        
                        // Limpiar markers anteriores
                        markersRef.current.forEach(marker => marker.setMap(null));
                        markersRef.current = [];
                        
                        // Crear markers
                        const markers = mapPlaces.map((place) => {
                          const tier = calculateQualityTier(place.rating, place.review_count);
                          const color = getTierMarkerColor(tier);
                          
                          const marker = new google.maps.Marker({
                            position: { lat: place.latitude, lng: place.longitude },
                            icon: {
                              path: google.maps.SymbolPath.CIRCLE,
                              fillColor: color,
                              fillOpacity: 1,
                              strokeWeight: 2,
                              strokeColor: '#ffffff',
                              scale: 6,
                            },
                            title: place.name,
                          });
                          
                          // Click handler
                          marker.addListener('click', () => {
                            handleMarkerClick(place);
                          });
                          
                          return marker;
                        });
                        
                        markersRef.current = markers;
                        
                        // 🎨 Renderer personalizado para clusters (mismo estilo que mapa público)
                        const clusterSize = 40;
                        const clusterRadius = 18;
                        const clusterFontSize = 12;
                        
                        const renderer = {
                          render: ({ count, position, markers }: any) => {
                            // Colores según cantidad (igual que mapa público)
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

                            // Click en cluster: hacer zoom para expandir
                            clusterMarker.addListener('click', () => {
                              if (mapRef.current && markers && markers.length > 0) {
                                const bounds = new google.maps.LatLngBounds();
                                markers.forEach((marker: any) => {
                                  bounds.extend(marker.getPosition()!);
                                });
                                mapRef.current?.fitBounds(bounds);
                                
                                // Limitar zoom máximo
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
                        
                        // Inicializar clusterer con renderer personalizado
                        clustererRef.current = new MarkerClusterer({
                          map,
                          markers,
                          renderer,
                        });
                        
                        console.log('✅ Clustering inicializado con', markers.length, 'markers');
                      }
                    }}
                    onUnmount={() => {
                      // Limpiar al desmontar
                      if (clustererRef.current) {
                        clustererRef.current.clearMarkers();
                        clustererRef.current = null;
                      }
                      markersRef.current.forEach(marker => marker.setMap(null));
                      markersRef.current = [];
                      mapRef.current = null;
                    }}
                    options={{
                      disableDefaultUI: false,
                      zoomControl: true,
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: true,
                    }}
                  >

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
                      {(() => {
                        // ✅ OPTIMIZACIÓN: Usar helper para fotos (prioriza Supabase, ahorra $0.007/foto)
                        const photoUrl = getPlacePhotoUrl(selectedPlace, 0, 600);
                        
                        return photoUrl && (
                          <div className="relative h-40 mb-4">
                            <img
                              src={photoUrl}
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
                        );
                      })()}

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
              )}
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
                  <option value="1000">1000</option>
                  <option value="0">Todos (carga progresiva)</option>
                </select>
                <span className="text-sm text-gray-600">
                  por página
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {itemsPerPage === 0 ? (
                  `Mostrando todos (${totalPlaces})`
                ) : (
                  `Mostrando ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalPlaces)} de ${totalPlaces}`
                )}
              </div>
            </div>
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              {searchInput !== searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
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
                    Redes Sociales
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
                {places.length > 0 ? (
                  places.map((place) => {
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

                        {/* Categoría (editable) */}
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2">
                            <select
                              value={ALLOWED_CATEGORIES.includes(place.category) ? place.category : 'restaurante'}
                              onChange={(e) => handleChangeCategory(place.id, e.target.value as any)}
                              disabled={updatingCategoryId === place.id}
                              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white"
                              title="Editar categoría"
                            >
                              {ALLOWED_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{categoryNames[cat]}</option>
                              ))}
                            </select>
                          </div>
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

                        {/* Redes Sociales */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {place.instagram_url && (
                              <a 
                                href={place.instagram_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-pink-600 hover:text-pink-800 transition"
                                title="Instagram"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                              </a>
                            )}
                            {place.facebook_url && (
                              <a 
                                href={place.facebook_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 transition"
                                title="Facebook"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              </a>
                            )}
                            {place.twitter_url && (
                              <a 
                                href={place.twitter_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-900 hover:text-gray-700 transition"
                                title="Twitter/X"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                              </a>
                            )}
                            {place.tiktok_url && (
                              <a 
                                href={place.tiktok_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-900 hover:text-gray-700 transition"
                                title="TikTok"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                </svg>
                              </a>
                            )}
                            {!place.instagram_url && !place.facebook_url && !place.twitter_url && !place.tiktok_url && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
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
