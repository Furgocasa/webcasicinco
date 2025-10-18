'use client';

import { useEffect, useState } from 'react';
import { useUserAccess } from '@/lib/hooks/useUserAccess';
import { X, Lock, Star, Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function PaywallModal() {
  const { needsSubscription, isAdmin, isFreeUser, isInTrial } = useUserAccess();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Mostrar modal si necesita suscripción (trial expirado y sin plan activo)
    if (needsSubscription && !isAdmin && !isFreeUser && !isInTrial) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [needsSubscription, isAdmin, isFreeUser, isInTrial]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white p-8 rounded-t-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Lock className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tu prueba ha finalizado</h2>
                <p className="text-indigo-100 text-sm">Continúa explorando los mejores lugares</p>
              </div>
            </div>
          </div>
          
          {/* Decorative stars */}
          <div className="absolute top-4 right-4 flex gap-1">
            <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
            <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
            <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Benefits */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              ¿Qué obtienes con Premium?
            </h3>
            <div className="grid gap-3">
              {[
                'Acceso ilimitado a +3,000 lugares verificados',
                'Solo sitios con valoración +4.7★',
                'Planificador de rutas personalizadas',
                'Mapa interactivo con filtros avanzados',
                'Actualizaciones semanales de nuevos lugares',
                'Sin anuncios ni límites',
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Mensual */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-500 transition">
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Mensual</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">9,90€</span>
                  <span className="text-gray-600">/mes</span>
                </div>
              </div>
              <Link href="/pricing">
                <Button variant="outline" className="w-full">
                  Elegir Plan
                </Button>
              </Link>
            </div>

            {/* Anual - Destacado */}
            <div className="border-2 border-indigo-600 rounded-xl p-6 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                AHORRA 33%
              </div>
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-indigo-600 mb-1">Anual</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">79,90€</span>
                  <span className="text-gray-600">/año</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Solo 6,66€/mes</p>
              </div>
              <Link href="/pricing">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Elegir Plan
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              🔒 Pago seguro con Stripe • Cancela cuando quieras • Sin permanencia
            </p>
            <Link 
              href="/perfil"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver mi estado de suscripción →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
