'use client';

import { Map, Filter, List } from 'lucide-react';

interface BottomNavigationProps {
  activeView: 'map' | 'filters' | 'list';
  onViewChange: (view: 'map' | 'filters' | 'list') => void;
  filtersCount?: number;
  placesCount?: number;
}

export default function BottomNavigation({
  activeView,
  onViewChange,
  filtersCount = 0,
  placesCount = 0,
}: BottomNavigationProps) {
  const buttonClass = (view: string) => `
    flex-1 flex flex-col items-center justify-center py-3 relative
    transition-all duration-200
    ${activeView === view 
      ? 'text-indigo-600 bg-indigo-50' 
      : 'text-gray-600 bg-white hover:bg-gray-50'
    }
  `;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex">
        {/* Botón Mapa */}
        <button
          onClick={() => onViewChange('map')}
          className={buttonClass('map')}
        >
          <Map className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Mapa</span>
        </button>

        {/* Botón Filtros */}
        <button
          onClick={() => onViewChange('filters')}
          className={buttonClass('filters')}
        >
          <Filter className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Filtros</span>
          {filtersCount > 0 && (
            <span className="absolute top-1 right-1/4 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {filtersCount}
            </span>
          )}
        </button>

        {/* Botón Lista */}
        <button
          onClick={() => onViewChange('list')}
          className={buttonClass('list')}
        >
          <List className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Lista</span>
          {placesCount > 0 && (
            <span className="absolute top-1 text-[10px] text-indigo-600 font-bold">
              {placesCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

