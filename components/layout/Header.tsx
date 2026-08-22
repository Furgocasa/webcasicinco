'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { User, LogOut, Settings, ChevronDown, Map, Navigation, BookOpen, Mail, DollarSign, FileText, Info, Menu } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAdmin, signOut, loading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isMapa = pathname === '/mapa' || pathname?.startsWith('/mapa?');

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

  const linkClass = isMapa
    ? 'text-white/90 hover:text-white font-medium transition relative z-10 touch-manipulation'
    : 'text-gray-700 hover:text-brand-blue transition relative z-10 touch-manipulation';

  return (
    <header className={`${isMapa ? 'bg-primary' : 'bg-white shadow-sm'} sticky top-0 z-[999] pt-[env(safe-area-inset-top)]`}>
      <nav className="container mx-auto px-4">
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

          {/* Desktop Navigation - Enlaces principales */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/mapa" 
              className={linkClass}
              style={{ touchAction: 'manipulation' }}
            >
              Mapa
            </Link>
            <Link 
              href="/ruta" 
              className={linkClass}
              style={{ touchAction: 'manipulation' }}
            >
              Planificar Ruta
            </Link>
            <Link 
              href="/blog" 
              className={linkClass}
              style={{ touchAction: 'manipulation' }}
            >
              Blog
            </Link>
          </div>

          {/* Mobile Quick Nav - Iconos permanentes en navbar móvil */}
          <div className={`${isMapa ? 'hidden' : 'flex'} md:hidden items-center gap-0.5`}>
            <Link 
              href="/mapa"
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative z-10 touch-manipulation min-w-[60px] ${isMapa ? 'hover:bg-white/10' : 'hover:bg-blue-50'}`}
              style={{ touchAction: 'manipulation' }}
              aria-label="Mapa"
            >
              <Map className={`h-5 w-5 ${isMapa ? 'text-white' : 'text-brand-blue'}`} />
              <span className={`text-[10px] font-medium leading-none ${isMapa ? 'text-white/80' : 'text-gray-600'}`}>Mapa</span>
            </Link>
            <Link 
              href="/ruta"
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative z-10 touch-manipulation min-w-[60px] ${isMapa ? 'hover:bg-white/10' : 'hover:bg-blue-50'}`}
              style={{ touchAction: 'manipulation' }}
              aria-label="Rutas"
            >
              <Navigation className={`h-5 w-5 ${isMapa ? 'text-white' : 'text-brand-blue'}`} />
              <span className={`text-[10px] font-medium leading-none ${isMapa ? 'text-white/80' : 'text-gray-600'}`}>Rutas</span>
            </Link>
            <Link 
              href="/blog"
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors relative z-10 touch-manipulation min-w-[60px] ${isMapa ? 'hover:bg-white/10' : 'hover:bg-blue-50'}`}
              style={{ touchAction: 'manipulation' }}
              aria-label="Blog"
            >
              <BookOpen className={`h-5 w-5 ${isMapa ? 'text-white' : 'text-brand-blue'}`} />
              <span className={`text-[10px] font-medium leading-none ${isMapa ? 'text-white/80' : 'text-gray-600'}`}>Blog</span>
            </Link>
            <div className={`w-px h-8 mx-1 ${isMapa ? 'bg-white/30' : 'bg-gray-300'}`} />
          </div>

          {/* Right Side: Hamburger + Auth Buttons */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu Button - Universal (Desktop + Mobile) - Antes del auth */}
            <button
              className={`hidden md:block p-2 rounded-lg transition ${isMapa ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menú"
            >
              <Menu className={`w-6 h-6 ${isMapa ? 'text-white' : 'text-gray-700'}`} />
            </button>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* Admin link - Solo para admins */}
                {isAdmin && (
                  <Link href="/admin/dashboard">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white text-brand-blue border-brand-blue hover:bg-blue-50"
                    >
                      Admin
                    </Button>
                  </Link>
                )}

                {/* Perfil link - Para TODOS los usuarios autenticados */}
                <Link href="/perfil">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Perfil
                  </Button>
                </Link>
                
                {/* User menu dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-brand-blue" />
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Mi cuenta</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          href="/perfil"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Mi Perfil
                        </Link>
                        
                        {isAdmin && (
                          <Link
                            href="/admin/configuracion"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-3" />
                            Configuración
                          </Link>
                        )}
                        
                        <button
                          onClick={() => {
                            signOut();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Iniciar Sesión</Button>
                </Link>
                <Link href="/registro">
                  <Button>Registrarse</Button>
                </Link>
              </>
            )}
            </div>
          </div>

          {/* Mobile Menu Button - Solo móvil */}
          <button
            className="md:hidden p-3 -mr-3 active:bg-gray-100 rounded-lg transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menú"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Overlay - Universal (Desktop + Mobile) */}
        {isMenuOpen && (
          <>
            {/* Fondo oscuro */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menú deslizable - Ancho adaptativo */}
            <div className="fixed top-16 right-0 bottom-0 bg-white z-50 overflow-y-auto animate-slide-in-right shadow-2xl w-full md:w-96">
              <div className="p-6">
              <div className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                  </div>
                ) : user ? (
                  <>
                    {/* User info card */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">Mi Cuenta</p>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Admin - Destacado si es admin */}
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-4 rounded-xl bg-brand-blue text-white hover:bg-brand-blue-dark transition shadow-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        <span className="font-semibold">Panel Admin</span>
                      </Link>
                    )}

                    {/* Perfil */}
                    <Link
                      href="/perfil"
                      className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-gray-50 transition border border-gray-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Mi Perfil</span>
                    </Link>

                    {/* Cerrar sesión */}
                    <button
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-red-50 transition w-full text-left border border-red-200"
                    >
                      <LogOut className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-600">Cerrar Sesión</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-12 text-base">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/registro" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full h-12 text-base bg-gradient-to-r from-brand-blue to-brand-blue-dark">
                        Registrarse
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Sección de Navegación */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Explorar</h3>
                  <div className="space-y-2">
                    <Link
                      href="/mapa"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Map className="h-5 w-5 text-brand-blue" />
                      <span className="font-medium text-gray-900">Mapa de Lugares</span>
                    </Link>
                    <Link
                      href="/ruta"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Navigation className="h-5 w-5 text-brand-blue" />
                      <span className="font-medium text-gray-900">Planificar Ruta</span>
                    </Link>
                  </div>
                </div>

                {/* Top 10 por Categoría */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Top 10</h3>
                  <div className="space-y-2">
                    <Link
                      href="/restaurante"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-2xl">🍽️</span>
                      <span className="font-medium text-gray-900">Restaurantes</span>
                    </Link>
                    <Link
                      href="/bar"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-2xl">🍺</span>
                      <span className="font-medium text-gray-900">Bares</span>
                    </Link>
                    <Link
                      href="/hotel"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-2xl">🏨</span>
                      <span className="font-medium text-gray-900">Hoteles</span>
                    </Link>
                  </div>
                </div>

                {/* Información y Ayuda */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">Información</h3>
                  <div className="space-y-2">
                    <Link
                      href="/contacto"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Mail className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-900">Contacto</span>
                    </Link>
                    <Link
                      href="/pricing"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-900">Precios</span>
                    </Link>
                    <Link
                      href="/metodologia"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <span className="font-medium text-gray-900">Metodología</span>
                    </Link>
                    <Link
                      href="/sobre-nosotros"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Info className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Sobre Nosotros</span>
                    </Link>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
