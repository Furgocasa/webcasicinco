'use client';

import { useEffect, useRef, useState } from 'react';
import { PlaceMarker } from './PlaceMarker';

interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  category: string;
  slug: string;
  province: string;
}

interface MapViewProps {
  places: Place[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onPlaceClick?: (place: Place) => void;
}

export function MapView({ places, center, zoom = 10, onPlaceClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Inicializar el mapa
  useEffect(() => {
    if (!mapRef.current || map) return;

    const defaultCenter = center || { lat: 41.8, lng: -3.7038 }; // Más al norte para mejor vista

    const newMap = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: zoom,
      gestureHandling: 'greedy', // Permite desplazar con 1 dedo y zoom con 2 dedos en móvil
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setMap(newMap);
  }, [center, zoom, map]);

  // Actualizar marcadores cuando cambien los lugares
  useEffect(() => {
    if (!map) return;

    // Limpiar marcadores existentes
    markers.forEach((marker) => marker.setMap(null));

    // Crear nuevos marcadores
    const newMarkers = places.map((place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        map: map,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: getCategoryColor(place.category),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // InfoWindow para mostrar información al hacer clic
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
              ${place.name}
            </h3>
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
              <span style="color: #f59e0b;">★</span>
              <span style="font-weight: 500;">${place.rating}</span>
            </div>
            <button 
              onclick="window.location.href='/${place.category}/${place.province}/${place.slug}'"
              style="
                background: #2563eb;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                width: 100%;
              "
            >
              Ver detalles →
            </button>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onPlaceClick) {
          onPlaceClick(place);
        }
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Ajustar el zoom para mostrar todos los marcadores
    if (places.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        bounds.extend({ lat: place.latitude, lng: place.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [map, places, onPlaceClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <h4 className="font-semibold mb-2">Categorías</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }}></div>
            <span>Restaurantes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#3b82f6' }}></div>
            <span>Hoteles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }}></div>
            <span>Spas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }}></div>
            <span>Experiencias</span>
          </div>
        </div>
      </div>

      {/* Contador de lugares */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
        <p className="text-sm font-medium">
          {places.length} lugares 4.7+★
        </p>
      </div>
    </div>
  );
}

// Función auxiliar para obtener el color según la categoría
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    restaurant: '#ef4444', // rojo
    restaurante: '#ef4444',
    hotel: '#3b82f6', // azul
    spa: '#10b981', // verde
    experience: '#f59e0b', // amarillo
    experiencia: '#f59e0b',
  };
  return colors[category.toLowerCase()] || '#6b7280'; // gris por defecto
}
