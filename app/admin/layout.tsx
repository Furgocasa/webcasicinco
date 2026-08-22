'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar, { getActiveAdminTitle } from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard';
import { Menu, X, Globe } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = getActiveAdminTitle(pathname || '');

  // Cerrar el drawer móvil al navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <AuthGuard requireAuth requireAdmin>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar escritorio */}
        <aside className="hidden lg:block w-72 shrink-0">
          <Sidebar />
        </aside>

        {/* Sidebar móvil */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 shadow-xl">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-3 text-blue-200/80 hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="w-6 h-6" />
              </button>
            </aside>
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barra superior */}
          <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-gray-900 truncate">{title}</h1>
            <div className="ml-auto flex items-center gap-4">
              <Link
                href="/mapa"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-blue transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="hidden sm:inline">Ver web</span>
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
