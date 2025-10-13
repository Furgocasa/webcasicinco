'use client';

import { useUserAccess } from '@/lib/hooks/useUserAccess';
import { useRouter } from 'next/navigation';
import { Clock, Crown, X } from 'lucide-react';
import { useState } from 'react';

export default function TrialBanner() {
  const router = useRouter();
  const accessInfo = useUserAccess();
  const [dismissed, setDismissed] = useState(false);

  // No mostrar si está cerrado
  if (dismissed) return null;

  // No mostrar si es admin o usuario gratis
  if (accessInfo.isAdmin || accessInfo.isFreeUser) return null;

  // Solo mostrar si está en trial
  if (!accessInfo.isInTrial) return null;

  const daysRemaining = accessInfo.trialDaysRemaining;
  const isEndingSoon = daysRemaining <= 7;

  return (
    <div className={`w-full ${
      isEndingSoon 
        ? 'bg-gradient-to-r from-orange-500 to-red-500' 
        : 'bg-gradient-to-r from-indigo-600 to-purple-600'
    } text-white py-2 px-4 relative`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isEndingSoon ? '⚠️ ' : '🎉 '}
              <span className="font-bold">{daysRemaining} días</span> restantes de prueba gratis
            </span>
          </div>
          
          {isEndingSoon && (
            <button
              onClick={() => router.push('/pricing')}
              className="bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-orange-50 transition flex items-center gap-1"
            >
              <Crown className="h-3 w-3" />
              Suscribirse ahora
            </button>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/20 rounded-full transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

