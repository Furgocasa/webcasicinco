import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function PrivacidadPage() {
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
              <Shield className="h-12 w-12 text-[#ffd935]" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Política de Privacidad
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Información que Recopilamos</h2>
              <p className="text-gray-700 mb-6">
                En Casi Cinco recopilamos y procesamos la siguiente información:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Información de cuenta:</strong> Email, nombre y contraseña cuando te registras</li>
                <li><strong>Información de uso:</strong> Lugares que visitas, favoritos, rutas planificadas</li>
                <li><strong>Información de pago:</strong> Procesada de forma segura por Stripe (no almacenamos datos de tarjetas)</li>
                <li><strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, sistema operativo</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Cómo Usamos tu Información</h2>
              <p className="text-gray-700 mb-4">
                Utilizamos tu información para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Personalizar tu experiencia en la plataforma</li>
                <li>Gestionar tu suscripción y pagos</li>
                <li>Enviarte notificaciones sobre tu cuenta y nuevos lugares</li>
                <li>Analizar el uso de la aplicación para mejoras</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Compartir Información</h2>
              <p className="text-gray-700 mb-4">
                <strong>No vendemos tu información personal.</strong> Solo compartimos datos con:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Stripe:</strong> Para procesar pagos de forma segura</li>
                <li><strong>Google Maps API:</strong> Para mostrar mapas y datos de lugares</li>
                <li><strong>OpenAI:</strong> Para análisis de reseñas con IA (datos anónimos)</li>
                <li><strong>Supabase:</strong> Nuestro proveedor de base de datos (cumple con GDPR)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Tus Derechos (GDPR)</h2>
              <p className="text-gray-700 mb-4">
                Como usuario en la UE, tienes derecho a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Acceso:</strong> Solicitar una copia de tus datos personales</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos</li>
                <li><strong>Supresión:</strong> Solicitar la eliminación de tu cuenta y datos</li>
                <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
                <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Seguridad</h2>
              <p className="text-gray-700 mb-6">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos:
                encriptación SSL/TLS, contraseñas hasheadas, acceso restringido a datos, y cumplimiento
                con estándares de la industria.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Retención de Datos</h2>
              <p className="text-gray-700 mb-6">
                Mantenemos tus datos mientras tu cuenta esté activa. Si cancelas tu suscripción,
                conservamos tu información durante 90 días para posible reactivación. Después,
                los datos se eliminan permanentemente.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
              <p className="text-gray-700 mb-6">
                Usamos cookies esenciales para el funcionamiento de la aplicación y cookies
                analíticas para mejorar el servicio. Puedes gestionar las cookies en la
                configuración de tu navegador. Ver nuestra{' '}
                <Link href="/cookies" className="text-[#002196] hover:underline">
                  Política de Cookies
                </Link>.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para ejercer tus derechos o resolver dudas sobre privacidad:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Email: <a href="mailto:privacidad@casicinco.com" className="text-[#002196] hover:underline">privacidad@casicinco.com</a></li>
                <li>Formulario de contacto: <Link href="/contacto" className="text-[#002196] hover:underline">/contacto</Link></li>
              </ul>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
                <p className="text-sm text-gray-600">
                  <strong>Nota importante:</strong> Esta política puede actualizarse. Te notificaremos
                  cambios significativos por email. El uso continuado de Casi Cinco implica la aceptación
                  de la política vigente.
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

