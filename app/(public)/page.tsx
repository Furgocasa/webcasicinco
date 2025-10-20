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
  Award,
  Crown,
  Check
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

  // Establecer título de la página
  useEffect(() => {
    document.title = 'Casi Cinco - Los mejores lugares con 4.7+ estrellas';
  }, []);

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
        <section className="relative bg-[#002196] text-white overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          <div className="relative container mx-auto px-4 py-16 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-6 md:mb-8 animate-fade-in">
                <Star className="h-3 md:h-4 w-3 md:w-4 fill-[#ffd935] text-[#ffd935]" />
                <span className="text-xs md:text-sm font-medium">Solo lugares excepcionales +4.7★</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight animate-slide-up">
                Acaba con las
                <br />
                <span className="text-[#ffd935]">
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
                    className="h-12 md:h-auto text-base md:text-lg bg-[#ffd935] hover:bg-[#e6c430] text-[#002196] font-bold px-6 md:px-8 w-full sm:w-auto"
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
                  <Star className="h-5 w-5 text-[#ffd935] fill-[#ffd935]" />
                  <span>Solo 4.7★ o más</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#ffd935]" />
                  <span>{stats.topTierPlaces}+ lugares excepcionales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wave separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
            </svg>
          </div>
        </section>

        {/* PROBLEMA + SOLUCIÓN */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Título */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                  El Problema de Elegir
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                  Abres Google Maps, ves <span className="text-[#002196] font-bold">2,547 resultados</span>, 
                  pasas <span className="text-[#002196] font-bold">30 minutos leyendo reseñas</span>...
                  <br />
                  <span className="text-gray-500 mt-2 block">Y al final eliges uno al azar 🤷</span>
                </p>
              </div>

              {/* Comparación Antes/Después */}
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* ANTES - El Problema */}
                <Card className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">❌</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Método Tradicional</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span className="text-gray-700">Miles de resultados sin filtrar</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span className="text-gray-700">Información contradictoria</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span className="text-gray-700">¿4.9★ con 10 reseñas o 4.7★ con 2,000?</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span className="text-gray-700">30 minutos perdidos</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-red-500 font-bold mt-1">•</span>
                        <span className="text-gray-700 font-semibold">Resultado: Elección al azar</span>
                      </li>
                    </ul>
                  </div>
                </Card>

                {/* DESPUÉS - La Solución */}
                <Card className="relative overflow-hidden border-2 border-[#ffd935] shadow-xl">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#002196] to-[#ffd935]"></div>
                  <div className="p-8 bg-gradient-to-br from-blue-50 to-yellow-50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-[#ffd935] w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">✨</span>
                      </div>
                      <h3 className="text-2xl font-bold text-[#002196]">Método Casi Cinco</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-[#002196] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Solo 50 opciones (ya filtradas)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-[#002196] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Información clara y objetiva</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-[#002196] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">Nuestro algoritmo ya decidió por ti</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-[#002196] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-medium">30 segundos de decisión</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-[#002196] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-900 font-bold">Resultado: Experiencia excepcional</span>
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>

              {/* Spoiler Box */}
              <div className="mt-12 max-w-3xl mx-auto">
                <Card className="p-6 bg-[#002196] text-white border-none">
                  <p className="text-center text-lg">
                    <span className="text-[#ffd935] font-bold">💡 Spoiler:</span> El de 4.7★ con 2,000 reseñas es objetivamente mejor.
                    <br />
                    <span className="text-white/90 mt-2 block">Pero Google no te lo dice. <strong>Nosotros sí.</strong></span>
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* HERRAMIENTAS - NUEVA SECCIÓN */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Tus Herramientas para Experiencias Perfectas
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Tres herramientas poderosas para que nunca más tengas una experiencia mediocre
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Herramienta 1: Mapa Interactivo */}
              <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-[#002196] overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-[#002196] to-blue-800 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <MapPin className="h-20 w-20 text-white relative z-10 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    🗺️ Mapa Interactivo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Explora <strong>{stats.totalPlaces.toLocaleString('es-ES')}+ lugares excepcionales</strong> en un mapa visual. 
                    Filtra por categoría, provincia y descubre joyas ocultas cerca de ti.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Visualización geográfica</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Filtros inteligentes</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Descubre cerca de ti</span>
                    </li>
                  </ul>
                  <Button 
                    onClick={() => router.push('/mapa')}
                    className="w-full bg-[#002196] hover:bg-[#001570] text-white"
                  >
                    Explorar Mapa
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Herramienta 2: Planificador de Rutas */}
              <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-[#ffd935] overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-[#ffd935] to-yellow-600 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <svg className="h-20 w-20 text-[#002196] relative z-10 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    🛣️ Planificador de Rutas
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crea <strong>rutas personalizadas</strong> conectando múltiples lugares excepcionales. 
                    Perfecto para roadtrips y escapadas.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Múltiples paradas</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Optimización automática</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Guarda y comparte</span>
                    </li>
                  </ul>
                  <Button 
                    onClick={() => router.push('/ruta')}
                    className="w-full bg-[#ffd935] hover:bg-[#e6c430] text-[#002196] font-bold"
                  >
                    Planificar Ruta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Herramienta 3: Chatbot IA */}
              <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-purple-500 overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <Sparkles className="h-20 w-20 text-white relative z-10 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    🤖 Chat con IA Viajera
                  </h3>
                  <p className="text-gray-600 mb-4">
                    <strong>Tu asistente personal</strong> que conoce todos los lugares. 
                    Pregunta lo que quieras en lenguaje natural.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Respuestas instantáneas</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Recomendaciones personalizadas</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Conversa como con un amigo</span>
                    </li>
                  </ul>
                  <Button 
                    onClick={() => {
                      // Abrir el chatbot flotante del Tío Viajero
                      const chatButton = document.querySelector('button[title="Abrir Tío Viajero IA"]') as HTMLButtonElement;
                      if (chatButton) {
                        chatButton.click();
                        // Scroll suave hacia abajo para ver el chatbot en móvil
                        setTimeout(() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }, 100);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    Hablar con IA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <Card className="max-w-3xl mx-auto p-6 bg-gradient-to-r from-blue-50 to-yellow-50 border-2 border-[#ffd935]">
                <p className="text-lg text-gray-800">
                  <strong>💡 Todas estas herramientas</strong> están incluidas en tu prueba gratuita de 30 días
                </p>
              </Card>
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
              <Card className="p-6 hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-[#ffd935]">
                <div className="bg-[#002196] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
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
              <Card className="p-6 hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-[#ffd935]">
                <div className="bg-[#002196] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
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
              <Card className="p-6 hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-[#ffd935]">
                <div className="bg-[#002196] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
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
              <Card className="p-6 hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-[#ffd935]">
                <div className="bg-[#002196] w-12 h-12 rounded-lg flex items-center justify-center mb-4">
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

        {/* PRICING SECTION */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Comienza Gratis, Continúa por Menos de un Café
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                30 días gratis para probar todo. Luego elige el plan que mejor se adapte a ti.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Plan Trial */}
              <Card className="border-2 border-gray-200 p-6 hover:shadow-xl transition hover:border-[#d6d8d7]">
                <div className="text-center mb-6">
                  <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
                    <Clock className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Prueba Gratis</h3>
                  <div className="text-4xl font-bold text-[#002196] mb-2">0€</div>
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
                    <span className="text-sm text-gray-700">No se cobra hasta día 31</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => router.push('/registro')}
                  variant="outline"
                  className="w-full"
                >
                  Empezar Gratis
                </Button>
              </Card>

              {/* Plan Mensual */}
              <Card className="border-2 border-[#002196]/30 p-6 hover:shadow-xl transition hover:border-[#002196]">
                <div className="text-center mb-6">
                  <div className="inline-block p-3 bg-blue-50 rounded-full mb-4">
                    <Zap className="h-8 w-8 text-[#002196]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Mensual</h3>
                  <div className="text-4xl font-bold text-[#002196] mb-2">2,99€</div>
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
                  onClick={() => router.push('/pricing?plan=monthly')}
                  className="w-full bg-[#002196] hover:bg-[#001570] text-white"
                >
                  Suscribirse
                </Button>
              </Card>

              {/* Plan Anual - DESTACADO */}
              <Card className="border-2 border-[#ffd935] bg-gradient-to-br from-yellow-50 to-white p-6 hover:shadow-2xl transition relative">
                {/* Badge de ahorro */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#ffd935] text-[#002196] px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    ¡Ahorra 30%!
                  </div>
                </div>
                
                <div className="text-center mb-6 mt-2">
                  <div className="inline-block p-3 bg-[#ffd935]/20 rounded-full mb-4">
                    <Crown className="h-8 w-8 text-[#002196]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Anual</h3>
                  <div className="text-4xl font-bold text-[#002196] mb-2">24,99€</div>
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
                  onClick={() => router.push('/pricing?plan=yearly')}
                  className="w-full bg-[#002196] hover:bg-[#001570] text-white shadow-lg"
                >
                  Mejor Valor
                </Button>
              </Card>
            </div>

            {/* FAQs rápidos */}
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">¿Necesito tarjeta para el trial?</h4>
                  <p className="text-sm text-gray-600">Sí. Necesitas tarjeta para los 30 días de prueba, pero no cobramos hasta el día 31. Cancela antes sin cargos.</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">¿Puedo cancelar cuando quiera?</h4>
                  <p className="text-sm text-gray-600">Sí. Cancela en cualquier momento desde tu perfil. Si es antes del día 31, no se cobra nada.</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">¿Cuándo se cobra?</h4>
                  <p className="text-sm text-gray-600">Después de 30 días de prueba. Si no cancelas, se cobra automáticamente 2,99€/mes o 24,99€/año según tu plan.</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">¿Por qué el plan anual es mejor?</h4>
                  <p className="text-sm text-gray-600">Ahorras 10,89€ al año (casi 4 meses gratis) y obtienes soporte prioritario.</p>
                </div>
              </div>
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
                <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-[#ffd935]">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    "Ya no pierdo tiempo leyendo reseñas. <strong>Solo lugares increíbles</strong>. El filtro de 4.7★ es genial."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#002196] w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">CM</span>
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

        {/* METODOLOGÍA + STATS CONSOLIDADO */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Metodología simplificada */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Nuestra Metodología: Objetividad, No Opinión
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                  Un 4.8★ con 2,000 reseñas no es opinión. Es <strong>matemática pura</strong>, 
                  validado por miles de personas reales.
                </p>
              </div>

              {/* Algoritmo en 3 pasos */}
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <Card className="p-6 text-center hover:shadow-xl transition border-2 border-gray-100 hover:border-[#ffd935]">
                  <div className="bg-[#002196] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Rating 4.7★+</h3>
                  <p className="text-gray-600">
                    Solo el top 5% de España. Filtro extremo sin concesiones.
                  </p>
                </Card>

                <Card className="p-6 text-center hover:shadow-xl transition border-2 border-gray-100 hover:border-[#ffd935]">
                  <div className="bg-[#002196] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Validación Masiva</h3>
                  <p className="text-gray-600">
                    Más reseñas = más confianza. Priorizamos consenso real.
                  </p>
                </Card>

                <Card className="p-6 text-center hover:shadow-xl transition border-2 border-gray-100 hover:border-[#ffd935]">
                  <div className="bg-[#002196] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">IA Analiza</h3>
                  <p className="text-gray-600">
                    Resumen inteligente de miles de opiniones en segundos.
                  </p>
                </Card>
              </div>

              {/* Stats integrados */}
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                  Números que nos avalan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-[#002196] mb-2">
                      {stats.totalPlaces.toLocaleString('es-ES')}
                    </div>
                    <p className="text-gray-600 text-sm">Lugares verificados</p>
                  </div>

                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-[#002196] mb-2">
                      {stats.avgRating}★
                    </div>
                    <p className="text-gray-600 text-sm">Rating promedio</p>
                  </div>

                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-[#002196] mb-2">
                      {stats.provincesCount}
                    </div>
                    <p className="text-gray-600 text-sm">Provincias</p>
                  </div>

                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-[#002196] mb-2">
                      {(stats.totalReviews / 1000).toFixed(0)}K+
                    </div>
                    <p className="text-gray-600 text-sm">Reseñas analizadas</p>
                  </div>
                </div>
              </div>

              {/* CTA Metodología */}
              <div className="text-center mt-8">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/metodologia')}
                  className="text-[#002196] border-[#002196] hover:bg-blue-50"
                >
                  Conocer Nuestra Metodología Completa
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL SIMPLIFICADO */}
        <section className="py-20 bg-[#002196] text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Empieza a Descubrir Lugares Excepcionales
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                30 días gratis. Luego solo <strong>2,99€/mes</strong>. 
                Cancela cuando quieras.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/registro')}
                  className="bg-[#ffd935] text-[#002196] hover:bg-[#e6c430] font-bold text-lg px-10 py-6 shadow-2xl"
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

              <p className="text-sm text-white/80">
                ✓ 30 días de prueba · ✓ Acceso completo · ✓ Cancela antes del día 31 sin cargos
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
