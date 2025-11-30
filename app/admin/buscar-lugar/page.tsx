'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useMap } from '@/lib/contexts/MapContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Star, Phone, Globe, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BuscarLugarPage() {
  useEffect(() => {
    document.title = 'Búsqueda Manual | Admin';
  }, []);

  const { isLoaded, loadError } = useMap();

  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Manejar Enter en el input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) {
      toast.error('Escribe al menos 3 caracteres');
      return;
    }

    setSearching(true);
    setResults([]);
    setSelectedPlaces([]);

    try {
      const res = await fetch('/api/admin/search-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm }),
      });

      const data = await res.json();

      console.log('📡 Respuesta del servidor:', data);

      if (data.success) {
        setResults(data.places);
        setTotalCost(prev => prev + data.cost);
        
        if (data.count === 0) {
          toast.warning('No se encontraron lugares con ≥4.7★');
        } else {
          toast.success(`${data.count} lugares encontrados con ≥4.7★`);
        }
      } else {
        // Mostrar error detallado
        const errorMsg = data.error || 'No se encontraron resultados';
        const details = data.details ? `\n${data.details}` : '';
        const googleStatus = data.googleStatus ? ` (${data.googleStatus})` : '';
        
        console.error('❌ Error en búsqueda:', {
          error: errorMsg,
          googleStatus: data.googleStatus,
          details: data.details
        });
        
        toast.error(`${errorMsg}${googleStatus}${details}`, {
          duration: 5000, // 5 segundos para leer el mensaje
        });
        setResults([]);
      }
    } catch (error: any) {
      console.error('❌ Error de red:', error);
      toast.error(`Error en la búsqueda: ${error.message}`);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddPlaces = async () => {
    if (selectedPlaces.length === 0) return;

    setAdding(true);
    let addedCount = 0;
    let errorCount = 0;
    let totalAddedCost = 0;

    try {
      // Procesar lugares de forma secuencial para evitar saturar la API
      for (const place of selectedPlaces) {
        try {
          const res = await fetch('/api/admin/add-manual-place', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ place_id: place.place_id }),
          });

          const data = await res.json();

          if (data.success) {
            addedCount++;
            totalAddedCost += data.cost;
          } else {
            errorCount++;
            console.error(`Error añadiendo ${place.name}:`, data.error);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error añadiendo ${place.name}:`, error);
        }
      }

      // Actualizar coste total
      setTotalCost(prev => prev + totalAddedCost);

      // Mostrar resultado
      if (addedCount > 0) {
        toast.success(`✅ ${addedCount} lugar${addedCount > 1 ? 'es' : ''} añadido${addedCount > 1 ? 's' : ''}!`);
      }
      if (errorCount > 0) {
        toast.error(`❌ ${errorCount} lugar${errorCount > 1 ? 'es' : ''} no se ${errorCount > 1 ? 'pudieron' : 'pudo'} añadir`);
      }

      // Quitar lugares añadidos de resultados
      const addedPlaceIds = selectedPlaces.map(p => p.place_id);
      setResults(results.filter(p => !addedPlaceIds.includes(p.place_id)));
      setSelectedPlaces([]);
    } catch (error) {
      toast.error('Error añadiendo lugares');
    } finally {
      setAdding(false);
    }
  };

  const togglePlaceSelection = (place: any) => {
    setSelectedPlaces(prev => {
      const isSelected = prev.some(p => p.place_id === place.place_id);
      if (isSelected) {
        return prev.filter(p => p.place_id !== place.place_id);
      } else {
        return [...prev, place];
      }
    });
  };

  const isPlaceSelected = (placeId: string) => {
    return selectedPlaces.some(p => p.place_id === placeId);
  };

  if (loadError) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error cargando Google Maps</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🔍 Búsqueda Manual de Lugares</h1>
        <p className="text-gray-600 mt-2">
          Busca y añade lugares de calidad que no estén indexados
        </p>
      </div>

      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ej: Restaurante El Patio, Madrid"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition-all"
                disabled={searching}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} size="lg">
              {searching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-500">
              💰 Coste de esta sesión: ${totalCost.toFixed(3)}
            </p>
            <p className="text-xs text-gray-500">
              Solo se muestran lugares con ≥4.7★
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lista de resultados */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              📋 Resultados 
              {results.length > 0 && ` (${results.length})`}
            </h2>
            {selectedPlaces.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedPlaces.length} seleccionado{selectedPlaces.length > 1 ? 's' : ''}
                </span>
                <Button
                  onClick={handleAddPlaces}
                  disabled={adding}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Añadiendo...
                    </>
                  ) : (
                    <>
                      ✅ Añadir {selectedPlaces.length} Lugar{selectedPlaces.length > 1 ? 'es' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {results.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500 py-8">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Busca un lugar para ver resultados</p>
                  <p className="text-sm mt-2">
                    Ejemplos: "Restaurante La Viña, San Sebastián" o "Hotel Ritz, Madrid"
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {results.map((place) => (
                <Card
                  key={place.place_id}
                  className={`cursor-pointer transition ${
                    isPlaceSelected(place.place_id)
                      ? 'border-primary border-2 shadow-md bg-blue-50'
                      : 'hover:border-gray-300 hover:shadow'
                  }`}
                  onClick={() => togglePlaceSelection(place)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isPlaceSelected(place.place_id)}
                          onChange={() => togglePlaceSelection(place)}
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {/* Información del lugar */}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{place.name}</h3>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{place.rating}★</span>
                          <span className="text-gray-500">({place.user_ratings_total} reseñas)</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {place.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Mapa + Detalles */}
        <div>
          <h2 className="text-xl font-bold mb-4">🗺️ Mapa</h2>
          
          {!isLoaded ? (
            <Card>
              <CardContent className="pt-6">
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mapa */}
              <Card className="mb-4">
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={
                      selectedPlaces.length > 0
                        ? selectedPlaces[0].location
                        : results.length > 0
                        ? results[0].location
                        : { lat: 40.4168, lng: -3.7038 }
                    }
                    zoom={selectedPlaces.length > 0 || results.length > 0 ? 12 : 6}
                    options={{
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    {results.map((place) => (
                      <Marker
                        key={place.place_id}
                        position={place.location}
                        onClick={() => togglePlaceSelection(place)}
                        icon={{
                          url: isPlaceSelected(place.place_id)
                            ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                            : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        }}
                      />
                    ))}
                  </GoogleMap>
                </div>
              </Card>

              {/* Detalles de los lugares seleccionados */}
              {selectedPlaces.length > 0 && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>
                      📍 Lugares Seleccionados ({selectedPlaces.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {selectedPlaces.map((place) => (
                        <div key={place.place_id} className="border-b pb-3 last:border-b-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{place.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold text-sm">{place.rating}★</span>
                                <span className="text-gray-500 text-sm">({place.user_ratings_total})</span>
                              </div>
                            </div>
                            <button
                              onClick={() => togglePlaceSelection(place)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex gap-2">
                      <Button
                        onClick={handleAddPlaces}
                        disabled={adding}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        {adding ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Añadiendo {selectedPlaces.length} lugar{selectedPlaces.length > 1 ? 'es' : ''}...
                          </>
                        ) : (
                          <>
                            ✅ Añadir {selectedPlaces.length} Lugar{selectedPlaces.length > 1 ? 'es' : ''}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setSelectedPlaces([])}
                        variant="outline"
                      >
                        Limpiar
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-3">
                      Se añadirán como borradores pendientes de enriquecimiento IA
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">💡 Información:</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Solo se muestran lugares con rating ≥4.7★</li>
                <li>• Los lugares se añaden como borradores (no publicados)</li>
                <li>• Necesitarás enriquecerlos con IA antes de publicar</li>
                <li>• Coste: $0.032 por búsqueda + $0.017 por lugar añadido</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

