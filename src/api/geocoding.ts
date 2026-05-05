// Google Geocoding API wrapper.
//
// The same Google Maps key used by react-native-maps (configured via
// app.config.js → android.config.googleMaps.apiKey) is reused here.
// Mobile API keys are not secrets — they're embedded in the APK's manifest
// regardless. Restrict this key in the GCP console by Android package name
// + enabled APIs (Maps SDK + Geocoding API) for security.
//
// Make sure the Geocoding API is enabled for this key in Google Cloud Console:
//   https://console.cloud.google.com/google/maps-apis/overview
//
// Endpoints:
//   forward:  https://maps.googleapis.com/maps/api/geocode/json?address=…&key=…
//   reverse:  https://maps.googleapis.com/maps/api/geocode/json?latlng=…&key=…

import { logger } from '../utils/logger';

const TAG = 'Geocoding';

// Hardcoded so it's guaranteed to land in the bundle (env-injection has bitten
// us in production before). If you rotate the key, update this constant and
// rebuild — same procedure as the production backend URL.
const GOOGLE_MAPS_API_KEY = 'AIzaSyDeNrBkpzh88P9UT1Y6GZsC7XBOSZpaBUM';

const BASE = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: { lat: number; lng: number };
    };
  }>;
}

async function callGoogle(query: string): Promise<GoogleGeocodeResponse> {
  const url = `${BASE}?${query}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding HTTP ${res.status}`);
  }
  const json = (await res.json()) as GoogleGeocodeResponse;
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Google: ${json.status}${json.error_message ? ` — ${json.error_message}` : ''}`);
  }
  return json;
}

/**
 * Forward geocode: address text → coordinates.
 * Biases results to Pakistan via the `region` parameter.
 * Returns the first / best match, or null if nothing was found.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  try {
    const json = await callGoogle(`address=${encodeURIComponent(trimmed)}&region=pk`);
    if (!json.results.length) return null;
    const top = json.results[0];
    return {
      latitude: top.geometry.location.lat,
      longitude: top.geometry.location.lng,
      formattedAddress: top.formatted_address,
    };
  } catch (e: any) {
    logger.error(TAG, `geocodeAddress failed for "${trimmed}": ${e.message}`);
    throw e;
  }
}

/**
 * Reverse geocode: coordinates → address. Used after a user drags the pin
 * to display "you're near…" feedback.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const json = await callGoogle(`latlng=${latitude},${longitude}`);
    if (!json.results.length) return null;
    return json.results[0].formatted_address;
  } catch (e: any) {
    logger.error(TAG, `reverseGeocode failed for ${latitude},${longitude}: ${e.message}`);
    return null;
  }
}
