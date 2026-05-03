export const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  KARACHI:    { latitude: 24.8607, longitude: 67.0011 },
  LAHORE:     { latitude: 31.5204, longitude: 74.3587 },
  ISLAMABAD:  { latitude: 33.6844, longitude: 73.0479 },
  RAWALPINDI: { latitude: 33.5651, longitude: 73.0169 },
  FAISALABAD: { latitude: 31.4504, longitude: 73.1350 },
  MULTAN:     { latitude: 30.1575, longitude: 71.5249 },
  PESHAWAR:   { latitude: 34.0151, longitude: 71.5249 },
  QUETTA:     { latitude: 30.1798, longitude: 66.9750 },
  SIALKOT:    { latitude: 32.4945, longitude: 74.5229 },
  GUJRANWALA: { latitude: 32.1877, longitude: 74.1945 },
};

export const PAKISTAN_CENTER = {
  latitude: 30.3753,
  longitude: 69.3451,
  latitudeDelta: 14,
  longitudeDelta: 14,
};

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
