'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PROVINCES, PLACE_CATEGORIES } from '@/lib/utils/constants';
import { toast } from 'sonner';
import { IndexationModal } from '@/components/admin/IndexationModal';
import { getAllCities } from '@/lib/indexation/cities-database';

export default function IndexarPage() {
  // Título del navegador
  useEffect(() => {
    document.title = 'Indexar Lugares - Admin | Casi Cinco';
  }, []);

  const [selectedCity, setSelectedCity] = useState<string>(''); // UNA ciudad
  const [selectedProvince, setSelectedProvince] = useState<string>(''); // UNA provincia
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState<string>(''); // Búsqueda de ciudad
  const [minRating, setMinRating] = useState('4.7');
  const [isIndexing, setIsIndexing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar todas las ciudades
  const allCities = useMemo(() => getAllCities(), []);
  
  // Filtrar ciudades por búsqueda y ordenar alfabéticamente
  const filteredCities = useMemo(() => {
    let cities = allCities;
    if (citySearch.trim()) {
      const search = citySearch.toLowerCase();
      cities = cities.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.province.toLowerCase().includes(search)
      );
    }
    // ✅ Ordenar alfabéticamente por nombre
    return cities.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [allCities, citySearch]);

  // Cuando se selecciona una ciudad, limpiar provincia
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (city) setSelectedProvince(''); // Limpiar provincia
  };

  // Cuando se selecciona una provincia, limpiar ciudad
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    if (province) setSelectedCity(''); // Limpiar ciudad
  };

  // 🆕 Detectar si se debe abrir el modal automáticamente (reanudación desde historial)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlJobId = params.get('jobId');
    const autoOpen = params.get('autoOpen');

    if (urlJobId && autoOpen === 'true') {
      setJobId(urlJobId);
      setShowModal(true);
      // Limpiar los parámetros de la URL sin recargar la página
      window.history.replaceState({}, '', '/admin/indexar');
    }
  }, []);


  const handleStartIndexation = async () => {
    setIsIndexing(true);
    toast.loading('🚀 Iniciando indexación...', { id: 'indexation-start' });
    
    try {
      const response = await fetch('/api/admin/start-indexation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provinces: selectedProvince ? [selectedProvince] : [], // 🆕 UNA provincia o ninguna
          categories: selectedCategories,
          cities: selectedCity ? [selectedCity] : undefined, // 🆕 UNA ciudad o ninguna
          minRating: parseFloat(minRating),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar la indexación');
      }
      
      if (data.job?.id) {
        setJobId(data.job.id);
        setShowModal(true); // 🆕 Abrir el modal
        toast.success('✅ Indexación iniciada', { id: 'indexation-start' });
      }
    } catch (error: any) {
      console.error('Error iniciando indexación:', error);
      toast.error(error.message || 'Error al iniciar la indexación', { id: 'indexation-start' });
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Indexar Lugares</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulario de configuración */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 🏙️ SELECTOR DE CIUDADES (PRIMERO) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  🏙️ Ciudad (opcional)
                </label>
                <input
                  type="text"
                  placeholder="🔍 Buscar ciudad..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  disabled={!!selectedProvince}
                  className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <div className={`h-40 overflow-y-auto border border-gray-300 rounded-lg ${selectedProvince ? 'bg-gray-100' : 'bg-white'}`}>
                  {filteredCities.map((city) => (
                    <button
                      key={`${city.province}-${city.name}`}
                      type="button"
                      disabled={!!selectedProvince}
                      onClick={() => handleCityChange(city.name)}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 transition-colors disabled:cursor-not-allowed ${
                        selectedCity === city.name ? 'bg-blue-100 font-medium' : ''
                      }`}
                    >
                      <span className="font-medium">{city.name}</span>
                      <span className="text-gray-600 text-xs ml-1">({city.province})</span>
                      <span className="text-gray-500 text-xs ml-1">- {(city.population / 1000).toFixed(0)}k hab</span>
                    </button>
                  ))}
                  {filteredCities.length === 0 && (
                    <p className="px-3 py-8 text-sm text-gray-500 text-center">
                      No se encontraron ciudades
                    </p>
                  )}
                </div>
                {selectedCity && (
                  <button
                    type="button"
                    onClick={() => handleCityChange('')}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    ✕ Limpiar selección
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {selectedProvince ? '⚠️ Desactiva provincia para seleccionar ciudad' : 'Haz clic en una ciudad para seleccionarla'}
                </p>
              </div>

              {/* 📍 SELECTOR DE PROVINCIAS (SEGUNDO) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  📍 Provincia (opcional)
                </label>
                <div className={`h-40 overflow-y-auto border border-gray-300 rounded-lg ${selectedCity ? 'bg-gray-100' : 'bg-white'}`}>
                  {PROVINCES.map((province) => (
                    <button
                      key={province}
                      type="button"
                      disabled={!!selectedCity}
                      onClick={() => handleProvinceChange(province)}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 transition-colors disabled:cursor-not-allowed ${
                        selectedProvince === province ? 'bg-blue-100 font-medium' : ''
                      }`}
                    >
                      {province}
                    </button>
                  ))}
                </div>
                {selectedProvince && (
                  <button
                    type="button"
                    onClick={() => handleProvinceChange('')}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    ✕ Limpiar selección
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {selectedCity ? '⚠️ Desactiva ciudad para seleccionar provincia' : 'Haz clic en una provincia para seleccionarla'}
                </p>
              </div>

              {/* 🍽️ CATEGORÍAS (TERCERO) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  🍽️ Categorías
                </label>
                <div className="border border-gray-300 rounded-lg bg-white divide-y">
                  {PLACE_CATEGORIES.map((cat) => (
                    <label
                      key={cat.value}
                      className="flex items-center px-3 py-1.5 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat.value]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat.value));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm">
                        {cat.icon} {cat.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona una o varias categorías
                </p>
              </div>

              {/* ⭐ RATING MÍNIMO */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  ⭐ Rating Mínimo
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="4.7">4.7★ o más (recomendado)</option>
                  <option value="4.8">4.8★ o más</option>
                  <option value="4.9">4.9★ o más</option>
                </select>
              </div>

              {/* 💡 INFO */}
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg">
                <p className="text-xs font-bold text-blue-900 mb-1">💡 Reglas:</p>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>• Selecciona <strong>CIUDAD</strong> O <strong>PROVINCIA</strong> (no ambas)</p>
                  <p>• Ciudad = búsqueda específica en esa ciudad</p>
                  <p>• Provincia = búsqueda en todas sus ciudades</p>
                </div>
              </div>

              {/* Botón de indexación */}
              <div className="pt-4">
                <Button
                  onClick={handleStartIndexation}
                  disabled={isIndexing || (!selectedCity && !selectedProvince) || selectedCategories.length === 0}
                  className="w-full"
                >
                  {isIndexing ? 'Iniciando...' : '🚀 Iniciar Indexación'}
                </Button>
                
                {(!selectedCity && !selectedProvince) && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    Selecciona una ciudad O una provincia
                  </p>
                )}
                
                {selectedCategories.length === 0 && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    Selecciona al menos una categoría
                  </p>
                )}
                
                {(selectedCity || selectedProvince) && selectedCategories.length > 0 && (
                  <p className="text-xs text-green-600 mt-2 text-center">
                    ✅ {selectedCity ? `Ciudad: ${selectedCity}` : `Provincia: ${selectedProvince}`} × {selectedCategories.length} categoría(s)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información del proceso */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>📋 Sistema de 2 Fases Optimizado</CardTitle>
              <CardDescription>
                Búsqueda rápida + Enriquecimiento separado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    🔍 FASE 1: Indexación Rápida <Badge className="bg-blue-600">Este Proceso</Badge>
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>1️⃣ <strong>Text Search por ciudad</strong> (hasta 60 resultados por búsqueda)</p>
                    <p>2️⃣ <strong>Obtener detalles básicos</strong> (rating, reseñas, ubicación)</p>
                    <p>3️⃣ <strong>Filtrar estricto</strong> rating ≥4.7, reseñas ≥50, detectar duplicados</p>
                    <p>4️⃣ <strong>Guardar</strong> como "Pendientes de Enriquecer"</p>
                    <p className="font-bold mt-3 pt-3 border-t border-blue-300">
                      ⏱️ Tiempo: 5-15 min por provincia (ultra-optimizado -75%)
                    </p>
                    <p className="font-bold text-green-700">
                      ✅ Resultado: ~150-250 lugares por provincia con 4.7★
                    </p>
                    <p className="text-xs text-blue-700 pt-1">
                      🗺️ 380 ciudades desde Supabase | 🇪🇸 Cobertura nacional completa
                    </p>
                    <p className="text-xs font-bold text-purple-700 pt-1">
                      🚀 TODA ESPAÑA: ~65 min/categoría = 4-5 horas para 4 categorías
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                  <h3 className="font-bold text-amber-900 mb-3">
                    🎨 FASE 2: Enriquecimiento IA
                  </h3>
                  <div className="space-y-2 text-sm text-amber-800">
                    <p>📸 Descargar fotos → Supabase Storage</p>
                    <p>🤖 Generar descripción con IA</p>
                    <p>📝 Resumir reseñas con IA</p>
                    <p>✨ Generar highlights con IA</p>
                    <p>🚀 Publicar en el mapa</p>
                    <p className="font-bold mt-3 pt-3 border-t border-amber-300">
                      ⏱️ Tiempo: ~3 seg/lugar = 20-30 min por 400 lugares
                    </p>
                    <p className="font-bold text-purple-700">
                      💡 Acceso: Dashboard → "Enriquecer con IA"
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>💰 Ventaja:</strong> Puedes revisar los lugares ANTES de gastar en IA.
                    Si hay duplicados o errores, los eliminas antes de procesarlos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modal flotante profesional */}
      {showModal && jobId && (
        <IndexationModal
          jobId={jobId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
