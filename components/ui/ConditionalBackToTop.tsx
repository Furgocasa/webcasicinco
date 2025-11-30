'use client';

import { usePathname } from 'next/navigation';
import BackToTop from './BackToTop';

export default function ConditionalBackToTop() {
  const pathname = usePathname();
  
  // No mostrar en /mapa ni /ruta
  const shouldShowBackToTop = !pathname.startsWith('/mapa') && !pathname.startsWith('/ruta');

  if (!shouldShowBackToTop) return null;

  return <BackToTop />;
}

