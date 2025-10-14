'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2, CheckCircle, XCircle, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function EnriquecerPage() {
  const [pendingCount, setPendingCount] = useState(0);
  const [enriching, setEnriching] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadPendingCount();
    checkActiveJob();

    // Recargar contador cada 10 segundos
    const reloadInterval = setInterval(() => {
      loadPendingCount();
    }, 10000);

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      clearInterval(reloadInterval);
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const response = await fetch('/api/admin/enrich-pending');
      const data = await response.json();
      
      if (data.success && data.stats) {
        setPendingCount(data.stats.pending);
      }
    } catch (error) {
      console.error('Error cargando pendientes:', error);
    }
  };

  const checkActiveJob = async () => {
    try {
      const response = await fetch('/api/admin/enrichment-status');
      const data = await response.json();
      
      if (data.success && data.job && data.job.status === 'running') {
        setJobStatus(data.job);
        startPolling();
      }
    } catch (error) {
      console.error('Error verificando job activo:', error);
    }
  };

  const startEnrichment = async () => {
    if (!confirm(`¿Enriquecer ${pendingCount} lugares con IA?\n\nTiempo estimado: ~${Math.round(pendingCount * 3 / 60)} minutos`)) {
      return;
    }

    setEnriching(true);
    
    try {
      const response = await fetch('/api/admin/enrich-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 100 })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('✅ Enriquecimiento iniciado');
        startPolling();
      } else {
        toast.error(data.error || 'Error al iniciar');
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setEnriching(false);
    }
  };

  const startPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/enrichment-status');
        const data = await response.json();
        
        if (data.success && data.job) {
          setJobStatus(data.job);
          
          if (['completed', 'failed'].includes(data.job.status)) {
            clearInterval(interval);
            setPollingInterval(null);
            loadPendingCount();
            
            if (data.job.status === 'completed') {
              toast.success(`🎉 Enriquecimiento completado: ${data.job.successful_places} lugares publicados`);
            }
          }
        }
      } catch (error) {
        console.error('Error en polling:', error);
      }
    }, 3000); // Cada 3 segundos

    setPollingInterval(interval);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎨 Enriquecimiento con IA</h1>
        <p className="text-gray-600 mt-1">Proceso de Fase 2: Fotos + Descripción + Categorización</p>
      </div>

      {/* Card de lugares pendientes */}
      <Card className="border-2 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-600" />
            Lugares Pendientes de Enriquecer
          </CardTitle>
          <CardDescription>
            Lugares que pasaron el filtro de FASE 1 y están listos para procesar con IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-6xl font-bold text-amber-600 mb-2">
              {pendingCount}
            </div>
            <p className="text-gray-600 mb-4">lugares pendientes</p>
            
            {pendingCount > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  ⏱️ Tiempo estimado: ~{Math.round(pendingCount * 3 / 60)} minutos
                  ({Math.round(pendingCount * 3 / 60 / 60)} horas)
                </p>
                
                <Button
                  onClick={startEnrichment}
                  disabled={enriching || (jobStatus && jobStatus.status === 'running')}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                >
                  {enriching ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Target className="h-5 w-5 mr-2" />
                      Iniciar Enriquecimiento
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {pendingCount === 0 && (
              <div className="text-green-600">
                <CheckCircle className="h-16 w-16 mx-auto mb-2" />
                <p>Todos los lugares están enriquecidos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estado del enriquecimiento */}
      {jobStatus && jobStatus.status === 'running' && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Estado del Enriquecimiento</CardTitle>
            <CardDescription className="font-mono text-xs">
              Job ID: {jobStatus.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Barra de progreso */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progreso</span>
                  <span>{jobStatus.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-2xl font-bold">{jobStatus.total_places || 0}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-700">Procesados</div>
                  <div className="text-2xl font-bold text-blue-700">{jobStatus.processed_places || 0}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-700">✅ Publicados</div>
                  <div className="text-2xl font-bold text-green-700">{jobStatus.successful_places || 0}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-xs text-amber-700">⏭️ Descartados IA</div>
                  <div className="text-2xl font-bold text-amber-700">{jobStatus.discarded_by_ai || 0}</div>
                </div>
              </div>

              {jobStatus.failed_places > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xs text-red-700">❌ Errores</div>
                  <div className="text-xl font-bold text-red-700">{jobStatus.failed_places || 0}</div>
                </div>
              )}

              {/* Estado */}
              <div className="pt-2 border-t">
                <Badge className="bg-blue-500">🔄 Enriqueciendo con IA...</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Qué hace el enriquecimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1️⃣ <strong>Categorización IA:</strong> Analiza nombre, reseñas y decide la categoría correcta (restaurante/bar/cafe/hotel)</p>
            <p>2️⃣ <strong>Fotos:</strong> Descarga 5 fotos de Google y las sube a Supabase Storage</p>
            <p>3️⃣ <strong>Descripción:</strong> Genera descripción atractiva con IA</p>
            <p>4️⃣ <strong>Resumen:</strong> Resume reseñas de clientes con IA</p>
            <p>5️⃣ <strong>Highlights:</strong> Extrae puntos clave con IA</p>
            <p>6️⃣ <strong>Publicar:</strong> Marca como published=true y aparece en el mapa</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

