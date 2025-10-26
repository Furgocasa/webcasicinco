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
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  
  // Estados para autocompletado
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Referencias
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout>();

  // Inicializar servicio de autocompletado cuando Google Maps esté cargado
  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Función para obtener sugerencias
  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 2 || !autocompleteService.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      autocompleteService.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'es' },
          types: ['establishment'],
          language: 'es',
        },
        (predictions, status) => {
          setIsLoadingSuggestions(false);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
            setSelectedSuggestionIndex(-1);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setIsLoadingSuggestions(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Manejar cambios en el input con debounce
  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    
    // Limpiar timeout anterior
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    // Esperar 300ms antes de buscar sugerencias (debounce)
    suggestionsTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Manejar selección de sugerencia
  const handleSelectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
    setSearchTerm(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) {
      toast.error('Escribe al menos 3 caracteres');
      return;
    }

    // Cerrar sugerencias
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);

    setSearching(true);
    setResults([]);
    setSelectedPlace(null);

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

  const handleAddPlace = async () => {
    if (!selectedPlace) return;

    setAdding(true);
    try {
      const res = await fetch('/api/admin/add-manual-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: selectedPlace.place_id }),
      });

      const data = await res.json();

      if (data.success) {
        setTotalCost(prev => prev + data.cost);
        toast.success('✅ Lugar añadido! Pendiente de enriquecimiento IA');
        
        // Quitar de resultados
        setResults(results.filter(p => p.place_id !== selectedPlace.place_id));
        setSelectedPlace(null);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error añadiendo lugar');
    } finally {
      setAdding(false);
    }
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
            <div className="flex-1 relative" ref={inputRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Ej: Restaurante El Patio, Madrid"
                value={searchTerm}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // Mostrar sugerencias si ya hay búsqueda previa
                  if (searchTerm.length >= 2 && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition-all"
                disabled={searching}
              />
              
              {/* Dropdown de sugerencias estilo Google */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-[400px] overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                        index === selectedSuggestionIndex
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          index === selectedSuggestionIndex ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${
                            index === selectedSuggestionIndex ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Indicador de carga */}
              {isLoadingSuggestions && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
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
          <h2 className="text-xl font-bold mb-4">
            📋 Resultados 
            {results.length > 0 && ` (${results.length})`}
          </h2>
          
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
                    selectedPlace?.place_id === place.place_id
                      ? 'border-primary border-2 shadow-md'
                      : 'hover:border-gray-300 hover:shadow'
                  }`}
                  onClick={() => setSelectedPlace(place)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
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
                      {selectedPlace?.place_id === place.place_id && (
                        <div className="ml-3">
                          <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                        </div>
                      )}
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
                      selectedPlace
                        ? selectedPlace.location
                        : { lat: 40.4168, lng: -3.7038 }
                    }
                    zoom={selectedPlace ? 15 : 6}
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
                        onClick={() => setSelectedPlace(place)}
                        icon={{
                          url: place.place_id === selectedPlace?.place_id
                            ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                            : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        }}
                      />
                    ))}
                  </GoogleMap>
                </div>
              </Card>

              {/* Detalles del lugar seleccionado */}
              {selectedPlace && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="flex-1">{selectedPlace.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-lg">{selectedPlace.rating}★</span>
                        <span className="text-gray-600">
                          ({selectedPlace.user_ratings_total} reseñas)
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{selectedPlace.address}</span>
                      </div>

                      {selectedPlace.rating >= 4.7 ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800 font-medium">
                            ✅ Cumple requisitos (≥4.7★)
                          </p>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800 font-medium">
                            ❌ No cumple requisitos (&lt;4.7★)
                          </p>
                        </div>
                      )}

                      <div className="pt-3 flex gap-2">
                        <Button
                          onClick={handleAddPlace}
                          disabled={adding || selectedPlace.rating < 4.7}
                          className="flex-1"
                          size="lg"
                        >
                          {adding ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Añadiendo...
                            </>
                          ) : (
                            <>
                              ✅ Añadir Lugar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setSelectedPlace(null)}
                          variant="outline"
                        >
                          Cancelar
                        </Button>
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        Se añadirá como borrador pendiente de enriquecimiento IA
                      </p>
                    </div>
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

