'use client';

// Sin caché para admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/formatters';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TrabajosPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resuming, setResuming] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/admin/jobs');
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error cargando trabajos:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Trabajo eliminado correctamente');
        loadJobs();
      } else {
        toast.error(data.error || 'Error al eliminar el trabajo');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el trabajo');
    }
  };

  const deleteAllByStatus = async (statusList: string[]) => {
    const statusNames = {
      pending: 'pendientes',
      failed: 'fallidos',
      completed: 'completados',
    };

    const statusText = statusList.map(s => statusNames[s as keyof typeof statusNames] || s).join(' y ');
    
    if (!confirm(`¿Estás seguro de que quieres eliminar TODOS los trabajos ${statusText}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true, filterStatus: statusList }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Trabajos ${statusText} eliminados correctamente`);
        loadJobs();
      } else {
        toast.error(data.error || 'Error al eliminar los trabajos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar los trabajos');
    }
  };

  const resumeJob = async (jobId: string) => {
    if (!confirm('¿Reanudar esta indexación?\n\nContinuará desde donde se quedó y se abrirá el monitor en tiempo real.')) {
      return;
    }

    setResuming(jobId);
    try {
      const response = await fetch(`/api/admin/resume-indexation/${jobId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Indexación reanudada correctamente', { duration: 2000 });
        // Redirigir a la página de indexar con el jobId para abrir el modal automáticamente
        setTimeout(() => {
          window.location.href = `/admin/indexar?jobId=${jobId}&autoOpen=true`;
        }, 500);
      } else {
        toast.error(data.error || 'Error al reanudar');
        setResuming(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al reanudar la indexación');
      setResuming(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'success',
      running: 'default',
      failed: 'destructive',
      paused: 'secondary',
      pending: 'secondary',
      cancelled: 'secondary',
    };

    const labels: Record<string, string> = {
      completed: 'Completado',
      running: 'En proceso',
      failed: 'Error',
      paused: 'Pausado',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Historial de Trabajos</h1>
        
        {jobs.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => deleteAllByStatus(['pending', 'failed'])}
              className="text-orange-600 hover:text-orange-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar pendientes y fallidos
            </Button>
            <Button 
              variant="outline" 
              onClick={() => deleteAllByStatus(['completed'])}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar completados
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Card key={job.id}>
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Trabajo #{job.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {job.provinces.join(', ')} - {job.categories.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(job.status)}
                    
                    {/* Botón Reanudar para trabajos pausados */}
                    {job.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resumeJob(job.id)}
                        disabled={resuming === job.id}
                        className="text-green-600 hover:text-green-700 border-green-500"
                      >
                        {resuming === job.id ? '...' : '▶️ Reanudar'}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteJob(job.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">🔍 Encontrados</p>
                    <p className="text-lg font-semibold">{job.total_places}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">🔄 Procesados</p>
                    <p className="text-lg font-semibold">{job.processed_places}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">✅ Guardados</p>
                    <p className="text-lg font-semibold text-green-600">{job.successful_places}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">⏭️ Descartados</p>
                    <p className="text-lg font-semibold text-yellow-600">
                      {((job.error_log?.lowRating || 0) + (job.error_log?.lowReviews || 0) + (job.error_log?.chains || 0) + (job.error_log?.duplicates || job.error_log?.skipped || 0))}
                    </p>
                  </div>
                </div>

                {/* Desglose de descartados */}
                {job.error_log && (job.error_log.lowRating > 0 || job.error_log.lowReviews > 0 || job.error_log.chains > 0 || job.error_log.duplicates > 0 || job.error_log.skipped > 0) && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-xs font-semibold text-amber-900 mb-2">📋 Desglose de descartados:</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {job.error_log.lowRating > 0 && (
                        <div className="text-amber-800">
                          📉 Rating bajo: <strong>{job.error_log.lowRating}</strong>
                        </div>
                      )}
                      {job.error_log.lowReviews > 0 && (
                        <div className="text-amber-800">
                          📊 Pocas reseñas: <strong>{job.error_log.lowReviews}</strong>
                        </div>
                      )}
                      {job.error_log.chains > 0 && (
                        <div className="text-amber-800">
                          🏪 Cadenas/Cat. inválida: <strong>{job.error_log.chains}</strong>
                        </div>
                      )}
                      {(job.error_log.duplicates > 0 || job.error_log.skipped > 0) && (
                        <div className="text-amber-800">
                          🔄 Duplicados: <strong>{job.error_log.duplicates || job.error_log.skipped}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Errores técnicos */}
                {job.failed_places > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-xs font-semibold text-red-900">
                      ❌ Errores técnicos (fallos de API): <strong>{job.failed_places}</strong>
                    </div>
                  </div>
                )}

                {/* Desglose por categorías */}
                {job.categoryStats && Object.keys(job.categoryStats).length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs font-semibold text-green-900 mb-2">✅ Lugares guardados por categoría:</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {job.categoryStats.restaurante > 0 && (
                        <div className="text-green-800">
                          🍽️ Restaurantes: <strong>{job.categoryStats.restaurante}</strong>
                        </div>
                      )}
                      {job.categoryStats.bar > 0 && (
                        <div className="text-green-800">
                          🍺 Bares: <strong>{job.categoryStats.bar}</strong>
                        </div>
                      )}
                      {job.categoryStats.cafe > 0 && (
                        <div className="text-green-800">
                          ☕ Cafés: <strong>{job.categoryStats.cafe}</strong>
                        </div>
                      )}
                      {job.categoryStats.hotel > 0 && (
                        <div className="text-green-800">
                          🏨 Hoteles: <strong>{job.categoryStats.hotel}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Iniciado: {formatDate(job.created_at)}
                  {job.completed_at && ` • Completado: ${formatDate(job.completed_at)}`}
                </div>

                {job.error_message && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {job.error_message}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>No hay trabajos registrados</p>
            <p className="text-sm mt-2">Los trabajos de indexación aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}
