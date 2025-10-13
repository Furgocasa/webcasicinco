'use client';

import { useEffect } from 'react';
import { preloadPlaces } from '@/lib/utils/places-cache';

/**
 * Componente que precarga lugares en background
 * Se debe incluir en el layout principal para que se ejecute una vez
 */
export default function PlacesPreloader() {
  useEffect(() => {
    // Precargar lugares en background después de un pequeño delay
    // para no interferir con la carga inicial de la página
    const timer = setTimeout(() => {
      preloadPlaces().catch(err => {
        console.warn('Error en precarga de lugares:', err);
      });
    }, 1000); // Esperar 1 segundo después de que cargue la app

    return () => clearTimeout(timer);
  }, []); // Solo ejecutar una vez al montar

  // Este componente no renderiza nada
  return null;
}

