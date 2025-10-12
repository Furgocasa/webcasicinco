'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface SearchParams {
  country: string;
  regions: string[];
  provinces: string[];
  city?: string;
  radius: number;
  categories: string[];
  minRating: number;
  minReviews: number;
  excludeChains: boolean;
}

interface IndexationFormProps {
  onSearch: (params: SearchParams) => Promise<void>;
  onStartIndexation: (params: SearchParams) => Promise<void>;
  isSearching: boolean;
  searchResults?: number;
  estimatedCost?: number;
  estimatedTime?: number;
}

const REGIONS = [
  'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias',
  'Cantabria', 'Castilla y León', 'Castilla-La Mancha', 'Cataluña',
  'Comunidad Valenciana', 'Extremadura', 'Galicia', 'Madrid',
  'Murcia', 'Navarra', 'País Vasco', 'La Rioja', 'Ceuta', 'Melilla'
];

const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurantes' },
  { value: 'hotel', label: 'Hoteles' },
  { value: 'spa', label: 'Spas y balnearios' },
  { value: 'bar', label: 'Bares y cafeterías' },
  { value: 'tourist_attraction', label: 'Monumentos' },
  { value: 'night_club', label: 'Experiencias' },
];

export function IndexationForm({
  onSearch,
  onStartIndexation,
  isSearching,
  searchResults,
  estimatedCost,
  estimatedTime,
}: IndexationFormProps) {
  const [params, setParams] = useState<SearchParams>({
    country: 'España',
    regions: [],
    provinces: [],
    city: '',
    radius: 10,
    categories: [],
    minRating: 4.7,
    minReviews: 50,
    excludeChains: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSearch(params);
  };

  const handleStartIndexation = async () => {
    await onStartIndexation(params);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Configuración de Búsqueda</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* País */}
          <div>
            <label className="block text-sm font-medium mb-2">País</label>
            <Select
              value={params.country}
              onChange={(e) => setParams({ ...params, country: e.target.value })}
              options={[{ value: 'España', label: 'España' }]}
            />
          </div>

          {/* Regiones */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Comunidades Autónomas (multiselección)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {REGIONS.map((region) => (
                <label key={region} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={params.regions.includes(region)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParams({
                          ...params,
                          regions: [...params.regions, region],
                        });
                      } else {
                        setParams({
                          ...params,
                          regions: params.regions.filter((r) => r !== region),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{region}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ciudad/Zona */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ciudad/Zona (opcional)
            </label>
            <Input
              value={params.city}
              onChange={(e) => setParams({ ...params, city: e.target.value })}
              placeholder="Ej: Marbella"
            />
          </div>

          {/* Radio */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Radio de búsqueda: {params.radius} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={params.radius}
              onChange={(e) =>
                setParams({ ...params, radius: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Categorías */}
          <div>
            <label className="block text-sm font-medium mb-2">Categorías</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((category) => (
                <label key={category.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={params.categories.includes(category.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setParams({
                          ...params,
                          categories: [...params.categories, category.value],
                        });
                      } else {
                        setParams({
                          ...params,
                          categories: params.categories.filter(
                            (c) => c !== category.value
                          ),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating mínimo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Rating mínimo: {params.minRating}★
            </label>
            <input
              type="range"
              min="4.0"
              max="5.0"
              step="0.1"
              value={params.minRating}
              onChange={(e) =>
                setParams({ ...params, minRating: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Reseñas mínimas */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Reseñas mínimas
            </label>
            <Input
              type="number"
              value={params.minReviews}
              onChange={(e) =>
                setParams({ ...params, minReviews: Number(e.target.value) })
              }
              min="1"
            />
          </div>

          {/* Excluir cadenas */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="excludeChains"
              checked={params.excludeChains}
              onChange={(e) =>
                setParams({ ...params, excludeChains: e.target.checked })
              }
              className="rounded"
            />
            <label htmlFor="excludeChains" className="text-sm">
              Excluir cadenas comerciales
            </label>
          </div>

          <Button type="submit" disabled={isSearching} className="w-full">
            {isSearching ? 'Buscando...' : 'Previsualizar Resultados'}
          </Button>
        </form>
      </Card>

      {/* Resultados de búsqueda */}
      {searchResults !== undefined && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Resultados de Búsqueda</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-lg font-medium">
                🎉 Se encontraron {searchResults} lugares que cumplen los criterios
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Estimaciones</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Coste estimado</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${estimatedCost?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiempo estimado</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ~{estimatedTime || 0} minutos
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Desglose de costes</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Búsquedas Google: ${((searchResults || 0) * 0.001).toFixed(2)}</li>
                <li>• Detalles de lugares: ${((searchResults || 0) * 0.017).toFixed(2)}</li>
                <li>• Fotos: ${((searchResults || 0) * 3 * 0.003).toFixed(2)}</li>
                <li>• OpenAI GPT-4: ${((searchResults || 0) * 0.015).toFixed(2)}</li>
              </ul>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button variant="outline" onClick={handleSubmit} className="flex-1">
                ← Ajustar Filtros
              </Button>
              <Button
                onClick={handleStartIndexation}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Iniciar Indexación →
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
