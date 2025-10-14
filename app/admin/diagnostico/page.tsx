'use client';

// Sin caché
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function DiagnosticoPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-google-api');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      console.error('Error cargando diagnósticos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Ejecutando diagnósticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔧 Diagnóstico del Sistema</h1>
          <p className="text-gray-600 mt-1">Verificación de APIs y configuración</p>
        </div>
        <Button onClick={loadDiagnostics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recargar
        </Button>
      </div>

      {diagnostics?.error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-bold text-red-900">Error Crítico</h3>
                <p className="text-red-700">{diagnostics.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variables de Entorno */}
      <Card>
        <CardHeader>
          <CardTitle>🔑 Variables de Entorno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {diagnostics?.environment && Object.entries(diagnostics.environment).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono text-sm text-gray-700">{key}</span>
                <div className="flex items-center gap-2">
                  {typeof value === 'boolean' ? (
                    value ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )
                  ) : (
                    <span className="font-mono text-sm text-gray-600">{String(value)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tests */}
      {diagnostics?.tests && diagnostics.tests.map((test: any, index: number) => (
        <Card key={index} className={test.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {test.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                {test.test}
              </CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                test.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {test.success ? 'PASS' : 'FAIL'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {test.query && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Query:</p>
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">{test.query}</p>
                </div>
              )}

              {test.place_id && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Place ID:</p>
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">{test.place_id}</p>
                </div>
              )}

              {test.url && (
                <div>
                  <p className="text-sm font-medium text-gray-700">URL:</p>
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded break-all">{test.url}</p>
                </div>
              )}

              {test.response && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Respuesta de Google:</p>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(test.response, null, 2)}
                  </pre>
                </div>
              )}

              {test.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-medium text-red-900">Error:</p>
                  <p className="text-sm text-red-700 font-mono">{test.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Resumen */}
      {diagnostics?.summary && (
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle>📊 Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{diagnostics.summary.total_tests}</p>
                <p className="text-sm text-blue-700">Total Tests</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{diagnostics.summary.passed}</p>
                <p className="text-sm text-green-700">Pasados</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{diagnostics.summary.failed}</p>
                <p className="text-sm text-red-700">Fallidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamp */}
      {diagnostics?.timestamp && (
        <p className="text-center text-sm text-gray-500">
          Última ejecución: {new Date(diagnostics.timestamp).toLocaleString('es-ES')}
        </p>
      )}
    </div>
  );
}

