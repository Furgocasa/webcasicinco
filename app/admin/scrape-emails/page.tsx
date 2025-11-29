'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailScraperPage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ processed: 0, found: 0, total: 0 });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startScraping = async () => {
    setRunning(true);
    setLogs([]);
    setStats({ processed: 0, found: 0, total: 0 });
    
    addLog('🚀 Iniciando scraping masivo de emails...');
    
    let offset = 0;
    let hasMore = true;
    let totalProcessed = 0;
    let totalFound = 0;
    
    while (hasMore && running) {
      try {
        addLog(`📦 Procesando batch desde offset ${offset}...`);
        
        const response = await fetch(`/api/admin/scrape-emails-batch?limit=20&offset=${offset}`);
        const data = await response.json();
        
        if (!response.ok) {
          addLog(`❌ Error: ${data.error}`);
          break;
        }
        
        totalProcessed += data.processed;
        totalFound += data.found;
        
        setStats({
          processed: totalProcessed,
          found: totalFound,
          total: totalProcessed
        });
        
        // Log resultados
        data.results.forEach((result: any) => {
          if (result.success) {
            addLog(`✅ ${result.name}: ${result.email} (${result.source})`);
          } else {
            addLog(`⚠️ ${result.name}: No encontrado`);
          }
        });
        
        addLog(`📊 Batch completado: ${data.found}/${data.processed} emails encontrados`);
        
        hasMore = data.hasMore;
        offset += 20;
        
        if (hasMore) {
          addLog('⏳ Esperando 3 segundos antes del siguiente batch...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error: any) {
        addLog(`❌ Error: ${error.message}`);
        break;
      }
    }
    
    addLog('');
    addLog('🎉 PROCESO COMPLETADO');
    addLog(`📊 Total procesados: ${totalProcessed}`);
    addLog(`✅ Total emails encontrados: ${totalFound} (${totalProcessed > 0 ? ((totalFound/totalProcessed)*100).toFixed(1) : 0}%)`);
    
    setRunning(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📧 Email Scraper Masivo
        </h1>
        <p className="text-gray-600">
          Busca emails en los websites de todos los lugares sin email
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.processed}</div>
              <div className="text-sm text-gray-600">Procesados</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.found}</div>
              <div className="text-sm text-gray-600">Emails encontrados</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.processed > 0 ? ((stats.found / stats.processed) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">Tasa de éxito</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Logs en tiempo real</h2>
            {!running && logs.length === 0 && (
              <Button onClick={startScraping} variant="primary">
                <Mail className="h-4 w-4 mr-2" />
                Iniciar Scraping
              </Button>
            )}
            {running && (
              <Button disabled variant="outline">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </Button>
            )}
          </div>

          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-[600px] overflow-y-auto font-mono text-sm">
            {logs.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Haz clic en "Iniciar Scraping" para comenzar</p>
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="mb-1">
                {log}
              </div>
            ))}
          </div>

          {!running && logs.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Proceso completado</span>
              </div>
              <Button onClick={startScraping} variant="primary">
                Ejecutar de nuevo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

