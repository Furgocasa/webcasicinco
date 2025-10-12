/**
 * Funciones para Google Directions API
 */

import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;
const DIRECTIONS_API_BASE = 'https://maps.googleapis.com/maps/api/directions/json';

export interface DirectionsRoute {
  distance: number; // en metros
  duration: number; // en segundos
  polyline: string;
  steps: DirectionsStep[];
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface DirectionsStep {
  distance: number;
  duration: number;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
  instructions: string;
  polyline: string;
}

/**
 * Calcula una ruta entre origen y destino
 */
export async function calculateRoute(
  origin: string,
  destination: string,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<DirectionsRoute> {
  try {
    const response = await axios.get(DIRECTIONS_API_BASE, {
      params: {
        origin,
        destination,
        mode,
        language: 'es',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Directions API error: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.value,
      duration: leg.duration.value,
      polyline: route.overview_polyline.points,
      steps: leg.steps.map((step: any) => ({
        distance: step.distance.value,
        duration: step.duration.value,
        start_location: step.start_location,
        end_location: step.end_location,
        instructions: step.html_instructions.replace(/<[^>]*>/g, ''),
        polyline: step.polyline.points,
      })),
      bounds: route.bounds,
    };
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

/**
 * Decodifica un polyline de Google Maps
 */
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

/**
 * Obtiene puntos a lo largo de una ruta para buscar lugares cercanos
 */
export function getRoutePoints(
  route: DirectionsRoute,
  intervalMeters: number = 10000
): Array<{ lat: number; lng: number }> {
  const points = decodePolyline(route.polyline);
  const sampledPoints: Array<{ lat: number; lng: number }> = [];
  
  let accumulatedDistance = 0;
  sampledPoints.push(points[0]); // Primer punto

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistanceBetweenPoints(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );

    accumulatedDistance += distance;

    if (accumulatedDistance >= intervalMeters) {
      sampledPoints.push(points[i]);
      accumulatedDistance = 0;
    }
  }

  sampledPoints.push(points[points.length - 1]); // Último punto

  return sampledPoints;
}

/**
 * Calcula la distancia entre dos puntos geográficos (fórmula de Haversine)
 */
export function calculateDistanceBetweenPoints(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calcula la distancia más corta de un punto a una línea (ruta)
 */
export function calculateDistanceToRoute(
  pointLat: number,
  pointLng: number,
  routePoints: Array<{ lat: number; lng: number }>
): number {
  let minDistance = Infinity;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const distance = distanceToSegment(
      { lat: pointLat, lng: pointLng },
      routePoints[i],
      routePoints[i + 1]
    );

    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

/**
 * Calcula la distancia de un punto a un segmento de línea
 */
function distanceToSegment(
  point: { lat: number; lng: number },
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number {
  const A = point.lat - start.lat;
  const B = point.lng - start.lng;
  const C = end.lat - start.lat;
  const D = end.lng - start.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = start.lat;
    yy = start.lng;
  } else if (param > 1) {
    xx = end.lat;
    yy = end.lng;
  } else {
    xx = start.lat + param * C;
    yy = start.lng + param * D;
  }

  return calculateDistanceBetweenPoints(point.lat, point.lng, xx, yy);
}
