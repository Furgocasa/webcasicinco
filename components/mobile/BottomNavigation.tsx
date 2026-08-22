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
  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-95 ${
      active ? 'text-primary' : 'text-gray-500'
    }`;

  const iconWrap = (active: boolean) =>
    `px-4 py-1 rounded-full transition-colors duration-200 relative ${
      active ? 'bg-primary-50' : 'bg-transparent'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 px-3">
        <button onClick={() => onViewChange('map')} className={itemClass(activeView === 'map')}>
          <span className={iconWrap(activeView === 'map')}>
            <Map className="w-6 h-6" />
          </span>
          <span className={`text-[11px] ${activeView === 'map' ? 'font-semibold' : 'font-medium'}`}>
            Mapa
          </span>
        </button>

        <button onClick={() => onViewChange('filters')} className={itemClass(activeView === 'filters')}>
          <span className={iconWrap(activeView === 'filters')}>
            <Filter className="w-6 h-6" />
            {filtersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-primary-900 text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {filtersCount}
              </span>
            )}
          </span>
          <span className={`text-[11px] ${activeView === 'filters' ? 'font-semibold' : 'font-medium'}`}>
            Filtros
          </span>
        </button>

        <button onClick={() => onViewChange('list')} className={itemClass(activeView === 'list')}>
          <span className={iconWrap(activeView === 'list')}>
            <List className="w-6 h-6" />
            {placesCount > 0 && (
              <span className="absolute -top-1.5 -right-3 bg-primary text-white text-[10px] rounded-full px-1.5 py-px font-bold min-w-[20px] text-center">
                {placesCount > 99 ? '99+' : placesCount}
              </span>
            )}
          </span>
          <span className={`text-[11px] ${activeView === 'list' ? 'font-semibold' : 'font-medium'}`}>
            Lista
          </span>
        </button>
      </div>
    </nav>
  );
}
