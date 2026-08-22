'use client';

import { useUserAccess } from '@/lib/hooks/useUserAccess';
import { Clock, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TrialBanner() {
  const { isInTrial, trialDaysRemaining, isAdmin, isFreeUser } = useUserAccess();
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();
  const isMapa = pathname === '/mapa' || pathname?.startsWith('/mapa?');

  // No mostrar el banner si:
  // - Es admin
  // - Es usuario gratis
  // - No está en trial
  // - El banner fue cerrado manualmente
  // - Está en el mapa (rompe el viewport a pantalla completa)
  if (isMapa || isAdmin || isFreeUser || !isInTrial || isDismissed) {
    return null;
  }

  // Determinar color según días restantes
  const getColorClasses = () => {
    if (trialDaysRemaining <= 3) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else if (trialDaysRemaining <= 7) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    } else {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = () => {
    if (trialDaysRemaining <= 3) return 'text-red-600';
    if (trialDaysRemaining <= 7) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getMessage = () => {
    if (trialDaysRemaining === 0) {
      return 'Tu prueba gratuita termina hoy';
    } else if (trialDaysRemaining === 1) {
      return 'Te queda 1 día de prueba gratuita';
    } else {
      return `Te quedan ${trialDaysRemaining} días de prueba gratuita`;
    }
  };

  return (
    <div className={`border-b ${getColorClasses()} transition-colors duration-300`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Clock className={`h-5 w-5 flex-shrink-0 ${getIconColor()} animate-pulse`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {getMessage()}
              </p>
              <p className="text-xs opacity-80 hidden sm:block">
                Actualiza tu plan para continuar disfrutando de todos los lugares +4.7★
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              href="/pricing"
              className="px-4 py-1.5 bg-white rounded-lg shadow-sm hover:shadow transition-shadow text-sm font-medium whitespace-nowrap"
            >
              Ver Planes
            </Link>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
              aria-label="Cerrar banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
