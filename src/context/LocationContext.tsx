import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import * as Location from 'expo-location';
import { logger } from '../utils/logger';

const TAG = 'LocationContext';

export interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  currentLocation: Coords | null;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Coords | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (granted) {
        const loc = await getLocationWithFallback();
        if (loc) {
          setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          logger.info(TAG, 'Location obtained');
        }
      }
      return granted;
    } catch (e) {
      logger.error(TAG, 'Permission request failed', e);
      return false;
    }
  };

  const getLocationWithFallback = async (): Promise<Location.LocationObject | null> => {
    // Try each accuracy level from highest to lowest until one works
    const accuracyLevels = [
      Location.Accuracy.Balanced,
      Location.Accuracy.Low,
      Location.Accuracy.Lowest,
    ];
    for (const accuracy of accuracyLevels) {
      try {
        return await Location.getCurrentPositionAsync({ accuracy });
      } catch {
        // try next level
      }
    }
    // Last resort: use last known position
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) return last;
    } catch {}
    logger.warn(TAG, 'Could not get location at any accuracy level');
    return null;
  };

  const startWatching = async () => {
    if (watchRef.current) return;
    const granted = permissionGranted || (await requestPermission());
    if (!granted) return;

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 5000,
      },
      (loc) => {
        setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      },
    );
    logger.info(TAG, 'Watching position');
  };

  const stopWatching = () => {
    watchRef.current?.remove();
    watchRef.current = null;
    logger.info(TAG, 'Stopped watching position');
  };

  return (
    <LocationContext.Provider
      value={{ currentLocation, permissionGranted, requestPermission, startWatching, stopWatching }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
