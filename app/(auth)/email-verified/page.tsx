'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function EmailVerifiedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 px-4">
      <Card className="max-w-md w-full p-8 text-center shadow-xl">
        {/* Icono de éxito */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
            <CheckCircle2 className="w-20 h-20 text-green-500 relative" />
          </div>
        </div>
        
        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Email Verificado!
        </h1>
        
        {/* Descripción */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Tu cuenta ha sido verificada correctamente. Ya puedes disfrutar de todas las funcionalidades de <span className="font-semibold text-primary">Casi Cinco</span>.
        </p>
        
        {/* Beneficios */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-gray-700 mb-2">✨ Ahora puedes:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Guardar tus lugares favoritos</li>
            <li>• Crear y compartir listas personalizadas</li>
            <li>• Recibir recomendaciones personalizadas</li>
            <li>• Acceder a tu periodo de prueba gratuito</li>
          </ul>
        </div>
        
        {/* Botones y countdown */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Serás redirigido automáticamente en <span className="font-bold text-primary">{countdown}</span> segundos...
          </p>
          
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
            size="lg"
          >
            Ir a Inicio Ahora
          </Button>
        </div>
      </Card>
    </div>
  );
}

