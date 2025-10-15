'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface IndexationModalProps {
  jobId: string;
  onClose: () => void;
}

interface IndexationLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface JobStatus {
  id: string;
  status: string;
  total_places: number;
  processed_places: number;
  successful_places: number;
  failed_places: number;
  progress: number;
  error_log?: {
    lowRating?: number;
    lowReviews?: number;
    chains?: number;
    duplicates?: number;
    skipped?: number;
  };
  logs?: IndexationLog[];
  started_at?: string;
  completed_at?: string;
}

export function IndexationModal({ jobId, onClose }: IndexationModalProps) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoClose, setAutoClose] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Polling cada 2s para actualizar estado
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/admin/indexation-status?jobId=${jobId}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.job);
          
          // Si el trabajo cambió de paused a running, quitar el estado de reanudación
          if (data.job.status === 'running' && isResuming) {
            setIsResuming(false);
          }
          
          // Auto-scroll al final del log
          setTimeout(() => {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          
          // Si terminó, auto-cerrar después de 5 segundos
          if (['completed', 'failed', 'cancelled'].includes(data.job.status) && !autoClose) {
            setAutoClose(true);
            setTimeout(() => {
              onClose();
            }, 5000);
          }
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    // Detectar si es un trabajo reanudado
    const isResumedJob = window.location.search.includes('autoOpen=true');
    if (isResumedJob) {
      setIsResuming(true);
    }

    // Fetch inmediato
    fetchStatus();

    // Para trabajos reanudados, hacer fetch más frecuente al inicio
    const initialInterval = isResumedJob ? 500 : 1000; // 500ms para trabajos reanudados
    const normalInterval = 1000; // 1s normal

    // Polling inicial más frecuente para trabajos reanudados
    const initialTimeout = setTimeout(() => {
      const interval = setInterval(fetchStatus, normalInterval);
      return () => clearInterval(interval);
    }, 3000); // Después de 3 segundos, volver al polling normal

    // Polling inmediato más frecuente
    const interval = setInterval(fetchStatus, initialInterval);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [jobId, autoClose, onClose, isResuming]);

  const handlePause = async () => {
    if (!confirm('¿Pausar la indexación? Podrás reanudarla más tarde desde el historial.')) return;
    
    setIsPausing(true);
    try {
      const res = await fetch(`/api/admin/pause-indexation/${jobId}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        // El polling actualizará el estado automáticamente
      } else {
        alert(data.error || 'Error al pausar');
      }
    } catch (error) {
      console.error('Error pausando:', error);
      alert('Error al pausar la indexación');
    } finally {
      setIsPausing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('⚠️ ¿Seguro que quieres CANCELAR? Se perderá el progreso actual y no se podrá reanudar.')) return;
    
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/admin/cancel-indexation/${jobId}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        // El polling actualizará el estado automáticamente
      } else {
        alert(data.error || 'Error al cancelar');
      }
    } catch (error) {
      console.error('Error cancelando:', error);
      alert('Error al cancelar la indexación');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    if (job?.status === 'running') {
      if (!confirm('⚠️ La indexación está en proceso.\n\nSi cierras esta ventana, el proceso CONTINUARÁ en segundo plano.\n\n¿Cerrar ventana?')) {
        return;
      }
    }
    onClose();
  };

  if (!job) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </Card>
      </div>
    );
  }

  const descartados = (job.error_log?.lowRating || 0) + 
                      (job.error_log?.lowReviews || 0) + 
                      (job.error_log?.chains || 0) + 
                      (job.error_log?.duplicates || job.error_log?.skipped || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white">
        <div className="sticky top-0 bg-white border-b p-3 sm:p-6 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-2">
                  {isResuming && job.status === 'paused' && '🔄 Reanudando Indexación...'}
                  {!isResuming && job.status === 'running' && '🔄 Indexación en Progreso'}
                  {!isResuming && job.status === 'paused' && '⏸️ Indexación Pausada'}
                  {job.status === 'completed' && '✅ Indexación Completada'}
                  {job.status === 'failed' && '❌ Indexación Fallida'}
                  {job.status === 'cancelled' && '🛑 Indexación Cancelada'}
                </span>
                
                {job.status === 'running' && !isResuming && (
                  <Badge className="bg-blue-600 text-white animate-pulse text-xs">
                    En vivo
                  </Badge>
                )}
                
                {isResuming && (
                  <Badge className="bg-orange-600 text-white animate-pulse text-xs">
                    Reanudando...
                  </Badge>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-mono">
                Job ID: {jobId.slice(0, 8)}...
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl font-bold leading-none flex-shrink-0"
              title="Cerrar (el proceso continuará en segundo plano)"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="font-medium">Progreso General</span>
              <span className="font-bold text-indigo-600">{job.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 flex items-center justify-center text-xs font-semibold ${
                  job.status === 'completed' ? 'bg-green-600' :
                  job.status === 'failed' ? 'bg-red-600' :
                  job.status === 'paused' ? 'bg-yellow-600' :
                  job.status === 'cancelled' ? 'bg-gray-600' :
                  'bg-indigo-600 animate-pulse'
                }`}
                style={{ width: `${Math.max(job.progress || 0, 3)}%` }}
              >
                {job.progress >= 10 && (
                  <span className="text-white text-xs">{job.progress}%</span>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas en cuadrícula */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-blue-50 p-2 sm:p-4 rounded-lg border-2 border-blue-200">
              <div className="text-xs text-blue-700 font-semibold mb-1">🔍 Encontrados</div>
              <div className="text-xl sm:text-3xl font-bold text-blue-700">{job.total_places}</div>
            </div>
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg border-2 border-gray-200">
              <div className="text-xs text-gray-600 font-semibold mb-1">🔄 Procesados</div>
              <div className="text-xl sm:text-3xl font-bold text-gray-700">{job.processed_places}</div>
            </div>
            <div className="bg-green-50 p-2 sm:p-4 rounded-lg border-2 border-green-200">
              <div className="text-xs text-green-700 font-semibold mb-1">✅ Guardados</div>
              <div className="text-xl sm:text-3xl font-bold text-green-700">{job.successful_places}</div>
            </div>
            <div className="bg-yellow-50 p-2 sm:p-4 rounded-lg border-2 border-yellow-200">
              <div className="text-xs text-yellow-700 font-semibold mb-1">⏭️ Descartados</div>
              <div className="text-xl sm:text-3xl font-bold text-yellow-700">{descartados}</div>
            </div>
          </div>

          {/* Log en tiempo real */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                📜 Log en Tiempo Real
                {job.logs && job.logs.length > 0 && (
                  <Badge variant="info" className="text-xs">
                    {job.logs.length} mensajes
                  </Badge>
                )}
              </h3>
              {job.status === 'running' && (
                <Badge className="bg-green-600 text-white animate-pulse text-xs">
                  ● Actualizando en tiempo real
                </Badge>
              )}
            </div>
            
            <div className="bg-gray-900 text-gray-100 rounded-lg p-2 sm:p-4 h-60 sm:h-80 overflow-y-auto font-mono text-xs shadow-inner">
              {job.logs && job.logs.length > 0 ? (
                <div className="space-y-1">
                  {job.logs.map((log, index) => (
                    <div
                      key={index}
                      className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'success' ? 'text-green-400' :
                        log.level === 'warning' ? 'text-yellow-400' :
                        'text-gray-300'
                      }`}
                    >
                      <span className="text-gray-500 shrink-0 select-none text-xs">
                        {new Date(log.timestamp).toLocaleTimeString('es-ES')}
                      </span>
                      <span className="break-all text-xs sm:text-xs">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              ) : (
                <div className="text-gray-500 text-center py-6 sm:py-8 flex flex-col items-center gap-2">
                  <div className="animate-spin text-3xl sm:text-4xl">⏳</div>
                  <div className="text-sm">Esperando logs del proceso...</div>
                  {job.status === 'running' && (
                    <div className="text-xs text-gray-600 mt-2 text-center">
                      El proceso acaba de iniciar, los logs aparecerán en breve
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botones de control */}
          <div className="pt-4 border-t">
            {/* Botones principales - responsive */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
              {job.status === 'running' && (
                <>
                  <Button
                    onClick={handlePause}
                    disabled={isPausing}
                    variant="outline"
                    size="sm"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 w-full sm:w-auto"
                  >
                    {isPausing ? 'Pausando...' : '⏸️ Pausar'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                  >
                    {isCancelling ? 'Cancelando...' : '🛑 Cancelar'}
                  </Button>
                </>
              )}
              
              <Button
                onClick={() => window.open('/admin/trabajos', '_blank')}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                📊 Ver Historial
              </Button>

              {['completed', 'failed', 'cancelled'].includes(job.status) && (
                <Button 
                  onClick={onClose} 
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                >
                  Cerrar
                </Button>
              )}

              {job.status === 'running' && (
                <Button 
                  onClick={handleClose} 
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Ocultar (continúa en 2º plano)</span>
                  <span className="sm:hidden">Ocultar</span>
                </Button>
              )}
            </div>
          </div>

          {/* Mensaje de estado final */}
          {job.status === 'completed' && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 sm:p-4">
              <p className="text-green-800 font-semibold text-center text-sm sm:text-base">
                🎉 ¡Indexación completada exitosamente!
              </p>
              <p className="text-green-700 text-xs sm:text-sm text-center mt-2">
                {job.successful_places} lugares guardados • Ve a "Gestión de Lugares" para revisarlos
              </p>
              {autoClose && (
                <p className="text-green-600 text-xs text-center mt-2 animate-pulse">
                  Esta ventana se cerrará automáticamente en 5 segundos...
                </p>
              )}
            </div>
          )}

          {job.status === 'paused' && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 sm:p-4">
              <p className="text-yellow-800 font-semibold text-center text-sm sm:text-base">
                ⏸️ Indexación pausada
              </p>
              <p className="text-yellow-700 text-xs sm:text-sm text-center mt-2">
                Puedes cerrar esta ventana y reanudar más tarde desde el "Historial de Trabajos"
              </p>
            </div>
          )}

          {job.status === 'cancelled' && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 sm:p-4">
              <p className="text-gray-800 font-semibold text-center text-sm sm:text-base">
                🛑 Indexación cancelada
              </p>
              <p className="text-gray-700 text-xs sm:text-sm text-center mt-2">
                El proceso fue detenido manualmente
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

