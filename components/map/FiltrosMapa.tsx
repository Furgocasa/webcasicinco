'use client';

import { Check, Search, X } from 'lucide-react';
import type { PlaceFilters, QualityTier } from '@/types/filters';
import { QUALITY_TIERS } from '@/types/filters';
import { PLACE_CATEGORIES } from '@/lib/utils/constants';

const CATEGORY_COLORS: Record<string, string> = {
  restaurante: '#002297',
  bar: '#c44317',
  hotel: '#0ea5e9',
};

const TIER_COLORS: Record<QualityTier, string> = {
  diamond: '#38bdf8',
  platinum: '#94a3b8',
  gold: '#f59e0b',
  silver: '#cbd5e1',
  bronze: '#ea580c',
  none: '#9ca3af',
};

const RATING_OPTS = [
  { value: 4.7, label: '4.7+' },
  { value: 4.8, label: '4.8+' },
  { value: 4.9, label: '4.9+' },
  { value: 5.0, label: '5.0★' },
];

const REVIEW_OPTS = [
  { min: 0, label: 'Todas' },
  { min: 50, label: '50+' },
  { min: 200, label: '200+' },
  { min: 1000, label: '1.000+' },
];

export interface FiltrosMapaOptions {
  communities: string[];
  provinces: string[];
  categories: string[];
}

interface FiltrosMapaProps {
  filters: PlaceFilters;
  onFiltersChange: (filters: PlaceFilters) => void;
  minReviews: number;
  onMinReviewsChange: (value: number) => void;
  loading?: boolean;
  totalResultados: number;
  availableOptions: FiltrosMapaOptions;
  onClear: () => void;
  onClose?: () => void;
  activeCount: number;
}

export default function FiltrosMapa({
  filters,
  onFiltersChange,
  minReviews,
  onMinReviewsChange,
  loading,
  totalResultados,
  availableOptions,
  onClear,
  onClose,
  activeCount,
}: FiltrosMapaProps) {
  const toggleCategory = (value: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === value ? undefined : value,
    });
  };

  const toggleTier = (tier: QualityTier) => {
    const current = filters.qualityTier || [];
    const next = current.includes(tier)
      ? current.filter((t) => t !== tier)
      : [...current, tier];
    onFiltersChange({
      ...filters,
      qualityTier: next.length > 0 ? next : undefined,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="hidden md:flex items-center justify-between px-4 py-3 bg-primary-50 border-b border-primary-100">
        <h2 className="text-lg font-bold text-primary-900">Filtros</h2>
        {activeCount > 0 && (
          <span className="text-xs font-bold bg-secondary text-primary-900 rounded-full px-2 py-0.5">
            {activeCount}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.searchTerm || ''}
              onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value || undefined })}
              placeholder="Área, ciudad, restaurante..."
              className="w-full pl-8 pr-8 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {filters.searchTerm && (
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, searchTerm: undefined })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Comunidad ({availableOptions.communities.length})
          </label>
          {loading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
          ) : (
            <select
              value={filters.community || ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  community: e.target.value || undefined,
                  province: undefined,
                })
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white"
            >
              <option value="">Todas</option>
              {availableOptions.communities.map((community) => (
                <option key={community} value={community}>
                  {community}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Provincia ({availableOptions.provinces.length})
          </label>
          {loading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-xl" />
          ) : (
            <select
              value={filters.province || ''}
              onChange={(e) => onFiltersChange({ ...filters, province: e.target.value || undefined })}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white"
            >
              <option value="">Todas</option>
              {availableOptions.provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
          <input
            type="text"
            placeholder="Málaga, Marbella..."
            value={filters.city || ''}
            onChange={(e) => onFiltersChange({ ...filters, city: e.target.value || undefined })}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
          <div className="space-y-2">
            {PLACE_CATEGORIES.map((cat) => {
              const activo = filters.category === cat.value;
              const color = CATEGORY_COLORS[cat.value] || '#002297';
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  aria-pressed={activo}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                    activo ? 'shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  style={activo ? { borderColor: color, backgroundColor: `${color}14` } : undefined}
                >
                  <span className="text-lg shrink-0" aria-hidden>
                    {cat.icon}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{cat.label}</span>
                  {activo && <Check className="w-5 h-5 shrink-0" style={{ color }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tier de calidad</label>
          <div className="space-y-2">
            {(Object.entries(QUALITY_TIERS) as [QualityTier, (typeof QUALITY_TIERS)[QualityTier]][]).map(
              ([tier, config]) => {
                if (tier === 'none') return null;
                const activo = filters.qualityTier?.includes(tier) || false;
                const color = TIER_COLORS[tier];
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => toggleTier(tier)}
                    aria-pressed={activo}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
                      activo ? 'shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    style={activo ? { borderColor: color, backgroundColor: `${color}22` } : undefined}
                  >
                    <span className="text-xl shrink-0" aria-hidden>
                      {config.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{config.name}</span>
                      <span className="block text-[11px] text-gray-500 leading-tight">{config.description}</span>
                    </span>
                    {activo && <Check className="w-5 h-5 shrink-0" style={{ color }} />}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rating mínimo</label>
          <div className="grid grid-cols-2 gap-1.5">
            {RATING_OPTS.map((opt) => {
              const activo = (filters.minRating || 4.7) === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFiltersChange({ ...filters, minRating: opt.value, maxRating: 5.0 })}
                  aria-pressed={activo}
                  className={`rounded-xl border px-2.5 py-2 text-center text-[13px] transition-all active:scale-[0.98] ${
                    activo
                      ? 'border-primary bg-primary text-white font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Número de reseñas</label>
          <div className="grid grid-cols-2 gap-1.5">
            {REVIEW_OPTS.map((opt) => {
              const activo = minReviews === opt.min;
              return (
                <button
                  key={opt.min}
                  type="button"
                  onClick={() => onMinReviewsChange(opt.min)}
                  aria-pressed={activo}
                  className={`rounded-xl border px-2.5 py-2 text-center text-[13px] transition-all active:scale-[0.98] ${
                    activo
                      ? 'border-primary bg-primary text-white font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 py-3 space-y-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-600"
          >
            Ver resultados ({totalResultados.toLocaleString('es-ES')})
          </button>
        )}
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="w-full h-10 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Limpiar filtros{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>
    </div>
  );
}
