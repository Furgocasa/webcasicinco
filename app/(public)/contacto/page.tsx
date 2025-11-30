'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Send, CheckCircle2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Establecer título de la página
  useEffect(() => {
    document.title = 'Contacto | Casi Cinco';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular envío (aquí deberías conectar con tu backend)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSent(true);
    setLoading(false);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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
              {/* Formulario */}
              <div>
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Envíanos un Mensaje</h2>
                  
                  {sent ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">¡Mensaje Enviado!</h3>
                      <p className="text-gray-600 mb-6">
                        Te responderemos lo antes posible. Normalmente en menos de 24 horas.
                      </p>
                      <Button
                        onClick={() => setSent(false)}
                        variant="outline"
                      >
                        Enviar Otro Mensaje
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre
                        </label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Tu nombre"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="tu@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Asunto
                        </label>
                        <Input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                          placeholder="¿En qué podemos ayudarte?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mensaje
                        </label>
                        <textarea
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#063971] focus:border-transparent resize-none"
                          placeholder="Cuéntanos con detalle..."
                        />
                      </div>

                      <Button
                        type="submit"
                        loading={loading}
                        className="w-full bg-[#063971] text-white hover:bg-[#052d5a]"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensaje
                      </Button>
                    </form>
                  )}
                </Card>
              </div>

              {/* Información de contacto */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Contacto Directo</h3>
                  <div className="space-y-4 text-gray-700">
                    <div>
                      <p className="font-semibold mb-1">Email Principal</p>
                      <a 
                        href="mailto:info@casicinco.com"
                        className="text-[#063971] hover:underline text-lg font-medium"
                      >
                        info@casicinco.com
                      </a>
                    </div>
                    <hr className="border-gray-200" />
                    <div>
                      <p className="font-semibold mb-1">Email General</p>
                      <a 
                        href="mailto:hola@casicinco.com"
                        className="text-[#063971] hover:underline"
                      >
                        hola@casicinco.com
                      </a>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Soporte Técnico</p>
                      <a 
                        href="mailto:soporte@casicinco.com"
                        className="text-[#063971] hover:underline"
                      >
                        soporte@casicinco.com
                      </a>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Privacidad y Datos</p>
                      <a 
                        href="mailto:privacidad@casicinco.com"
                        className="text-[#063971] hover:underline"
                      >
                        privacidad@casicinco.com
                      </a>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Legal y Empresas</p>
                      <a 
                        href="mailto:legal@casicinco.com"
                        className="text-[#063971] hover:underline"
                      >
                        legal@casicinco.com
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h3>
                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold mb-1">¿Cómo cancelo mi suscripción?</p>
                      <p>Desde tu perfil → Suscripción → Cancelar</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">¿Ofrecen reembolsos?</p>
                      <p>No reembolsamos periodos parciales, pero puedes cancelar en cualquier momento</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">¿Cómo añadir un lugar?</p>
                      <p>Solo indexamos lugares de Google Maps con 4.7★+. No podemos añadir lugares manualmente</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">¿Tiempo de respuesta?</p>
                      <p>Menos de 24 horas laborables</p>
                    </div>
                  </div>
                </Card>

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
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

