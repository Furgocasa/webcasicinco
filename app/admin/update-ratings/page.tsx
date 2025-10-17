'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw, AlertTriangle, Clock, Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function UpdateRatingsPage() {
  const [stats, setStats] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [mode, setMode] = useState<'all' | 'critical' | 'old'>('critical');
  const [progress, setProgress] = useState({ updated: 0, deleted: 0, failed: 0, total: 0, cost: '$0' });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'Actualizar Ratings | Admin';
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/update-ratings');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error cargando estadísticas');
    }
  };

  const startUpdate = async () => {
    const modeLabels = {
      all: 'TODOS los lugares',
      critical: 'lugares críticos (rating 4.7-4.85)',
      old: 'lugares antiguos (>3 meses)'
    };

    const estimatedCost = stats?.estimatedCost[mode] || '0';

    if (!confirm(`¿Actualizar ${modeLabels[mode]}?\n\nCoste estimado: $${estimatedCost}`)) {
      return;
    }

    setUpdating(true);
    setLogs([`🔄 Iniciando actualización de ${modeLabels[mode]}...`]);
    setProgress({ updated: 0, deleted: 0, failed: 0, total: 0, cost: '$0' });
    
    let offset = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;
    let totalFailed = 0;
    let totalCost = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const res = await fetch('/api/admin/update-ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, batchSize: 100, offset })
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        totalUpdated += data.updated;
        totalDeleted += data.deleted;
        totalFailed += data.failed;
        totalCost += parseFloat(data.cost.replace('$', ''));

        setProgress({
          updated: totalUpdated,
          deleted: totalDeleted,
          failed: totalFailed,
          total: totalUpdated + totalDeleted + totalFailed,
          cost: `$${totalCost.toFixed(2)}`
        });

        setLogs(prev => [
          ...prev,
          `✅ Lote ${Math.floor(offset / 100) + 1}: ${data.updated} actualizados, ${data.deleted} despublicados, ${data.failed} fallos - ${data.cost}`
        ]);

        if (data.errors && data.errors.length > 0) {
          setLogs(prev => [...prev, `⚠️ Errores: ${data.errors.map((e: any) => e.place).join(', ')}`]);
        }

        hasMore = data.hasMore;
        offset = data.nextOffset;

        // Pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        setLogs(prev => [...prev, `❌ Error: ${error.message}`]);
        toast.error('Error en actualización');
        break;
      }
    }

    setUpdating(false);
    setLogs(prev => [...prev, `🎉 ¡Actualización completada! ${totalUpdated} actualizados, ${totalDeleted} despublicados, ${totalFailed} fallos - Coste total: $${totalCost.toFixed(2)}`]);
    toast.success(`Actualización completada`);
    loadStats();
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Actualizar Ratings de Lugares</h1>
        <p className="text-gray-600 mt-2">
          Actualiza los ratings desde Google para mantener la base de datos al día
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Todos los Lugares</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Coste: ${stats.estimatedCost.all}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Críticos (4.7-4.85)</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Coste: ${stats.estimatedCost.critical}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Antiguos (>3 meses)</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.old}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Coste: ${stats.estimatedCost.old}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selección de modo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Modo de Actualización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            <button
              onClick={() => setMode('critical')}
              disabled={updating}
              className={`p-4 rounded-lg border-2 transition ${
                mode === 'critical'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-semibold">Críticos</span>
              </div>
              <p className="text-sm text-gray-600">
                Solo lugares con rating 4.7-4.85 (cerca del límite)
              </p>
              <Badge className="mt-2 bg-orange-100 text-orange-800">Recomendado</Badge>
            </button>

            <button
              onClick={() => setMode('old')}
              disabled={updating}
              className={`p-4 rounded-lg border-2 transition ${
                mode === 'old'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">Antiguos</span>
              </div>
              <p className="text-sm text-gray-600">
                Lugares sin actualizar en más de 3 meses
              </p>
            </button>

            <button
              onClick={() => setMode('all')}
              disabled={updating}
              className={`p-4 rounded-lg border-2 transition ${
                mode === 'all'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Todos</span>
              </div>
              <p className="text-sm text-gray-600">
                Actualizar todos los lugares de la base de datos
              </p>
              <Badge className="mt-2 bg-blue-100 text-blue-800">Más caro</Badge>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Advertencia */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">Información importante:</p>
              <ul className="space-y-1">
                <li>✅ Solo se consultan campos básicos (rating + reseñas) = $0.005 por lugar</li>
                <li>✅ Lugares que bajen de 4.7 se despublican automáticamente (no se borran)</li>
                <li>✅ Ratings que suban o bajen se actualizan automáticamente</li>
                <li>⏱️ Tiempo estimado: ~1 minuto por cada 100 lugares</li>
                <li>💰 Coste estimado: ${stats?.estimatedCost[mode] || '0'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de actualización */}
      <Button 
        onClick={startUpdate}
        disabled={updating || !stats || stats[mode === 'critical' ? 'critical' : mode === 'old' ? 'old' : 'total'] === 0}
        className="w-full mb-6"
        size="lg"
      >
        {updating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Actualizando... {progress.total > 0 && `(${progress.updated + progress.deleted}/${progress.total})`}
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5 mr-2" />
            Iniciar Actualización de Ratings
          </>
        )}
      </Button>

      {/* Progreso */}
      {updating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{progress.updated}</p>
                <p className="text-sm text-gray-600">Actualizados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{progress.deleted}</p>
                <p className="text-sm text-gray-600">Despublicados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{progress.failed}</p>
                <p className="text-sm text-gray-600">Fallos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{progress.cost}</p>
                <p className="text-sm text-gray-600">Coste</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

