'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EmailScrapingLog {
  type: 'info' | 'processing' | 'success' | 'warning' | 'error' | 'summary' | 'complete';
  message: string;
  timestamp: string;
  progress?: number;
  processed?: number;
  total?: number;
  found?: number;
  email?: string;
  source?: string;
  percentage?: string;
}

interface EmailScrapingModalProps {
  isOpen: boolean;
  onClose: () => void;
  limit?: number;
}

export function EmailScrapingModal({ isOpen, onClose, limit = 100 }: EmailScrapingModalProps) {
  const [logs, setLogs] = useState<EmailScrapingLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<{ total: number; found: number; percentage: string } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll al final
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setLogs([]);
      setIsRunning(false);
      setSummary(null);
    }
  }, [isOpen]);

  const startScraping = () => {
    setIsRunning(true);
    setLogs([]);
    setSummary(null);

    const eventSource = new EventSource(`/api/admin/scrape-emails-stream?limit=${limit}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const log: EmailScrapingLog = JSON.parse(event.data);
      
      setLogs(prev => [...prev, log]);

      if (log.type === 'summary') {
        setSummary({
          total: log.total || 0,
          found: log.found || 0,
          percentage: log.percentage || '0'
        });
      }

      if (log.type === 'complete') {
        setIsRunning(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setIsRunning(false);
      setLogs(prev => [...prev, {
        type: 'error',
        message: '❌ Error de conexión con el servidor',
        timestamp: new Date().toISOString()
      }]);
      eventSource.close();
    };
  };

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsRunning(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Búsqueda Masiva de Emails</h2>
              <p className="text-sm text-gray-500">Scraping automático desde websites</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isRunning}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-xs text-gray-600">Procesados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.found}</div>
                <div className="text-xs text-gray-600">Emails encontrados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary.percentage}%</div>
                <div className="text-xs text-gray-600">Tasa de éxito</div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 font-mono text-sm">
          {logs.length === 0 && !isRunning && (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Haz clic en "Iniciar Búsqueda" para comenzar el scraping de emails
              </p>
              <p className="text-xs text-gray-400">
                Se procesarán hasta {limit} lugares con website pero sin email
              </p>
            </div>
          )}

          {logs.map((log, index) => (
            <div
              key={index}
              className={`mb-2 ${
                log.type === 'error' ? 'text-red-600' :
                log.type === 'success' ? 'text-green-600' :
                log.type === 'warning' ? 'text-orange-600' :
                log.type === 'processing' ? 'text-blue-600 font-semibold' :
                log.type === 'summary' ? 'text-purple-600 font-bold' :
                'text-gray-700'
              }`}
            >
              {log.message}
              
              {/* Progress bar para logs de processing */}
              {log.type === 'processing' && log.progress !== undefined && (
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${log.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}

          <div ref={logsEndRef} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {isRunning && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span>Procesando... ({logs.filter(l => l.type === 'success').length} emails encontrados)</span>
              </>
            )}
            {!isRunning && summary && (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Completado - {summary.found} emails guardados en BD</span>
              </>
            )}
          </div>

          <div className="flex space-x-3">
            {!isRunning && logs.length === 0 && (
              <button
                onClick={startScraping}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Iniciar Búsqueda
              </button>
            )}
            
            {!isRunning && logs.length > 0 && (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            )}
            
            {isRunning && (
              <button
                disabled
                className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium"
              >
                Procesando...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

