'use client';

import { useState, useEffect } from 'react';
import { X, Navigation, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

const PROMO_MESSAGES = [
  {
    title: '🗺️ ¿Sabías que...?',
    description: 'Puedes crear rutas personalizadas y descubrir los mejores lugares en tu camino!',
    features: [
      'Optimización automática de distancias',
      'Múltiples paradas en tu ruta',
      'Guarda tus rutas favoritas',
    ],
  },
  {
    title: '🚗 ¡Planifica tu viaje!',
    description: 'El planificador de rutas te ayuda a encontrar lugares excepcionales en tu trayecto.',
    features: [
      'Añade todos los lugares que quieras',
      'Calcula la mejor ruta automáticamente',
      'Comparte tus rutas con amigos',
    ],
  },
  {
    title: '✨ Nueva función: Rutas',
    description: '¿Vas de viaje? Descubre los mejores restaurantes, hoteles y bares en tu camino.',
    features: [
      'Solo lugares con 4.7+ estrellas',
      'Prioriza tiers Diamante, Platino y Oro',
      'Sincroniza en todos tus dispositivos',
    ],
  },
];

const STORAGE_KEY = 'casicinco_route_promo_last_shown';
const DAYS_BETWEEN_SHOWS = 7; // Mostrar cada 7 días
const DONT_SHOW_KEY = 'casicinco_route_promo_dont_show';

export default function RoutePromoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // Solo para usuarios registrados
    if (!user) return;

    // Verificar si el usuario marcó "No mostrar de nuevo"
    const dontShow = localStorage.getItem(DONT_SHOW_KEY);
    if (dontShow === 'true') return;

    // Verificar la última vez que se mostró
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (lastShown) {
      const daysSinceLastShown = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastShown < DAYS_BETWEEN_SHOWS) return;
    }

    // Seleccionar mensaje aleatorio
    const randomIndex = Math.floor(Math.random() * PROMO_MESSAGES.length);
    setCurrentMessage(randomIndex);

    // Mostrar modal después de 3 segundos
    const timer = setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem(STORAGE_KEY, now.toString());
    }, 3000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_KEY, 'true');
    }
  };

  if (!isOpen) return null;

  const message = PROMO_MESSAGES[currentMessage];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Navigation className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">{message.title}</h2>
            </div>
            <p className="text-blue-50 text-sm">
              {message.description}
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="space-y-3 mb-6">
              {message.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Ahora no
              </button>
              <Link
                href="/ruta"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="h-5 w-5" />
                Crear mi ruta
              </Link>
            </div>

            {/* Don't show again */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">
                  No volver a mostrar
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

