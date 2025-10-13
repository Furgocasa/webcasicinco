'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Image, Loader2, CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function PhotoMigrationTool() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, successful: 0, failed: 0, total: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/migrate-photos');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMigration = async () => {
    if (!confirm(`¿Migrar ${stats.needsMigration} lugares a Supabase Storage?\n\nEsto descargará fotos de Google (última vez) y las subirá a Supabase.\nTiempo estimado: ${Math.ceil(stats.needsMigration / 50 * 5)} minutos`)) {
      return;
    }

    setMigrating(true);
    setProgress({ processed: 0, successful: 0, failed: 0, total: stats.needsMigration });

    let offset = 0;
    const batchSize = 50;
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    try {
      while (totalProcessed < stats.needsMigration) {
        console.log(`🔄 Migrando lote ${Math.floor(offset / batchSize) + 1}...`);
        
        const response = await fetch('/api/admin/migrate-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchSize, offset }),
        });

        const data = await response.json();

        if (!data.success) {
          toast.error(data.error || 'Error en migración');
          break;
        }

        totalProcessed += data.processed;
        totalSuccessful += data.successful;
        totalFailed += data.failed;

        setProgress({
          processed: totalProcessed,
          successful: totalSuccessful,
          failed: totalFailed,
          total: stats.needsMigration,
        });

        // Si no procesó nada, terminar
        if (data.processed === 0) {
          break;
        }

        offset += batchSize;

        // Pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast.success(`✅ Migración completada: ${totalSuccessful}/${totalProcessed} lugares`);
      loadStats(); // Recargar estadísticas

    } catch (error: any) {
      console.error('Error en migración:', error);
      toast.error('Error durante la migración');
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </CardContent>
      </Card>
    );
  }

  const percentageMigrated = stats?.percentageMigrated || 0;
  const needsMigration = stats?.needsMigration || 0;

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5 text-indigo-600" />
          Migración de Fotos a Supabase
        </CardTitle>
        <CardDescription>
          Ahorra hasta $2,500/año migrando fotos de Google Photos API a Supabase Storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Database className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            <p className="text-xs text-gray-600">Total Lugares</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats?.withPhotoUrls || 0}</p>
            <p className="text-xs text-gray-600">En Supabase</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{needsMigration}</p>
            <p className="text-xs text-gray-600">Pendientes</p>
          </div>
          
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <Image className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-600">{percentageMigrated}%</p>
            <p className="text-xs text-gray-600">Migrado</p>
          </div>
        </div>

        {/* Barra de progreso */}
        {migrating && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Migrando... {progress.processed}/{progress.total}
              </span>
              <span className="text-sm font-medium text-indigo-600">
                {Math.round((progress.processed / progress.total) * 100)}%
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{ width: `${(progress.processed / progress.total) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <span>✅ Exitosos: {progress.successful}</span>
              <span>❌ Fallidos: {progress.failed}</span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 mb-1">💰 Ahorro de Costos</p>
              <p className="text-blue-800">
                <strong>Actual:</strong> Cada foto vista = $0.007 a Google<br />
                <strong>Después:</strong> Fotos desde Supabase = $0 (gratis)<br />
                <strong>Ahorro anual estimado:</strong> ~$2,500/año
              </p>
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        {needsMigration > 0 ? (
          <div className="space-y-4">
            <Button
              onClick={startMigration}
              disabled={migrating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              {migrating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Migrando... {progress.processed}/{progress.total}
                </>
              ) : (
                <>
                  <Image className="h-5 w-5 mr-2" />
                  Migrar {needsMigration} Lugares a Supabase
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-gray-500">
              Tiempo estimado: ~{Math.ceil(needsMigration / 50 * 5)} minutos. 
              Puedes cerrar esta página, continuará en background.
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              ✅ Migración Completada
            </p>
            <p className="text-sm text-gray-600">
              Todas las fotos están en Supabase Storage. ¡Ahorro activado!
            </p>
          </div>
        )}

        {/* Advertencia */}
        {needsMigration > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>⚠️ Importante:</strong> Esta será la última vez que descargas fotos de Google. 
              Después, TODO será gratis desde Supabase. El proceso puede tardar ~3 horas para 3,600 lugares.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

