import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Casi Cinco</h3>
            <p className="text-sm">
              Descubre los mejores lugares de España con mínimo 4.7★ de valoración.
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
            </ul>
          </div>

          {/* Sobre Nosotros */}
          <div>
            <h4 className="text-white font-semibold mb-4">Sobre Nosotros</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/metodologia" className="hover:text-white transition flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  Nuestra Metodología
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
                <Link href="/restaurantes" className="hover:text-white transition">
                  Restaurantes
                </Link>
              </li>
              <li>
                <Link href="/hoteles" className="hover:text-white transition">
                  Hoteles
                </Link>
              </li>
              <li>
                <Link href="/spas" className="hover:text-white transition">
                  Spas
                </Link>
              </li>
              <li>
                <Link href="/experiencias" className="hover:text-white transition">
                  Experiencias
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
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>© {currentYear} Casi Cinco. Todos los derechos reservados.</p>
          <p className="mt-2 text-gray-500">
            Hecho con ❤️ en España
          </p>
        </div>
      </div>
    </footer>
  );
}
