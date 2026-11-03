import { useState } from 'react';
import { FacilityLocation, GPSInfo } from '../types';
import { evaluateGeofence } from './geo';

export interface GeolocationState {
  gpsInfo?: GPSInfo;
  isLoading: boolean;
  error?: string;
  isSimulated: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    isLoading: false,
    isSimulated: false,
  });

  const requestRealGPS = async (facility: FacilityLocation): Promise<GPSInfo> => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const fallback: GPSInfo = {
          lat: facility.lat,
          lng: facility.lng,
          accuracy: 50,
          distanceMeters: 0,
          isOutsideGeofence: false,
          deniedOrUnavailable: true,
        };
        setState({
          gpsInfo: fallback,
          isLoading: false,
          error: 'GPS not supported by this browser.',
          isSimulated: false,
        });
        resolve(fallback);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const { distanceMeters, isOutsideGeofence } = evaluateGeofence(
            latitude,
            longitude,
            facility.lat,
            facility.lng,
            facility.geofenceMeters || 300
          );

          const info: GPSInfo = {
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            distanceMeters,
            isOutsideGeofence,
          };

          setState({
            gpsInfo: info,
            isLoading: false,
            isSimulated: false,
          });
          resolve(info);
        },
        (err) => {
          // Fallback if user denies GPS permission
          const fallback: GPSInfo = {
            lat: facility.lat,
            lng: facility.lng,
            accuracy: 100,
            distanceMeters: 45,
            isOutsideGeofence: false,
            deniedOrUnavailable: true,
          };
          setState({
            gpsInfo: fallback,
            isLoading: false,
            error: `Location access was denied or timed out (${err.message}). Defaulting to facility center.`,
            isSimulated: false,
          });
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const simulateLocation = (
    facility: FacilityLocation,
    type: 'onsite' | 'offsite'
  ): GPSInfo => {
    // If onsite: ~35m from facility center
    // If offsite: ~850m from facility (>300m threshold)
    const latOffset = type === 'onsite' ? 0.0003 : 0.0076;
    const lngOffset = type === 'onsite' ? 0.0002 : 0.0055;

    const userLat = facility.lat + latOffset;
    const userLng = facility.lng + lngOffset;

    const { distanceMeters, isOutsideGeofence } = evaluateGeofence(
      userLat,
      userLng,
      facility.lat,
      facility.lng,
      facility.geofenceMeters || 300
    );

    const info: GPSInfo = {
      lat: userLat,
      lng: userLng,
      accuracy: 12,
      distanceMeters,
      isOutsideGeofence,
    };

    setState({
      gpsInfo: info,
      isLoading: false,
      isSimulated: true,
    });

    return info;
  };

  return {
    ...state,
    requestRealGPS,
    simulateLocation,
    resetGPS: () => setState({ isLoading: false, isSimulated: false }),
  };
}
