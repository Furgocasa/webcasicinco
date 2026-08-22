'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  LayoutDashboard,
  MapPin,
  Search,
  Target,
  Star,
  Sparkles,
  FileText,
  MessageSquare,
  Share2,
  BarChart3,
  LineChart,
  ClipboardList,
  Users,
  Settings,
  Activity,
  ChevronDown,
  LogOut,
} from 'lucide-react';

const iconClass = 'w-5 h-5 shrink-0';

export type NavItem = {
  label: string;
  href: string;
  icon: JSX.Element;
};

export type NavGroup = {
  label: string;
  icon: JSX.Element;
  items: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

export const NAV: NavEntry[] = [
  {
    label: 'Inicio',
    href: '/admin',
    icon: <LayoutDashboard className={iconClass} />,
  },
  {
    label: 'Lugares',
    icon: <MapPin className={iconClass} />,
    items: [
      { label: 'Gestión de lugares', href: '/admin/lugares', icon: <MapPin className={iconClass} /> },
      { label: 'Indexar lugares', href: '/admin/indexar', icon: <Search className={iconClass} /> },
      { label: 'Búsqueda manual', href: '/admin/buscar-lugar', icon: <Target className={iconClass} /> },
      { label: 'Actualizar ratings', href: '/admin/update-ratings', icon: <Star className={iconClass} /> },
    ],
  },
  {
    label: 'Contenido e IA',
    icon: <Sparkles className={iconClass} />,
    items: [
      { label: 'Blog SEO', href: '/admin/blog', icon: <FileText className={iconClass} /> },
      { label: 'Conversaciones IA', href: '/admin/conversaciones', icon: <MessageSquare className={iconClass} /> },
      { label: 'Redes sociales', href: '/admin/redes-sociales', icon: <Share2 className={iconClass} /> },
    ],
  },
  {
    label: 'Datos y análisis',
    icon: <BarChart3 className={iconClass} />,
    items: [
      { label: 'Dashboard Analytics', href: '/admin/dashboard', icon: <BarChart3 className={iconClass} /> },
      { label: 'Estadísticas', href: '/admin/estadisticas', icon: <LineChart className={iconClass} /> },
      { label: 'Historial de trabajos', href: '/admin/trabajos', icon: <ClipboardList className={iconClass} /> },
    ],
  },
  {
    label: 'Sistema',
    icon: <Settings className={iconClass} />,
    items: [
      { label: 'Usuarios', href: '/admin/usuarios', icon: <Users className={iconClass} /> },
      { label: 'Configuración', href: '/admin/configuracion', icon: <Settings className={iconClass} /> },
      { label: 'Diagnóstico', href: '/admin/diagnostico', icon: <Activity className={iconClass} /> },
    ],
  },
];

export function isGroup(entry: NavEntry): entry is NavGroup {
  return (entry as NavGroup).items !== undefined;
}

export function flattenItems(): NavItem[] {
  return NAV.flatMap((entry) => (isGroup(entry) ? entry.items : [entry]));
}

/** href del item activo: el prefijo más largo que casa con el pathname */
export function findActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const item of flattenItems()) {
    // '/admin' solo casa exacto para no ganar siempre por prefijo
    const matches = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/');
    if (matches) {
      if (!best || item.href.length > best.length) best = item.href;
    }
  }
  return best;
}

export function getActiveAdminTitle(pathname: string): string {
  const href = findActiveHref(pathname || '');
  const item = flattenItems().find((i) => i.href === href);
  return item?.label || 'Panel de Administración';
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const activeHref = findActiveHref(pathname || '');

  // Abrir automáticamente el grupo que contiene la ruta activa
  useEffect(() => {
    if (!activeHref) return;
    for (const entry of NAV) {
      if (isGroup(entry) && entry.items.some((i) => i.href === activeHref)) {
        setOpenGroups((prev) => (prev[entry.label] ? prev : { ...prev, [entry.label]: true }));
      }
    }
  }, [activeHref]);

  const userEmail = user?.email || '';

  const linkClasses = (href: string, indented = false) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${indented ? 'pl-10' : ''} ${
      activeHref === href
        ? 'bg-brand-blue text-white font-semibold'
        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="flex h-full flex-col bg-brand-blue-darker">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-1.5 shrink-0">
            <img src="/images/casi_cinco_blue.png" alt="Casi Cinco" className="h-9 w-9 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold leading-tight">Casi Cinco</p>
            <p className="text-blue-200/70 text-xs leading-tight">Panel de Administración</p>
          </div>
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((entry) => {
          if (!isGroup(entry)) {
            return (
              <Link key={entry.href} href={entry.href} onClick={onNavigate} className={linkClasses(entry.href)}>
                {entry.icon}
                {entry.label}
              </Link>
            );
          }

          const open = !!openGroups[entry.label];
          const containsActive = entry.items.some((i) => i.href === activeHref);
          return (
            <div key={entry.label}>
              <button
                onClick={() => setOpenGroups((prev) => ({ ...prev, [entry.label]: !open }))}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  containsActive && !open
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {entry.icon}
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="mt-1 space-y-1">
                  {entry.items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={onNavigate} className={linkClasses(item.href, true)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Usuario */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-yellow flex items-center justify-center text-brand-blue-darker font-bold shrink-0">
            {(userEmail[0] || 'A').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{userEmail || 'Administrador'}</p>
            <p className="text-blue-200/70 text-xs">Administrador</p>
          </div>
          <button
            onClick={() => signOut()}
            title="Cerrar sesión"
            className="text-blue-200/70 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
