'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries: ("places" | "geometry" | "drawing")[] = ["places", "geometry", "drawing"];

interface MapContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  mapInstance: google.maps.Map | null;
  setMapInstance: (map: google.maps.Map | null) => void;
  shouldLoadMap: boolean;
  setShouldLoadMap: (should: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

/**
 * Provider de Google Maps
 * Carga la librería UNA SOLA VEZ y reutiliza entre páginas
 * Ahorra ~66% en navegaciones múltiples entre /mapa y /ruta
 */
export function MapProvider({ children }: { children: ReactNode }) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(true); // ✅ SIEMPRE true para carga inmediata

  // Cargar Google Maps inmediatamente
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  return (
    <MapContext.Provider 
      value={{ 
        isLoaded, 
        loadError, 
        mapInstance, 
        setMapInstance,
        shouldLoadMap,
        setShouldLoadMap
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

/**
 * Hook para usar el contexto del mapa
 */
export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within MapProvider');
  }
  return context;
}

