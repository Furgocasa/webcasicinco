/**
 * Funciones para Google Geocoding API
 */

import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;
const GEOCODING_API_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
  };
  place_id: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

/**
 * Convierte una dirección en coordenadas geográficas
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    const response = await axios.get(GEOCODING_API_BASE, {
      params: {
        address,
        language: 'es',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding API error: ${response.data.status}`);
    }

    return response.data.results[0];
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

/**
 * Convierte coordenadas geográficas en una dirección
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  try {
    const response = await axios.get(GEOCODING_API_BASE, {
      params: {
        latlng: `${latitude},${longitude}`,
        language: 'es',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding API error: ${response.data.status}`);
    }

    return response.data.results[0];
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
}

/**
 * Extrae componentes específicos de una dirección
 */
export function extractAddressComponent(
  result: GeocodeResult,
  type: string
): string | null {
  const component = result.address_components.find((comp) =>
    comp.types.includes(type)
  );
  return component ? component.long_name : null;
}

/**
 * Obtiene la ciudad de un resultado de geocoding
 */
export function getCityFromGeocodeResult(result: GeocodeResult): string {
  return (
    extractAddressComponent(result, 'locality') ||
    extractAddressComponent(result, 'administrative_area_level_2') ||
    ''
  );
}

/**
 * Obtiene la provincia de un resultado de geocoding
 */
export function getProvinceFromGeocodeResult(result: GeocodeResult): string {
  return extractAddressComponent(result, 'administrative_area_level_2') || '';
}

/**
 * Obtiene la región de un resultado de geocoding
 */
export function getRegionFromGeocodeResult(result: GeocodeResult): string {
  return extractAddressComponent(result, 'administrative_area_level_1') || '';
}

/**
 * Obtiene el país de un resultado de geocoding
 */
export function getCountryFromGeocodeResult(result: GeocodeResult): string {
  return extractAddressComponent(result, 'country') || '';
}

/**
 * Obtiene el código postal de un resultado de geocoding
 */
export function getPostalCodeFromGeocodeResult(result: GeocodeResult): string {
  return extractAddressComponent(result, 'postal_code') || '';
}
