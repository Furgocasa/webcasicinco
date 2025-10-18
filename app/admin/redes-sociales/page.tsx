'use client';

import { useState } from 'react';
import { Loader2, Instagram, Facebook, Twitter, Music2, Download, Upload, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProcessStats {
  processed: number;
  found: number;
  foundViaWebsite: number;
  foundViaGoogle: number;
  cost: number;
}

export default function RedesSocialesAdmin() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [limit, setLimit] = useState(100);
  const [stats, setStats] = useState<ProcessStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);
    setStats(null);
    setLogs([]);
    addLog(`Iniciando procesamiento de ${limit} lugares...`);

    try {
      const response = await fetch('/api/admin/social-media/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });

      if (!response.ok) {
        throw new Error('Error procesando lugares');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'log') {
                  addLog(data.message);
                } else if (data.type === 'stats') {
                  setStats(data.stats);
                } else if (data.type === 'error') {
                  setError(data.message);
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        }
      }

      addLog('✅ Procesamiento completado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    addLog('Exportando lugares a CSV...');
    
    try {
      const response = await fetch(`/api/admin/social-media/export?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Error exportando CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `social-media-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addLog('✅ CSV descargado correctamente');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🔍 Gestión de Redes Sociales
          </h1>
          <p className="text-gray-600">
            Busca y actualiza automáticamente perfiles de Instagram, Facebook, Twitter y TikTok de lugares
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Procesados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.processed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Instagram className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Encontrados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.found}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Music2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vía Website (GRATIS)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.foundViaWebsite}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Coste Real</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.cost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de lugares a procesar
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                min="1"
                max="3111"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <p className="text-sm text-gray-500 mt-1">
                Coste estimado: ${(limit * 0.005).toFixed(2)} (si 100% usa Google)
              </p>
              <p className="text-sm text-green-600 mt-1">
                💰 Real: ~$3 para 3,111 lugares (80% gratis vía website)
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 justify-center transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Procesar Automáticamente
                  </>
                )}
              </button>

              <button
                onClick={handleExport}
                disabled={isProcessing}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 justify-center transition"
              >
                <Download className="h-5 w-5" />
                Exportar CSV (Manual)
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Registro de Actividad
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No hay actividad aún...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-300 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">ℹ️ Cómo funciona</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span><strong>Método 1 (GRATIS):</strong> Scrapea el website del lugar buscando links a Instagram/Facebook/Twitter/TikTok</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span><strong>Método 2 (Google):</strong> Si no se encuentra en el website, busca en Google Custom Search API</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span><strong>Resultado:</strong> ~80% se encuentra gratis, ~20% usa Google (~$3 total para todos los lugares)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

