import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-bold text-lg mb-4">Casi Cinco ⭐</h3>
            <p className="text-sm text-gray-400">
              Los mejores lugares de España con mínimo 4.7★ de valoración.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="text-white font-semibold mb-4">Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/mapa" className="hover:text-white transition">
                  Mapa
                </Link>
              </li>
              <li>
                <Link href="/ruta" className="hover:text-white transition">
                  Planificar Ruta
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Sobre Nosotros + Pricing */}
          <div>
            <h4 className="text-white font-semibold mb-4">Nosotros</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/metodologia" className="hover:text-white transition">
                  Metodología
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="/perfil" className="hover:text-white transition">
                  Mi Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Categorías */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/restaurante" className="hover:text-white transition">
                  Restaurantes
                </Link>
              </li>
              <li>
                <Link href="/hotel" className="hover:text-white transition">
                  Hoteles
                </Link>
              </li>
              <li>
                <Link href="/bar" className="hover:text-white transition">
                  Bares
                </Link>
              </li>
              <li>
                <Link href="/cafeteria" className="hover:text-white transition">
                  Cafeterías
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacidad" className="hover:text-white transition">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-white transition">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-white transition">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-sm">
          <p className="text-gray-400">© {currentYear} Casi Cinco. Todos los derechos reservados.</p>
          <p className="mt-2 md:mt-0 text-gray-500">
            Hecho con ❤️ en España
          </p>
        </div>
      </div>
    </footer>
  );
}
