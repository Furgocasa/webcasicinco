'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Cookie, Megaphone, Settings, Shield, X } from 'lucide-react';

export const OPEN_COOKIE_SETTINGS = 'openCookieSettings';
const KEY = 'casicinco_cookie_consent';
const PREFS_KEY = 'casicinco_cookie_preferences';

type Prefs = {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

const ALL_ON: Prefs = { necessary: true, analytics: true, functional: true, marketing: true };
const ONLY_NECESSARY: Prefs = { necessary: true, analytics: false, functional: false, marketing: false };

function updateGtag(prefs: Prefs) {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  const analytics = prefs.analytics ? 'granted' : 'denied';
  const ads = prefs.marketing ? 'granted' : 'denied';
  (window as any).gtag('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
}

function persist(prefs: Prefs) {
  // KEY solo refleja analítica: el default de gtag en el layout la lee al recargar.
  localStorage.setItem(KEY, prefs.analytics ? 'granted' : 'denied');
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  updateGtag(prefs);
}

function readPrefs(): Prefs | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Prefs>;
      return {
        necessary: true,
        analytics: Boolean(parsed.analytics),
        functional: Boolean(parsed.functional),
        marketing: Boolean(parsed.marketing),
      };
    }
    const legacy = localStorage.getItem(KEY);
    if (legacy === 'granted') return ALL_ON;
    if (legacy === 'denied') return ONLY_NECESSARY;
  } catch {
    /* modo privado */
  }
  return null;
}

export function openCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS));
  }
}

export function CookieSettingsButton({
  className,
  label = 'Configurar cookies',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {label}
    </button>
  );
}

export function CookieConsentBar() {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith('/admin'));
  const [view, setView] = useState<'hidden' | 'banner' | 'settings'>('hidden');
  const [prefs, setPrefs] = useState<Prefs>(ALL_ON);

  useEffect(() => {
    if (isAdmin) return;
    const stored = readPrefs();
    if (stored) {
      setPrefs(stored);
      updateGtag(stored);
    } else {
      setView('banner');
    }
    const open = () => {
      const current = readPrefs();
      if (current) setPrefs(current);
      setView('settings');
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, open);
  }, [isAdmin]);

  const acceptAll = useCallback(() => {
    persist(ALL_ON);
    setPrefs(ALL_ON);
    setView('hidden');
  }, []);

  const rejectAll = useCallback(() => {
    persist(ONLY_NECESSARY);
    setPrefs(ONLY_NECESSARY);
    setView('hidden');
  }, []);

  const save = useCallback(() => {
    persist(prefs);
    setView('hidden');
  }, [prefs]);

  if (isAdmin || view === 'hidden') return null;

  if (view === 'settings') {
    return (
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Cookie className="h-8 w-8 text-[#002297]" aria-hidden="true" />
              <h2 id="cookie-settings-title" className="text-xl font-bold text-gray-900">Configuración de cookies</h2>
            </div>
            <button type="button" onClick={() => setView(readPrefs() ? 'hidden' : 'banner')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" aria-label="Cerrar configuración de cookies">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-gray-600 mb-6">Elige qué tipos de cookies deseas aceptar. Las cookies necesarias no se pueden desactivar ya que son imprescindibles para el funcionamiento del sitio.</p>
            <div className="space-y-4">
              <Category
                icon={Shield}
                title="Cookies necesarias"
                description="Estas cookies son esenciales para el funcionamiento del sitio web. Sin ellas, el sitio no funcionaría correctamente."
                enabled
                required
              />
              <Category
                icon={BarChart3}
                title="Cookies analíticas"
                description="Nos permiten contar las visitas y analizar cómo los usuarios navegan por el sitio para mejorarlo."
                enabled={prefs.analytics}
                onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
              <Category
                icon={Settings}
                title="Cookies funcionales"
                description="Recuerdan filtros, vista del mapa y preferencias de uso."
                enabled={prefs.functional}
                onChange={(v) => setPrefs((p) => ({ ...p, functional: v }))}
              />
              <Category
                icon={Megaphone}
                title="Cookies de marketing"
                description="Se utilizan para mostrarte anuncios relevantes y medir la efectividad de las campañas publicitarias."
                enabled={prefs.marketing}
                onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Más información en la{' '}
              <Link href="/cookies" className="text-[#002297] hover:underline" onClick={() => setView('hidden')}>
                Política de cookies
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button type="button" onClick={rejectAll} className="flex-1 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-white">
              Rechazar todas
            </button>
            <button type="button" onClick={save} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              Guardar preferencias
            </button>
            <button type="button" onClick={acceptAll} className="flex-1 px-4 py-2.5 bg-[#002297] text-white rounded-lg font-medium hover:bg-[#001a73]">
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 bg-white border-t border-gray-200 shadow-lg md:p-6" role="region" aria-label="Banner de consentimiento de cookies">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1 flex items-start gap-3">
            <Cookie className="h-8 w-8 text-[#002297] flex-shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Utilizamos cookies</h3>
              <p className="text-gray-600 text-sm">
                Usamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico. Puedes aceptar todas o configurar tus preferencias.{' '}
                <Link href="/cookies" className="text-[#002297] hover:underline">Política de cookies</Link>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            <button type="button" onClick={() => setView('settings')} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 text-sm">
              Configurar
            </button>
            <button type="button" onClick={acceptAll} className="px-4 py-2 bg-[#002297] text-white rounded-lg font-medium hover:bg-[#001a73] text-sm">
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Category({
  icon: Icon,
  title,
  description,
  enabled,
  required,
  onChange,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
  enabled: boolean;
  required?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className={`p-4 rounded-xl border-2 ${enabled ? 'border-[#002297] bg-[#002297]/5' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-[#002297] text-white' : 'bg-gray-200 text-gray-500'}`} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1 gap-3">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {required ? (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">Siempre activas</span>
            ) : (
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={enabled} onChange={(e) => onChange?.(e.target.checked)} aria-label={title} />
                <span className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-[#002297] transition-colors" />
                <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </label>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
