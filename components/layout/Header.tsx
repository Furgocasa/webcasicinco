'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { User, LogOut, Settings, ChevronDown, Map, Navigation, BookOpen } from 'lucide-react';

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAdmin, signOut, loading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // /mapa y /ruta comparten el mismo chrome: barra azul a sangre y sin fila de iconos,
  // porque en ambas la navegación de móvil la lleva la barra inferior de la página.
  const isMapa = ['/mapa', '/ruta'].some(
    (ruta) => pathname === ruta || pathname?.startsWith(`${ruta}?`)
  );

  // Cerrar menú de usuario al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navLinkClass = (href: string) => {
    const active = pathname === href;
    if (isMapa) {
      return `text-white font-semibold hover:text-white/80 transition relative z-10 touch-manipulation ${
        active ? 'border-b-2 border-white pb-1' : ''
      }`;
    }
    return 'text-gray-700 hover:text-brand-blue font-medium transition relative z-10 touch-manipulation';
  };

  return (
    <header className={`${isMapa ? 'bg-primary text-white shadow-lg' : 'bg-white shadow-sm'} sticky top-0 z-[999] pt-[env(safe-area-inset-top)]`}>
      <nav className={isMapa ? 'w-full px-3 md:px-4 lg:px-6' : 'container mx-auto px-4'}>
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center relative z-10 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <img
              src={isMapa ? '/images/casi_cinco_white.png' : '/images/casi_cinco_dark.png'}
              alt="Casi Cinco"
              className="h-8 sm:h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/mapa"
              className={navLinkClass('/mapa')}
              style={{ touchAction: 'manipulation' }}
            >
              Mapa
            </Link>
            <Link
              href="/ruta"
              className={navLinkClass('/ruta')}
              style={{ touchAction: 'manipulation' }}
            >
              Planificar Ruta
            </Link>
            <Link
              href="/blog"
              className={navLinkClass('/blog')}
              style={{ touchAction: 'manipulation' }}
            >
              Blog
            </Link>
          </div>

          {/* Mobile Quick Nav */}
          <div className={`${isMapa ? 'hidden' : 'flex'} md:hidden items-center gap-0.5`}>
            <Link
              href="/mapa"
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative z-10 touch-manipulation min-w-[60px] hover:bg-blue-50"
              style={{ touchAction: 'manipulation' }}
              aria-label="Mapa"
            >
              <Map className="h-5 w-5 text-brand-blue" />
              <span className="text-[10px] font-medium leading-none text-gray-600">Mapa</span>
            </Link>
            <Link
              href="/ruta"
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative z-10 touch-manipulation min-w-[60px] hover:bg-blue-50"
              style={{ touchAction: 'manipulation' }}
              aria-label="Rutas"
            >
              <Navigation className="h-5 w-5 text-brand-blue" />
              <span className="text-[10px] font-medium leading-none text-gray-600">Rutas</span>
            </Link>
            <Link
              href="/blog"
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative z-10 touch-manipulation min-w-[60px] hover:bg-blue-50"
              style={{ touchAction: 'manipulation' }}
              aria-label="Blog"
            >
              <BookOpen className="h-5 w-5 text-brand-blue" />
              <span className="text-[10px] font-medium leading-none text-gray-600">Blog</span>
            </Link>
            <div className="w-px h-8 mx-1 bg-gray-300" />
          </div>

          {/* Auth: login o menú de usuario */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${isMapa ? 'border-white' : 'border-brand-blue'}`}></div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg transition-colors duration-200 ${
                    isMapa ? 'bg-white text-brand-blue hover:bg-blue-50' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <User className="h-4 w-4 text-brand-blue" />
                  </div>
                  <span className="hidden lg:inline text-sm font-medium max-w-[140px] truncate">
                    {(user.user_metadata as any)?.full_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''} ${isMapa ? 'text-brand-blue' : 'text-gray-500'}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {(user.user_metadata as any)?.full_name || 'Mi cuenta'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Panel Admin
                        </Link>
                      )}

                      <Link
                        href="/perfil"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Mi Perfil
                      </Link>

                      <button
                        onClick={() => {
                          signOut();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    size="sm"
                    variant={isMapa ? 'outline' : 'ghost'}
                    className={isMapa ? 'bg-white/15 text-white border-white/30 hover:bg-white/25' : ''}
                  >
                    Entrar
                  </Button>
                </Link>
                <Link href="/registro" className="hidden sm:block">
                  <Button size="sm" className={isMapa ? 'bg-white text-brand-blue hover:bg-blue-50' : ''}>
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
