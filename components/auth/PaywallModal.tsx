'use client';

import { useRouter } from 'next/navigation';
import { X, Crown, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PLANS, formatPrice, getIntervalText } from '@/lib/stripe/plans';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialDaysRemaining?: number;
  feature?: string; // "mapa", "chatbot", "rutas"
}

export default function PaywallModal({ 
  isOpen, 
  onClose, 
  trialDaysRemaining = 0,
  feature = 'esta función'
}: PaywallModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const showTrialMessage = trialDaysRemaining > 0;
  const premiumMonthly = PLANS.premium_monthly;
  const premiumYearly = PLANS.premium_yearly;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-8 w-8" />
            <h2 className="text-2xl font-bold">
              {showTrialMessage ? `¡Prueba Gratis Activa!` : '¡Suscríbete Ahora!'}
            </h2>
          </div>
          
          {showTrialMessage ? (
            <p className="text-indigo-100 text-sm">
              Te quedan <span className="font-bold text-white">{trialDaysRemaining} días</span> de prueba gratis
            </p>
          ) : (
            <p className="text-indigo-100 text-sm">
              Tu período de prueba ha terminado. Suscríbete para continuar disfrutando de {feature}.
            </p>
          )}
        </div>

        {/* Planes */}
        <div className="p-6 space-y-4">
          {/* Plan Mensual */}
          <div className="border-2 border-indigo-200 rounded-xl p-4 hover:border-indigo-400 transition">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{premiumMonthly.name}</h3>
                <p className="text-sm text-gray-600">Cancela cuando quieras</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-indigo-600">{formatPrice(premiumMonthly.price)}</p>
                <p className="text-xs text-gray-500">por mes</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {premiumMonthly.features.slice(0, 5).map((feature, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => router.push('/pricing?plan=monthly')}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Suscribirse Mensual
            </Button>
          </div>

          {/* Plan Anual - Destacado */}
          <div className="border-2 border-purple-400 bg-purple-50 rounded-xl p-4 relative">
            {/* Badge de ahorro */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                <Zap className="h-3 w-3" />
                ¡Ahorra 30%!
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 mt-2">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{premiumYearly.name}</h3>
                <p className="text-sm text-purple-700 font-semibold">Solo 2.08€/mes</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-600">{formatPrice(premiumYearly.price)}</p>
                <p className="text-xs text-gray-500">por año</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {premiumYearly.features.slice(0, 5).map((feature, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => router.push('/pricing?plan=yearly')}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Suscribirse Anual
            </Button>
          </div>

          {/* Mensaje de trial */}
          {showTrialMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 text-center">
                💡 Suscríbete ahora y continúa sin interrupciones cuando termine tu prueba
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-2">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Seguir explorando ({trialDaysRemaining > 0 ? `${trialDaysRemaining} días restantes` : 'sin acceso'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

