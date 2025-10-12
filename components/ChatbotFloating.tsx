'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotFloating() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true); // Estado de habilitación del chatbot
  const [showClearConfirm, setShowClearConfirm] = useState(false); // Confirmación para limpiar chat
  const [sessionId] = useState(() => {
    // Generar ID de sesión único para usuarios no autenticados
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat_session_id');
      if (stored) return stored;
      const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_session_id', newId);
      return newId;
    }
    return `session_${Date.now()}`;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Función simple para convertir markdown básico (evita errores de hidratación)
  const renderMessageWithLinks = (content: string) => {
    // Convertir markdown a HTML simple
    let html = content
      // Enlaces: [texto](url) → <a>texto</a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        const isExternal = url.startsWith('http');
        const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        const dataUrl = `data-href="${url}"`;
        return `<a href="${url}" ${dataUrl} class="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"${target}>${text}</a>`;
      })
      // Negrita: **texto** → <strong>texto</strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');
    
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'A') {
            const href = target.getAttribute('data-href');
            if (href && !href.startsWith('http')) {
              e.preventDefault();
              router.push(href);
            }
          }
        }}
      />
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Verificar si el chatbot está habilitado
  useEffect(() => {
    const checkEnabled = async () => {
      try {
        const response = await fetch('/api/admin/config?key=chatbot_config');
        const data = await response.json();
        if (data.success) {
          setIsEnabled(data.config?.enabled !== false);
        }
      } catch (error) {
        console.error('Error verificando estado del chatbot:', error);
      }
    };
    checkEnabled();
  }, []);

  // Cargar historial cuando se abre el chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/chatbot/history?session_id=${sessionId}`);
      const data = await response.json();
      
      if (data.success && data.messages) {
        setMessages(data.messages);
        // Hacer scroll al final después de cargar
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Añadir mensaje del usuario
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([...newMessages, { role: 'assistant', content: data.message }]);
      } else {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: 'Lo siento, ocurrió un error. Por favor, intenta de nuevo.' 
        }]);
      }
    } catch (error) {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Error de conexión. Por favor, verifica tu conexión e intenta de nuevo.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // No renderizar si el chatbot está desactivado
  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-40 group"
          title="Abrir Tío Viajero IA"
        >
          {/* Avatar flotante estilo Tío Viajero - Más pequeño en móvil */}
          <div className="relative">
            {/* Imagen del Tío Viajero */}
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full shadow-xl md:shadow-2xl transform transition-all duration-300 hover:scale-110 overflow-hidden bg-sky-100">
              <img 
                src="/images/tio-viajero.png" 
                alt="Tío Viajero" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Indicador online - Más pequeño en móvil */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full animate-pulse border-2 md:border-3 border-white shadow-lg"></div>
          </div>
        </button>
      )}

      {/* Panel del chat */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-[calc(100vw-2rem)] md:w-96 h-[calc(100vh-10rem)] md:h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar estilo Tío Viajero */}
              <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-sky-100 border-2 border-white shadow-lg">
                <img 
                  src="/images/tio-viajero.png" 
                  alt="Tío Viajero" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  Tío Viajero IA
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">BETA</span>
                </h3>
                <p className="text-xs text-amber-100">Tu guía de viajes inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Botón para limpiar conversación */}
              {messages.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                  title="Limpiar conversación"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              {/* Botón cerrar */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                title="Cerrar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {/* Loading historial */}
            {loadingHistory && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-amber-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Cargando conversación...</span>
                </div>
              </div>
            )}

            {/* Mensaje de bienvenida */}
            {!loadingHistory && messages.length === 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
                <div className="flex items-start gap-3">
                  {/* Avatar del Tío Viajero */}
                  <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-sky-100 border-2 border-amber-500">
                    <img 
                      src="/images/tio-viajero.png" 
                      alt="Tío Viajero" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 mb-1">¡Saludos, viajero! 🎩</p>
                    <p className="text-sm text-amber-800">
                      Soy el Tío Viajero, tu guía experto por España. He recorrido cada rincón y conozco los mejores secretos.
                    </p>
                    <p className="text-sm text-amber-800 mt-2">
                      Pregúntame lo que quieras:
                    </p>
                    <ul className="text-xs text-amber-700 mt-2 space-y-1 ml-2">
                      <li>🍽️ "¿Dónde comer en Madrid?"</li>
                      <li>🏨 "Hotel en Barcelona cerca del mar"</li>
                      <li>🗺️ "Ruta de Toledo a Galicia"</li>
                      <li>💎 "Qué son los tiers?"</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Mensajes del chat */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-sky-100 border border-amber-400">
                        <img 
                          src="/images/tio-viajero.png" 
                          alt="Tío Viajero" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-semibold text-amber-700">Tío Viajero</span>
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="text-sm whitespace-pre-line">
                      {renderMessageWithLinks(msg.content)}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Modal de confirmación para limpiar conversación */}
            {showClearConfirm && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-10">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border-2 border-amber-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Limpiar conversación</h3>
                      <p className="text-sm text-gray-600">
                        ¿Quieres borrar todos los mensajes y empezar una nueva conversación?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setMessages([]);
                        setShowClearConfirm(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg transition shadow-lg"
                    >
                      Sí, limpiar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Presiona Enter para enviar
            </p>
          </div>
        </div>
      )}
    </>
  );
}

