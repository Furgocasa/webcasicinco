'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';

interface LoginOverlayProps {
  title?: string;
  description?: string;
  feature: 'mapa' | 'ruta';
}

export default function LoginOverlay({ 
  title, 
  description, 
  feature 
}: LoginOverlayProps) {
  const defaultTitles = {
    mapa: 'Mapa Completo Bloqueado',
    ruta: 'Planificador de Rutas Bloqueado'
  };

  const defaultDescriptions = {
    mapa: 'Es necesario registrarse para explorar los 3,547+ lugares excepcionales de España en el mapa interactivo',
    ruta: 'Es necesario registrarse para planificar rutas personalizadas con paradas en lugares excepcionales'
  };

  return (
    // Overlay agresivo: cubre toda la pantalla, no se puede cerrar, alto z-index
    <div className="absolute inset-0 bg-gray-100/98 backdrop-blur-md flex items-center justify-center z-[1000] p-4 md:p-6">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-indigo-200 text-center animate-fade-in">
        {/* Icono de candado prominente */}
        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
          <Lock className="h-10 w-10 md:h-12 md:w-12 text-white" />
        </div>
        
        {/* Título más prominente */}
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          {title || defaultTitles[feature]}
        </h3>
        
        {/* Descripción más clara */}
        <p className="text-gray-700 mb-6 text-base md:text-lg leading-relaxed">
          {description || defaultDescriptions[feature]}
        </p>
        
        {/* Destacar el beneficio */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 border border-indigo-100">
          <p className="text-sm md:text-base font-semibold text-indigo-900">
            🎉 Prueba GRATIS por 30 días
          </p>
          <p className="text-xs md:text-sm text-indigo-700 mt-1">
            Sin tarjeta de crédito · Cancela cuando quieras
          </p>
        </div>
        
        {/* Botones más grandes y visibles */}
        <div className="space-y-3">
          <Link href="/registro" className="block">
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg md:text-xl py-4 font-bold shadow-lg hover:shadow-xl transition-all">
              Registrarme Gratis
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full text-base md:text-lg py-3 border-2 border-gray-300 hover:border-indigo-400">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>
        
        {/* Footer con garantías */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ✓ Acceso inmediato · ✓ 3,547+ lugares verificados · ✓ 100% gratis por 30 días
          </p>
        </div>
      </div>
    </div>
  );
}

