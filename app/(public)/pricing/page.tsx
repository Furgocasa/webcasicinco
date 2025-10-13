'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PLANS, formatPrice, getIntervalText, getYearlySavings } from '@/lib/stripe/plans';
import type { SubscriptionPlan } from '@/types/stripe';

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);

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
          trialDays: 30, // 30 días de prueba gratis
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Comienza con 30 Días Gratis
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Luego solo 2,99€/mes o ahorra con el plan anual
        </p>

        {/* Info importante sobre trial */}
        <div className="mt-6 max-w-2xl mx-auto bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <p className="text-center text-blue-900">
            <strong>🎉 Todos los planes incluyen 30 días de prueba gratis</strong>
            <br />
            <span className="text-sm">Requiere tarjeta. No se cobra hasta el día 31. Cancela cuando quieras sin cargos.</span>
          </p>
        </div>

        {/* Toggle mensual/anual */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              billingInterval === 'month'
                ? 'bg-primary text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-6 py-3 rounded-lg font-bold transition relative ${
              billingInterval === 'year'
                ? 'bg-primary text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Anual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              Ahorra {formatPrice(yearlySavings)}
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="container mx-auto px-4 pb-24">
        <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          {/* Plan Premium Mensual/Anual */}
          <Card className="relative p-8 border-2 border-primary shadow-xl scale-105">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
              MÁS POPULAR
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">RECOMENDADO</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {billingInterval === 'month' 
                  ? PLANS.premium_monthly.name 
                  : PLANS.premium_yearly.name
                }
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(
                    billingInterval === 'month'
                      ? PLANS.premium_monthly.price
                      : PLANS.premium_yearly.price / 12
                  )}
                </span>
                <span className="text-gray-600">/mes</span>
              </div>
              {billingInterval === 'year' && (
                <p className="mt-1 text-sm text-green-600 font-medium">
                  Facturado {formatPrice(PLANS.premium_yearly.price)} anualmente
                </p>
              )}
              <p className="mt-2 text-sm text-gray-600">
                Para viajeros frecuentes
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {(billingInterval === 'month' 
                ? PLANS.premium_monthly.features 
                : PLANS.premium_yearly.features
              ).map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              loading={loading === (billingInterval === 'month' ? 'premium_monthly' : 'premium_yearly')}
              onClick={() => handleSubscribe(
                billingInterval === 'month' ? 'premium_monthly' : 'premium_yearly'
              )}
            >
              Probar 30 Días Gratis
            </Button>

            <p className="mt-4 text-center text-xs text-gray-500">
              Requiere tarjeta. No se cobra hasta el día 31. Cancela cuando quieras.
            </p>
          </Card>

        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Preguntas Frecuentes
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Puedo cancelar en cualquier momento?
              </h3>
              <p className="text-gray-600">
                Sí, puedes cancelar tu suscripción en cualquier momento desde tu dashboard.
                No hay compromisos ni penalizaciones.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Qué métodos de pago aceptan?
              </h3>
              <p className="text-gray-600">
                Aceptamos todas las tarjetas de crédito y débito principales a través de Stripe,
                nuestro procesador de pagos seguro.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Puedo cambiar de plan después?
              </h3>
              <p className="text-gray-600">
                Por supuesto. Puedes actualizar o cambiar tu plan en cualquier momento desde tu dashboard.
                Los cambios se aplican de manera inmediata.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿La prueba gratuita requiere tarjeta?
              </h3>
              <p className="text-gray-600">
                Sí, necesitamos una tarjeta para comenzar tu prueba de 30 días, pero no te cobraremos
                hasta el día 31. Puedes cancelar antes sin ningún cargo.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Ofrecen descuentos para estudiantes?
              </h3>
              <p className="text-gray-600">
                Actualmente no, pero estamos trabajando en programas especiales para estudiantes y educadores.
                Mantente atento a nuestras novedades.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para descubrir lugares excepcionales?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a miles de viajeros que ya confían en Casi Cinco
          </p>
          <Link href="/registro">
            <Button size="lg">
              Empezar Gratis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
