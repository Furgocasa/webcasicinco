'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Play, Pause, X, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface JobStatus {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  total_places: number;
  processed_places: number;
  successful_places: number;
  failed_places: number;
  error_log?: {
    lowRating: number;
    lowReviews: number;
    chains: number;
    duplicates: number;
    errors: number;
  };
  logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
  started_at?: string;
  completed_at?: string;
  provinces: string[];
  categories: string[];
}

interface LiveJobProgressProps {
  jobId: string;
  onStatusChange?: (status: string) => void;
}

export function LiveJobProgress({ jobId, onStatusChange }: LiveJobProgressProps) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Polling cada 2s para actualizar estado
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/admin/indexation-status?jobId=${jobId}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.job);
          
          // Auto-scroll al final del log si está expandido
          if (isExpanded) {
            setTimeout(() => {
              logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
          
          // Notificar cambio de estado
          if (onStatusChange && data.job.status !== job?.status) {
            onStatusChange(data.job.status);
          }
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    // Fetch inmediato
    fetchStatus();

    // Polling cada 2 segundos para trabajos en progreso
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, isExpanded, job?.status, onStatusChange]);

  const handlePause = async () => {
    setIsPausing(true);
    try {
      const res = await fetch(`/api/admin/pause-indexation/${jobId}`, { method: 'POST' });
      const data = await res.json();
      
      if (!data.success) {
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
      
      if (!data.success) {
        alert(data.error || 'Error al cancelar');
      }
    } catch (error) {
      console.error('Error cancelando:', error);
      alert('Error al cancelar la indexación');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Trabajo eliminado correctamente');
        // Notificar al componente padre que el trabajo fue eliminado
        if (onStatusChange) {
          onStatusChange('deleted');
        }
      } else {
        toast.error(data.error || 'Error al eliminar el trabajo');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el trabajo');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!job) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-blue-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-blue-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Solo mostrar para trabajos en progreso
  if (!['running', 'paused'].includes(job.status)) {
    return null;
  }

  const descartados = (job.error_log?.lowRating || 0) + 
                      (job.error_log?.lowReviews || 0) + 
                      (job.error_log?.chains || 0) + 
                      (job.error_log?.duplicates || 0);

  const progressPercentage = job.total_places > 0 
    ? Math.round((job.processed_places / job.total_places) * 100)
    : 0;

  return (
    <Card className={`border-2 ${job.status === 'running' ? 'border-blue-300 bg-blue-50' : 'border-yellow-300 bg-yellow-50'}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">
              {job.status === 'running' ? '🚀 Indexación en Progreso' : '⏸️ Indexación Pausada'}
            </h3>
            {job.status === 'running' && (
              <Badge variant="default" className="bg-green-500 text-white">
                En vivo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isExpanded ? 'Ocultar' : 'Ver'} Log
            </Button>
            
            {/* Botón de eliminar en el header para trabajos pausados */}
            {job.status === 'paused' && (
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-500 hover:bg-red-50"
                title="Eliminar trabajo"
              >
                {isDeleting ? '...' : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Job ID */}
        <div className="text-sm text-gray-600 mb-3">
          Job ID: {jobId.slice(0, 8)}...
        </div>

        {/* Progreso General */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progreso General</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{job.total_places}</div>
            <div className="text-xs text-gray-600">Encontrados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{job.processed_places}</div>
            <div className="text-xs text-gray-600">Procesados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              {job.successful_places}
              <span className="text-green-500">✓</span>
            </div>
            <div className="text-xs text-gray-600">Guardados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
              {descartados}
              <span className="text-yellow-500">⚠</span>
            </div>
            <div className="text-xs text-gray-600">Descartados</div>
          </div>
        </div>

        {/* Log en Tiempo Real */}
        {isExpanded && job.logs && job.logs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Log en Tiempo Real</h4>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Actualizando en tiempo real
              </div>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-xs">
              {job.logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 py-1 ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'success' ? 'text-green-400' :
                    log.level === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('es-ES')}
                  </span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Botones de Control */}
        <div className="flex flex-wrap gap-2">
          {job.status === 'running' && (
            <Button
              onClick={handlePause}
              disabled={isPausing}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-500 hover:bg-blue-50"
            >
              {isPausing ? '...' : <><Pause className="h-4 w-4 mr-1" />Pausar</>}
            </Button>
          )}
          
          {job.status === 'running' && (
            <Button
              onClick={handleCancel}
              disabled={isCancelling}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-500 hover:bg-red-50"
            >
              {isCancelling ? '...' : <><X className="h-4 w-4 mr-1" />Cancelar</>}
            </Button>
          )}

          {job.status === 'paused' && (
            <Button
              onClick={() => window.location.href = `/admin/indexar?jobId=${jobId}&autoOpen=true`}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-500 hover:bg-green-50"
            >
              <Play className="h-4 w-4 mr-1" />Reanudar
            </Button>
          )}

          {/* Botón de eliminar para trabajos pausados */}
          {job.status === 'paused' && (
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-500 hover:bg-red-50"
            >
              {isDeleting ? '...' : <><Trash2 className="h-4 w-4 mr-1" />Eliminar</>}
            </Button>
          )}
        </div>

        {/* Mensaje de estado */}
        {job.status === 'paused' && (
          <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
            ⏸️ Indexación pausada. Puedes reanudarla desde aquí o desde el historial.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
