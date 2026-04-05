import { useState, useEffect, useRef } from 'react';

export const useGeolocation = (isReadyToTrack) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const lastUpdateTime = useRef(0);
  const watchId = useRef(null);

  useEffect(() => {
    if (!isReadyToTrack) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      setIsTracking(false);
      return;
    }

    setIsTracking(true);
    setError(null);

    if (!('geolocation' in navigator)) {
      setError({ code: 0, message: 'Geolocation not supported' });
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastUpdateTime.current >= 5000) {
          lastUpdateTime.current = now;
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setError(null);
        }
      },
      (err) => {
        setError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [isReadyToTrack]);

  return { location, error, isTracking };
};
