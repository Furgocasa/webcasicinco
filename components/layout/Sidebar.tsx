'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: '📊',
  },
  {
    name: 'Indexar Lugares',
    href: '/admin/indexar',
    icon: '🔍',
  },
  {
    name: 'Gestión de Lugares',
    href: '/admin/lugares',
    icon: '📍',
  },
  {
    name: 'Historial de Trabajos',
    href: '/admin/trabajos',
    icon: '📋',
  },
  {
    name: 'Configuración',
    href: '/admin/configuracion',
    icon: '⚙️',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-6 shadow-sm">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <span className="text-2xl">⭐</span>
          <div>
            <div className="font-bold text-lg text-gray-900">Casi Cinco</div>
            <div className="text-xs text-gray-500">Panel Admin</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-500' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
