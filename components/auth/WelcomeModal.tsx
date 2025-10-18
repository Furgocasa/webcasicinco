'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Clock, Zap, Crown } from 'lucide-react';

export function WelcomeModal() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mostrar solo al primer login (usuario recién registrado)
    const checkFirstLogin = () => {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      
      // Si no ha visto el modal, mostrarlo después de 500ms
      if (!hasSeenWelcome) {
        setTimeout(() => setShow(true), 500);
      }
    };

    checkFirstLogin();
  }, []);

  const handleFreeTrial = () => {
    // Guardar preferencia
    localStorage.setItem('hasSeenWelcome', 'true');
    localStorage.setItem('selectedPlan', 'trial');
    setShow(false);
    
    // Redirigir al mapa para empezar a usar
    router.push('/mapa');
  };

  const handleSubscribe = async (planId: 'premium_monthly' | 'premium_yearly') => {
    setLoading(true);
    localStorage.setItem('hasSeenWelcome', 'true');
    
    try {
      // Llamar a Stripe checkout SIN trial (trial se gestiona en Supabase)
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId, 
          trialDays: 0 // ← IMPORTANTE: Sin trial en Stripe, ya se gestiona en Supabase
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear sesión de pago');
      }
      
      const { url } = await response.json();
      
      // Redirigir a Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el pago. Por favor, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ¡Bienvenido a Casi Cinco!
        </h2>
        <p className="text-center text-gray-600 mb-8 text-lg">
          Elige cómo quieres empezar:
        </p>

        <div className="space-y-4">
          {/* OPCIÓN 1: Trial Gratis 30 Días - DESTACADA */}
          <button
            onClick={handleFreeTrial}
            disabled={loading}
            className="w-full p-6 border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 text-left transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    🎁 Prueba Gratis 30 Días
                  </h3>
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    RECOMENDADO
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Sin tarjeta · Sin compromiso · Acceso completo a todas las funciones
                </p>
                <ul className="space-y-1 text-sm text-gray-700 mb-3">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Mapa interactivo con 2,600+ lugares</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Chatbot IA "Tío Viajero" ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Planificador de rutas</span>
                  </li>
                </ul>
                <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm">
                  <span>Empezar Ahora</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </button>

          {/* OPCIÓN 2: Premium Mensual */}
          <button
            onClick={() => handleSubscribe('premium_monthly')}
            disabled={loading}
            className="w-full p-5 border-2 border-gray-200 bg-white rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gray-100 rounded-lg">
                <Zap className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  ⚡ Premium Mensual
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  2.99€/mes · Cancela cuando quieras
                </p>
                <div className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg font-medium text-sm">
                  <span>Suscribirse</span>
                </div>
              </div>
            </div>
          </button>

          {/* OPCIÓN 3: Premium Anual - Mejor Valor */}
          <button
            onClick={() => handleSubscribe('premium_yearly')}
            disabled={loading}
            className="w-full p-5 border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:border-purple-400 hover:shadow-md transition-all duration-200 text-left transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-purple-100 rounded-lg">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    👑 Premium Anual
                  </h3>
                  <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Ahorra 30%
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  24.99€/año · Solo 2.08€/mes · Casi 4 meses gratis
                </p>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                  <span>Mejor Valor</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Puedes cambiar de plan en cualquier momento desde tu perfil
        </p>

        {/* Botón cerrar (pequeño, discreto) */}
        <button
          onClick={() => {
            localStorage.setItem('hasSeenWelcome', 'true');
            setShow(false);
          }}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </Card>
    </div>
  );
}

