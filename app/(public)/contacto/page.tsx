'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';

interface FAQItem {
  question: string;
  answer: string;
  category: 'suscripcion' | 'lugares' | 'funcionalidades' | 'app' | 'general';
}

const faqs: FAQItem[] = [
  // Suscripción
  {
    category: 'suscripcion',
    question: '¿Cómo funciona el trial de 30 días?',
    answer: 'Todos los nuevos usuarios obtienen 30 días gratis automáticamente al registrarse. No necesitas tarjeta de crédito para activarlo. Tienes acceso completo a todas las funciones desde el primer día.',
  },
  {
    category: 'suscripcion',
    question: '¿Cómo cancelo mi suscripción?',
    answer: 'Puedes cancelar en cualquier momento desde tu perfil → Suscripción → Cancelar. No hay permanencia ni penalizaciones. Tu acceso continuará hasta el final del periodo pagado.',
  },
  {
    category: 'suscripcion',
    question: '¿Ofrecen reembolsos?',
    answer: 'No reembolsamos periodos parciales, pero puedes cancelar en cualquier momento y tu acceso continuará hasta el final del periodo que pagaste. No hay cargos ocultos ni penalizaciones.',
  },
  {
    category: 'suscripcion',
    question: '¿Cuánto cuesta la suscripción?',
    answer: 'Tenemos dos planes: Premium Mensual (2,99€/mes) y Premium Anual (24,99€/año, equivalente a 2,08€/mes). Ambos incluyen acceso completo a todas las funciones. El plan anual te ahorra 40%.',
  },
  {
    category: 'suscripcion',
    question: '¿Necesito tarjeta para el trial?',
    answer: 'No. El trial de 30 días es completamente gratuito y no requiere tarjeta de crédito. Solo necesitarás suscribirte si quieres continuar después del trial.',
  },
  // Lugares
  {
    category: 'lugares',
    question: '¿Cómo añadir un lugar?',
    answer: 'Solo indexamos lugares de Google Maps con mínimo 4.7★ de valoración verificada. Nuestro sistema indexa automáticamente los mejores lugares. No podemos añadir lugares manualmente.',
  },
  {
    category: 'lugares',
    question: '¿Los lugares pagan por aparecer?',
    answer: 'No. Los lugares no pagan por aparecer en Casi Cinco. Nuestro sistema indexa automáticamente los mejores lugares según su valoración en Google Maps. Es un proceso completamente objetivo.',
  },
  {
    category: 'lugares',
    question: '¿Con qué frecuencia se actualizan los lugares?',
    answer: 'Añadimos nuevos lugares cada semana. También actualizamos las valoraciones y reseñas de lugares existentes regularmente para mantener la información actualizada.',
  },
  {
    category: 'lugares',
    question: '¿Qué criterios usan para seleccionar lugares?',
    answer: 'Solo incluimos lugares con mínimo 4.7★ de valoración verificada en Google Maps. Además, consideramos el número de reseñas para asegurar que son lugares consolidados y de calidad.',
  },
  // Funcionalidades
  {
    category: 'funcionalidades',
    question: '¿Qué incluye la suscripción?',
    answer: 'Acceso completo al mapa interactivo con más de 3,500 lugares, chatbot IA ilimitado (Tío Viajero), planificador de rutas personalizado, favoritos ilimitados y todas las funciones premium.',
  },
  {
    category: 'funcionalidades',
    question: '¿Cómo funciona el chatbot Tío Viajero?',
    answer: 'Es un asistente de IA que te ayuda a encontrar lugares perfectos según tus preferencias. Puedes preguntarle por categorías, ubicaciones, precios, y te recomendará los mejores lugares.',
  },
  {
    category: 'funcionalidades',
    question: '¿Puedo planificar rutas con múltiples lugares?',
    answer: 'Sí. El planificador de rutas te permite añadir múltiples lugares y optimizar la ruta automáticamente. Puedes guardar tus rutas y compartirlas con otros usuarios.',
  },
  {
    category: 'funcionalidades',
    question: '¿Hay límite de favoritos?',
    answer: 'No. Puedes guardar tantos lugares como favoritos como quieras. También puedes organizarlos por categorías y acceder a ellos fácilmente desde tu perfil.',
  },
  // App y Tecnología
  {
    category: 'app',
    question: '¿Cómo funciona el sistema de tiers (Diamante, Platino, Oro)?',
    answer: 'No ordenamos solo por rating. Usamos un sistema único que combina rating + número de reseñas: 💎 Diamante (4.8+ con 1000+ reseñas), 🏆 Platino (4.8+ con 500+), 🥇 Oro (4.8+ con 200+), 🥈 Plata (4.7+ con 100+), 🥉 Bronce (4.7+). Esto identifica los lugares verdaderamente excepcionales.',
  },
  {
    category: 'app',
    question: '¿Qué es el Tío Viajero y cómo funciona?',
    answer: 'El Tío Viajero es nuestro asistente de IA (GPT-4o-mini) que te ayuda a encontrar lugares mediante conversación natural. Puede detectar tu ubicación GPS, entender búsquedas como "restaurantes cerca de mí" o "hoteles románticos en Madrid", y recomendarte los mejores lugares basándose en datos verificados de Google Maps.',
  },
  {
    category: 'app',
    question: '¿El Tío Viajero puede usar mi ubicación GPS?',
    answer: 'Sí. Si compartes tu ubicación, el Tío Viajero puede encontrar lugares cercanos usando términos como "cerca", "aquí", "a 500 metros" o "caminando". Siempre te mostrará la distancia real en kilómetros. Tu ubicación solo se usa para recomendaciones y nunca se almacena.',
  },
  {
    category: 'app',
    question: '¿Cómo se indexan los lugares?',
    answer: 'Nuestro sistema indexa automáticamente lugares de Google Maps con mínimo 4.7★ verificados. El proceso tiene 2 fases: primero indexación rápida (datos básicos), luego enriquecimiento con IA (descripciones, fotos). Añadimos nuevos lugares cada semana.',
  },
  {
    category: 'app',
    question: '¿Qué datos usan para los lugares?',
    answer: 'Todos los datos provienen de Google Places API verificados y actualizados. Incluyen: nombre, dirección, teléfono, website, rating, número de reseñas, coordenadas GPS, fotos, y descripciones generadas con IA. Nunca inventamos información.',
  },
  {
    category: 'app',
    question: '¿Cómo funciona el mapa interactivo?',
    answer: 'El mapa muestra más de 3,500 lugares verificados en toda España. Puedes filtrar por categoría (restaurante, hotel, bar), provincia, ciudad, rating y precio. Los lugares se muestran con marcadores de colores según su tier (Diamante, Platino, Oro, etc.).',
  },
  {
    category: 'app',
    question: '¿Cómo funciona el planificador de rutas?',
    answer: 'Puedes añadir múltiples lugares a tu ruta y el sistema optimiza automáticamente el orden para minimizar distancias. Puedes guardar rutas, compartirlas y acceder a ellas desde cualquier dispositivo. Ideal para planificar viajes o días de turismo.',
  },
  {
    category: 'app',
    question: '¿Qué tecnologías usa la app?',
    answer: 'Casi Cinco está construida con Next.js 14, Supabase (base de datos), OpenAI GPT-4o-mini (chatbot), Google Maps API (lugares), y Stripe (pagos). Todo está optimizado para rendimiento y seguridad.',
  },
  {
    category: 'app',
    question: '¿Los lugares pueden pagar para aparecer mejor?',
    answer: 'No. Nuestro sistema es completamente objetivo. Los lugares se ordenan exclusivamente por nuestro algoritmo de calidad (tiers) que combina rating y número de reseñas. No hay pago por posición ni publicidad.',
  },
  // General
  {
    category: 'general',
    question: '¿Tiempo de respuesta del soporte?',
    answer: 'Respondemos todas las consultas en menos de 24 horas laborables. Para temas urgentes, puedes escribir directamente a info@casicinco.com.',
  },
  {
    category: 'general',
    question: '¿Qué zonas cubren?',
    answer: 'Actualmente cubrimos toda España con más de 3,500 lugares verificados en las principales ciudades y provincias. Añadimos nuevos lugares cada semana.',
  },
  {
    category: 'general',
    question: '¿Cómo puedo reportar un error?',
    answer: 'Puedes escribirnos a info@casicinco.com con los detalles del error. Incluye capturas de pantalla si es posible y te responderemos lo antes posible.',
  },
  {
    category: 'general',
    question: '¿Tienen aplicación móvil?',
    answer: 'Por ahora, Casi Cinco está disponible como aplicación web optimizada para móviles. Puedes acceder desde cualquier dispositivo con navegador. Estamos trabajando en apps nativas.',
  },
];

const categories = [
  { id: 'suscripcion', name: 'Suscripción', icon: '💳' },
  { id: 'lugares', name: 'Lugares', icon: '📍' },
  { id: 'funcionalidades', name: 'Funcionalidades', icon: '⚙️' },
  { id: 'app', name: 'Cómo Funciona', icon: '🤖' },
  { id: 'general', name: 'General', icon: '❓' },
];

export default function ContactoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Establecer título de la página
  useEffect(() => {
    document.title = 'Contacto | Casi Cinco';
  }, []);

  const filteredFaqs = selectedCategory
    ? faqs.filter((faq) => faq.category === selectedCategory)
    : faqs;

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
                <div className="flex items-center gap-3 mb-6">
                  <HelpCircle className="h-6 w-6 text-[#063971]" />
                  <h2 className="text-2xl font-bold text-gray-900">Preguntas Frecuentes</h2>
                </div>

                {/* Filtros por categoría */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === null
                        ? 'bg-[#063971] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#063971] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Lista de FAQs con acordeones */}
                <div className="space-y-3">
                  {filteredFaqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-[#063971]"
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="w-full px-5 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-[#063971] flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

