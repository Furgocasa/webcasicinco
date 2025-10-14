'use client';

// Sin caché para admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Save, RefreshCw, Key, Brain, Map } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfiguracionPage() {
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ total: 0, withAI: 0, withoutAI: 0 });
  
  const [config, setConfig] = useState({
    // API Keys (solo mostrar si están configuradas)
    googleMapsApiKey: '',
    openaiApiKey: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    
    // Prompts de IA
    descriptionPrompt: '',
    reviewSummaryPrompt: '',
    
    // Configuración del Agente Chatbot
    chatbotModel: 'gpt-4o-mini',
    chatbotTemperature: 0.7,
    chatbotMaxTokens: 400,
    chatbotSystemPrompt: '',
    chatbotUserPrompt: '',
    chatbotMaxHistoryMessages: 20,
    chatbotEnabled: true,
    
    // Configuración de búsqueda
    minReviews: 20,
    minRating: 4.7,
    searchRadius: 50000,
  });

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/places');
      const data = await response.json();
      
      if (data.success) {
        const places = data.places || [];
        const withAI = places.filter((p: any) => p.ai_description).length;
        const withoutAI = places.filter((p: any) => !p.ai_description).length;
        
        setStats({
          total: places.length,
          withAI,
          withoutAI,
        });
      }
    } catch (error) {
      console.error('Error cargando stats:', error);
    }
  };

  const loadConfig = async () => {
    try {
      // Cargar estado de APIs desde el servidor
      const [statusResponse, chatbotResponse] = await Promise.all([
        fetch('/api/admin/config-status'),
        fetch('/api/admin/config?key=chatbot_config')
      ]);
      
      const statusData = await statusResponse.json();
      const chatbotData = await chatbotResponse.json();
      
      if (statusData.success) {
        const apiConfig = statusData.config;
        const savedChatbotConfig = chatbotData.success ? chatbotData.config : {};
        setConfig({
          googleMapsApiKey: apiConfig.googleMapsConfigured ? '✓ Configurada' : '❌ No configurada',
          openaiApiKey: apiConfig.openaiConfigured ? '✓ Configurada' : '❌ No configurada',
          supabaseUrl: apiConfig.supabaseConfigured ? 'https://zzycxijexoxrjpijslsb.supabase.co' : '❌ No configurada',
          supabaseAnonKey: apiConfig.supabaseConfigured ? '✓ Configurada' : '❌ No configurada',
          
          descriptionPrompt: `Escribe una descripción atractiva y profesional para SEO de este lugar:

Nombre EXACTO: {name}
Ubicación EXACTA: {city}, {province}
Tipo: {category}

Reseñas de clientes:
{reviews}

REQUISITOS ESTRICTOS:
- 2-3 párrafos (150-200 palabras)
- USA EL NOMBRE Y UBICACIÓN EXACTOS
- NO confundas ubicaciones
- NO inventes datos
- Enfócate en lo que mencionan las reseñas
- Tono profesional pero cercano`,
      
      reviewSummaryPrompt: `Resume estas reseñas en 2-3 frases concisas:

{reviews}

Destaca los aspectos más mencionados.
Sé objetivo y equilibrado.`,

      // Configuración del chatbot (desde la base de datos)
      chatbotModel: savedChatbotConfig.model || 'gpt-4o-mini',
      chatbotTemperature: savedChatbotConfig.temperature !== undefined ? savedChatbotConfig.temperature : 0.7,
      chatbotMaxTokens: savedChatbotConfig.maxTokens || 400,
      chatbotMaxHistoryMessages: savedChatbotConfig.maxHistoryMessages || 20,
      chatbotEnabled: savedChatbotConfig.enabled !== false,
      
      chatbotSystemPrompt: savedChatbotConfig.systemPrompt || `Eres el Tío Viajero, el asistente virtual de Casi Cinco.

🚨 REGLAS ABSOLUTAS:
1. SOLO recomiendas lugares de la lista "LUGARES DISPONIBLES"
2. NUNCA inventes nombres de restaurantes/hoteles
3. SIEMPRE incluye ⭐rating y (reseñas exactas)
4. Si no hay lugares, di "No tengo lugares de esa zona"
5. NO uses conocimiento externo del mundo real

PERSONALIDAD:
- Explorador sabio y experimentado
- Amigable pero siempre con datos verificados
- Español de España, tono cercano`,

      chatbotUserPrompt: savedChatbotConfig.userPromptTemplate || `Contexto disponible:
- {placesCount} lugares en la plataforma
- Provincias: {provinces}
- Categorías: {categories}

Lugares relevantes para esta pregunta:
{relevantPlaces}

Responde en 100-200 palabras.`,
      
      minReviews: 20,
      minRating: 4.7,
      searchRadius: 50000,
        });
      } else {
        // Fallback si falla el endpoint
        setConfig({
          googleMapsApiKey: '⚠️ Verificando...',
          openaiApiKey: '⚠️ Verificando...',
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          supabaseAnonKey: '⚠️ Verificando...',
          descriptionPrompt: '',
          reviewSummaryPrompt: '',
          chatbotModel: 'gpt-4o-mini',
          chatbotTemperature: 0.7,
          chatbotMaxTokens: 400,
          chatbotSystemPrompt: '',
          chatbotUserPrompt: '',
          chatbotMaxHistoryMessages: 20,
          chatbotEnabled: true,
          minReviews: 20,
          minRating: 4.7,
          searchRadius: 50000,
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast.error('Error al cargar estado de APIs');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Guardar configuración del chatbot en Supabase
      const chatbotConfig = {
        model: config.chatbotModel,
        temperature: config.chatbotTemperature,
        maxTokens: config.chatbotMaxTokens,
        maxHistoryMessages: config.chatbotMaxHistoryMessages,
        enabled: config.chatbotEnabled,
        systemPrompt: config.chatbotSystemPrompt,
        userPromptTemplate: config.chatbotUserPrompt,
      };

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'chatbot_config',
          value: chatbotConfig,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Configuración guardada y aplicada inmediatamente');
        toast.info('El chatbot usará la nueva configuración en el próximo mensaje');
      } else {
        toast.error(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleEnrichMissing = async () => {
    if (stats.withoutAI === 0) {
      toast.info('✅ Todos los lugares ya están enriquecidos');
      return;
    }

    if (!confirm(`¿Enriquecer ${stats.withoutAI} lugares pendientes con IA?\n\nTiempo estimado: ~${Math.ceil(stats.withoutAI * 3 / 60)} minutos`)) return;

    setEnriching(true);
    setEnrichProgress({ current: 0, total: stats.withoutAI });

    try {
      const response = await fetch('/api/admin/enrich-places', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${data.enriched} lugares enriquecidos`);
        loadStats();
      }
    } catch (error) {
      toast.error('Error al enriquecer lugares');
    } finally {
      setEnriching(false);
      setEnrichProgress({ current: 0, total: 0 });
    }
  };

  const handleReEnrichAll = async () => {
    if (!confirm(`⚠️ ¿RE-ENRIQUECER TODOS los ${stats.total} lugares?\n\nEsto borrará las descripciones actuales y las regenerará con los nuevos prompts.\n\nTiempo estimado: ~${Math.ceil(stats.total * 3 / 60)} minutos\n\n¿Continuar?`)) return;

    try {
      // Primero borrar las descripciones actuales
      const resetResponse = await fetch('/api/admin/reset-ai-content', {
        method: 'POST',
      });

      if (resetResponse.ok) {
        toast.success('Descripciones borradas, iniciando re-enriquecimiento...');
        loadStats();
        
        // Esperar un poco y luego enriquecer
        setTimeout(() => {
          handleEnrichMissing();
        }, 2000);
      }
    } catch (error) {
      toast.error('Error al re-enriquecer');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            APIs, prompts de IA y parámetros de búsqueda
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadConfig} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
          <Button onClick={handleSave} variant="primary" size="sm" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-600" />
            APIs Externas
          </CardTitle>
          <CardDescription>
            Estado de las integraciones con servicios externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Google Maps API</span>
                <Badge variant={config.googleMapsApiKey.includes('✓') ? 'success' : 'warning'}>
                  {config.googleMapsApiKey}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Para mapas, búsqueda de lugares y geocodificación
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">OpenAI API</span>
                <Badge variant={config.openaiApiKey.includes('✓') ? 'success' : 'warning'}>
                  {config.openaiApiKey}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Para generar descripciones y resúmenes con IA
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Supabase URL</span>
                <Badge variant={config.supabaseUrl ? 'success' : 'warning'}>
                  {config.supabaseUrl ? '✓ Configurada' : '❌ No configurada'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {config.supabaseUrl || 'No configurada'}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Supabase Anon Key</span>
                <Badge variant={config.supabaseAnonKey.includes('✓') ? 'success' : 'warning'}>
                  {config.supabaseAnonKey}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Para autenticación y base de datos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompts de IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Prompts de Inteligencia Artificial
          </CardTitle>
          <CardDescription>
            Personaliza cómo la IA genera contenido para los lugares
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt de Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Prompt de Descripción SEO
            </label>
            <textarea
              value={config.descriptionPrompt}
              onChange={(e) => setConfig({ ...config, descriptionPrompt: e.target.value })}
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              placeholder="Escribe el prompt para generar descripciones..."
            />
            <p className="text-xs text-gray-600 mt-2">
              Variables disponibles: {'{name}'}, {'{city}'}, {'{province}'}, {'{category}'}, {'{reviews}'}
            </p>
          </div>

          {/* Prompt de Resumen */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Prompt de Resumen de Reseñas
            </label>
            <textarea
              value={config.reviewSummaryPrompt}
              onChange={(e) => setConfig({ ...config, reviewSummaryPrompt: e.target.value })}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              placeholder="Escribe el prompt para resumir reseñas..."
            />
            <p className="text-xs text-gray-600 mt-2">
              Variables disponibles: {'{reviews}'}
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Configuración del Agente Chatbot */}
      <Card className="border-2 border-amber-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-sky-100">
              <img src="/images/tio-viajero.png" alt="Tío Viajero" className="w-full h-full object-cover" />
            </div>
            Configuración del Agente "Tío Viajero"
          </CardTitle>
          <CardDescription>
            Control total del asistente de IA - Modelo, temperatura, prompts y límites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grid de configuración técnica */}
          <div className="grid md:grid-cols-3 gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            {/* Modelo de IA */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                🤖 Modelo de IA
              </label>
              <select
                value={config.chatbotModel}
                onChange={(e) => setConfig({ ...config, chatbotModel: e.target.value })}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
              >
                <optgroup label="Serie GPT-4o (Recomendado)">
                  <option value="gpt-4o">GPT-4o (Más potente)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Recomendado)</option>
                </optgroup>
                <optgroup label="Serie GPT-4 Turbo">
                  <option value="gpt-4-turbo">GPT-4 Turbo (Multimodal)</option>
                  <option value="gpt-4-turbo-preview">GPT-4 Turbo Preview</option>
                  <option value="gpt-4-0125-preview">GPT-4 0125 Preview</option>
                  <option value="gpt-4-1106-preview">GPT-4 1106 Preview</option>
                </optgroup>
                <optgroup label="Serie GPT-4">
                  <option value="gpt-4">GPT-4 (Original)</option>
                  <option value="gpt-4-0613">GPT-4 0613</option>
                </optgroup>
                <optgroup label="Serie GPT-3.5">
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido y económico)</option>
                  <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K (Más contexto)</option>
                </optgroup>
              </select>
              <p className="text-xs text-amber-700 mt-1">Modelo usado para generar respuestas</p>
            </div>

            {/* Temperatura */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                🌡️ Temperatura: {config.chatbotTemperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.chatbotTemperature}
                onChange={(e) => setConfig({ ...config, chatbotTemperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-amber-700 mt-1">
                <span>Preciso (0)</span>
                <span>Creativo (1)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                📝 Max Tokens
              </label>
              <input
                type="number"
                value={config.chatbotMaxTokens}
                onChange={(e) => setConfig({ ...config, chatbotMaxTokens: parseInt(e.target.value) })}
                min="50"
                max="1000"
                step="50"
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <p className="text-xs text-amber-700 mt-1">Longitud máxima de respuesta</p>
            </div>
          </div>

          {/* Configuración adicional */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Mensajes de historial */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                💬 Mensajes de Historial
              </label>
              <input
                type="number"
                value={config.chatbotMaxHistoryMessages}
                onChange={(e) => setConfig({ ...config, chatbotMaxHistoryMessages: parseInt(e.target.value) })}
                min="5"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">
                Cuántos mensajes previos usar como contexto
              </p>
            </div>

            {/* Activar/Desactivar */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                ⚡ Estado del Chatbot
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.chatbotEnabled}
                  onChange={(e) => setConfig({ ...config, chatbotEnabled: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {config.chatbotEnabled ? '✅ Activado' : '❌ Desactivado'}
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-2">
                Activa o desactiva el chatbot globalmente
              </p>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-semibold text-amber-900 mb-2">
              🎯 System Prompt (Personalidad del Agente)
            </label>
            <textarea
              value={config.chatbotSystemPrompt}
              onChange={(e) => setConfig({ ...config, chatbotSystemPrompt: e.target.value })}
              className="w-full h-64 px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm bg-amber-50/50"
              placeholder="Define quién es el agente, su personalidad y reglas..."
            />
            <div className="mt-2 bg-red-50 border-2 border-red-300 rounded-lg p-3">
              <p className="text-xs font-bold text-red-900 mb-1">🚨 REGLAS CRÍTICAS - NO NEGOCIABLES:</p>
              <ul className="text-xs text-red-800 space-y-1">
                <li>• ❌ El agente NO tiene conocimiento externo sobre lugares reales</li>
                <li>• ✅ SOLO puede recomendar lugares de nuestra base de datos</li>
                <li>• ❌ NUNCA puede inventar nombres, ratings o reseñas</li>
                <li>• ✅ Debe incluir datos exactos: "⭐4.8 (1234 reseñas)"</li>
                <li>• ❌ Si no hay lugares en el contexto, debe admitirlo</li>
                <li>• ❌ NUNCA comparte datos personales de otros usuarios</li>
              </ul>
            </div>
          </div>

          {/* User Prompt Template */}
          <div>
            <label className="block text-sm font-semibold text-amber-900 mb-2">
              👤 User Prompt Template (Contexto Dinámico)
            </label>
            <textarea
              value={config.chatbotUserPrompt}
              onChange={(e) => setConfig({ ...config, chatbotUserPrompt: e.target.value })}
              className="w-full h-40 px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm bg-amber-50/50"
              placeholder="Template que se rellena dinámicamente con datos..."
            />
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-900 mb-1">✅ Variables Disponibles:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                <code className="bg-green-100 px-2 py-1 rounded">{'{placesCount}'}</code>
                <code className="bg-green-100 px-2 py-1 rounded">{'{relevantPlaces}'}</code>
                <code className="bg-green-100 px-2 py-1 rounded">{'{categories}'}</code>
                <code className="bg-green-100 px-2 py-1 rounded">{'{provinces}'}</code>
                <code className="bg-green-100 px-2 py-1 rounded">{'{cities}'}</code>
                <code className="bg-green-100 px-2 py-1 rounded">{'{isAdmin}'}</code>
              </div>
            </div>
          </div>

          {/* Ejemplos de prueba */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
            <p className="text-sm font-bold text-indigo-900 mb-3">💡 Ejemplos de Preguntas de Prueba:</p>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="text-xs bg-white p-2 rounded border border-indigo-200">
                <span className="text-indigo-600 font-semibold">Usuario:</span> "¿Dónde comer en Madrid?"
              </div>
              <div className="text-xs bg-white p-2 rounded border border-indigo-200">
                <span className="text-indigo-600 font-semibold">Usuario:</span> "Hotel en Barcelona cerca del mar"
              </div>
              <div className="text-xs bg-white p-2 rounded border border-indigo-200">
                <span className="text-indigo-600 font-semibold">Usuario:</span> "Ruta de Toledo a Galicia"
              </div>
              <div className="text-xs bg-white p-2 rounded border border-indigo-200">
                <span className="text-indigo-600 font-semibold">Usuario:</span> "¿Qué son los tiers?"
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompts de Descripción (movidos aquí) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Prompts de Generación de Contenido
          </CardTitle>
          <CardDescription>
            Para generar descripciones y resúmenes de lugares automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt de Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Prompt de Descripción SEO
            </label>
            <textarea
              value={config.descriptionPrompt}
              onChange={(e) => setConfig({ ...config, descriptionPrompt: e.target.value })}
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              placeholder="Escribe el prompt para generar descripciones..."
            />
            <p className="text-xs text-gray-600 mt-2">
              Variables disponibles: {'{name}'}, {'{city}'}, {'{province}'}, {'{category}'}, {'{reviews}'}
            </p>
          </div>

          {/* Prompt de Resumen */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Prompt de Resumen de Reseñas
            </label>
            <textarea
              value={config.reviewSummaryPrompt}
              onChange={(e) => setConfig({ ...config, reviewSummaryPrompt: e.target.value })}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              placeholder="Escribe el prompt para resumir reseñas..."
            />
            <p className="text-xs text-gray-600 mt-2">
              Variables disponibles: {'{reviews}'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Parámetros de Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-green-600" />
            Parámetros de Búsqueda
          </CardTitle>
          <CardDescription>
            Configuración para la indexación de lugares desde Google Maps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reseñas Mínimas
              </label>
              <input
                type="number"
                value={config.minReviews}
                onChange={(e) => setConfig({ ...config, minReviews: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-600 mt-1">
                Actual: {config.minReviews} reseñas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Rating Mínimo
              </label>
              <input
                type="number"
                step="0.1"
                value={config.minRating}
                onChange={(e) => setConfig({ ...config, minRating: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="0"
                max="5"
              />
              <p className="text-xs text-gray-600 mt-1">
                Actual: {config.minRating} estrellas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Radio de Búsqueda (metros)
              </label>
              <input
                type="number"
                value={config.searchRadius}
                onChange={(e) => setConfig({ ...config, searchRadius: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="1000"
                max="100000"
                step="1000"
              />
              <p className="text-xs text-gray-600 mt-1">
                Actual: {(config.searchRadius / 1000).toFixed(0)} km
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Nota sobre la Configuración</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  • Las <strong>API Keys</strong> se configuran en el archivo <code className="bg-blue-100 px-1 rounded">.env.local</code>
                </p>
                <p>
                  • Los <strong>Prompts de IA</strong> se pueden editar aquí para personalizar las descripciones
                </p>
                <p>
                  • Los <strong>Parámetros de Búsqueda</strong> afectan la próxima indexación
                </p>
                <p className="pt-2 border-t border-blue-300">
                  ⚠️ Después de guardar cambios, <strong>reinicia el servidor</strong> para aplicarlos
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

