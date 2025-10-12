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
          trialDays: 7, // 7 días de prueba gratis
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
          Elige tu plan perfecto
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Descubre lugares excepcionales sin límites
        </p>

        {/* Toggle mensual/anual */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              billingInterval === 'month'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded-lg font-medium transition relative ${
              billingInterval === 'year'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Anual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Ahorra {formatPrice(yearlySavings)}
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="container mx-auto px-4 pb-24">
        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Plan Gratis */}
          <Card className="relative p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">PARA EMPEZAR</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {PLANS.free.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">Gratis</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Perfecto para probar la app
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {PLANS.free.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/registro'}
            >
              Empezar Gratis
            </Button>
          </Card>

          {/* Plan Premium */}
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
              Probar 7 Días Gratis
            </Button>

            <p className="mt-4 text-center text-xs text-gray-500">
              Sin compromisos. Cancela cuando quieras.
            </p>
          </Card>

          {/* Plan Admin */}
          <Card className="relative p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <Crown className="h-5 w-5" />
                <span className="text-sm font-medium">PROFESIONAL</span>
              </div>
              <h3 className="text-2xl font-bold">
                {PLANS.admin_monthly.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {formatPrice(PLANS.admin_monthly.price)}
                </span>
                <span className="text-gray-300">/mes</span>
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Para creadores de contenido
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {PLANS.admin_monthly.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-100">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="w-full bg-white text-gray-900 hover:bg-gray-100"
              loading={loading === 'admin_monthly'}
              onClick={() => handleSubscribe('admin_monthly')}
            >
              Empezar Ahora
            </Button>
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
                Sí, necesitamos una tarjeta para comenzar tu prueba de 7 días, pero no te cobraremos
                hasta que termine el periodo de prueba. Puedes cancelar antes sin ningún cargo.
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
