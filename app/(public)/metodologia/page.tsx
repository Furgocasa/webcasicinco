'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Shield,
  TrendingUp,
  Users,
  Sparkles,
  CheckCircle2,
  Award,
  BarChart3,
  Brain,
  Target
} from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function MetodologiaPage() {
  // Establecer título de la página
  useEffect(() => {
    document.title = 'Nuestra Metodología | Casi Cinco';
  }, []);

  return (
    <>
      <main className="min-h-screen bg-white">
        {/* HERO */}
        <section className="relative bg-[#063971] text-white overflow-hidden py-24 md:py-32">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Link>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Nuestra Metodología:
                <br />
                <span className="text-[#ffd935]">
                  Objetividad, No Opinión
                </span>
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed">
                En un mundo donde "lo mejor" es subjetivo, nosotros elegimos la <strong>ciencia de los datos</strong>.
              </p>
            </div>
          </div>

          {/* Wave separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* EL PROBLEMA */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  El Problema que Resolvemos
                </h2>
                <p className="text-xl text-gray-600">
                  La paradoja de la elección en la era digital
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <Card className="p-8 bg-red-50 border-2 border-red-200">
                  <h3 className="text-2xl font-bold text-red-900 mb-4">❌ Método Tradicional</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Abres Google Maps → <strong>2,547 resultados</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Lees 50 reseñas → <strong>30 minutos perdidos</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>¿4.9★ con 10 reseñas o 4.7★ con 2,000? → <strong>¿Cuál es mejor?</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Eliges uno "al azar" → <strong>Incertidumbre total</strong></span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-8 bg-green-50 border-2 border-green-200">
                  <h3 className="text-2xl font-bold text-green-900 mb-4">✅ Método Casi Cinco</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Abre Casi Cinco → <strong>Solo 50 opciones</strong> (ya filtradas)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>IA resume por ti → <strong>30 segundos de lectura</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Nuestro algoritmo ya decidió → <strong>4.7★ con 2,000 es objetivamente mejor</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Eliges cualquiera → <strong>Todos son excepcionales</strong></span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ALGORITMO EXPLICADO */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  El Algoritmo: Rating + Reseñas
                </h2>
                <p className="text-xl text-gray-600">
                  Dos variables. Resultados objetivos. Matemática simple.
                </p>
              </div>

              <div className="space-y-8">
                {/* Variable 1: Rating */}
                <Card className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-[#ffd935] w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="h-8 w-8 text-[#063971]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">1. Rating Mínimo: 4.7★</h3>
                      <p className="text-gray-700 mb-4">
                        Solo el <strong>top 5% de todos los lugares de España</strong> tiene 4.7 estrellas o más.
                        Este es nuestro filtro base. <strong>Cero lugares mediocres</strong>.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-[#063971]">
                        <p className="text-sm text-gray-700">
                          <strong>📊 Dato:</strong> De ~70,000 restaurantes en España, solo ~3,500 tienen 4.7★+.
                          Eso es un 95% de descarte automático.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Variable 2: Número de Reseñas */}
                <Card className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-[#063971] w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">2. Número de Reseñas: Validación Masiva</h3>
                      <p className="text-gray-700 mb-4">
                        Aquí es donde nos diferenciamos de TODO el mercado. <strong>No es lo mismo 4.9★ con 10 reseñas que 4.7★ con 2,000</strong>.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                          <p className="font-bold text-red-900 mb-2">❌ Lugar A</p>
                          <p className="text-sm text-gray-700">
                            ⭐ 4.9 estrellas<br />
                            👥 15 reseñas<br />
                            <strong className="text-red-600">Alto riesgo de sesgo</strong>
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
                          <p className="font-bold text-green-900 mb-2">✅ Lugar B</p>
                          <p className="text-sm text-gray-700">
                            ⭐ 4.7 estrellas<br />
                            👥 2,000 reseñas<br />
                            <strong className="text-green-600">Validación masiva</strong>
                          </p>
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-[#ffd935]">
                        <p className="text-sm text-gray-700">
                          <strong>💡 Nuestro principio:</strong> La opinión de miles de personas es más confiable que la de 10.
                          Así de simple. Así de objetivo.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Variable 3: IA */}
                <Card className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-gradient-to-br from-[#063971] to-blue-800 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">3. IA: Análisis Profundo</h3>
                      <p className="text-gray-700 mb-4">
                        Nuestra IA (GPT-4) lee y analiza <strong>cientos de reseñas por lugar</strong> para extraer:
                      </p>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-[#063971] mt-0.5" />
                          <span><strong>Highlights:</strong> Qué hace único a cada lugar</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-[#063971] mt-0.5" />
                          <span><strong>Resumen de reseñas:</strong> Consenso de opiniones reales</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-[#063971] mt-0.5" />
                          <span><strong>Descripción:</strong> Información relevante sin marketing</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* SISTEMA DE TIERS */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Sistema de Tiers: 6 Niveles de Excelencia
                </h2>
                <p className="text-xl text-gray-600">
                  No todos los "4.7 estrellas" son iguales. Nuestro sistema distingue lo bueno de lo extraordinario.
                </p>
              </div>

              <div className="space-y-4">
                {/* Diamante */}
                <Card className="p-6 border-2 border-[#063971] bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">💎</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Diamante - Los Inalcanzables</h3>
                      <p className="text-gray-600 mb-2">4.8★+ con 1,000+ reseñas</p>
                      <p className="text-sm text-gray-500">Solo ~150 lugares en toda España. El 0.2% absoluto.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[#063971]">0.2%</p>
                      <p className="text-xs text-gray-500">de España</p>
                    </div>
                  </div>
                </Card>

                {/* Platino */}
                <Card className="p-6 border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🏆</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Platino - Los Élite</h3>
                      <p className="text-gray-600 mb-2">4.8★+ con 500-999 reseñas</p>
                      <p className="text-sm text-gray-500">~500 lugares. Calidad probada por cientos.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-600">0.7%</p>
                      <p className="text-xs text-gray-500">de España</p>
                    </div>
                  </div>
                </Card>

                {/* Oro */}
                <Card className="p-6 border-2 border-[#ffd935] bg-gradient-to-r from-yellow-50 to-yellow-100">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🥇</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Oro - Los Excelentes</h3>
                      <p className="text-gray-600 mb-2">4.7★+ con 200+ reseñas</p>
                      <p className="text-sm text-gray-500">~400 lugares. Validación sólida y consistente.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[#063971]">1%</p>
                      <p className="text-xs text-gray-500">de España</p>
                    </div>
                  </div>
                </Card>

                {/* Plata */}
                <Card className="p-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🥈</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Plata - Los Confiables</h3>
                      <p className="text-gray-600 mb-2">4.7★+ con 50-199 reseñas</p>
                      <p className="text-sm text-gray-500">~1,600 lugares. Excelente calidad verificada.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[#063971]">2%</p>
                      <p className="text-xs text-gray-500">de España</p>
                    </div>
                  </div>
                </Card>

                {/* Bronce */}
                <Card className="p-6 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🥉</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Bronce - Los Buenos</h3>
                      <p className="text-gray-600 mb-2">4.7★+ con menos de 50 reseñas</p>
                      <p className="text-sm text-gray-500">~1,100 lugares. Buena calidad, menos validación.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[#063971]">1.5%</p>
                      <p className="text-xs text-gray-500">de España</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="mt-12 text-center">
                <div className="bg-gradient-to-r from-blue-50 to-yellow-50 p-8 rounded-2xl border-2 border-[#ffd935]">
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    💡 La Fórmula
                  </p>
                  <p className="text-lg text-gray-700">
                    <span className="font-mono bg-white px-3 py-1 rounded">Rating Alto</span>
                    {' + '}
                    <span className="font-mono bg-white px-3 py-1 rounded">Muchas Reseñas</span>
                    {' = '}
                    <span className="font-mono bg-[#063971] text-white px-3 py-1 rounded">Objetividad Garantizada</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POR QUÉ FUNCIONA */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Por Qué Funciona Nuestra Metodología
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="p-6 text-center">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Ley de Grandes Números</h3>
                  <p className="text-gray-600 text-sm">
                    100 reseñas son más confiables que 10. 1,000 son más que 100. 
                    <strong> Es estadística básica</strong>, no magia.
                  </p>
                </Card>

                <Card className="p-6 text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Sesgo Reducido</h3>
                  <p className="text-gray-600 text-sm">
                    Con muchas reseñas, <strong>es imposible manipular</strong> el rating. 
                    La verdad emerge del consenso.
                  </p>
                </Card>

                <Card className="p-6 text-center">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">IA Sin Sesgos</h3>
                  <p className="text-gray-600 text-sm">
                    Nuestra IA <strong>no tiene preferencias</strong>. Solo analiza datos.
                    No hay publicidad, no hay comisiones.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPARENCIA TOTAL */}
        <section className="py-20 bg-[#063971] text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Transparencia Total
              </h2>
              <p className="text-xl mb-8 text-white/90">
                No ocultamos nada. Nuestra metodología es pública. Los datos vienen de Google Maps (fuente neutral).
                La IA solo analiza, no inventa.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-2">✅ Lo que SÍ hacemos</h4>
                  <ul className="text-sm space-y-1 text-white/80">
                    <li>• Filtrar por rating objetivo</li>
                    <li>• Ordenar por reseñas</li>
                    <li>• Analizar con IA neutral</li>
                    <li>• Mostrar datos reales</li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-2">❌ Lo que NO hacemos</h4>
                  <ul className="text-sm space-y-1 text-white/80">
                    <li>• Publicidad pagada</li>
                    <li>• Comisiones de lugares</li>
                    <li>• Manipular rankings</li>
                    <li>• Inventar reseñas</li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-2">🎯 Nuestra misión</h4>
                  <p className="text-sm text-white/80">
                    Ser la fuente <strong>más objetiva y confiable</strong> para encontrar lugares excepcionales en España.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-24 bg-gradient-to-r from-[#063971] to-blue-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold mb-6">
                ¿Listo para confiar en la objetividad?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Miles de datos. Un solo objetivo: que elijas lo mejor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/mapa">
                  <Button 
                    size="lg"
                    className="bg-[#ffd935] text-[#063971] hover:bg-[#e6c430] font-bold px-8 py-6"
                  >
                    Explorar el Mapa
                  </Button>
                </Link>
                <Link href="/">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-6"
                  >
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}












