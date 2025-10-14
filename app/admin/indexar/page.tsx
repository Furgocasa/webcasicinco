'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PROVINCES, PLACE_CATEGORIES } from '@/lib/utils/constants';
import { toast } from 'sonner';

export default function IndexarPage() {
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState('4.7');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleCancelJob = async () => {
    if (!jobId) return;
    
    if (!confirm('¿Estás seguro de que quieres cancelar la indexación?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/cancel-indexation/${jobId}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar');
      }
      
      toast.success('✅ Indexación cancelada');
      
      // Actualizar estado
      setIsIndexing(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Refrescar estado del job manualmente
      const statusResponse = await fetch(`/api/admin/indexation-status?jobId=${jobId}`);
      const statusData = await statusResponse.json();
      if (statusData.success && statusData.job) {
        setJobStatus(statusData.job);
      }
      
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    toast.info('🔍 Buscando lugares...');
    
    try {
      const response = await fetch('/api/admin/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provinces: selectedProvinces,
          categories: selectedCategories,
          minRating: parseFloat(minRating),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar lugares');
      }
      
      setSearchResults(data.places || []);
      toast.success(`✅ ${data.places?.length || 0} lugares encontrados`);
    } catch (error: any) {
      console.error('Error buscando lugares:', error);
      toast.error(error.message || 'Error al buscar lugares');
    } finally {
      setIsSearching(false);
    }
  };

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
          minRating: parseFloat(minRating),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar la indexación');
      }
      
      if (data.job?.id) {
        setJobId(data.job.id);
        // Iniciar polling del estado
        pollJobStatus(data.job.id);
        toast.success('✅ Indexación iniciada correctamente', { id: 'indexation-start' });
      }
    } catch (error: any) {
      console.error('Error iniciando indexación:', error);
      toast.error(error.message || 'Error al iniciar la indexación', { id: 'indexation-start' });
    } finally {
      setIsIndexing(false);
    }
  };

  const pollJobStatus = async (id: string) => {
    // Limpiar intervalo previo si existe
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/indexation-status?jobId=${id}`);
        const data = await response.json();
        
        if (data.success && data.job) {
          setJobStatus(data.job);
          
          // Detener polling si el trabajo terminó
          if (['completed', 'failed'].includes(data.job.status)) {
            clearInterval(interval);
            setPollingInterval(null);
            
            if (data.job.status === 'completed') {
              toast.success(`🎉 Indexación completada: ${data.job.successful_places} lugares guardados`);
            } else {
              toast.error(`❌ Indexación fallida`);
            }
          }
        }
      } catch (error) {
        console.error('Error obteniendo estado:', error);
      }
    }, 2000); // Cada 2 segundos

    setPollingInterval(interval);
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
                    <p>1️⃣ <strong>Búsqueda exhaustiva</strong> en Google Maps (sin filtros)</p>
                    <p>2️⃣ <strong>Obtener detalles básicos</strong> (rating, reseñas, ubicación)</p>
                    <p>3️⃣ <strong>Filtrar</strong> rating ≥4.7, reseñas ≥20, detectar duplicados</p>
                    <p>4️⃣ <strong>Guardar</strong> como "Pendientes de Enriquecer"</p>
                    <p className="font-bold mt-3 pt-3 border-t border-blue-300">
                      ⏱️ Tiempo: 30-60 min para todas las provincias
                    </p>
                    <p className="font-bold text-green-700">
                      ✅ Resultado: ~3,500 lugares aprobados (SIN IA aún)
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
                      ⏱️ Tiempo: ~3 seg/lugar = 3-5 horas para 3,500
                    </p>
                    <p className="font-bold text-purple-700">
                      💡 Acceso: Dashboard → "Enriquecer con IA"
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>💰 Ventaja:</strong> Puedes revisar los 3,500 lugares ANTES de gastar en IA.
                    Si hay duplicados o errores, los eliminas antes de procesarlos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado del Trabajo */}
          {jobStatus && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Estado de la Indexación</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      Job ID: {jobId}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open(`/admin/trabajos`, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    Ver en Historial →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Barra de progreso */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Progreso</span>
                      <span>{jobStatus.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${jobStatus.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-blue-700">🔍 Encontrados</div>
                      <div className="text-xl font-bold text-blue-700">{jobStatus.total_places || 0}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">🔄 Procesados</div>
                      <div className="text-xl font-bold">{jobStatus.processed_places || 0}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-700">✅ Guardados</div>
                      <div className="text-xl font-bold text-green-700">{jobStatus.successful_places || 0}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-xs text-yellow-700">⏭️ Descartados</div>
                      <div className="text-xl font-bold text-yellow-700">
                        {((jobStatus.error_log?.lowRating || 0) + (jobStatus.error_log?.lowReviews || 0) + (jobStatus.error_log?.skipped || 0))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Desglose de descartados */}
                  {jobStatus.error_log && (jobStatus.error_log.lowRating > 0 || jobStatus.error_log.lowReviews > 0 || jobStatus.error_log.skipped > 0) && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-xs font-semibold text-amber-900 mb-2">📋 Desglose de descartados:</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {jobStatus.error_log.lowRating > 0 && (
                          <div className="text-amber-800">
                            📉 Rating bajo: <strong>{jobStatus.error_log.lowRating}</strong>
                          </div>
                        )}
                        {jobStatus.error_log.lowReviews > 0 && (
                          <div className="text-amber-800">
                            📊 Pocas reseñas: <strong>{jobStatus.error_log.lowReviews}</strong>
                          </div>
                        )}
                        {jobStatus.error_log.skipped > 0 && (
                          <div className="text-amber-800">
                            🔄 Duplicados: <strong>{jobStatus.error_log.skipped}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Errores reales */}
                  {jobStatus.failed_places > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg mt-2">
                      <div className="text-xs text-red-700">❌ Errores técnicos (fallo de API)</div>
                      <div className="text-xl font-bold text-red-700">{jobStatus.failed_places || 0}</div>
                    </div>
                  )}

                  {/* Estado */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Estado:</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        jobStatus.status === 'completed' ? 'bg-green-100 text-green-700' :
                        jobStatus.status === 'running' ? 'bg-blue-100 text-blue-700' :
                        jobStatus.status === 'failed' ? 'bg-red-100 text-red-700' :
                        jobStatus.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {jobStatus.status === 'pending' ? '⏳ Pendiente' :
                         jobStatus.status === 'running' ? (jobStatus.total_places > 0 && jobStatus.processed_places === 0 ? '🔍 Buscando lugares...' : '🔄 Procesando lugares') :
                         jobStatus.status === 'completed' ? '✅ Completado' :
                         jobStatus.status === 'failed' ? '❌ Fallido' :
                         jobStatus.status === 'cancelled' ? '🛑 Cancelado' :
                         jobStatus.status}
                      </span>
                      {jobStatus.status === 'running' && (
                        <Button
                          onClick={handleCancelJob}
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                        >
                          🛑 Cancelar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mensaje durante búsqueda */}
                  {jobStatus.status === 'running' && jobStatus.total_places > 0 && jobStatus.processed_places === 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        🔍 <strong>Fase de búsqueda activa</strong>
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Se encontraron <strong>{jobStatus.total_places} lugares únicos</strong> hasta ahora. 
                        Cuando termine la búsqueda, comenzará el procesamiento y verás el progreso avanzar.
                      </p>
                    </div>
                  )}

                  {/* Mensaje sobre errores técnicos */}
                  {jobStatus.failed_places > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        ⚠️ <strong>{jobStatus.failed_places} errores técnicos</strong>
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Posibles causas: timeout de Google API, timeout de OpenAI, límite de cuota alcanzado, error de red, o error al guardar en BD.
                      </p>
                      <p className="text-xs text-red-700 mt-2">
                        💡 Si hay muchos errores, intenta de nuevo más tarde (puede ser límite temporal de API).
                      </p>
                    </div>
                  )}

                  {/* Mensaje de éxito completo */}
                  {jobStatus.status === 'completed' && jobStatus.successful_places > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        🎉 <strong>¡Indexación completada!</strong>
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Ve a <strong>"Gestión de Lugares"</strong> para revisar y publicar los {jobStatus.successful_places} lugares encontrados.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
