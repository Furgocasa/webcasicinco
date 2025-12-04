'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Clock, Zap, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function WelcomeModal() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(30);

  useEffect(() => {
    // Verificar si debe mostrar el modal
    const checkShouldShow = async () => {
      // 1. Verificar localStorage (ya lo vio antes)
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (hasSeenWelcome) {
        return;
      }

      // 2. Verificar estado del usuario
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Obtener metadata del usuario
      const role = user.user_metadata?.role;
      const isFreeUser = user.user_metadata?.is_free_user === true;
      const trialEndsAt = user.user_metadata?.trial_ends_at;

      // 2a. NO mostrar a admin
      if (role === 'admin') {
        localStorage.setItem('hasSeenWelcome', 'true');
        return;
      }

      // 2b. NO mostrar a usuarios "free" (bypass)
      if (isFreeUser) {
        localStorage.setItem('hasSeenWelcome', 'true');
        return;
      }

      // 2c. Verificar y calcular días restantes del trial
      if (trialEndsAt) {
        const trialEnd = new Date(trialEndsAt);
        const now = new Date();
        const days = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        setDaysRemaining(days);
        
        console.log('🔍 WelcomeModal: Días restantes de trial:', days);
        
        // Si el trial expiró (0 días), no mostrar este modal
        // El PaywallModal se encargará de mostrar el mensaje apropiado
        if (days === 0) {
          console.log('❌ WelcomeModal: Trial expirado, PaywallModal se encargará');
          localStorage.setItem('hasSeenWelcome', 'true');
          return;
        }
        
        // Si tiene días válidos (1-30), continuar para mostrar modal
        // La verificación de si ya lo vio está en localStorage al inicio
      } else {
        // Si NO tiene trial_ends_at, el trigger de base de datos falló
        // No mostrar modal pero tampoco marcar como visto (puede que se corrija)
        console.log('⚠️ WelcomeModal: Usuario sin trial_ends_at - posible error en trigger de BD');
        return;
      }

      // 2d. NO mostrar si ya tiene suscripción activa
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subscription) {
        console.log('❌ WelcomeModal: Usuario con suscripción activa, no mostrar');
        localStorage.setItem('hasSeenWelcome', 'true');
        return;
      }

      // 3. Si llegó aquí y tiene trial, es un nuevo usuario → MOSTRAR
      console.log('✅ WelcomeModal: Mostrando modal de bienvenida');
      setTimeout(() => setShow(true), 1000); // 1 segundo de delay
    };

    checkShouldShow();
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
      // Llamar a Stripe checkout CON días restantes de trial (para respetar el trial de Supabase)
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId, 
          trialDays: daysRemaining // ✅ Respeta días restantes del trial de Supabase
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

  // Función para cerrar el modal
  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    // Overlay - permite cerrar haciendo clic fuera
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4"
      onClick={handleClose}
    >
      {/* Modal - evita que el clic dentro cierre el modal */}
      <Card 
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 bg-white rounded-xl sm:rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Botón cerrar X - siempre visible y accesible */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition z-10"
          aria-label="Cerrar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 sm:mb-3 pr-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          🎉 ¡Enhorabuena!
        </h2>
        <div className="text-center mb-4 sm:mb-6 space-y-1 sm:space-y-2">
          <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
            Has iniciado tu periodo de prueba gratuito
          </p>
          <p className="text-sm sm:text-base text-gray-600">
            Podrás utilizar la APP <strong>sin restricciones durante 30 días</strong>
          </p>
          <div className="inline-flex items-center gap-1 sm:gap-2 bg-green-100 text-green-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
            <span className="hidden sm:inline">✓ Sin tarjeta de crédito · ✓ Sin cargos · ✓ Cancela cuando quieras</span>
            <span className="sm:hidden">✓ Sin tarjeta · ✓ Sin cargos</span>
          </div>
        </div>
        
        {/* Texto intermedio - oculto en móvil para ahorrar espacio */}
        <p className="hidden sm:block text-center text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
          Transcurridos esos 30 días deberás elegir tu suscripción:
        </p>

        <div className="space-y-2 sm:space-y-4">
          {/* OPCIÓN 1: Empezar con Trial - DESTACADA */}
          <button
            onClick={handleFreeTrial}
            disabled={loading}
            className="w-full p-3 sm:p-4 md:p-6 border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg sm:rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 text-left transform hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-indigo-500 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                    Empezar con Trial
                  </h3>
                  <span className="bg-green-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    RECOMENDADO
                  </span>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
                  <span className="hidden sm:inline">Usa todas las funciones gratis durante 30 días · Ya está activado</span>
                  <span className="sm:hidden">30 días gratis · Ya activado</span>
                </p>
                {/* Lista de características - oculta en móvil */}
                <ul className="hidden sm:block space-y-1 text-sm text-gray-700 mb-3">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Mapa interactivo con 3,000+ lugares</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Chatbot IA "Tío Viajero" ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Planificador de rutas personalizado</span>
                  </li>
                </ul>
                <div className="inline-flex items-center gap-1 sm:gap-2 bg-indigo-600 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm">
                  <span>Empezar a Explorar</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </button>

          {/* Sección suscripciones - colapsada en móvil */}
          <details className="sm:hidden">
            <summary className="text-center text-xs text-gray-500 py-2 cursor-pointer">
              Ver opciones de suscripción anticipada
            </summary>
            <div className="space-y-2 pt-2">
              {/* Premium Mensual - versión móvil */}
              <button
                onClick={() => handleSubscribe('premium_monthly')}
                disabled={loading}
                className="w-full p-3 border border-gray-200 bg-white rounded-lg text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Mensual · 2,99€/mes</p>
                    <p className="text-xs text-gray-500">Cargo en 30 días</p>
                  </div>
                </div>
              </button>
              {/* Premium Anual - versión móvil */}
              <button
                onClick={() => handleSubscribe('premium_yearly')}
                disabled={loading}
                className="w-full p-3 border border-purple-200 bg-purple-50 rounded-lg text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Anual · 24,99€/año <span className="text-orange-500 text-xs">-30%</span></p>
                    <p className="text-xs text-gray-500">Cargo en 30 días</p>
                  </div>
                </div>
              </button>
            </div>
          </details>

          {/* OPCIÓN 2: Premium Mensual - solo desktop */}
          <button
            onClick={() => handleSubscribe('premium_monthly')}
            disabled={loading}
            className="hidden sm:block w-full p-4 md:p-5 border-2 border-gray-200 bg-white rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gray-100 rounded-lg">
                <Zap className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  ⚡ Suscribirme Ahora - Mensual
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  2,99€/mes · Cargo en 30 días · Respeta tu trial
                </p>
                <div className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg font-medium text-sm">
                  <span>Suscribirse</span>
                </div>
              </div>
            </div>
          </button>

          {/* OPCIÓN 3: Premium Anual - Mejor Valor - solo desktop */}
          <button
            onClick={() => handleSubscribe('premium_yearly')}
            disabled={loading}
            className="hidden sm:block w-full p-4 md:p-5 border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:border-purple-400 hover:shadow-md transition-all duration-200 text-left transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-purple-100 rounded-lg">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    👑 Suscribirme Ahora - Anual
                  </h3>
                  <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Ahorra 30%
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  24,99€/año · Cargo en 30 días · Respeta tu trial
                </p>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                  <span>Mejor Valor</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Nota al pie - más compacta en móvil */}
        <p className="text-center text-gray-500 text-[10px] sm:text-xs md:text-sm mt-3 sm:mt-6">
          <span className="hidden sm:inline">Si eliges suscribirte ahora, introducirás tu tarjeta pero </span>
          <strong>No se cobra hasta que finalice el trial</strong>
        </p>
      </Card>
    </div>
  );
}

