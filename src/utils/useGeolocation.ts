import { useState, useCallback } from 'react';
import { FacilityLocation, GPSInfo } from '../types';
import { evaluateGeofence } from './geo';

export interface GeolocationState {
  gpsInfo?: GPSInfo;
  isLoading: boolean;
  error?: string;
  isSimulated: boolean;
  source?: 'high_accuracy_gps' | 'network_wifi' | 'fallback_facility' | 'simulated';
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    isLoading: false,
    isSimulated: false,
  });

  const requestRealGPS = useCallback(
    async (facility: FacilityLocation): Promise<GPSInfo> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      // Check for secure context (HTTPS / localhost required by modern mobile browsers)
      if (
        typeof window !== 'undefined' &&
        window.isSecureContext === false &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
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
          error:
            'Browser requires HTTPS for location services. Defaulted to facility location.',
          isSimulated: false,
          source: 'fallback_facility',
        });
        return fallback;
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
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
          error: 'GPS is not supported by this browser.',
          isSimulated: false,
          source: 'fallback_facility',
        });
        return fallback;
      }

      // Helper to attempt getCurrentPosition with specific options
      const tryGetPosition = (
        options: PositionOptions
      ): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
      };

      try {
        // Stage 1: Try high-accuracy GPS with a 5-second timeout
        let pos: GeolocationPosition;
        let source: 'high_accuracy_gps' | 'network_wifi' = 'high_accuracy_gps';

        try {
          pos = await tryGetPosition({
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 60000,
          });
        } catch (stage1Err: any) {
          // If permission was explicitly denied, do not retry stage 2
          if (stage1Err?.code === 1) {
            throw stage1Err;
          }

          // Stage 2: Fallback to low-accuracy (Wi-Fi / Cell tower triangulation)
          // Critical for indoor warehouses & distribution centers where satellites are obstructed!
          source = 'network_wifi';
          pos = await tryGetPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000, // allow 5-min cached network location
          });
        }

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
          source,
          error: undefined,
        });
        return info;
      } catch (err: any) {
        // Handle failure after all stages
        let userMsg =
          'Location access timed out or unavailable. Defaulting to facility location.';
        if (err?.code === 1) {
          userMsg =
            'Location access was denied. Please allow location permissions in your browser address bar.';
        } else if (err?.code === 2) {
          userMsg =
            'Physical location could not be determined. Defaulting to facility location.';
        } else if (err?.code === 3) {
          userMsg =
            'Location request timed out. Defaulting to facility location.';
        }

        const fallback: GPSInfo = {
          lat: facility.lat,
          lng: facility.lng,
          accuracy: 100,
          distanceMeters: 30, // on-site facility reference
          isOutsideGeofence: false,
          deniedOrUnavailable: true,
        };

        setState({
          gpsInfo: fallback,
          isLoading: false,
          error: userMsg,
          isSimulated: false,
          source: 'fallback_facility',
        });
        return fallback;
      }
    },
    []
  );

  const simulateLocation = useCallback(
    (facility: FacilityLocation, type: 'onsite' | 'offsite'): GPSInfo => {
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
        source: 'simulated',
        error: undefined,
      });

      return info;
    },
    []
  );

  const resetGPS = useCallback(() => {
    setState({ isLoading: false, isSimulated: false });
  }, []);

  return {
    ...state,
    requestRealGPS,
    simulateLocation,
    resetGPS,
  };
}
