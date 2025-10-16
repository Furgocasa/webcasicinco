'use client';

// Sin caché para admin - ver cambios al instante
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PROVINCES, PLACE_CATEGORIES } from '@/lib/utils/constants';
import { toast } from 'sonner';
import { IndexationModal } from '@/components/admin/IndexationModal';
import { CitySelector } from '@/components/admin/CitySelector';

export default function IndexarPage() {
  // Título del navegador
  useEffect(() => {
    document.title = 'Indexar Lugares - Admin | Casi Cinco';
  }, []);

  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]); // 🆕 Ciudades seleccionadas
  const [minRating, setMinRating] = useState('4.7');
  const [isIndexing, setIsIndexing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // 🆕 Control del modal

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
          provinces: selectedProvinces,
          categories: selectedCategories,
          cities: selectedCities.length > 0 ? selectedCities : undefined, // 🆕 Enviar ciudades si están seleccionadas
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
              {/* Provincias */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Provincias
                </label>
                <select
                  multiple
                  value={selectedProvinces}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    setSelectedProvinces(options.map(opt => opt.value));
                  }}
                  className="flex h-32 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Mantén Ctrl/Cmd para seleccionar múltiples
                </p>
              </div>

              {/* Categorías */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Categorías
                </label>
                <select
                  multiple
                  value={selectedCategories}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions);
                    setSelectedCategories(options.map(opt => opt.value));
                  }}
                  className="flex h-32 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {PLACE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating mínimo */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Rating Mínimo
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="4.7">4.7★ o más</option>
                  <option value="4.8">4.8★ o más</option>
                  <option value="4.9">4.9★ o más</option>
                </select>
              </div>

              {/* Advertencia para múltiples provincias */}
              {selectedProvinces.length > 1 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>⚠️ Recomendación:</strong> Para mejor estabilidad, indexa <strong>UNA provincia a la vez</strong>.
                    Múltiples provincias pueden tardar 30-90 minutos.
                  </p>
                </div>
              )}
              
              {/* 🆕 Info del sistema optimizado */}
              {selectedProvinces.length > 0 && selectedCategories.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg space-y-2">
                  <p className="text-xs font-bold text-blue-900">
                    🎯 Sistema Text Search Optimizado por Ciudad
                  </p>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p>✅ Text Search por ciudad (hasta 60 resultados/búsqueda, pausas 10s)</p>
                    <p>• Ciudades grandes (&gt;200k): <strong>2 búsquedas</strong> (general + calidad)</p>
                    <p>• Ciudades medianas (50k-200k): <strong>1 búsqueda</strong></p>
                    <p>• Ciudades pequeñas (&lt;50k): <strong>1 búsqueda</strong></p>
                    <p className="font-bold text-green-700 pt-1">
                      ⚡ Máxima eficiencia: 380 ciudades × 1-2 búsquedas = cobertura nacional
                    </p>
                  </div>
                </div>
              )}

              {/* Botón de indexación */}
              <div className="pt-4">
                <Button
                  onClick={handleStartIndexation}
                  disabled={isIndexing || selectedProvinces.length === 0 || selectedCategories.length === 0}
                  className="w-full"
                >
                  {isIndexing ? 'Iniciando...' : '🚀 Iniciar Indexación'}
                </Button>
                
                {(selectedProvinces.length === 0 || selectedCategories.length === 0) && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    Selecciona al menos una provincia y una categoría
                  </p>
                )}
                
                {selectedProvinces.length === 1 && selectedCategories.length > 0 && (
                  <p className="text-xs text-green-600 mt-2 text-center">
                    ✅ Configuración óptima: 1 provincia × {selectedCategories.length} categoría(s)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 🆕 Selector de ciudades (solo si hay una provincia seleccionada) */}
          {selectedProvinces.length === 1 && (
            <div className="mt-6">
              <CitySelector
                province={selectedProvinces[0]}
                selectedCities={selectedCities}
                onCitiesChange={setSelectedCities}
              />
            </div>
          )}
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
