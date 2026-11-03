/**
 * Geolocation calculations and Geofencing utilities for So What Else facilities.
 */

export const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Checks if coordinates are within the given geofence (default 300 meters).
 */
export function evaluateGeofence(
  userLat: number,
  userLng: number,
  facilityLat: number,
  facilityLng: number,
  radiusMeters = 300
): { distanceMeters: number; isOutsideGeofence: boolean } {
  const distance = calculateHaversineDistance(userLat, userLng, facilityLat, facilityLng);
  return {
    distanceMeters: distance,
    isOutsideGeofence: distance > radiusMeters,
  };
}

/**
 * Formats distance cleanly (e.g., "140m away" or "2.4 km away").
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
