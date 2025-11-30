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
  // Suscripción (10 preguntas)
  {
    category: 'suscripcion',
    question: '¿Cómo funciona el trial de 30 días?',
    answer: 'Todos los nuevos usuarios obtienen 30 días gratis automáticamente al registrarse. No necesitas tarjeta de crédito para activarlo. Tienes acceso completo a todas las funciones desde el primer día.',
  },
  {
    category: 'suscripcion',
    question: '¿Necesito tarjeta para el trial?',
    answer: 'No. El trial de 30 días es completamente gratuito y no requiere tarjeta de crédito. Solo necesitarás suscribirte si quieres continuar después del trial.',
  },
  {
    category: 'suscripcion',
    question: '¿Cuánto cuesta la suscripción?',
    answer: 'Tenemos dos planes: Premium Mensual (2,99€/mes) y Premium Anual (24,99€/año, equivalente a 2,08€/mes). Ambos incluyen acceso completo a todas las funciones. El plan anual te ahorra 40%.',
  },
  {
    category: 'suscripcion',
    question: '¿Qué incluye la suscripción Premium?',
    answer: 'Acceso ilimitado al mapa interactivo con 3,500+ lugares verificados, chatbot IA (Tío Viajero) con geolocalización GPS, planificador de rutas optimizado, favoritos ilimitados, filtros avanzados, blog con guías Top 10, y nuevos lugares cada semana.',
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
    question: '¿Qué ventajas tiene el plan anual?',
    answer: 'El plan anual cuesta 24,99€/año (2,08€/mes), ahorrando 40% respecto al mensual. Incluye todas las funciones premium, badge especial "Plan Anual" en tu perfil, y facturación única al año.',
  },
  {
    category: 'suscripcion',
    question: '¿Puedo cambiar de plan mensual a anual?',
    answer: 'Sí. Puedes actualizar tu plan en cualquier momento desde tu perfil. El cambio es inmediato y se ajustará proporcionalmente el costo.',
  },
  {
    category: 'suscripcion',
    question: '¿Qué pasa cuando termina el trial?',
    answer: 'Cuando termina el trial, aparece un mensaje bloqueando acceso a funciones premium hasta que te suscribas. Puedes elegir entre plan mensual o anual en ese momento.',
  },
  {
    category: 'suscripcion',
    question: '¿Cómo se procesa el pago?',
    answer: 'Usamos un sistema de pagos seguro y certificado. Aceptamos todas las tarjetas principales (Visa, Mastercard, American Express). Todos los datos están cifrados y protegidos. Nunca almacenamos información de tarjetas.',
  },
  // Lugares (12 preguntas)
  {
    category: 'lugares',
    question: '¿Cuántos lugares hay en la plataforma?',
    answer: 'Actualmente tenemos más de 3,500 lugares verificados en toda España. Añadimos nuevos lugares cada semana mediante nuestro sistema de indexación automática.',
  },
  {
    category: 'lugares',
    question: '¿Qué criterios usan para seleccionar lugares?',
    answer: 'Solo incluimos lugares con mínimo 4.7★ de valoración verificada en Google Maps. Además, consideramos el número de reseñas para asegurar que son lugares consolidados y de calidad.',
  },
  {
    category: 'lugares',
    question: '¿Cómo funciona el sistema de tiers?',
    answer: 'Nuestro sistema clasifica lugares en 5 tiers: 💎 Diamante (4.8+ con 1000+ reseñas, top 0.1%), 🏆 Platino (4.8+ con 500+, top 1%), 🥇 Oro (4.8+ con 200+, top 5%), 🥈 Plata (4.7+ con 100+, top 15%), 🥉 Bronce (4.7+, calidad garantizada). Esto identifica los lugares verdaderamente excepcionales.',
  },
  {
    category: 'lugares',
    question: '¿Los lugares pagan por aparecer?',
    answer: 'No. Los lugares no pagan por aparecer en Casi Cinco. Nuestro sistema indexa automáticamente los mejores lugares según su valoración en Google Maps. Es un proceso completamente objetivo.',
  },
  {
    category: 'lugares',
    question: '¿Cómo añadir un lugar?',
    answer: 'Solo indexamos lugares de Google Maps con mínimo 4.7★ de valoración verificada. Nuestro sistema indexa automáticamente los mejores lugares. No podemos añadir lugares manualmente. Si conoces un lugar excepcional, escríbenos a info@casicinco.com.',
  },
  {
    category: 'lugares',
    question: '¿Con qué frecuencia se actualizan los lugares?',
    answer: 'Añadimos nuevos lugares cada semana. También actualizamos las valoraciones y reseñas de lugares existentes regularmente para mantener la información actualizada.',
  },
  {
    category: 'lugares',
    question: '¿Qué categorías de lugares incluyen?',
    answer: 'Actualmente incluimos 3 categorías principales: Restaurantes, Hoteles y Bares. Todos con mínimo 4.7★ en Google Maps y verificados por nuestro sistema.',
  },
  {
    category: 'lugares',
    question: '¿De dónde provienen los datos de los lugares?',
    answer: 'Todos los datos provienen de Google Maps verificados y actualizados. Incluyen: nombre, dirección, teléfono, website, rating, número de reseñas, coordenadas GPS, fotos en alta calidad, y descripciones generadas con IA.',
  },
  {
    category: 'lugares',
    question: '¿Cómo funciona la indexación en 2 fases?',
    answer: 'Fase 1 (Indexación): Obtenemos datos básicos de Google Maps (nombre, dirección, rating, fotos). Fase 2 (Enriquecimiento): IA genera descripciones únicas, analiza reseñas, optimiza fotos, y busca redes sociales. Este proceso garantiza calidad y eficiencia.',
  },
  {
    category: 'lugares',
    question: '¿Qué zonas geográficas cubren?',
    answer: 'Cubrimos toda España con más de 3,500 lugares en las 50 provincias. Principales ciudades: Madrid, Barcelona, Valencia, Sevilla, Bilbao, Málaga, Zaragoza, Murcia, y muchas más.',
  },
  {
    category: 'lugares',
    question: '¿Puedo filtrar lugares por precio?',
    answer: 'Sí. En el mapa puedes filtrar por nivel de precio (€, €€, €€€, €€€€) según la información de Google Maps. También puedes preguntarle al Tío Viajero por lugares "baratos", "económicos" o "de lujo".',
  },
  {
    category: 'lugares',
    question: '¿Los lugares tienen fotos reales?',
    answer: 'Sí. Almacenamos hasta 5 fotos en alta calidad de cada lugar. Las fotos provienen de Google Maps y están optimizadas para carga rápida. El 96.8% de nuestros lugares tienen fotos.',
  },
  // Funcionalidades (15 preguntas)
  {
    category: 'funcionalidades',
    question: '¿Qué funciones principales tiene la app?',
    answer: 'Mapa interactivo con 3,500+ lugares, chatbot IA con geolocalización GPS (Tío Viajero), planificador de rutas optimizado, blog con guías Top 10 por ciudad, favoritos ilimitados, filtros avanzados, y analytics de usuarios.',
  },
  {
    category: 'funcionalidades',
    question: '¿Cómo funciona el mapa interactivo?',
    answer: 'El mapa muestra todos los lugares verificados con marcadores de colores según su tier. Puedes filtrar por categoría, provincia, ciudad, rating y precio. Cada lugar muestra su rating, número de reseñas, y tier. Haz clic para ver detalles completos.',
  },
  {
    category: 'funcionalidades',
    question: '¿Qué es el Tío Viajero?',
    answer: 'Es nuestro asistente de IA (GPT-4o-mini) que te ayuda a encontrar lugares mediante conversación natural. Puede usar tu ubicación GPS, entender búsquedas como "restaurantes cerca de mí" o "hoteles románticos en Madrid", y recomendar los mejores lugares.',
  },
  {
    category: 'funcionalidades',
    question: '¿El Tío Viajero puede usar mi ubicación GPS?',
    answer: 'Sí. Si compartes tu ubicación, el Tío Viajero encuentra lugares cercanos usando términos como "cerca", "aquí", "a 500 metros" o "caminando". Te muestra la distancia real en kilómetros. Tu ubicación solo se usa para recomendaciones y nunca se almacena.',
  },
  {
    category: 'funcionalidades',
    question: '¿Cómo funciona el planificador de rutas?',
    answer: 'Añade múltiples lugares a tu ruta y el sistema optimiza automáticamente el orden para minimizar distancias. Puedes guardar rutas, compartirlas, y acceder desde cualquier dispositivo. Ideal para planificar viajes o días de turismo.',
  },
  {
    category: 'funcionalidades',
    question: '¿Puedo guardar lugares favoritos?',
    answer: 'Sí. Guarda tantos lugares como quieras en favoritos. Organízalos por categorías y accede fácilmente desde tu perfil. Sincronizados en todos tus dispositivos.',
  },
  {
    category: 'funcionalidades',
    question: '¿Qué filtros están disponibles?',
    answer: 'Filtra por categoría (restaurante, hotel, bar), provincia, ciudad, rating (4.7-5.0), precio (€ a €€€€), número de reseñas, y quality tier (Diamante, Platino, Oro, Plata, Bronce).',
  },
  {
    category: 'funcionalidades',
    question: '¿Hay función de búsqueda avanzada?',
    answer: 'Sí. Además de filtros, el Tío Viajero permite búsquedas por lenguaje natural: "cocina italiana en Barcelona", "hoteles románticos cerca de mí", "bares con terraza en Madrid". Entiende contexto y preferencias.',
  },
  {
    category: 'funcionalidades',
    question: '¿Puedo compartir lugares con amigos?',
    answer: 'Sí. Cada lugar tiene su propia URL que puedes copiar y compartir. También puedes compartir rutas completas planificadas.',
  },
  {
    category: 'funcionalidades',
    question: '¿Qué información veo de cada lugar?',
    answer: 'Nombre, categoría, tier, rating, número de reseñas, dirección completa, coordenadas GPS, teléfono, website, redes sociales (Instagram, Facebook, Twitter, TikTok), fotos, descripción generada con IA, y enlace a Google Maps.',
  },
  {
    category: 'funcionalidades',
    question: '¿Hay límite de búsquedas o consultas?',
    answer: 'No. Con suscripción Premium tienes búsquedas ilimitadas, consultas ilimitadas al Tío Viajero, favoritos ilimitados, y rutas ilimitadas. Sin restricciones.',
  },
  {
    category: 'funcionalidades',
    question: '¿Puedo usar la app offline?',
    answer: 'No. Casi Cinco requiere conexión a internet para acceder a datos actualizados de lugares, chatbot IA, y mapa interactivo. Estamos evaluando funcionalidades offline para el futuro.',
  },
  {
    category: 'funcionalidades',
    question: '¿Qué es el blog Top 10?',
    answer: 'Generamos guías "Top 10 mejores [categoría] de [ciudad/provincia]" con los lugares mejor valorados. SSR/SSG optimizado para SEO. Actualizaciones automáticas basadas en tiers y ratings. Disponible públicamente.',
  },
  {
    category: 'funcionalidades',
    question: '¿Cómo funcionan las recomendaciones personalizadas?',
    answer: 'El Tío Viajero aprende de tus preferencias en la conversación (precio, tipo de cocina, ocasión) y prioriza lugares según tu perfil. También considera tu ubicación GPS si la compartes.',
  },
  {
    category: 'funcionalidades',
    question: '¿Puedo ver el historial de lugares visitados?',
    answer: 'Sí. Desde tu perfil puedes ver todos los lugares que has marcado como visitados, junto con la fecha. Útil para recordar y recomendar.',
  },
  // App y Tecnología (8 preguntas)
  {
    category: 'app',
    question: '¿Cómo se garantiza la calidad de los datos?',
    answer: 'Solo indexamos lugares de Google Maps con 4.7+ estrellas verificadas. Sistema de 2 fases (indexación + enriquecimiento IA). Actualizaciones semanales. Validación de datos antes de publicar.',
  },
  {
    category: 'app',
    question: '¿Cómo funciona el sistema de indexación automática?',
    answer: 'Nuestro sistema busca automáticamente lugares en Google Maps con 4.7+ estrellas, los indexa en 2 fases (datos básicos + enriquecimiento IA), optimiza fotos, genera descripciones únicas, y busca redes sociales. Todo automatizado.',
  },
  {
    category: 'app',
    question: '¿Por qué no puedo añadir lugares manualmente?',
    answer: 'Para garantizar objetividad y calidad, solo indexamos lugares que cumplen nuestros criterios automáticos (4.7+ estrellas en Google Maps). Esto evita sesgos y asegura que todos los lugares son excepcionales.',
  },
  {
    category: 'app',
    question: '¿Qué diferencia a Casi Cinco de otras apps?',
    answer: 'Sistema de tiers único (rating + reseñas, no solo rating), chatbot IA con geolocalización GPS, datos verificados de Google Maps, proceso totalmente objetivo (sin pagos de lugares), y optimización extrema de calidad.',
  },
  {
    category: 'app',
    question: '¿Cómo funciona la geolocalización GPS?',
    answer: 'Si compartes tu ubicación, el sistema calcula distancias reales en kilómetros a cada lugar. El Tío Viajero entiende términos como "cerca", "caminando", "en coche" y ajusta búsquedas. Tu ubicación nunca se almacena.',
  },
  {
    category: 'app',
    question: '¿Qué es el enriquecimiento con IA?',
    answer: 'Fase 2 de indexación donde nuestra IA genera descripciones únicas analizando nombre, categoría, ubicación y reseñas. También resumimos reseñas, extraemos highlights, y buscamos redes sociales automáticamente.',
  },
  {
    category: 'app',
    question: '¿La app es responsive?',
    answer: 'Sí. Totalmente optimizada para desktop, tablet y móvil. Funciona en todos los navegadores: Chrome, Firefox, Safari, Edge. Diseño adaptativo y moderno.',
  },
  {
    category: 'app',
    question: '¿Qué medidas de seguridad tienen?',
    answer: 'Seguridad a nivel de base de datos con permisos granulares, autenticación con Google OAuth, cifrado de datos, HTTPS obligatorio, y cumplimiento completo de GDPR y políticas de privacidad europeas.',
  },
  {
    category: 'app',
    question: '¿Tienen aplicación móvil nativa?',
    answer: 'Por ahora, Casi Cinco es una aplicación web progresiva (PWA) optimizada para móviles. Funciona desde cualquier navegador. Estamos evaluando apps nativas iOS/Android para el futuro.',
  },
  // General (11 preguntas)
  {
    category: 'general',
    question: '¿Cuándo lanzaron Casi Cinco?',
    answer: 'Lanzamos en BETA en octubre de 2024. Actualmente en versión BETA 100, totalmente funcional con más de 3,500 lugares indexados en toda España.',
  },
  {
    category: 'general',
    question: '¿Quién está detrás de Casi Cinco?',
    answer: 'Casi Cinco es una empresa de Furgocasa (www.furgocasa.com), alquiler premium de campervans desde 2018. Nació de la necesidad real de nuestros clientes de encontrar lugares excepcionales sin perder tiempo.',
  },
  {
    category: 'general',
    question: '¿Tiempo de respuesta del soporte?',
    answer: 'Respondemos todas las consultas en menos de 24 horas laborables. Para temas urgentes, escribe directamente a info@casicinco.com.',
  },
  {
    category: 'general',
    question: '¿Cómo puedo reportar un error?',
    answer: 'Escríbenos a info@casicinco.com con detalles del error. Incluye capturas de pantalla si es posible. Respondemos en menos de 24 horas y priorizamos correcciones críticas.',
  },
  {
    category: 'general',
    question: '¿Puedo sugerir mejoras o funcionalidades?',
    answer: 'Sí. Valoramos mucho el feedback de usuarios. Escribe a info@casicinco.com con tus sugerencias. Evaluamos todas las propuestas y priorizamos las más solicitadas.',
  },
  {
    category: 'general',
    question: '¿Hay programa de afiliados?',
    answer: 'Actualmente no tenemos programa de afiliados. Estamos enfocados en mejorar la plataforma y añadir más lugares. Lo consideraremos en el futuro.',
  },
  {
    category: 'general',
    question: '¿Puedo usar Casi Cinco para mi negocio?',
    answer: 'Casi Cinco es para uso personal de viajeros. Si representas un lugar y quieres actualizar información, escríbenos a info@casicinco.com. Para colaboraciones comerciales, también contáctanos.',
  },
  {
    category: 'general',
    question: '¿Planean expandirse a otros países?',
    answer: 'Por ahora nos enfocamos en España con 3,500+ lugares verificados. Una vez consolidado el mercado español, evaluaremos expansión a Portugal y otros países europeos.',
  },
  {
    category: 'general',
    question: '¿Cómo se financia la plataforma?',
    answer: 'Modelo freemium: trial gratuito 30 días sin tarjeta, luego suscripción Premium (2,99€/mes o 24,99€/año). Los lugares NO pagan por aparecer. Solo usuarios pagan suscripción.',
  },
  {
    category: 'general',
    question: '¿Hay descuentos para grupos o empresas?',
    answer: 'Actualmente no ofrecemos planes empresariales. Cada usuario paga su suscripción individual. Para consultas empresariales o grupos grandes, escribe a info@casicinco.com.',
  },
  {
    category: 'general',
    question: '¿Puedo exportar mis datos (favoritos, rutas)?',
    answer: 'Puedes ver y gestionar tus favoritos y rutas desde tu perfil. Actualmente no hay opción de exportar a archivo. Estamos evaluando esta funcionalidad para el futuro.',
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

  // Filtrar categorías a mostrar
  const categoriesToShow = selectedCategory
    ? categories.filter((cat) => cat.id === selectedCategory)
    : categories;

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

        {/* SECCIÓN CONTACTO */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Necesitas Ayuda?</h2>
            <p className="text-gray-600 mb-8">
              Escríbenos a nuestro email y te responderemos en menos de 24 horas laborables
            </p>

            {/* Email destacado */}
            <div className="mb-10">
              <a 
                href="mailto:info@casicinco.com"
                className="inline-flex items-center gap-3 bg-[#063971] text-white px-8 py-4 rounded-xl hover:bg-[#0a4a8f] transition-all text-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Mail className="h-6 w-6" />
                info@casicinco.com
              </a>
                      </div>

            {/* Redes Sociales */}
            <div className="mb-10">
              <p className="text-gray-600 mb-4 font-medium">Síguenos en Redes Sociales</p>
              <div className="flex justify-center gap-6">
                <a 
                  href="https://www.instagram.com/casi_cinco/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
                <a 
                  href="https://www.facebook.com/profile.php?id=61569287943719" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#1877f2] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>
                      </div>
                      </div>

            {/* Motivos para contactar */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">🐛</span>
                  <h3 className="font-semibold text-gray-900">Reportar Errores</h3>
                      </div>
                <p className="text-sm text-gray-600">
                  Si encuentras información incorrecta, enlaces rotos o cualquier problema en la plataforma.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">✏️</span>
                  <h3 className="font-semibold text-gray-900">Corregir Información</h3>
                </div>
                <p className="text-sm text-gray-600">
                  ¿Eres propietario de un lugar y hay datos desactualizados? Ayúdanos a mantener la información precisa.
                </p>
                    </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">⭐</span>
                  <h3 className="font-semibold text-gray-900">Sugerir Lugares</h3>
                    </div>
                <p className="text-sm text-gray-600">
                  ¿Conoces un lugar excepcional con +4.7★ que no está en Casi Cinco? Cuéntanos.
                </p>
                    </div>
                    </div>
                  </div>
        </section>

        {/* SECCIÓN PREGUNTAS FRECUENTES */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <HelpCircle className="h-8 w-8 text-[#063971]" />
                <h2 className="text-3xl font-bold text-gray-900">Preguntas Frecuentes</h2>
              </div>
              <p className="text-gray-600 text-lg">
                Encuentra respuestas rápidas a las preguntas más comunes
              </p>
            </div>

            {/* Filtros por categoría */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                  selectedCategory === null
                    ? 'bg-[#063971] text-white shadow-md scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                    selectedCategory === cat.id
                      ? 'bg-[#063971] text-white shadow-md scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* FAQs agrupadas por categoría */}
            <div className="space-y-10">
              {categoriesToShow.map((category) => {
                const categoryFaqs = faqs.filter((faq) => faq.category === category.id);
                
                return (
                  <div key={category.id}>
                    {/* Título de categoría */}
                    <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-[#063971]">
                      <span className="text-3xl">{category.icon}</span>
                      <h3 className="text-2xl font-bold text-[#063971]">{category.name}</h3>
                      <span className="ml-auto bg-[#063971] text-white text-sm font-semibold px-3 py-1 rounded-full">
                        {categoryFaqs.length} preguntas
                      </span>
                    </div>

                    {/* Lista de preguntas de esta categoría */}
                    <div className="space-y-3">
                      {categoryFaqs.map((faq, index) => {
                        const globalIndex = faqs.indexOf(faq);
                        const isOpen = openFaq === globalIndex;
                        
                        return (
                          <div
                            key={globalIndex}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all hover:border-[#063971] hover:shadow-md"
                          >
                            <button
                              onClick={() => setOpenFaq(isOpen ? null : globalIndex)}
                              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <span className="font-semibold text-gray-900 pr-4 text-base">{faq.question}</span>
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-[#063971] flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              )}
                            </button>
                            {isOpen && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                            )}
                    </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nota propietarios */}
            <div className="mt-10">
              <Card className="p-6 bg-gradient-to-r from-[#ffd935]/20 to-[#063971]/10 border-[#ffd935]">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  🏪 ¿Eres propietario de un lugar?
                  </h3>
                  <p className="text-sm text-gray-700">
                  Si tienes un restaurante, hotel o bar y quieres aparecer en Casi Cinco,
                    asegúrate de tener <strong>mínimo 4.7★</strong> en Google Maps. Nuestro sistema
                  indexa automáticamente los mejores lugares. Para consultas, escribe a{' '}
                  <a href="mailto:info@casicinco.com" className="text-[#063971] font-semibold hover:underline">
                    info@casicinco.com
                  </a>
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

