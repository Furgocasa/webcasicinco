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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'success',
      running: 'default',
      failed: 'destructive',
      paused: 'secondary',
      pending: 'secondary',
    };

    const labels: Record<string, string> = {
      completed: 'Completado',
      running: 'En proceso',
      failed: 'Error',
      paused: 'Pausado',
      pending: 'Pendiente',
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
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-semibold">{job.total_places}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Procesados</p>
                    <p className="text-lg font-semibold">{job.processed_places}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Exitosos</p>
                    <p className="text-lg font-semibold text-green-600">{job.successful_places}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fallidos</p>
                    <p className="text-lg font-semibold text-red-600">{job.failed_places}</p>
                  </div>
                </div>

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
