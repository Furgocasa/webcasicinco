'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

interface JobProgressProps {
  jobId: string;
  onComplete?: () => void;
}

interface ProgressData {
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  total_places: number;
  processed_places: number;
  successful_places: number;
  failed_places: number;
  estimated_cost: number;
  actual_cost: number;
  started_at?: string;
  current_place?: {
    name: string;
    rating: number;
    steps: {
      basic_data: boolean;
      photos: boolean;
      ai_description: boolean;
      ai_reviews: boolean;
    };
  };
}

export function JobProgress({ jobId, onComplete }: JobProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/indexation-status?jobId=${jobId}`);
        const data = await res.json();
        setProgress(data);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          onComplete?.();
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    }, 2000); // Actualizar cada 2 segundos

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  const handlePause = async () => {
    try {
      await fetch('/api/admin/pause-indexation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      setIsPaused(true);
    } catch (error) {
      console.error('Error pausing job:', error);
    }
  };

  const handleResume = async () => {
    try {
      await fetch('/api/admin/start-indexation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      setIsPaused(false);
    } catch (error) {
      console.error('Error resuming job:', error);
    }
  };

  if (!progress) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  const percentage = progress.total_places
    ? Math.round((progress.processed_places / progress.total_places) * 100)
    : 0;

  const timeElapsed = progress.started_at
    ? Math.floor((Date.now() - new Date(progress.started_at).getTime()) / 60000)
    : 0;

  const timeRemaining = progress.total_places && progress.processed_places
    ? Math.ceil(
        (timeElapsed / progress.processed_places) *
          (progress.total_places - progress.processed_places)
      )
    : 0;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">
        {progress.status === 'completed'
          ? '✅ INDEXACIÓN COMPLETADA'
          : progress.status === 'failed'
          ? '❌ INDEXACIÓN FALLIDA'
          : progress.status === 'paused'
          ? '⏸️ INDEXACIÓN PAUSADA'
          : 'INDEXACIÓN EN CURSO'}
      </h2>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
          <div
            className={`h-full flex items-center justify-center text-sm font-medium text-white transition-all duration-500 ${
              progress.status === 'completed'
                ? 'bg-green-600'
                : progress.status === 'failed'
                ? 'bg-red-600'
                : progress.status === 'paused'
                ? 'bg-yellow-600'
                : 'bg-blue-600'
            }`}
            style={{ width: `${percentage}%` }}
          >
            {percentage}%
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Progreso: {progress.processed_places} / {progress.total_places} lugares
        </p>
      </div>

      {/* Información de tiempo */}
      {progress.status === 'running' && (
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-600">⏱️ Tiempo transcurrido</p>
            <p className="text-lg font-semibold">{timeElapsed} min</p>
          </div>
          <div>
            <p className="text-gray-600">⏳ Tiempo restante</p>
            <p className="text-lg font-semibold">~{timeRemaining} min</p>
          </div>
        </div>
      )}

      {/* Lugar actual */}
      {progress.current_place && progress.status === 'running' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="font-medium mb-2">📍 Procesando actualmente:</p>
          <p className="text-lg font-semibold mb-3">
            {progress.current_place.name} ({progress.current_place.rating}★)
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              {progress.current_place.steps.basic_data ? '✅' : '⏳'}
              <span>Datos básicos obtenidos</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress.current_place.steps.photos ? '✅' : '⏳'}
              <span>Fotos descargadas</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress.current_place.steps.ai_description ? '✅' : '⏳'}
              <span>Generando descripción IA...</span>
            </div>
            <div className="flex items-center space-x-2">
              {progress.current_place.steps.ai_reviews ? '✅' : '⏳'}
              <span>Analizando reseñas...</span>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      <div className="border-t pt-4 mb-6">
        <h3 className="font-medium mb-3">RESULTADOS</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-green-600 text-2xl font-bold">
              {progress.successful_places}
            </p>
            <p className="text-sm text-gray-600">✅ Exitosos</p>
          </div>
          <div>
            <p className="text-red-600 text-2xl font-bold">
              {progress.failed_places}
            </p>
            <p className="text-sm text-gray-600">❌ Fallidos</p>
          </div>
          <div>
            <p className="text-blue-600 text-2xl font-bold">
              ${progress.actual_cost.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">💰 Coste</p>
          </div>
        </div>
      </div>

      {/* Botones de control */}
      {progress.status === 'running' && (
        <div className="flex space-x-4">
          <button
            onClick={handlePause}
            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            ⏸️ Pausar
          </button>
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de que quieres cancelar?')) {
                handlePause();
              }
            }}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            ❌ Cancelar
          </button>
        </div>
      )}

      {progress.status === 'paused' && (
        <button
          onClick={handleResume}
          className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          ▶️ Reanudar
        </button>
      )}

      {(progress.status === 'completed' || progress.status === 'failed') && (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="font-medium mb-2">Resumen Final</p>
            <div className="text-sm space-y-1">
              <p>
                ⏱️ Duración total: {timeElapsed} minutos
              </p>
              <p>
                💰 Coste total: ${progress.actual_cost.toFixed(2)}
              </p>
              <p>
                📊 Tasa de éxito:{' '}
                {Math.round(
                  (progress.successful_places / progress.total_places) * 100
                )}
                %
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => (window.location.href = '/admin/lugares')}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Ver Lugares Indexados
            </button>
            <button
              onClick={() => (window.location.href = '/admin/indexar')}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Nueva Indexación
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
