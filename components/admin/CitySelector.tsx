'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface City {
  name: string;
  province: string;
  population: number;
  coords: { lat: number; lng: number };
}

interface CitySelectorProps {
  province: string;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
}

export function CitySelector({ province, selectedCities, onCitiesChange }: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar ciudades cuando cambia la provincia
  useEffect(() => {
    if (!province) {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/cities?province=${encodeURIComponent(province)}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar ciudades');
        }
        
        const data = await response.json();
        setCities(data.cities || []);
        
        // Auto-seleccionar todas las ciudades por defecto
        if (data.cities && data.cities.length > 0) {
          onCitiesChange(data.cities.map((c: City) => c.name));
        }
      } catch (err: any) {
        console.error('Error loading cities:', err);
        setError(err.message || 'Error al cargar ciudades');
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, [province]);

  const handleToggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      onCitiesChange(selectedCities.filter(c => c !== cityName));
    } else {
      onCitiesChange([...selectedCities, cityName]);
    }
  };

  const handleSelectAll = () => {
    onCitiesChange(cities.map(c => c.name));
  };

  const handleDeselectAll = () => {
    onCitiesChange([]);
  };

  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}k`;
    return pop.toString();
  };

  const getStrategyLabel = (population: number) => {
    if (population > 200000) return { text: 'MÁXIMA', color: 'bg-purple-100 text-purple-800' };
    if (population > 50000) return { text: 'MEDIA', color: 'bg-blue-100 text-blue-800' };
    return { text: 'BÁSICA', color: 'bg-gray-100 text-gray-800' };
  };

  if (!province) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Ciudades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            Selecciona una provincia primero para ver las ciudades disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Ciudades de {province}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Cargando ciudades...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Ciudades de {province}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Ciudades de {province}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ No hay ciudades configuradas para {province}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Seleccionar Ciudades de {province}</CardTitle>
          <Badge variant="secondary">
            {selectedCities.length} / {cities.length} seleccionadas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controles de selección */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1"
            >
              ✓ Todas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              className="flex-1"
            >
              ✗ Ninguna
            </Button>
          </div>

          {/* Lista de ciudades */}
          <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
            {cities.map((city) => {
              const strategy = getStrategyLabel(city.population);
              const isSelected = selectedCities.includes(city.name);

              return (
                <label
                  key={city.name}
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCity(city.name)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{city.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatPopulation(city.population)} hab
                      </p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${strategy.color}`}>
                    {strategy.text}
                  </Badge>
                </label>
              );
            })}
          </div>

          {/* Info sobre estrategias */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p className="font-medium">Estrategias de búsqueda:</p>
            <p>• <span className="font-medium">MÁXIMA</span> {`(>200k hab)`}: 4 búsquedas específicas</p>
            <p>• <span className="font-medium">MEDIA</span> (50k-200k hab): 3 búsquedas</p>
            <p>• <span className="font-medium">BÁSICA</span> {`(<50k hab)`}: 2 búsquedas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

