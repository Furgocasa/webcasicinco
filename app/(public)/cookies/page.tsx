import Link from 'next/link';
import { ArrowLeft, Cookie } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function CookiesPage() {
  return (
    <>
      <main className="min-h-screen bg-white">
        {/* HERO */}
        <section className="relative bg-[#002196] text-white overflow-hidden py-12">
          <div className="container mx-auto px-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <Cookie className="h-12 w-12 text-[#ffd935]" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Política de Cookies
              </h1>
            </div>
            <p className="text-white/90 text-lg">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Qué son las Cookies?</h2>
              <p className="text-gray-700 mb-6">
                Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas
                Casi Cinco. Nos ayudan a mejorar tu experiencia, recordar tus preferencias y entender
                cómo usas la plataforma.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tipos de Cookies que Usamos</h2>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">1. Cookies Esenciales (Obligatorias)</h3>
              <p className="text-gray-700 mb-4">
                Necesarias para el funcionamiento básico del sitio. <strong>No se pueden desactivar.</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Sesión de usuario:</strong> Mantiene tu sesión activa</li>
                <li><strong>Autenticación:</strong> Verifica que estás logueado</li>
                <li><strong>Seguridad:</strong> Protege contra ataques CSRF</li>
                <li><strong>Preferencias básicas:</strong> Idioma, tema</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">2. Cookies Funcionales</h3>
              <p className="text-gray-700 mb-4">
                Mejoran tu experiencia recordando tus preferencias.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Filtros guardados:</strong> Recuerda tus filtros de búsqueda</li>
                <li><strong>Vista del mapa:</strong> Última posición y zoom</li>
                <li><strong>Favoritos locales:</strong> Cache de lugares favoritos</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">3. Cookies Analíticas</h3>
              <p className="text-gray-700 mb-4">
                Nos ayudan a entender cómo usas Casi Cinco para mejorar el servicio.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Páginas visitadas:</strong> Qué páginas son más populares</li>
                <li><strong>Tiempo de sesión:</strong> Cuánto tiempo usas la app</li>
                <li><strong>Errores:</strong> Detectar y corregir problemas</li>
              </ul>
              <p className="text-gray-700 mb-6">
                <em>Datos anónimos y agregados. No identificamos usuarios individuales.</em>
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies de Terceros</h2>
              <p className="text-gray-700 mb-4">
                Usamos servicios externos que pueden establecer sus propias cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Google Maps:</strong> Para mostrar mapas interactivos</li>
                <li><strong>Stripe:</strong> Para procesar pagos seguros</li>
                <li><strong>Supabase:</strong> Para autenticación y base de datos</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Duración de las Cookies</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Sesión:</strong> Se borran al cerrar el navegador</li>
                  <li><strong>Persistentes:</strong> Se mantienen hasta 1 año (preferencias, sesión)</li>
                  <li><strong>Analíticas:</strong> Hasta 2 años (Google Analytics)</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cómo Gestionar las Cookies</h2>
              <p className="text-gray-700 mb-4">
                Puedes controlar y eliminar cookies desde la configuración de tu navegador:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad</li>
                <li><strong>Safari:</strong> Preferencias → Privacidad</li>
                <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
              </ul>
              <p className="text-gray-700 mb-6">
                <strong>Nota:</strong> Bloquear cookies esenciales puede afectar el funcionamiento
                de Casi Cinco (por ejemplo, no podrás iniciar sesión).
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Actualizaciones de esta Política</h2>
              <p className="text-gray-700 mb-6">
                Podemos actualizar esta política ocasionalmente. Te notificaremos cambios significativos
                mediante un aviso en la plataforma.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contacto</h2>
              <p className="text-gray-700 mb-4">
                Preguntas sobre cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Email: <a href="mailto:privacidad@casicinco.com" className="text-[#002196] hover:underline">privacidad@casicinco.com</a></li>
                <li>Formulario: <Link href="/contacto" className="text-[#002196] hover:underline">/contacto</Link></li>
              </ul>

              <div className="bg-[#ffd935] bg-opacity-20 p-6 rounded-lg border border-[#ffd935] mt-8">
                <p className="text-sm text-gray-800">
                  <strong>💡 En resumen:</strong> Usamos cookies para que Casi Cinco funcione bien y
                  para mejorar tu experiencia. No vendemos tu información a terceros. Puedes gestionar
                  cookies desde tu navegador.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

