'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, RotateCcw, Lock, MapPin } from 'lucide-react';
import { Button } from './ui/Button';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import Link from 'next/link';
import { trackEvent, EVENTS, CATEGORIES as ANALYTICS_CATEGORIES } from '@/lib/analytics/tracker';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotFloating() {
  const router = useRouter();
  const pathname = usePathname();
  // /mapa y /ruta llevan barra inferior en móvil: el botón se apoya sobre ella
  const isMapa = ['/mapa', '/ruta'].some(
    (ruta) => pathname === ruta || pathname?.startsWith(`${ruta}?`)
  );
  const { user, loading: authLoading } = useAuth();
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
  
  // 📍 Estado de ubicación
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

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
              
              // 🎯 Trackear click en enlace del chatbot
              trackEvent(EVENTS.CHATBOT_LINK_CLICK, ANALYTICS_CATEGORIES.CHATBOT, {
                link_url: href,
                link_type: href.includes('/mapa') ? 'map' : 'detail'
              });
              
              // En móvil el panel cubre toda la pantalla: si no se cierra, parece que el enlace no ha hecho nada.
              if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 768px)').matches) {
                setIsOpen(false)
              }
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

  // 📍 Solicitar ubicación cuando se abre el chat
  useEffect(() => {
    if (isOpen && !userLocation && !locationDenied && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          console.log('📍 Ubicación obtenida:', location);
          
          // Mostrar notificación amigable
          toast.success('📍 Ubicación compartida', {
            description: 'El Tío Viajero puede recomendarte lugares cerca de ti'
          });
        },
        (error) => {
          console.log('❌ Ubicación denegada o no disponible:', error.message);
          setLocationDenied(true);
          // No mostrar error, es opcional
        },
        {
          enableHighAccuracy: false, // No necesitamos precisión extrema
          timeout: 5000,
          maximumAge: 300000 // Cache de 5 minutos
        }
      );
    }
  }, [isOpen, userLocation, locationDenied]);

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
    
    // 🎯 Trackear mensaje enviado al chatbot
    trackEvent(EVENTS.CHATBOT_MESSAGE_SEND, ANALYTICS_CATEGORIES.CHATBOT, {
      message_length: userMessage.length,
      messages_in_conversation: messages.length
    });
    
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
          location: userLocation, // 📍 Incluir ubicación si está disponible
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
          className={`fixed right-3 md:right-6 z-40 bg-gradient-to-r from-blue-600 to-gray-700 rounded-full p-1.5 md:p-2 shadow-2xl hover:scale-110 transition-transform ${
            isMapa
              ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6'
              : 'bottom-20 md:bottom-6'
          }`}
          title="Abrir Tío Viajero IA"
        >
          <img
            src="/images/tio-viajero.png"
            alt="Tío Viajero"
            className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-full border-2 border-white bg-sky-100"
          />
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full shadow-lg">
            IA
          </span>
        </button>
      )}

      {/* Panel del chat: a pantalla completa en móvil, como en Mapa Furgocasa */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 w-full md:w-96 h-full md:h-[600px] bg-white md:rounded-2xl shadow-2xl border-0 md:border border-gray-200 md:max-w-[calc(100vw-3rem)] md:max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden z-40 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          {/* Header - STICKY para siempre visible */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-gray-700 text-white p-4 md:rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <img
                src="/images/tio-viajero.png"
                alt="Tío Viajero"
                className="w-10 h-10 flex-shrink-0 object-cover rounded-full border-2 border-white bg-sky-100"
              />
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  Tío Viajero IA
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">BETA</span>
                </h3>
                <p className="text-xs opacity-90">Tu guía de viajes inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Botón para limpiar conversación */}
              {messages.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  title="Limpiar conversación"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              {/* Botón cerrar */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                title="Cerrar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mensajes - Área con scroll independiente */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50">
            {/* BLOQUEO para usuarios no logueados */}
            {!authLoading && !user && (
              <div className="absolute inset-0 bg-gray-100/95 backdrop-blur-sm flex items-center justify-center z-20 p-6">
                {/* Botón X para cerrar el overlay */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white hover:bg-gray-100 shadow-lg transition-colors"
                  title="Cerrar"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
                
                <div className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl border-2 border-indigo-200 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Inicia Sesión
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Es necesario registrarse para usar el Agente de Chat "Tío Viajero"
                  </p>
                  <div className="space-y-2">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/registro" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Crear Cuenta
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Loading historial */}
            {loadingHistory && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-[#002297]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Cargando conversación...</span>
                </div>
              </div>
            )}

            {/* Indicador de ubicación */}
            {!loadingHistory && userLocation && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700">
                  <strong>Ubicación compartida</strong> - Puedes preguntar por lugares "cerca de mí"
                </p>
              </div>
            )}

            {/* Mensaje de bienvenida */}
            {!loadingHistory && messages.length === 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  {/* Avatar del Tío Viajero */}
                  <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-sky-100 border-2 border-[#002297]">
                    <img 
                      src="/images/tio-viajero.png" 
                      alt="Tío Viajero" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-[#002297] mb-1">¡Saludos, viajero! 🎩</p>
                    <p className="text-sm text-blue-800">
                      Soy el Tío Viajero, tu guía experto por España. He recorrido cada rincón y conozco los mejores secretos.
                    </p>
                    {userLocation && (
                      <p className="text-xs text-green-700 mt-2 font-medium">
                        📍 Tengo tu ubicación. Puedes preguntarme por lugares "cerca" o "aquí"
                      </p>
                    )}
                    <p className="text-sm text-blue-800 mt-2">
                      Pregúntame lo que quieras:
                    </p>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-2">
                      <li>🍽️ "¿Dónde comer en Madrid?"</li>
                      <li>🏨 "Hotel en Barcelona cerca del mar"</li>
                      {userLocation && <li>📍 "Restaurante de pescado cerca de mí"</li>}
                      {userLocation && <li>🍔 "Hamburguesería económica aquí"</li>}
                      {!userLocation && <li>🗺️ "Mejores hoteles de Málaga"</li>}
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
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}
              >
                {msg.role === 'assistant' && (
                  <img
                    src="/images/tio-viajero.png"
                    alt="Tío Viajero"
                    className="w-8 h-8 object-cover rounded-full border-2 border-blue-500 bg-sky-100 flex-shrink-0 mt-1"
                  />
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-gray-700 text-white'
                      : 'bg-white text-gray-900 shadow-md border border-blue-100'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {renderMessageWithLinks(msg.content)}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start gap-2">
                <img
                  src="/images/tio-viajero.png"
                  alt="Tío Viajero"
                  className="w-8 h-8 object-cover rounded-full border-2 border-blue-500 bg-sky-100 flex-shrink-0"
                />
                <div className="bg-white rounded-2xl p-3 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Modal de confirmación para limpiar conversación */}
            {showClearConfirm && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-10">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border-2 border-blue-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="h-5 w-5 text-[#002297]" />
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
                      onClick={async () => {
                        try {
                          // Borrar de la BD
                          await fetch(`/api/chatbot/history?session_id=${sessionId}`, {
                            method: 'DELETE',
                          });
                          
                          // Limpiar estado local
                          setMessages([]);
                          setShowClearConfirm(false);
                          toast.success('Conversación limpiada');
                        } catch (error) {
                          console.error('Error limpiando historial:', error);
                          toast.error('Error al limpiar conversación');
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#002297] to-blue-700 hover:from-blue-900 hover:to-blue-800 rounded-lg transition shadow-lg"
                    >
                      Sí, limpiar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input - STICKY abajo, siempre visible */}
          <div className="sticky bottom-0 p-4 bg-white border-t border-gray-200 md:rounded-b-2xl flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-gray-700 text-white rounded-full px-6 py-2 hover:from-blue-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-md flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Presiona Enter para enviar
            </p>
          </div>
        </div>
      )}
    </>
  );
}

