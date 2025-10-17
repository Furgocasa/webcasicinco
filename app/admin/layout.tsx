'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard';
import { ChevronDown } from 'lucide-react';

const adminSections = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
  { name: 'Estadísticas', path: '/admin/estadisticas', icon: '📈' },
  { name: 'Indexar Lugares', path: '/admin/indexar', icon: '🔍' },
  { name: 'Búsqueda Manual', path: '/admin/buscar-lugar', icon: '🎯' },
  { name: 'Actualizar Ratings', path: '/admin/update-ratings', icon: '⭐' },
  { name: 'Gestión de Lugares', path: '/admin/lugares', icon: '📍' },
  { name: 'Gestión de Usuarios', path: '/admin/usuarios', icon: '👥' },
  { name: 'Historial de Trabajos', path: '/admin/trabajos', icon: '📋' },
  { name: 'Conversaciones IA', path: '/admin/conversaciones', icon: '💬' },
  { name: 'Configuración', path: '/admin/configuracion', icon: '⚙️' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  const currentSection = adminSections.find(s => s.path === pathname) || adminSections[0];

  return (
    <AuthGuard requireAuth requireAdmin>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar - Solo Desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 overflow-auto">
          {/* Mobile Section Selector */}
          <div className="md:hidden sticky top-0 z-30 bg-white border-b shadow-sm">
            <button
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="w-full px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentSection.icon}</span>
                <span className="font-semibold text-gray-900">{currentSection.name}</span>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isSelectorOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black bg-opacity-30 z-40"
                  onClick={() => setIsSelectorOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-50 border-t">
                  {adminSections.map((section) => (
                    <button
                      key={section.path}
                      onClick={() => {
                        router.push(section.path);
                        setIsSelectorOpen(false);
                      }}
                      className={`w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition ${
                        pathname === section.path ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                      }`}
                    >
                      <span className="text-xl">{section.icon}</span>
                      <span className="font-medium text-gray-900">{section.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Contenido - Padding adaptado */}
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
