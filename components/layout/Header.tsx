'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { User, LogOut, Settings, ChevronDown, Map, Navigation } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAdmin, signOut, loading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="bg-white shadow-sm sticky top-0 z-[999]">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 relative z-10 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <span className="text-base sm:text-xl font-bold text-gray-900">Casi Cinco</span>
            <span className="text-2xl font-bold text-indigo-600">⭐</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/mapa" 
              className="text-gray-700 hover:text-indigo-600 transition relative z-10 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
            >
              Mapa
            </Link>
            <Link 
              href="/ruta" 
              className="text-gray-700 hover:text-indigo-600 transition relative z-10 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
            >
              Planificar Ruta
            </Link>
          </div>

          {/* Mobile Quick Nav + Menu - Iconos permanentes en navbar */}
          <div className="flex md:hidden items-center gap-1">
            <Link 
              href="/mapa"
              className="p-2.5 hover:bg-indigo-50 rounded-lg transition-colors relative z-10 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              aria-label="Mapa"
            >
              <Map className="h-5 w-5 text-indigo-600" />
            </Link>
            <Link 
              href="/ruta"
              className="p-2.5 hover:bg-indigo-50 rounded-lg transition-colors relative z-10 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              aria-label="Rutas"
            >
              <Navigation className="h-5 w-5 text-indigo-600" />
            </Link>
            {/* Separador visual */}
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* Admin link - Solo para admins */}
                {isAdmin && (
                  <Link href="/admin/dashboard">
                    <Button variant="outline" size="sm">
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
                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                      <User className="h-4 w-4 text-indigo-600" />
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

          {/* Mobile Menu Button - Touch optimized */}
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

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <>
            {/* Fondo oscuro */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menú deslizable - Limpio y Sin Duplicados */}
            <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 md:hidden overflow-y-auto animate-slide-down shadow-2xl">
              <div className="p-6">
              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : user ? (
                  <>
                    {/* User info card */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
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
                        className="flex items-center gap-3 px-4 py-4 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition shadow-lg"
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
                      <Button className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600">
                        Registrarse
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
