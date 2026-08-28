'use client';

import { useEffect, type JSX } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  Target,
  Star,
  FileText,
  MessageSquare,
  Share2,
  BarChart3,
  LineChart,
  ClipboardList,
  Users,
  Settings,
  Activity,
} from 'lucide-react';

type Seccion = {
  title: string;
  description: string;
  icon: JSX.Element;
  href: string;
};

type Grupo = {
  label: string;
  color: string;
  sections: Seccion[];
};

const icon = 'w-6 h-6';

const GRUPOS: Grupo[] = [
  {
    label: 'Lugares',
    color: 'text-primary-600 border-primary-200 bg-primary-50',
    sections: [
      { title: 'Gestión de lugares', description: 'Busca, edita, publica u oculta lugares', icon: <MapPin className={icon} />, href: '/admin/lugares' },
      { title: 'Indexar lugares', description: 'Importa lugares desde Google Maps', icon: <Search className={icon} />, href: '/admin/indexar' },
      { title: 'Búsqueda manual', description: 'Añade un lugar concreto por nombre', icon: <Target className={icon} />, href: '/admin/buscar-lugar' },
      { title: 'Actualizar ratings', description: 'Refresca notas y reseñas de Google', icon: <Star className={icon} />, href: '/admin/update-ratings' },
    ],
  },
  {
    label: 'Contenido e IA',
    color: 'text-purple-600 border-purple-200 bg-purple-50',
    sections: [
      { title: 'Blog SEO', description: 'Crea y gestiona artículos del blog', icon: <FileText className={icon} />, href: '/admin/blog' },
      { title: 'Respuestas Tío Viajero', description: 'Revisa y evalúa respuestas del chatbot', icon: <MessageSquare className={icon} />, href: '/admin/conversaciones' },
      { title: 'Redes sociales', description: 'Genera y programa contenido social', icon: <Share2 className={icon} />, href: '/admin/redes-sociales' },
    ],
  },
  {
    label: 'Datos y análisis',
    color: 'text-emerald-600 border-emerald-200 bg-emerald-50',
    sections: [
      { title: 'Dashboard Analytics', description: 'KPIs, tiers y tops de la plataforma', icon: <BarChart3 className={icon} />, href: '/admin/dashboard' },
      { title: 'Estadísticas', description: 'Métricas de uso y evolución', icon: <LineChart className={icon} />, href: '/admin/estadisticas' },
      { title: 'Historial de trabajos', description: 'Seguimiento de procesos e indexaciones', icon: <ClipboardList className={icon} />, href: '/admin/trabajos' },
    ],
  },
  {
    label: 'Sistema',
    color: 'text-slate-600 border-slate-200 bg-slate-100',
    sections: [
      { title: 'Usuarios', description: 'Gestiona los usuarios del sistema', icon: <Users className={icon} />, href: '/admin/usuarios' },
      { title: 'Configuración', description: 'Ajustes generales y de IA', icon: <Settings className={icon} />, href: '/admin/configuracion' },
      { title: 'Diagnóstico', description: 'Comprueba el estado de las integraciones', icon: <Activity className={icon} />, href: '/admin/diagnostico' },
    ],
  },
];

export default function AdminHomePage() {
  useEffect(() => {
    document.title = 'Panel de Administración | Casi Cinco';
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona todas las funciones de Casi Cinco</p>
      </div>

      {/* Secciones agrupadas */}
      <div className="space-y-10">
        {GRUPOS.map((grupo) => (
          <section key={grupo.label}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${grupo.color.split(' ')[0].replace('text-', 'bg-')}`} />
              {grupo.label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {grupo.sections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className={`inline-flex p-2.5 rounded-lg border ${grupo.color} mb-3`}>
                    {section.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
