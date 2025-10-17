'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent, EVENTS, CATEGORIES } from '@/lib/analytics/tracker';

/**
 * Componente para trackear vistas de página automáticamente
 * Usar en layout.tsx
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Trackear vista de página
    trackEvent(EVENTS.PAGE_VIEW, CATEGORIES.NAVIGATION, {
      page: pathname
    });
  }, [pathname]);

  return null; // Componente invisible
}

