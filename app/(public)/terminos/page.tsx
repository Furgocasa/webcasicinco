import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function TerminosPage() {
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
              <FileText className="h-12 w-12 text-[#ffd935]" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Términos de Servicio
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 mb-6">
                Al acceder y usar Casi Cinco, aceptas estos términos de servicio. Si no estás de acuerdo,
                no uses la plataforma.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descripción del Servicio</h2>
              <p className="text-gray-700 mb-4">
                Casi Cinco es una plataforma que:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Muestra lugares con valoraciones mínimas de 4.7★ en Google Maps</li>
                <li>Proporciona análisis con IA de reseñas y descripciones</li>
                <li>Ofrece mapas interactivos y planificador de rutas</li>
                <li>Permite guardar favoritos y registrar visitas</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cuenta de Usuario</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Debes ser mayor de 18 años para usar el servicio</li>
                <li>Eres responsable de mantener tu contraseña segura</li>
                <li>Una persona = una cuenta</li>
                <li>Prohibido compartir cuentas o usar bots/automatización</li>
                <li>Nos reservamos el derecho de suspender cuentas que violen estos términos</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Suscripciones y Pagos</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li><strong>Prueba gratis:</strong> 30 días completos sin cargo</li>
                <li><strong>Renovación automática:</strong> Después de 30 días, se cobra automáticamente</li>
                <li><strong>Cancelación:</strong> Puedes cancelar en cualquier momento desde tu perfil</li>
                <li><strong>Sin reembolsos:</strong> No ofrecemos reembolsos por periodos parciales</li>
                <li><strong>Cambios de precio:</strong> Te notificaremos 30 días antes de aumentos</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Uso Aceptable</h2>
              <p className="text-gray-700 mb-4">
                <strong>Está prohibido:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Hacer scraping o extraer datos masivos de la plataforma</li>
                <li>Usar el servicio para fines comerciales sin autorización</li>
                <li>Intentar hackear o comprometer la seguridad</li>
                <li>Enviar spam o contenido malicioso</li>
                <li>Violar derechos de propiedad intelectual</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propiedad Intelectual</h2>
              <p className="text-gray-700 mb-6">
                Todo el contenido de Casi Cinco (diseño, código, análisis IA, compilaciones de datos)
                es propiedad nuestra o de nuestros licenciantes. Los datos de Google Maps pertenecen
                a Google Inc.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Descargo de Responsabilidad</h2>
              <p className="text-gray-700 mb-6">
                <strong>El servicio se proporciona "tal cual".</strong> No garantizamos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Que todos los datos sean 100% exactos o actualizados</li>
                <li>Que el servicio esté disponible 24/7 sin interrupciones</li>
                <li>Que cada recomendación cumplirá tus expectativas</li>
              </ul>
              <p className="text-gray-700 mb-6">
                Usamos datos de Google Maps y análisis con IA. Aunque nos esforzamos por la calidad,
                no somos responsables de experiencias negativas en los lugares recomendados.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 mb-6">
                Casi Cinco no será responsable de daños indirectos, pérdida de datos, o experiencias
                negativas en lugares. Nuestra responsabilidad máxima está limitada al importe pagado
                por tu suscripción en los últimos 12 meses.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modificaciones del Servicio</h2>
              <p className="text-gray-700 mb-6">
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte del
                servicio con aviso previo de 30 días para cambios significativos.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Ley Aplicable</h2>
              <p className="text-gray-700 mb-6">
                Estos términos se rigen por las leyes de España. Cualquier disputa se resolverá
                en los tribunales de Madrid.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para preguntas sobre estos términos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>Email: <a href="mailto:legal@casicinco.com" className="text-[#002196] hover:underline">legal@casicinco.com</a></li>
                <li>Formulario: <Link href="/contacto" className="text-[#002196] hover:underline">/contacto</Link></li>
              </ul>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
                <p className="text-sm text-gray-600">
                  <strong>Cambios en los términos:</strong> Nos reservamos el derecho de actualizar
                  estos términos. Te notificaremos por email sobre cambios materiales. El uso continuado
                  implica aceptación.
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

