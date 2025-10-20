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
    mapa: 'Mapa Completo',
    ruta: 'Planificador de Rutas'
  };

  const defaultDescriptions = {
    mapa: 'Regístrate gratis para explorar los 3,547+ lugares excepcionales de España',
    ruta: 'Regístrate gratis para planificar rutas personalizadas con paradas en lugares excepcionales'
  };

  return (
    <div className="absolute inset-0 bg-gray-100/95 backdrop-blur-sm flex items-center justify-center z-[999] p-6">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md shadow-2xl border-2 border-indigo-200 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 md:h-10 md:w-10 text-white" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          {title || defaultTitles[feature]}
        </h3>
        <p className="text-gray-600 mb-6 text-sm md:text-base">
          {description || defaultDescriptions[feature]}
        </p>
        <div className="space-y-3">
          <Link href="/registro" className="block">
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-base md:text-lg py-3">
              Registrarse Gratis - 30 Días
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full text-base">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          ✓ Sin tarjeta · ✓ 30 días gratis · ✓ Cancela cuando quieras
        </p>
      </div>
    </div>
  );
}

