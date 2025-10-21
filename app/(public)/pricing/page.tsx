'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Zap, Crown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Footer from '@/components/layout/Footer';
import { PLANS, formatPrice, getIntervalText, getYearlySavings } from '@/lib/stripe/plans';
import type { SubscriptionPlan } from '@/types/stripe';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Establecer título de la página
  useEffect(() => {
    document.title = 'Planes y Precios | Casi Cinco';
  }, []);

  // Verificar si el usuario está logueado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/access');
        if (response.ok) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleSubscribe = async (planId: SubscriptionPlan) => {
    try {
      setLoading(planId);

      // Llamar a la API para crear sesión de checkout
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          trialDays: 0, // Trial sin tarjeta se gestiona en Supabase, no en Stripe
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
      alert('Error al procesar el pago. Inténtalo de nuevo.');
      setLoading(null);
    }
  };

  const yearlySavings = getYearlySavings();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto px-4">
        {/* Header - Igual que home */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Comienza Gratis, Continúa por Menos de un Café
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            30 días gratis para probar todo. Luego elige el plan que mejor se adapte a ti.
          </p>
        </div>

        {/* Plans Grid - 3 columnas IGUAL QUE HOME */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan Trial - Card sombreada si está logueado */}
          <Card className={`border-2 p-6 hover:shadow-xl transition ${
            isLoggedIn ? 'border-gray-200 opacity-60 bg-gray-50' : 'border-gray-200'
          }`}>
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Prueba Gratis</h3>
              <div className="text-4xl font-bold text-blue-600 mb-2">0€</div>
              <p className="text-gray-600">30 días completos</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Acceso total a mapa interactivo</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Chatbot IA ilimitado</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Planificador de rutas</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Sin tarjeta hasta el día 31</span>
              </li>
            </ul>
            <Button 
              onClick={() => router.push('/registro')}
              variant="outline"
              className="w-full"
              disabled={isLoggedIn}
            >
              {isLoggedIn ? 'Ya estás registrado' : 'Empezar Gratis'}
            </Button>
          </Card>

          {/* Plan Mensual */}
          <Card className="border-2 border-indigo-200 p-6 hover:shadow-xl transition">
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-indigo-100 rounded-full mb-4">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Mensual</h3>
              <div className="text-4xl font-bold text-indigo-600 mb-2">2,99€</div>
              <p className="text-gray-600">por mes</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Todo del plan gratis</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Sin límites de tiempo</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Nuevos lugares cada semana</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Cancela cuando quieras</span>
              </li>
            </ul>
            <Button 
              onClick={() => handleSubscribe('premium_monthly')}
              loading={loading === 'premium_monthly'}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Suscribirse
            </Button>
          </Card>

          {/* Plan Anual - DESTACADO */}
          <Card className="border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-white p-6 hover:shadow-2xl transition relative">
            {/* Badge de ahorro */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                ¡Ahorra 30%!
              </div>
            </div>
            
            <div className="text-center mb-6 mt-2">
              <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Anual</h3>
              <div className="text-4xl font-bold text-purple-600 mb-2">24,99€</div>
              <p className="text-gray-600">por año · Solo 2,08€/mes</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Todo del plan mensual</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Casi 4 meses gratis al año</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Soporte prioritario</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Acceso anticipado a nuevos lugares</span>
              </li>
            </ul>
            <Button 
              onClick={() => handleSubscribe('premium_yearly')}
              loading={loading === 'premium_yearly'}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
            >
              Mejor Valor
            </Button>
          </Card>
        </div>

        {/* FAQs rápidos - IGUAL QUE HOME */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">¿Necesito tarjeta para el trial?</h4>
              <p className="text-sm text-gray-600">No. Los 30 días de prueba son 100% gratis sin necesidad de tarjeta. La introduces solo cuando decidas suscribirte.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">¿Puedo cancelar cuando quiera?</h4>
              <p className="text-sm text-gray-600">Sí. Cancela en cualquier momento desde tu perfil. Si es antes del día 31, no se cobra nada.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">¿Cuándo añado mi tarjeta?</h4>
              <p className="text-sm text-gray-600">Cuando decidas suscribirte después del trial. Puedes hacerlo en cualquier momento durante los 30 días o al final del período de prueba.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">¿Por qué el plan anual es mejor?</h4>
              <p className="text-sm text-gray-600">Ahorras 10,89€ al año (casi 4 meses gratis) y obtienes soporte prioritario.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
