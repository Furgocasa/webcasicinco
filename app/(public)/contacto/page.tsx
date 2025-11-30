'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';

export default function ContactoPage() {
  // Establecer título de la página
  useEffect(() => {
    document.title = 'Contacto | Casi Cinco';
  }, []);

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* HERO */}
        <section className="relative bg-[#063971] text-white overflow-hidden py-12">
          <div className="container mx-auto px-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <Mail className="h-12 w-12 text-[#ffd935]" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Contacto
              </h1>
            </div>
            <p className="text-white/90 text-lg">
              ¿Tienes preguntas, sugerencias o necesitas ayuda? Escríbenos.
            </p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contacto Directo */}
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contacto Directo</h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <p className="font-semibold mb-2 text-lg">Email</p>
                    <a 
                      href="mailto:info@casicinco.com"
                      className="text-[#063971] hover:underline text-xl font-medium inline-flex items-center gap-2"
                    >
                      <Mail className="h-5 w-5" />
                      info@casicinco.com
                    </a>
                    <p className="text-sm text-gray-500 mt-3">
                      Para consultas generales, soporte técnico, privacidad o temas legales
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Tiempo de respuesta: menos de 24 horas laborables
                    </p>
                  </div>
                </div>
              </Card>

              {/* Preguntas Frecuentes */}
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Preguntas Frecuentes</h2>
                <div className="space-y-6 text-gray-700">
                  <div>
                    <p className="font-semibold mb-2 text-base">¿Cómo cancelo mi suscripción?</p>
                    <p className="text-sm">Desde tu perfil → Suscripción → Cancelar</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2 text-base">¿Ofrecen reembolsos?</p>
                    <p className="text-sm">No reembolsamos periodos parciales, pero puedes cancelar en cualquier momento</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2 text-base">¿Cómo añadir un lugar?</p>
                    <p className="text-sm">Solo indexamos lugares de Google Maps con 4.7★+. No podemos añadir lugares manualmente</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2 text-base">¿Tiempo de respuesta?</p>
                    <p className="text-sm">Menos de 24 horas laborables</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sección Propietarios */}
            <div className="mt-8">
              <Card className="p-6 bg-[#ffd935] bg-opacity-20 border-[#ffd935]">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ¿Eres propietario de un lugar?
                </h3>
                <p className="text-sm text-gray-700">
                  Si tienes un restaurante, hotel, bar o cafetería y quieres aparecer en Casi Cinco,
                  asegúrate de tener <strong>mínimo 4.7★</strong> en Google Maps. Nuestro sistema
                  indexa automáticamente los mejores lugares.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

