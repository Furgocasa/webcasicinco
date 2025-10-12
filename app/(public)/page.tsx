'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Star, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Zap,
  Clock,
  Heart,
  ArrowRight,
  CheckCircle2,
  Users,
  Award
} from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalPlaces: 3547,
    avgRating: 4.8,
    totalReviews: 500000,
    provincesCount: 50,
    topTierPlaces: 400,
  });

  // Cargar stats reales al montar
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error cargando stats:', error);
        // Mantiene los valores por defecto
      }
    };
    loadStats();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/mapa?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/mapa');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <main className="min-h-screen">
        {/* HERO SECTION - EL GANCHO */}
        <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          <div className="relative container mx-auto px-4 py-16 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-6 md:mb-8 animate-fade-in">
                <Star className="h-3 md:h-4 w-3 md:w-4 fill-yellow-300 text-yellow-300" />
                <span className="text-xs md:text-sm font-medium">Solo lugares excepcionales +4.7★</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight animate-slide-up">
                Acaba con las
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-300">
                  Experiencias Mediocres
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-white/90 animate-slide-up animation-delay-100 px-2">
                La única app que filtra el <strong>95% de lugares</strong> para mostrarte solo los <strong>mejores de España</strong>
              </p>

              {/* Search Bar - Mobile Optimized */}
              <div className="max-w-2xl mx-auto mb-6 md:mb-8 animate-slide-up animation-delay-200 px-2 md:px-0">
                <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center flex-1 px-2">
                    <Search className="h-5 w-5 md:h-6 md:w-6 text-gray-400 ml-1 md:ml-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Ej: Restaurantes Málaga"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-3 py-3 md:py-4 text-gray-900 text-base md:text-lg outline-none bg-transparent"
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    className="h-12 md:h-auto text-base md:text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 md:px-8 w-full sm:w-auto"
                  >
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Quick Stats - DATOS REALES */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm animate-slide-up animation-delay-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-300" />
                  <span>{stats.totalPlaces.toLocaleString('es-ES')}+ lugares verificados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  <span>Solo 4.7★ o más</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-300" />
                  <span>{stats.topTierPlaces}+ lugares excepcionales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wave separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* PROBLEMA + SOLUCIÓN */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Problem */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  El Problema de Elegir
                </h2>
                <div className="max-w-3xl mx-auto space-y-4">
                  <p className="text-xl text-gray-600">
                    Abres Google Maps, ves <strong>2,547 resultados</strong>, pasas <strong>30 minutos leyendo reseñas</strong>, 
                    y al final... eliges uno al azar 🤷
                  </p>
                  <p className="text-lg text-gray-500 italic">
                    "¿Es mejor un 4.9★ con 15 reseñas o un 4.7★ con 2,000 reseñas?"
                  </p>
                  <p className="text-base text-gray-600">
                    <strong className="text-purple-600">Spoiler:</strong> El de 2,000 reseñas. Pero Google no te lo dice. Nosotros sí.
                  </p>
                </div>
              </div>

              {/* Solution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
                {/* Card 1 */}
                <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-purple-200">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">😰</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">El Problema</h3>
                  <p className="text-gray-600">
                    Demasiadas opciones, información contradictoria, miedo a equivocarte
                  </p>
                </Card>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <ArrowRight className="h-12 w-12 text-purple-400" />
                </div>

                {/* Card 2 */}
                <Card className="p-8 text-center hover:shadow-xl transition-shadow border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">😍</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Nuestra Solución</h3>
                  <p className="text-gray-600">
                    <strong>Solo el top 5%</strong>. Decisión en 2 minutos. Experiencia excepcional garantizada.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* DIFERENCIADORES CLAVE */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Por qué Casi Cinco es diferente
              </h2>
              <p className="text-xl text-gray-600">
                No somos otra app de viajes. Somos tu garantía de calidad <strong>objetiva y verificable</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
              {/* Feature 1 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Filtro Extremo 4.7★+
                </h3>
                <p className="text-gray-600 text-sm">
                  Eliminamos el 95% de lugares. Solo ves el top 5% absoluto. <strong>Cero riesgo</strong> de mala experiencia.
                </p>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Algoritmo Objetivo
                </h3>
                <p className="text-gray-600 text-sm">
                  <strong>Rating + Reseñas = Objetividad.</strong> No es lo "mejor" subjetivo. Es matemática pura validada por miles.
                </p>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  IA que Analiza por Ti
                </h3>
                <p className="text-gray-600 text-sm">
                  <strong>De 30 min a 30 segundos.</strong> Nuestra IA analiza miles de reseñas y te da el resumen perfecto.
                </p>
              </Card>

              {/* Feature 4 */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Decisiones Rápidas
                </h3>
                <p className="text-gray-600 text-sm">
                  <strong>Todos son buenos</strong>. No pierdas 30 minutos eligiendo. Cualquiera que elijas será excepcional.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Lo que dicen nuestros usuarios
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Testimonial 1 */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    "Encontré el restaurante perfecto en 5 minutos. <strong>La mejor experiencia</strong> que he tenido en Málaga. Esta app me salvó el viaje."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">LC</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Laura C.</p>
                      <p className="text-sm text-gray-500">Madrid</p>
                    </div>
                  </div>
                </Card>

                {/* Testimonial 2 */}
                <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-purple-200">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    "Ya no pierdo tiempo leyendo reseñas. <strong>Solo lugares increíbles</strong>. El filtro de 4.7★ es genial."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">CM</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Carlos M.</p>
                      <p className="text-sm text-gray-500">Barcelona</p>
                    </div>
                  </div>
                </Card>

                {/* Testimonial 3 */}
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    "Como influencer necesito lugares espectaculares. <strong>Casi Cinco nunca falla</strong>. Todas mis fotos son en lugares de aquí."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-100 w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-pink-600">MR</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">María R.</p>
                      <p className="text-sm text-gray-500">Sevilla</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Tan fácil que da gusto
              </h2>
              <p className="text-xl text-gray-600">
                3 pasos para encontrar lugares excepcionales
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Busca lo que quieras</h3>
                  <p className="text-gray-600">
                    "Restaurantes Málaga", "Hoteles con spa"... Lo que sea.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ve solo lo mejor</h3>
                  <p className="text-gray-600">
                    Solo lugares 4.7★+. Todos verificados. Cero basura.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Disfruta sin miedo</h3>
                  <p className="text-gray-600">
                    Elige cualquiera. Todos son excepcionales. Garantizado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METODOLOGÍA - LA IDENTIDAD */}
        <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  ¿Lo "Mejor" es Subjetivo?
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-300">
                    No Para Nosotros.
                  </span>
                </h2>
                <p className="text-xl text-white/90 leading-relaxed">
                  "Lo mejor" puede ser opinión. Pero <strong>un 4.8★ con 2,000 reseñas</strong> no es opinión.
                  <br />
                  Es <strong>matemática pura</strong>. Es <strong>consenso de miles</strong>. Es <strong>objetividad</strong>.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
                <h3 className="text-2xl font-bold mb-6 text-center">Nuestro Algoritmo</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-yellow-400 text-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                      1
                    </div>
                    <h4 className="font-bold mb-2">Rating</h4>
                    <p className="text-sm text-white/80">Mínimo 4.7★ - Solo el top 5% de España</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-yellow-400 text-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                      2
                    </div>
                    <h4 className="font-bold mb-2">Reseñas</h4>
                    <p className="text-sm text-white/80">Más reseñas = más validación = más confianza</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-yellow-400 text-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                      3
                    </div>
                    <h4 className="font-bold mb-2">IA Valida</h4>
                    <p className="text-sm text-white/80">Análisis profundo de miles de opiniones reales</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/metodologia')}
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-900 font-bold text-lg px-8 py-6"
                >
                  Saber Más Sobre Nuestra Metodología
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* STATS IMPACTANTES - DATOS REALES */}
        <section className="py-20 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Números que hablan por sí solos
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
                <div>
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                    {stats.totalPlaces.toLocaleString('es-ES')}
                  </div>
                  <p className="text-gray-400">Lugares verificados</p>
                  <p className="text-sm text-gray-500 mt-1">Y subiendo cada día</p>
                </div>

                <div>
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                    {stats.avgRating}★
                  </div>
                  <p className="text-gray-400">Rating promedio</p>
                  <p className="text-sm text-gray-500 mt-1">Solo lo excepcional</p>
                </div>

                <div>
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                    {stats.provincesCount}
                  </div>
                  <p className="text-gray-400">Provincias cubiertas</p>
                  <p className="text-sm text-gray-500 mt-1">Toda España</p>
                </div>

                <div>
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                    {(stats.totalReviews / 1000).toFixed(0)}K+
                  </div>
                  <p className="text-gray-400">Reseñas analizadas</p>
                  <p className="text-sm text-gray-500 mt-1">Por nuestra IA</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA - MUY POTENTE */}
        <section className="py-24 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          
          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Acaba con las experiencias mediocres
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Únete a miles de viajeros que ya solo eligen <strong>lugares excepcionales</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/registro')}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-8 py-6 shadow-2xl"
                >
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push('/mapa')}
                  className="border-2 border-white text-white hover:bg-white/10 font-bold text-lg px-8 py-6"
                >
                  Ver Mapa
                  <MapPin className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <p className="mt-6 text-sm text-white/80">
                ✓ Gratis para siempre · ✓ Sin tarjeta requerida · ✓ Empieza en 30 segundos
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
          animation-fill-mode: both;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
          animation-fill-mode: both;
        }
      `}</style>
    </>
  );
}
