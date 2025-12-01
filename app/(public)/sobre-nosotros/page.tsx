'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Star, 
  ArrowRight,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SobreNosotrosPage() {
  const router = useRouter();

  useEffect(() => {
    document.title = 'Sobre Nosotros - Casi Cinco';
  }, []);

  return (
    <>
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-[#002297] text-white overflow-hidden">
          {/* Capa sólida de fondo */}
          <div className="absolute inset-0 bg-[#002297]"></div>
          
          <div className="relative container mx-auto px-4 py-20 md:py-32 z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Star className="h-4 w-4 fill-[#ffd935] text-[#ffd935]" />
                <span className="text-sm font-medium">Nuestra Historia</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                De Campervans a Tu Próxima Aventura
              </h1>

              <p className="text-xl md:text-2xl text-white/90">
                La historia de cómo dos negocios se unieron para resolver un problema real de viajeros
              </p>
            </div>
          </div>

          {/* Wave separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
            </svg>
          </div>
        </section>

        {/* Historia Principal */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
                {/* Columna Izquierda: Historia */}
                <div className="space-y-6">
                  <Card className="bg-white border-2 border-gray-200 p-6 hover:shadow-lg transition">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-[#ffd935] rounded-full p-3 flex-shrink-0">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">2018: Nace Furgocasa</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          Comenzamos alquilando campervans premium en Murcia y Madrid, llevando a familias españolas 
                          a descubrir los rincones más auténticos de nuestra tierra.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white border-2 border-red-200 p-6 hover:shadow-lg transition">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-red-500 rounded-full p-3 flex-shrink-0">
                        <span className="text-2xl">❓</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">El Problema Diario</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          <strong>"¿Dónde comemos en Málaga?"</strong> <br />
                          <strong>"¿Qué hotel cerca de Granada?"</strong> <br />
                          Miles de preguntas. Miles de horas investigando. Y muchas veces... experiencias mediocres.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white border-2 border-[#ffd935] p-6 hover:shadow-lg transition">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-[#ffd935] rounded-full p-3 flex-shrink-0">
                        <span className="text-2xl">💡</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">2024: Nace Casi Cinco</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          De la necesidad real de nuestros clientes de Furgocasa. Una herramienta que resuelve 
                          el problema que vivíamos cada día: <strong>encontrar lugares excepcionales sin perder tiempo</strong>.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Columna Derecha: Conexión Visual */}
                <div className="space-y-6">
                  {/* Logo Furgocasa */}
                  <div className="bg-white rounded-2xl p-8 text-center shadow-xl border-2 border-gray-200">
                    <img 
                      src="/images/furgocasa/logo_negro_vf.png" 
                      alt="Furgocasa Campervans" 
                      className="h-16 mx-auto mb-4"
                    />
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Furgocasa Campervans</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Alquiler premium de campervans desde 2018
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>Murcia & Madrid</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>+500 familias</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="bg-gray-200 rounded-full p-3">
                      <ArrowRight className="h-8 w-8 transform rotate-90 text-[#002297]" />
                    </div>
                  </div>

                  {/* Logo Casi Cinco */}
                  <div className="bg-gradient-to-br from-[#ffd935] to-yellow-600 rounded-2xl p-8 text-center shadow-xl">
                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-[#002297] fill-[#002297]" />
                    </div>
                    <h4 className="text-xl font-bold text-[#002297] mb-2">Casi Cinco</h4>
                    <p className="text-[#002297]/80 text-sm mb-4">
                      La solución para encontrar lugares excepcionales
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-[#002297]/80">
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>Solo 4.7★+</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>3,500+ lugares</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mensaje Final */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Card className="bg-gradient-to-br from-blue-50 to-yellow-50 border-2 border-[#ffd935] p-8 md:p-12">
                <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-6">
                  Hoy, <strong>tanto si viajas en camper como si no</strong>, Casi Cinco te garantiza 
                  que cada lugar que elijas será excepcional. 
                  <br /><br />
                  <span className="text-[#002297] font-bold text-2xl">Porque nacimos de viajeros, para viajeros.</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <a 
                    href="https://www.furgocasa.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button 
                      variant="outline"
                      className="border-2 border-[#002297] text-[#002297] hover:bg-[#002297] hover:text-white transition-colors"
                      size="lg"
                    >
                      🚐 Conoce Furgocasa Campervans
                    </Button>
                  </a>
                  <Button 
                    onClick={() => router.push('/mapa')}
                    className="bg-[#002297] text-white hover:bg-[#052d5a] font-bold"
                    size="lg"
                  >
                    ⭐ Explora Casi Cinco
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Valores */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
                Nuestros Valores
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="p-6 text-center hover:shadow-lg transition">
                  <div className="bg-[#002297] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-[#ffd935] fill-[#ffd935]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Excelencia</h3>
                  <p className="text-gray-600">
                    Solo el top 5% de lugares. Sin concesiones en calidad.
                  </p>
                </Card>

                <Card className="p-6 text-center hover:shadow-lg transition">
                  <div className="bg-[#002297] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Objetividad</h3>
                  <p className="text-gray-600">
                    Datos reales, algoritmo transparente. Cero influencias.
                  </p>
                </Card>

                <Card className="p-6 text-center hover:shadow-lg transition">
                  <div className="bg-[#002297] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Experiencia</h3>
                  <p className="text-gray-600">
                    Nacimos de viajeros reales con problemas reales.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative py-20 bg-[#002297] text-white overflow-hidden">
          {/* Capa sólida de fondo */}
          <div className="absolute inset-0 bg-[#002297]"></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                ¿Listo para Descubrir Lugares Excepcionales?
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Únete a miles de viajeros que ya disfrutan de experiencias perfectas
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/registro')}
                  className="bg-[#ffd935] text-[#002297] hover:bg-[#e6c430] font-bold text-lg px-10 py-6 shadow-2xl"
                >
                  Probar Gratis 30 Días
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push('/mapa')}
                  className="border-2 border-white text-white hover:bg-white/10 font-bold text-lg px-10 py-6"
                >
                  Ver Mapa
                  <MapPin className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <p className="text-sm text-white/80 mt-6">
                ✓ Sin tarjeta · ✓ 30 días completos · ✓ Cancela cuando quieras
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

