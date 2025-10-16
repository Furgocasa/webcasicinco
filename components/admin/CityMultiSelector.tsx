'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Importar todas las ciudades del archivo estático
import { getAllCities, type CityData } from '@/lib/indexation/cities-database';

// Tipo extendido que incluye la provincia
type CityWithProvince = CityData & { province: string };

interface CityMultiSelectorProps {
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
}

export function CityMultiSelector({ selectedCities, onCitiesChange }: CityMultiSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Obtener todas las ciudades disponibles
  const allCities = useMemo(() => getAllCities(), []);
  
  // Filtrar ciudades por búsqueda
  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) return allCities;
    
    const search = searchTerm.toLowerCase();
    return allCities.filter(city => 
      city.name.toLowerCase().includes(search) ||
      city.province.toLowerCase().includes(search)
    );
  }, [allCities, searchTerm]);

  // Agrupar por provincias para mejor organización
  const citiesByProvince = useMemo(() => {
    const grouped: Record<string, CityWithProvince[]> = {};
    
    filteredCities.forEach(city => {
      if (!grouped[city.province]) {
        grouped[city.province] = [];
      }
      grouped[city.province].push(city);
    });
    
    return grouped;
  }, [filteredCities]);

  const handleToggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      onCitiesChange(selectedCities.filter(c => c !== cityName));
    } else {
      onCitiesChange([...selectedCities, cityName]);
    }
  };

  const handleSelectAll = () => {
    onCitiesChange(filteredCities.map(c => c.name));
  };

  const handleDeselectAll = () => {
    onCitiesChange([]);
  };

  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}k`;
    return pop.toString();
  };

  const getStrategyBadge = (population: number) => {
    if (population > 200000) return { text: 'MÁXIMA', color: 'bg-purple-100 text-purple-800' };
    if (population > 50000) return { text: 'MEDIA', color: 'bg-blue-100 text-blue-800' };
    return { text: 'BÁSICA', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ciudades (Opcional)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Selecciona ciudades específicas o deja vacío para indexar por provincia
            </p>
          </div>
          <Badge variant="secondary">
            {selectedCities.length} / {allCities.length} seleccionadas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Buscador */}
          <div>
            <input
              type="text"
              placeholder="🔍 Buscar ciudad o provincia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Controles */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
            >
              ✓ Todas ({filteredCities.length})
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              ✗ Ninguna
            </button>
          </div>

          {/* Lista de ciudades agrupadas por provincia */}
          <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
            {Object.keys(citiesByProvince).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No se encontraron ciudades</p>
                <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
              </div>
            ) : (
              Object.entries(citiesByProvince)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([province, cities]) => (
                  <div key={province}>
                    {/* Encabezado de provincia */}
                    <div className="bg-gray-50 px-3 py-2 font-medium text-sm text-gray-700 sticky top-0">
                      {province} ({cities.length})
                    </div>
                    
                    {/* Ciudades de la provincia */}
                    {cities
                      .sort((a, b) => b.population - a.population)
                      .map((city) => {
                        const strategy = getStrategyBadge(city.population);
                        const isSelected = selectedCities.includes(city.name);

                        return (
                          <label
                            key={`${city.province}-${city.name}`}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
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
                ))
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">💡 Consejo:</p>
            <p>• Si NO seleccionas ciudades → indexa provincias completas</p>
            <p>• Si seleccionas ciudades → indexa SOLO esas ciudades</p>
            <p>• Combina con provincias para filtrar aún más</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

