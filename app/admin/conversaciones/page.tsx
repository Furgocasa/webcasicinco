'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Search, RefreshCw, CheckCircle, AlertCircle, XCircle, Trash2, Eye, BarChart3, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  user_email: string | null;
  session_id: string | null;
  user_message: string;
  bot_response: string;
  conversation_context: any;
  detected_intent: any;
  places_found: number;
  query_time_ms: number;
  ai_summary: string | null;
  quality_assessment: 'correcta' | 'mejorable' | 'incorrecta' | null;
  quality_reasoning: string | null;
  suggested_improvements: string | null;
  created_at: string;
  analyzed_at: string | null;
}

interface Stats {
  total: number;
  pending: number;
  analyzed: number;
  byQuality: {
    correcta: number;
    mejorable: number;
    incorrecta: number;
  };
  avgQueryTimeMs: number;
}

export default function ConversacionesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  // Filtros
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Verificar que es admin
  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/analyze-conversations');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Cargar conversaciones
  const loadConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (qualityFilter !== 'all') {
        params.append('quality', qualityFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/conversations?${params}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      toast.error('Error cargando conversaciones');
    } finally {
      setLoading(false);
    }
  };

  // Analizar conversaciones pendientes
  const analyzeConversations = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/admin/analyze-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.analyzed} conversaciones analizadas`);
        loadConversations();
        loadStats();
      } else {
        toast.error('Error analizando conversaciones');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error en el análisis');
    } finally {
      setAnalyzing(false);
    }
  };

  // Cargar al inicio
  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadConversations();
  }, [page, qualityFilter]);

  // Buscar con delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadConversations();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ================================================================
  // FUNCIONES DE EXPORTACIÓN
  // ================================================================

  // Exportar a CSV
  const exportToCSV = async () => {
    try {
      toast.info('Exportando conversaciones a CSV...');
      
      // Obtener todas las conversaciones sin paginación
      const params = new URLSearchParams({ limit: '10000' });
      if (qualityFilter !== 'all') params.append('quality', qualityFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/conversations?${params}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Error obteniendo datos');
      }

      const allConversations = data.conversations;

      // Crear CSV
      const headers = [
        'ID',
        'Fecha',
        'Usuario',
        'Sesión',
        'Pregunta',
        'Respuesta',
        'Calidad',
        'Resumen IA',
        'Razonamiento',
        'Mejoras Sugeridas',
        'Lugares Encontrados',
        'Tiempo (ms)',
        'Categoría Detectada',
        'Ubicación Detectada',
        'Fecha Análisis'
      ];

      const rows = allConversations.map((conv: Conversation) => {
        const intent = conv.detected_intent || {};
        return [
          conv.id,
          new Date(conv.created_at).toLocaleString('es-ES'),
          conv.user_email || '',
          conv.session_id?.slice(0, 16) || '',
          `"${(conv.user_message || '').replace(/"/g, '""')}"`,
          `"${(conv.bot_response || '').replace(/"/g, '""')}"`,
          conv.quality_assessment || 'pendiente',
          `"${(conv.ai_summary || '').replace(/"/g, '""')}"`,
          `"${(conv.quality_reasoning || '').replace(/"/g, '""')}"`,
          `"${(conv.suggested_improvements || '').replace(/"/g, '""')}"`,
          conv.places_found,
          conv.query_time_ms,
          intent.category || '',
          intent.location || '',
          conv.analyzed_at ? new Date(conv.analyzed_at).toLocaleString('es-ES') : ''
        ];
      });

      // Combinar headers y rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Crear y descargar archivo
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `conversaciones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${allConversations.length} conversaciones exportadas a CSV`);
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error('Error al exportar CSV');
    }
  };

  // Exportar a Excel (usando biblioteca xlsx)
  const exportToExcel = async () => {
    try {
      toast.info('Exportando conversaciones a Excel...');
      
      // Obtener todas las conversaciones
      const params = new URLSearchParams({ limit: '10000' });
      if (qualityFilter !== 'all') params.append('quality', qualityFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/conversations?${params}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Error obteniendo datos');
      }

      const allConversations = data.conversations;

      // Importar xlsx dinámicamente
      const XLSX = await import('xlsx');

      // Preparar datos para Excel
      const excelData = allConversations.map((conv: Conversation) => {
        const intent = conv.detected_intent || {};
        return {
          'ID': conv.id.slice(0, 8),
          'Fecha': new Date(conv.created_at).toLocaleString('es-ES'),
          'Usuario': conv.user_email || 'Anónimo',
          'Sesión': conv.session_id?.slice(0, 16) || '',
          'Pregunta': conv.user_message,
          'Respuesta': conv.bot_response,
          'Calidad': conv.quality_assessment || 'pendiente',
          'Resumen IA': conv.ai_summary || '',
          'Razonamiento': conv.quality_reasoning || '',
          'Mejoras Sugeridas': conv.suggested_improvements || '',
          'Lugares': conv.places_found,
          'Tiempo (ms)': conv.query_time_ms,
          'Categoría': intent.category || '',
          'Ubicación': intent.location || '',
          'Fecha Análisis': conv.analyzed_at ? new Date(conv.analyzed_at).toLocaleString('es-ES') : ''
        };
      });

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Conversaciones');

      // Ajustar anchos de columna
      const colWidths = [
        { wch: 10 },  // ID
        { wch: 18 },  // Fecha
        { wch: 25 },  // Usuario
        { wch: 18 },  // Sesión
        { wch: 50 },  // Pregunta
        { wch: 60 },  // Respuesta
        { wch: 12 },  // Calidad
        { wch: 40 },  // Resumen IA
        { wch: 40 },  // Razonamiento
        { wch: 40 },  // Mejoras
        { wch: 8 },   // Lugares
        { wch: 10 },  // Tiempo
        { wch: 15 },  // Categoría
        { wch: 20 },  // Ubicación
        { wch: 18 }   // Fecha Análisis
      ];
      ws['!cols'] = colWidths;

      // Descargar archivo
      XLSX.writeFile(wb, `conversaciones_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success(`${allConversations.length} conversaciones exportadas a Excel`);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      toast.error('Error al exportar Excel');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getQualityIcon = (quality: string | null) => {
    if (!quality) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    if (quality === 'correcta') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (quality === 'mejorable') return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getQualityBadge = (quality: string | null) => {
    if (!quality) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Pendiente</span>;
    if (quality === 'correcta') return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">✅ Correcta</span>;
    if (quality === 'mejorable') return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">⚠️ Mejorable</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">❌ Incorrecta</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Análisis de Conversaciones del Chatbot
        </h1>
        <p className="text-gray-600">
          Sistema de evaluación automática para mejorar continuamente el Tío Viajero IA
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </Card>

          <Card className="p-4 border-green-200 bg-green-50">
            <div className="text-sm text-gray-600 mb-1">✅ Correctas</div>
            <div className="text-2xl font-bold text-green-700">
              {stats.byQuality.correcta}
              <span className="text-sm font-normal ml-2">
                ({stats.analyzed > 0 ? Math.round((stats.byQuality.correcta / stats.analyzed) * 100) : 0}%)
              </span>
            </div>
          </Card>

          <Card className="p-4 border-yellow-200 bg-yellow-50">
            <div className="text-sm text-gray-600 mb-1">⚠️ Mejorables</div>
            <div className="text-2xl font-bold text-yellow-700">
              {stats.byQuality.mejorable}
              <span className="text-sm font-normal ml-2">
                ({stats.analyzed > 0 ? Math.round((stats.byQuality.mejorable / stats.analyzed) * 100) : 0}%)
              </span>
            </div>
          </Card>

          <Card className="p-4 border-red-200 bg-red-50">
            <div className="text-sm text-gray-600 mb-1">❌ Incorrectas</div>
            <div className="text-2xl font-bold text-red-700">
              {stats.byQuality.incorrecta}
              <span className="text-sm font-normal ml-2">
                ({stats.analyzed > 0 ? Math.round((stats.byQuality.incorrecta / stats.analyzed) * 100) : 0}%)
              </span>
            </div>
          </Card>

          <Card className="p-4 border-blue-200 bg-blue-50">
            <div className="text-sm text-gray-600 mb-1">⏱️ Tiempo medio</div>
            <div className="text-2xl font-bold text-blue-700">{stats.avgQueryTimeMs}ms</div>
          </Card>
        </div>
      )}

      {/* Acciones y Filtros */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            {/* Filtro de calidad */}
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las calidades</option>
              <option value="pending">⏳ Pendientes análisis</option>
              <option value="correcta">✅ Correctas</option>
              <option value="mejorable">⚠️ Mejorables</option>
              <option value="incorrecta">❌ Incorrectas</option>
            </select>

            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en mensajes o usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={loadConversations}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>

            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>

            <Button
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>

            {stats && stats.pending > 0 && (
              <Button
                onClick={analyzeConversations}
                size="sm"
                disabled={analyzing}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analizar Pendientes ({stats.pending})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabla de conversaciones */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">Cargando conversaciones...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No hay conversaciones que mostrar</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pregunta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resumen IA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resultados
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {conversations.map((conv) => (
                    <tr key={conv.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getQualityIcon(conv.quality_assessment)}
                          {getQualityBadge(conv.quality_assessment)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          {conv.user_email ? (
                            <span className="font-medium text-gray-900">{conv.user_email}</span>
                          ) : (
                            <span className="text-gray-500 text-xs">Sesión: {conv.session_id?.slice(0, 8)}...</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <div className="text-sm text-gray-900 truncate">
                          {conv.user_message}
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <div className="text-sm text-gray-600 truncate">
                          {conv.ai_summary || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-900">{conv.places_found} lugares</span>
                          <span className="text-xs text-gray-500">{conv.query_time_ms}ms</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(conv.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          onClick={() => setSelectedConv(conv)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  ← Anterior
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Siguiente →
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modal de detalle */}
      {selectedConv && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedConv(null)}
        >
          <Card 
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Conversación #{selectedConv.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedConv.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getQualityBadge(selectedConv.quality_assessment)}
                </div>
              </div>

              {/* Usuario */}
              <div className="mb-6">
                <div className="text-xs font-medium text-gray-500 mb-1">USUARIO</div>
                <div className="text-sm text-gray-900">
                  {selectedConv.user_email || `Sesión: ${selectedConv.session_id}`}
                </div>
              </div>

              {/* Pregunta */}
              <div className="mb-6">
                <div className="text-xs font-medium text-gray-500 mb-2">💬 PREGUNTA</div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-900">{selectedConv.user_message}</p>
                </div>
              </div>

              {/* Respuesta */}
              <div className="mb-6">
                <div className="text-xs font-medium text-gray-500 mb-2">🤖 RESPUESTA</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-line">{selectedConv.bot_response}</p>
                </div>
              </div>

              {/* Intención detectada */}
              <div className="mb-6">
                <div className="text-xs font-medium text-gray-500 mb-2">🔍 INTENCIÓN DETECTADA</div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <pre className="text-xs text-gray-800 overflow-x-auto">
                    {JSON.stringify(selectedConv.detected_intent, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Lugares encontrados</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedConv.places_found}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Tiempo de respuesta</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedConv.query_time_ms}ms</div>
                </div>
              </div>

              {/* Análisis IA */}
              {selectedConv.quality_assessment && (
                <div className="mb-6">
                  <div className="text-xs font-medium text-gray-500 mb-2">🎯 ANÁLISIS IA</div>
                  <div className={`border rounded-lg p-4 ${
                    selectedConv.quality_assessment === 'correcta' ? 'bg-green-50 border-green-200' :
                    selectedConv.quality_assessment === 'mejorable' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    {selectedConv.ai_summary && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-700 mb-1">Resumen:</div>
                        <p className="text-sm text-gray-900">{selectedConv.ai_summary}</p>
                      </div>
                    )}

                    {selectedConv.quality_reasoning && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-700 mb-1">Razonamiento:</div>
                        <p className="text-sm text-gray-900 whitespace-pre-line">{selectedConv.quality_reasoning}</p>
                      </div>
                    )}

                    {selectedConv.suggested_improvements && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Mejoras sugeridas:</div>
                        <p className="text-sm text-gray-900 whitespace-pre-line">{selectedConv.suggested_improvements}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botón cerrar */}
              <div className="flex justify-end">
                <Button onClick={() => setSelectedConv(null)} variant="outline">
                  Cerrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

